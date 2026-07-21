/**
 * Gmail API OAuth 2.0 認証ユーティリティ
 *
 * Google Cloud Projectで取得したOAuth認証情報を使用して、
 * Gmail APIにアクセスするためのアクセストークンを取得・更新します。
 */

import { google } from 'googleapis';
import { getGmailCredentials } from '../utils/secrets';

/**
 * OAuth 2.0クライアントの設定
 */
export interface OAuthConfig {
  /** クライアントID */
  clientId: string;
  /** クライアントシークレット */
  clientSecret: string;
  /** リフレッシュトークン */
  refreshToken: string;
  /** リダイレクトURI（初回認証時のみ使用） */
  redirectUri?: string;
}

/**
 * OAuth 2.0クライアントを作成
 *
 * リフレッシュトークンを使用して、自動的にアクセストークンを取得・更新します。
 *
 * @param config OAuth設定
 * @returns OAuth2クライアント
 */
export function createOAuth2Client(config: OAuthConfig) {
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri || 'http://localhost:3000/auth/callback'
  );

  // リフレッシュトークンを設定
  oauth2Client.setCredentials({
    refresh_token: config.refreshToken,
  });

  return oauth2Client;
}

/**
 * AWS Secrets ManagerからOAuth設定を取得
 *
 * Secrets Managerから認証情報を読み込みます。
 * キャッシュ機能により、Lambda関数の再利用時にSecrets Managerへのアクセスを減らします。
 *
 * @returns OAuth設定
 * @throws Secrets Managerからの取得に失敗した場合
 */
export async function getOAuthConfigFromEnv(): Promise<OAuthConfig> {
  // Secrets Managerから認証情報を取得
  const credentials = await getGmailCredentials();

  // OAuth設定に変換
  return {
    clientId: credentials.GMAIL_CLIENT_ID,
    clientSecret: credentials.GMAIL_CLIENT_SECRET,
    refreshToken: credentials.GMAIL_REFRESH_TOKEN || '',
  };
}

/**
 * 初回認証用: 認証URLを生成
 *
 * このURLをブラウザで開き、Googleアカウントでログインして認可コードを取得します。
 * セットアップ時の1回のみ実行します。
 *
 * @param config OAuth設定（clientId, clientSecret, redirectUri）
 * @returns 認証URL
 */
export function generateAuthUrl(config: Omit<OAuthConfig, 'refreshToken'>): string {
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri || 'http://localhost:3000/auth/callback'
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // リフレッシュトークンを取得
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly', // メール読み取り
      'https://www.googleapis.com/auth/gmail.modify',   // ラベル変更（既読化など）
    ],
    prompt: 'consent', // 毎回同意画面を表示（リフレッシュトークン再取得のため）
  });

  return authUrl;
}

/**
 * 初回認証用: 認可コードからリフレッシュトークンを取得
 *
 * ブラウザで認証後に取得した認可コードを使用して、
 * リフレッシュトークンを取得します。
 *
 * @param config OAuth設定（clientId, clientSecret, redirectUri）
 * @param code 認可コード
 * @returns リフレッシュトークン
 */
export async function getRefreshTokenFromCode(
  config: Omit<OAuthConfig, 'refreshToken'>,
  code: string
): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri || 'http://localhost:3000/auth/callback'
  );

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error('リフレッシュトークンが取得できませんでした');
  }

  return tokens.refresh_token;
}
