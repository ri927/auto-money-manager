/**
 * 新規登録ページ（無効化）
 *
 * パス: /auth/signup
 * 個人使用のため、新規登録機能は無効化されています。
 * このページにアクセスするとログインページにリダイレクトされます。
 *
 * ユーザーはAWS Cognitoコンソールで管理者が事前に作成したアカウントのみを使用できます。
 */

// Next.jsのredirect関数（サーバー側でのリダイレクト用）
import { redirect } from 'next/navigation';

/**
 * SignUpPageコンポーネント
 *
 * 新規登録は無効化されているため、ログインページにリダイレクトします。
 */
export default function SignUpPage() {
  // ログインページにリダイレクト
  redirect('/auth/signin');
}
