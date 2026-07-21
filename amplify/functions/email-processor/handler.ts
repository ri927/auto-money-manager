/**
 * メール自動取り込みLambda関数ハンドラー
 *
 * Amazon SESからメールを受信し、三井住友Amazonカードの利用通知を解析して
 * 自動的に取引記録を作成します。
 *
 * 対応カード: 三井住友Amazonカード（Amazon Mastercard）のみ
 *
 * フロー:
 * 1. SESイベントからメールIDを取得
 * 2. S3からメール本文を取得
 * 3. メールをパース（送信元、件名、本文を抽出）
 * 4. Amazonカードのメールかどうかを判定
 * 5. 取引データを抽出
 * 6. カテゴリ自動分類
 * 7. GraphQL Mutationで取引を作成
 */

import type { SESEvent, SESHandler } from 'aws-lambda';
import { parseEmail, fetchEmailFromS3 } from './utils/email-parser';
import { SMBCParser } from './parsers/smbc-parser';
import { suggestCategory } from './auto-categorization/rule-matcher';
import { createTransaction } from './graphql/mutations';
import type { EmailParser } from './parsers/types';

/**
 * 環境変数
 */
const FAMILY_ID = process.env.FAMILY_ID || '';
const EMAIL_BUCKET = process.env.EMAIL_BUCKET || '';

/**
 * サポートするパーサーのリスト
 *
 * 現在対応: 三井住友Amazonカード（Amazon Mastercard）のみ
 *
 * 将来的に他のカードを追加する場合、ここに追加:
 * - new RakutenParser() (楽天カード)
 * - new JCBParser() (JCBカード)
 * など
 */
const PARSERS: EmailParser[] = [
  new SMBCParser(), // 三井住友Amazonカード専用
];

/**
 * Lambda関数のメインハンドラー
 *
 * @param event SESイベント
 * @returns ステータスコード
 */
export const handler: SESHandler = async (event: SESEvent) => {
  console.log('メール処理を開始:', JSON.stringify(event, null, 2));

  try {
    // 環境変数の検証
    if (!FAMILY_ID) {
      throw new Error('環境変数 FAMILY_ID が設定されていません');
    }

    if (!EMAIL_BUCKET) {
      throw new Error('環境変数 EMAIL_BUCKET が設定されていません');
    }

    // SESイベントから最初のレコードを取得
    const record = event.Records[0];
    if (!record) {
      console.error('SESイベントにレコードが含まれていません');
      return;
    }

    // メールのメタデータを取得
    const { messageId, source, destination } = record.ses.mail;
    console.log(`メール受信: ID=${messageId}, From=${source}, To=${destination.join(', ')}`);

    // S3からメール本文を取得
    // SESはメールをS3に保存する際、プレフィックスを付けます
    const s3Key = `emails/${messageId}`;
    const rawEmail = await fetchEmailFromS3(EMAIL_BUCKET, s3Key);

    if (!rawEmail) {
      console.error('S3からメールを取得できませんでした');
      return;
    }

    // メールをパース（送信元、件名、本文を抽出）
    const parsedEmail = parseEmail(rawEmail);
    console.log('メール解析完了:', {
      from: parsedEmail.from,
      subject: parsedEmail.subject,
      bodyLength: parsedEmail.body.length,
    });

    // 対応するパーサーを選択
    const parser = PARSERS.find(p => p.supports(parsedEmail));

    if (!parser) {
      console.warn('サポートされていないメールです:', parsedEmail.from);
      // 将来的にはS3の `unsupported/` フォルダに移動するなど
      return;
    }

    console.log(`パーサー選択: ${parser.constructor.name}`);

    // 取引データを抽出
    const transactionData = parser.parse(parsedEmail);

    if (!transactionData) {
      console.error('メールから取引データを抽出できませんでした');
      // 将来的にはS3の `failed/` フォルダに移動するなど
      return;
    }

    console.log('取引データ抽出成功:', transactionData);

    // カテゴリ自動分類
    const categoryId = await suggestCategory(
      transactionData.description,
      FAMILY_ID
    );

    if (categoryId) {
      console.log(`カテゴリ自動分類成功: categoryId=${categoryId}`);
    } else {
      console.log('カテゴリ自動分類できませんでした（手動設定が必要）');
    }

    // 取引を作成
    const transactionId = await createTransaction({
      familyId: FAMILY_ID,
      date: transactionData.date,
      amount: transactionData.amount,
      type: transactionData.type,
      categoryId,
      description: transactionData.description,
      paymentMethod: transactionData.paymentMethod,
      source: 'email',
      originalEmail: rawEmail,
      createdBy: 'email-processor', // システムユーザー
    });

    console.log(`取引作成成功: transactionId=${transactionId}`);

    // 成功レスポンス
    return;
  } catch (error) {
    console.error('メール処理中にエラーが発生しました:', error);

    // エラーは再スローしない（SESの再試行を避けるため）
    // 代わりに、エラーメトリクスやアラームで監視
    return;
  }
};
