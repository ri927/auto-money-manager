/**
 * AWS Secrets Manager からシークレットを取得するユーティリティ
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

/**
 * Gmail API認証情報の型定義
 */
export interface GmailCredentials {
  GMAIL_CLIENT_ID: string;
  GMAIL_CLIENT_SECRET: string;
  GMAIL_REFRESH_TOKEN?: string;
  GOOGLE_CLOUD_PROJECT_ID: string;
}

/**
 * キャッシュされた認証情報
 * Lambda関数が再利用される場合、Secrets Managerへのアクセスを減らすためにキャッシュします
 */
let cachedCredentials: GmailCredentials | null = null;

/**
 * Secrets ManagerからGmail API認証情報を取得
 *
 * @returns Gmail API認証情報
 * @throws Secrets Managerからの取得に失敗した場合
 */
export async function getGmailCredentials(): Promise<GmailCredentials> {
  // キャッシュがあればそれを返す
  if (cachedCredentials) {
    console.log('Using cached credentials');
    return cachedCredentials;
  }

  const secretName = process.env.SECRET_NAME;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!secretName) {
    throw new Error('環境変数 SECRET_NAME が設定されていません');
  }

  console.log(`Fetching secret from Secrets Manager: ${secretName}`);

  const client = new SecretsManagerClient({ region });

  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    );

    if (!response.SecretString) {
      throw new Error('SecretString が空です');
    }

    // JSONパース
    const credentials = JSON.parse(response.SecretString) as GmailCredentials;

    // 必須フィールドの検証
    if (!credentials.GMAIL_CLIENT_ID || !credentials.GMAIL_CLIENT_SECRET) {
      throw new Error('認証情報に必須フィールドが含まれていません');
    }

    // キャッシュに保存
    cachedCredentials = credentials;

    console.log('Successfully fetched credentials from Secrets Manager');
    return credentials;
  } catch (error) {
    console.error('Secrets Manager からの認証情報取得に失敗しました:', error);
    throw error;
  }
}

/**
 * キャッシュをクリア（テスト用）
 */
export function clearCache(): void {
  cachedCredentials = null;
}
