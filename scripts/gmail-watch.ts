/**
 * Gmail Push通知（Watch）設定スクリプト
 *
 * このスクリプトは、Gmail APIのPush通知機能を有効にします。
 * 新しいメールが届いたときに、Google Cloud Pub/Subに通知が送信されます。
 *
 * 注意: Watchの有効期限は7日間です。定期的に再実行してください。
 *
 * 使用方法:
 * 1. 環境変数を設定（または直接編集）
 * 2. 以下のコマンドを実行: npx tsx scripts/gmail-watch.ts
 */

import { createOAuth2Client } from '../amplify/functions/email-processor-gmail/gmail/auth';
import { setupWatch, stopWatch } from '../amplify/functions/email-processor-gmail/gmail/watch';

/**
 * Google Cloud Console で取得した認証情報
 */
const CLIENT_ID = process.env.GMAIL_CLIENT_ID || 'YOUR_CLIENT_ID';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || 'YOUR_REFRESH_TOKEN';

/**
 * Google Cloud Project ID
 */
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'YOUR_PROJECT_ID';

/**
 * Pub/Sub トピック名
 */
const TOPIC_NAME = `projects/${PROJECT_ID}/topics/gmail-push-notification`;

async function main() {
  console.log('='.repeat(60));
  console.log('Gmail Push通知 設定');
  console.log('='.repeat(60));
  console.log('');

  // 環境変数のチェック
  if (
    CLIENT_ID === 'YOUR_CLIENT_ID' ||
    CLIENT_SECRET === 'YOUR_CLIENT_SECRET' ||
    REFRESH_TOKEN === 'YOUR_REFRESH_TOKEN'
  ) {
    console.error('エラー: 認証情報を設定してください。');
    console.error('');
    console.error('方法1: 環境変数で設定');
    console.error('  export GMAIL_CLIENT_ID="your-client-id"');
    console.error('  export GMAIL_CLIENT_SECRET="your-client-secret"');
    console.error('  export GMAIL_REFRESH_TOKEN="your-refresh-token"');
    console.error('  export GOOGLE_CLOUD_PROJECT_ID="your-project-id"');
    console.error('  npx tsx scripts/gmail-watch.ts');
    console.error('');
    console.error('方法2: スクリプトを直接編集');
    console.error('  scripts/gmail-watch.ts の各変数を編集');
    process.exit(1);
  }

  try {
    console.log('OAuth認証クライアントを作成中...');
    const auth = createOAuth2Client({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN,
    });

    console.log('Gmail Push通知を設定中...');
    console.log(`Pub/Subトピック: ${TOPIC_NAME}`);
    console.log('');

    const response = await setupWatch(auth, TOPIC_NAME);

    const expirationDate = new Date(parseInt(response.expiration));
    const now = new Date();
    const daysUntilExpiration = Math.ceil(
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log('='.repeat(60));
    console.log('✅ Gmail Push通知の設定に成功しました！');
    console.log('='.repeat(60));
    console.log('');
    console.log('設定情報:');
    console.log(`  History ID: ${response.historyId}`);
    console.log(`  有効期限: ${expirationDate.toLocaleString('ja-JP')}`);
    console.log(`  残り日数: ${daysUntilExpiration}日`);
    console.log('');
    console.log('⚠️  重要: Watchは7日間で期限切れになります');
    console.log('   期限切れ前にこのスクリプトを再実行してください。');
    console.log('');
    console.log('【推奨】EventBridge（CloudWatch Events）で自動更新を設定:');
    console.log('  - Lambda関数を定期実行（毎日など）');
    console.log('  - このスクリプトの内容をLambda関数化');
  } catch (error) {
    console.error('');
    console.error('❌ エラーが発生しました:', error);
    console.error('');
    console.error('トラブルシューティング:');
    console.error('- REFRESH_TOKEN が正しいか確認してください');
    console.error('- Pub/Subトピックが存在するか確認してください');
    console.error('- Gmail API Push用のサービスアカウントに権限があるか確認してください');
    console.error('');
    console.error('Pub/Subトピックの作成:');
    console.error(`  gcloud pubsub topics create gmail-push-notifications --project=${PROJECT_ID}`);
    console.error('');
    console.error('サービスアカウントへの権限付与:');
    console.error(`  gcloud projects add-iam-policy-binding ${PROJECT_ID} \\`);
    console.error('    --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \\');
    console.error('    --role=roles/pubsub.publisher');
    process.exit(1);
  }
}

/**
 * Watch停止用の関数（オプション）
 *
 * Push通知を停止したい場合に使用します。
 */
async function stopWatchIfNeeded() {
  const auth = createOAuth2Client({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    refreshToken: REFRESH_TOKEN,
  });

  await stopWatch(auth);
  console.log('Gmail Push通知を停止しました');
}

// メイン処理を実行
main();

// Watch停止が必要な場合は以下のコメントを外してください
// stopWatchIfNeeded();
