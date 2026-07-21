/**
 * Gmail API 初回OAuth認証スクリプト
 *
 * このスクリプトは、Gmail APIにアクセスするためのリフレッシュトークンを取得します。
 * セットアップ時に1回のみ実行してください。
 *
 * 使用方法:
 * 1. CLIENT_ID と CLIENT_SECRET を Google Cloud Console から取得
 * 2. 以下のコマンドを実行: npx tsx scripts/gmail-auth.ts
 * 3. ブラウザで認証URLを開き、Googleアカウントでログイン
 * 4. 認可コードをコピーしてターミナルに貼り付け
 * 5. 取得したリフレッシュトークンをLambda環境変数に設定
 */

import { generateAuthUrl, getRefreshTokenFromCode } from '../amplify/functions/email-processor-gmail/gmail/auth';
import * as readline from 'readline';

/**
 * Google Cloud Console で取得したクライアントID
 * 例: '123456789-abcdefghijk.apps.googleusercontent.com'
 */
const CLIENT_ID = process.env.GMAIL_CLIENT_ID || 'YOUR_CLIENT_ID';

/**
 * Google Cloud Console で取得したクライアントシークレット
 * 例: 'GOCSPX-xxxxxxxxxxxxx'
 */
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';

/**
 * リダイレクトURI（OAuth同意画面で設定したもの）
 */
const REDIRECT_URI = 'http://localhost:3000/auth/callback';

async function main() {
  console.log('='.repeat(60));
  console.log('Gmail API 初回OAuth認証');
  console.log('='.repeat(60));
  console.log('');

  // 環境変数のチェック
  if (CLIENT_ID === 'YOUR_CLIENT_ID' || CLIENT_SECRET === 'YOUR_CLIENT_SECRET') {
    console.error('エラー: CLIENT_ID と CLIENT_SECRET を設定してください。');
    console.error('');
    console.error('方法1: 環境変数で設定');
    console.error('  export GMAIL_CLIENT_ID="your-client-id"');
    console.error('  export GMAIL_CLIENT_SECRET="your-client-secret"');
    console.error('  npx tsx scripts/gmail-auth.ts');
    console.error('');
    console.error('方法2: スクリプトを直接編集');
    console.error('  scripts/gmail-auth.ts の CLIENT_ID と CLIENT_SECRET を編集');
    process.exit(1);
  }

  // 1. 認証URLを生成
  const authUrl = generateAuthUrl({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: REDIRECT_URI,
  });

  console.log('【ステップ1】以下のURLをブラウザで開いてください:');
  console.log('');
  console.log(authUrl);
  console.log('');
  console.log('【ステップ2】Googleアカウントでログインして権限を承認してください');
  console.log('');
  console.log('【ステップ3】リダイレクト後のURLをコピーしてください');
  console.log('  ※ 404エラーが表示されても問題ありません');
  console.log('  ※ ブラウザのURLバー全体をコピーしてください');
  console.log('  例: http://localhost:3000/auth/callback?code=4/0AY0e-g7xxxxx...');
  console.log('');

  // 2. 認可コードを入力
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('認可コードまたはリダイレクトURL全体を入力してください: ', async (input) => {
    try {
      console.log('');
      console.log('リフレッシュトークンを取得中...');

      // 入力から認可コードを抽出
      // URL全体が入力された場合は code パラメータを抽出
      let code = input.trim();
      if (code.includes('code=')) {
        const match = code.match(/code=([^&]+)/);
        if (match) {
          code = match[1];
          console.log('URLから認可コードを抽出しました');
        }
      }

      // 3. リフレッシュトークンを取得
      const refreshToken = await getRefreshTokenFromCode(
        {
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          redirectUri: REDIRECT_URI,
        },
        code
      );

      console.log('');
      console.log('='.repeat(60));
      console.log('✅ リフレッシュトークンの取得に成功しました！');
      console.log('='.repeat(60));
      console.log('');
      console.log('リフレッシュトークン:');
      console.log(refreshToken);
      console.log('');
      console.log('【次のステップ】');
      console.log('1. AWS Lambda Console を開く');
      console.log('2. 関数 "email-processor-gmail" を選択');
      console.log('3. 設定 > 環境変数 で以下を設定:');
      console.log('   - キー: GMAIL_REFRESH_TOKEN');
      console.log(`   - 値: ${refreshToken}`);
      console.log('');
      console.log('これで初回認証は完了です！');
    } catch (error) {
      console.error('');
      console.error('❌ エラーが発生しました:', error);
      console.error('');
      console.error('トラブルシューティング:');
      console.error('- 認可コードが正しいか確認してください');
      console.error('- 認可コードは1回しか使用できません。もう一度ステップ1からやり直してください');
      console.error('- CLIENT_ID と CLIENT_SECRET が正しいか確認してください');
    }
    rl.close();
  });
}

main();
