/**
 * Gmail Watch 自動更新Lambda関数
 *
 * EventBridge（CloudWatch Events）によって毎日実行され、
 * Gmail APIのWatch（Push通知）を自動的に更新します。
 *
 * Watchの有効期限は7日間なので、余裕を持って毎日更新します。
 */

import type { ScheduledHandler } from 'aws-lambda';
import { createOAuth2Client, getOAuthConfigFromEnv } from '../email-processor-gmail/gmail/auth';
import { setupWatch, isWatchExpired } from '../email-processor-gmail/gmail/watch';

/**
 * 環境変数
 */
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
const TOPIC_NAME = `projects/${PROJECT_ID}/topics/gmail-push-notifications`;

/**
 * 最後のWatch設定情報を保存するための環境変数
 * （実際にはDynamoDBなどに保存することを推奨）
 */
let lastHistoryId = process.env.LAST_HISTORY_ID || '';
let lastExpiration = process.env.LAST_EXPIRATION || '';

/**
 * Lambda関数のメインハンドラー
 *
 * EventBridgeから定期的に呼び出されます。
 *
 * @param event EventBridgeイベント
 */
export const handler: ScheduledHandler = async (event) => {
  console.log('Gmail Watch 自動更新を開始:', JSON.stringify(event, null, 2));

  try {
    // 環境変数の検証
    if (!PROJECT_ID) {
      throw new Error('環境変数 GOOGLE_CLOUD_PROJECT_ID が設定されていません');
    }

    // OAuth認証クライアントを作成（Secrets Managerから取得）
    const oauthConfig = await getOAuthConfigFromEnv();
    const auth = createOAuth2Client(oauthConfig);

    // 現在のWatch設定が期限切れかチェック
    let needsRenewal = true;
    if (lastExpiration) {
      needsRenewal = isWatchExpired(lastExpiration);
      console.log(`現在のWatch有効期限: ${new Date(parseInt(lastExpiration)).toLocaleString('ja-JP')}`);
      console.log(`更新が必要: ${needsRenewal ? 'はい' : 'いいえ'}`);
    } else {
      console.log('初回実行: Watchを設定します');
    }

    if (!needsRenewal) {
      console.log('Watchはまだ有効です。更新をスキップします。');
      return;
    }

    // Watchを更新
    console.log(`Pub/Subトピック: ${TOPIC_NAME}`);
    const response = await setupWatch(auth, TOPIC_NAME);

    // 更新情報を保存（次回の判定に使用）
    lastHistoryId = response.historyId;
    lastExpiration = response.expiration;

    const expirationDate = new Date(parseInt(response.expiration));
    const now = new Date();
    const daysUntilExpiration = Math.ceil(
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log('✅ Gmail Watch更新成功:');
    console.log(`  History ID: ${response.historyId}`);
    console.log(`  有効期限: ${expirationDate.toLocaleString('ja-JP')}`);
    console.log(`  残り日数: ${daysUntilExpiration}日`);

    // TODO: 実際にはDynamoDBに保存することを推奨
    // await saveToDynamoDB({
    //   historyId: response.historyId,
    //   expiration: response.expiration,
    // });
  } catch (error) {
    console.error('❌ Gmail Watch更新エラー:', error);

    // エラー通知（SNSなど）を送信することを推奨
    // await sendErrorNotification(error);

    throw error;
  }
};

/**
 * Watch設定情報をDynamoDBに保存（推奨実装）
 *
 * @param data Watch設定情報
 */
async function saveToDynamoDB(data: { historyId: string; expiration: string }): Promise<void> {
  // TODO: DynamoDBに保存する実装
  // const dynamodb = new DynamoDB.DocumentClient();
  // await dynamodb.put({
  //   TableName: 'GmailWatchStatus',
  //   Item: {
  //     id: 'current',
  //     historyId: data.historyId,
  //     expiration: data.expiration,
  //     updatedAt: new Date().toISOString(),
  //   },
  // }).promise();
}
