/**
 * Gmail API + Pub/Sub メール自動取り込みLambda関数の定義
 *
 * この関数は、Google Cloud Pub/SubからPush通知を受け取り、
 * Gmail APIで三井住友Amazonカードの利用通知を解析して取引を自動作成します。
 */

import { defineFunction } from '@aws-amplify/backend';

/**
 * Lambda関数リソース定義
 *
 * - name: Lambda関数の名前
 * - entry: ハンドラーファイルのパス
 * - timeoutSeconds: タイムアウト（秒）
 * - memoryMB: メモリサイズ（MB）
 */
export const emailProcessorGmail = defineFunction({
  name: 'email-processor-gmail',
  entry: './handler.ts',
  timeoutSeconds: 60, // Gmail API呼び出しを考慮して長めに設定
  memoryMB: 512,
  environment: {
    // 環境変数はbackend.tsまたはAWSコンソールで設定
    // GMAIL_CLIENT_ID: Google Cloud Projectで取得
    // GMAIL_CLIENT_SECRET: Google Cloud Projectで取得
    // GMAIL_REFRESH_TOKEN: 初回認証で取得
    // FAMILY_ID: 家族グループID
  },
  // 外部パッケージを指定（バンドルせずにnode_modulesから読み込む）
  bundling: {
    externalModules: ['googleapis', 'google-auth-library'],
    nodeModules: [
      'googleapis',
      'google-auth-library',
      '@aws-sdk/signature-v4',
      '@aws-sdk/protocol-http',
      '@aws-crypto/sha256-js',
      '@aws-sdk/credential-provider-node',
    ],
  },
});
