/**
 * Gmail Watch 自動更新Lambda関数の定義
 *
 * EventBridge（CloudWatch Events）によって毎日実行され、
 * Gmail APIのWatch（Push通知）を自動的に更新します。
 */

import { defineFunction } from '@aws-amplify/backend';

/**
 * Lambda関数リソース定義
 *
 * - name: Lambda関数の名前
 * - entry: ハンドラーファイルのパス
 * - timeoutSeconds: タイムアウト（秒）
 * - memoryMB: メモリサイズ（MB）
 * - schedule: EventBridgeスケジュール式（cron or rate）
 */
export const gmailWatchRenewal = defineFunction({
  name: 'gmail-watch-renewal',
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 256,
  environment: {
    // 環境変数はbackend.tsで設定
    // GMAIL_CLIENT_ID: Google Cloud Projectで取得
    // GMAIL_CLIENT_SECRET: Google Cloud Projectで取得
    // GMAIL_REFRESH_TOKEN: 初回認証で取得
    // GOOGLE_CLOUD_PROJECT_ID: Google Cloud ProjectのID
  },
  // EventBridgeスケジュール: 毎日1回実行
  // 注: Amplify Gen 2でスケジュール機能がまだサポートされていないため、
  // デプロイ後にAWSコンソールでEventBridgeルールを手動設定してください
  // schedule: 'rate(1 day)',
});
