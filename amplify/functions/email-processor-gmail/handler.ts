/**
 * Gmail API + Pub/Sub メール自動取り込みLambda関数ハンドラー
 *
 * Google Cloud Pub/SubからPush通知を受け取り、Gmail APIでメールを取得して
 * 三井住友Amazonカードの利用通知を解析し、自動的に取引記録を作成します。
 *
 * 対応カード: 三井住友Amazonカード（Amazon Mastercard）のみ
 *
 * フロー:
 * 1. API GatewayからPub/SubのPush通知を受信
 * 2. OAuth認証クライアントを作成
 * 3. Gmail APIで新しいメールを取得
 * 4. Amazonカードのメールかどうかを判定
 * 5. 取引データを抽出
 * 6. カテゴリ自動分類
 * 7. GraphQL Mutationで取引を作成
 */

import type { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { createOAuth2Client, getOAuthConfigFromEnv } from './gmail/auth';
import { GmailClient } from './gmail/client';
import { getNewMessages } from './gmail/watch';
import { SMBCParser } from '../email-processor/parsers/smbc-parser';
import { suggestCategory } from '../email-processor/auto-categorization/rule-matcher';
import { createTransaction } from '../email-processor/graphql/mutations';

/**
 * 環境変数
 */
const FAMILY_ID = process.env.FAMILY_ID || '';

/**
 * サポートするパーサー（三井住友Amazonカード専用）
 */
const parser = new SMBCParser();

/**
 * Pub/Sub Push通知のペイロード
 */
interface PubSubMessage {
  message: {
    data: string; // Base64エンコードされたJSON
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

/**
 * Pub/Sub通知のデータ（Gmail）
 */
interface GmailPubSubData {
  emailAddress: string;
  historyId: string;
}

/**
 * Lambda関数のメインハンドラー
 *
 * API GatewayからHTTPリクエストとして呼び出されます。
 *
 * @param event API Gatewayイベント
 * @returns HTTPレスポンス
 */
export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  console.log('Pub/Sub Push通知を受信:', JSON.stringify(event, null, 2));

  try {
    // 環境変数の検証
    if (!FAMILY_ID) {
      throw new Error('環境変数 FAMILY_ID が設定されていません');
    }

    // リクエストボディをパース
    if (!event.body) {
      console.log('リクエストボディが空です（ヘルスチェック？）');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'OK' }),
      };
    }

    const pubsubMessage: PubSubMessage = JSON.parse(event.body);

    // Pub/Subメッセージのデータをデコード
    const dataStr = Buffer.from(pubsubMessage.message.data, 'base64').toString('utf-8');
    const data: GmailPubSubData = JSON.parse(dataStr);

    console.log('Gmail通知データ:', data);

    // OAuth認証クライアントを作成（Secrets Managerから取得）
    const oauthConfig = await getOAuthConfigFromEnv();
    const auth = createOAuth2Client(oauthConfig);

    // Gmail APIクライアントを作成
    const gmailClient = new GmailClient(auth);

    // 履歴IDから新しいメッセージを取得
    const messageIds = await getNewMessages(auth, data.historyId);

    if (messageIds.length === 0) {
      console.log('新しいメッセージがありません');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No new messages' }),
      };
    }

    console.log(`${messageIds.length}件の新しいメッセージを処理します`);

    // 各メッセージを処理
    for (const messageId of messageIds) {
      try {
        await processMessage(gmailClient, messageId);
      } catch (error) {
        console.error(`メッセージ処理エラー (${messageId}):`, error);
        // 1件のエラーで全体を止めない
        continue;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Success', processed: messageIds.length }),
    };
  } catch (error) {
    console.error('ハンドラーエラー:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

/**
 * 個別のメッセージを処理
 *
 * @param gmailClient Gmail APIクライアント
 * @param messageId メッセージID
 */
async function processMessage(
  gmailClient: GmailClient,
  messageId: string
): Promise<void> {
  console.log(`メッセージを処理中: ${messageId}`);

  // 1. メールの詳細を取得
  const parsedEmail = await gmailClient.getMessage(messageId);

  console.log('メール取得完了:', {
    from: parsedEmail.from,
    subject: parsedEmail.subject,
    bodyLength: parsedEmail.body.length,
  });

  // 2. Amazonカードのメールかどうかを判定
  if (!parser.supports(parsedEmail)) {
    console.log('Amazonカード以外のメールです。スキップします。');
    return;
  }

  console.log('Amazonカードのメールを検出しました');

  // 3. 取引データを抽出
  const transactionData = parser.parse(parsedEmail);

  if (!transactionData) {
    console.error('メールから取引データを抽出できませんでした');
    return;
  }

  console.log('取引データ抽出成功:', transactionData);

  // 4. カテゴリ自動分類
  const categoryId = await suggestCategory(
    transactionData.description,
    FAMILY_ID
  );

  if (categoryId) {
    console.log(`カテゴリ自動分類成功: categoryId=${categoryId}`);
  } else {
    console.log('カテゴリ自動分類できませんでした（手動設定が必要）');
  }

  // 5. 取引を作成
  const transactionId = await createTransaction({
    familyId: FAMILY_ID,
    date: transactionData.date,
    amount: transactionData.amount,
    type: transactionData.type,
    categoryId,
    description: transactionData.description,
    paymentMethod: transactionData.paymentMethod,
    source: 'email',
    originalEmail: parsedEmail.body,
    createdBy: 'gmail-processor', // システムユーザー
  });

  console.log(`取引作成成功: transactionId=${transactionId}`);

  // 6. メールを既読にする
  await gmailClient.markAsRead(messageId);

  console.log(`メッセージ処理完了: ${messageId}`);
}
