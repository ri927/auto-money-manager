/**
 * メール自動取り込みLambda関数の定義
 *
 * この関数は、Amazon SESから受信したメールを処理し、
 * クレジットカード利用通知を解析して取引を自動作成します。
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
export const emailProcessor = defineFunction({
  name: 'email-processor',
  entry: './handler.ts',
  timeoutSeconds: 30, // メール処理には十分な時間
  memoryMB: 512, // メール解析には512MBで十分
  environment: {
    // 環境変数はbackend.tsで設定
    // FAMILY_ID: 実行時に設定
    // EMAIL_BUCKET: 実行時に設定
    // API_ENDPOINT: 実行時に設定
  },
});
