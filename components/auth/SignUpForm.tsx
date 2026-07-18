/**
 * 新規登録フォームコンポーネント
 *
 * ユーザーが新規アカウントを作成するための2ステップフォーム。
 * ステップ1: メールアドレスとパスワードで登録
 * ステップ2: メールで送られてきた確認コードを入力
 */

// クライアントサイドコンポーネント（状態管理とイベントハンドリングを使用）
'use client';

// Reactの状態管理フック
import { useState } from 'react';

// Next.jsのルーティングフック
import { useRouter } from 'next/navigation';

// AWS Amplify の認証機能（signUp: 新規登録、confirmSignUp: 確認コード検証）
import { signUp, confirmSignUp } from 'aws-amplify/auth';

// UIコンポーネント
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * SignUpFormコンポーネント
 *
 * 2段階の登録プロセスを管理します。
 */
export function SignUpForm() {
  // ページ遷移用のルーター
  const router = useRouter();

  // 現在のステップを管理（'signup': 登録画面、'confirm': 確認コード入力画面）
  const [step, setStep] = useState<'signup' | 'confirm'>('signup');

  // フォーム入力値の状態管理
  const [email, setEmail] = useState('');                    // メールアドレス
  const [password, setPassword] = useState('');              // パスワード
  const [confirmationCode, setConfirmationCode] = useState('');  // 確認コード（6桁）
  const [error, setError] = useState('');                    // エラーメッセージ
  const [loading, setLoading] = useState(false);             // ローディング状態

  /**
   * 新規登録処理のハンドラー（ステップ1）
   *
   * @param e - フォーム送信イベント
   *
   * 処理の流れ:
   * 1. フォーム送信のデフォルト動作を防止
   * 2. Amplify の signUp を実行して登録
   * 3. 成功したら確認コード入力画面（ステップ2）へ遷移
   * 4. 失敗したらエラーメッセージを表示
   */
  const handleSignUp = async (e: React.FormEvent) => {
    // デフォルトのフォーム送信動作を防止
    e.preventDefault();

    // エラーをクリア
    setError('');

    // ローディング開始
    setLoading(true);

    try {
      // AWS Amplify の signUp 関数で新規ユーザー登録
      await signUp({
        username: email,  // ユーザー名としてメールアドレスを使用
        password,
        options: {
          // ユーザー属性（Cognito に保存される追加情報）
          userAttributes: {
            email,  // メールアドレスを属性として保存
          },
        },
      });

      // 登録成功: 確認コード入力ステップへ遷移
      setStep('confirm');
    } catch (err: any) {
      // エラー発生時の処理

      // コンソールにエラーを出力（デバッグ用）
      console.error('Sign up error:', err);

      // エラーメッセージを設定（err.message があればそれを使用、なければデフォルトメッセージ）
      setError(
        err.message || 'サインアップに失敗しました。もう一度お試しください。'
      );
    } finally {
      // 処理完了後、必ずローディングを終了
      setLoading(false);
    }
  };

  /**
   * 確認コード検証処理のハンドラー（ステップ2）
   *
   * @param e - フォーム送信イベント
   *
   * 処理の流れ:
   * 1. ユーザーが入力した確認コードを検証
   * 2. 成功したらログインページへ遷移
   * 3. 失敗したらエラーメッセージを表示
   */
  const handleConfirmSignUp = async (e: React.FormEvent) => {
    // デフォルトのフォーム送信動作を防止
    e.preventDefault();

    // エラーをクリア
    setError('');

    // ローディング開始
    setLoading(true);

    try {
      // AWS Amplify の confirmSignUp 関数で確認コードを検証
      await confirmSignUp({
        username: email,           // 登録時のメールアドレス
        confirmationCode,          // ユーザーが入力した6桁の確認コード
      });

      // 確認成功: ログインページへ遷移
      router.push('/auth/signin');
    } catch (err: any) {
      // エラー発生時の処理

      // コンソールにエラーを出力（デバッグ用）
      console.error('Confirmation error:', err);

      // エラーメッセージを設定
      setError(
        err.message || '確認コードが正しくありません。もう一度お試しください。'
      );
    } finally {
      // 処理完了後、必ずローディングを終了
      setLoading(false);
    }
  };

  /**
   * ステップ2: 確認コード入力画面
   *
   * step が 'confirm' の場合、この画面を表示
   * ユーザーがメールで受け取った6桁の確認コードを入力します
   */
  if (step === 'confirm') {
    return (
      <Card className="w-full max-w-md">
        {/* ヘッダー: タイトルと説明 */}
        <CardHeader>
          <CardTitle>メールアドレスの確認</CardTitle>
          <CardDescription>
            {/* 登録したメールアドレスを表示 */}
            {email} に送信された確認コードを入力してください
          </CardDescription>
        </CardHeader>

        {/* コンテンツ: 確認コード入力フォーム */}
        <CardContent>
          <form onSubmit={handleConfirmSignUp} className="space-y-4">
            {/* エラーメッセージ表示エリア */}
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* 確認コード入力フィールド */}
            <div className="space-y-2">
              <Label htmlFor="code">確認コード</Label>
              <Input
                id="code"
                type="text"                // テキスト形式
                placeholder="123456"       // 6桁の数字
                value={confirmationCode}   // 入力値（state と連動）
                onChange={(e) => setConfirmationCode(e.target.value)}  // 入力時に state を更新
                required                   // 必須入力
                disabled={loading}         // ローディング中は入力無効
              />
            </div>

            {/* 確認ボタン */}
            <Button type="submit" className="w-full" disabled={loading}>
              {/* ローディング中は「確認中...」、通常時は「確認」を表示 */}
              {loading ? '確認中...' : '確認'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  /**
   * ステップ1: 新規登録フォーム画面
   *
   * デフォルト（step が 'signup'）の場合、この画面を表示
   * メールアドレスとパスワードを入力して新規登録を行います
   */
  return (
    <Card className="w-full max-w-md">
      {/* ヘッダー: タイトルと説明 */}
      <CardHeader>
        <CardTitle>新規登録</CardTitle>
        <CardDescription>
          アカウントを作成して家計簿の管理を始めましょう
        </CardDescription>
      </CardHeader>

      {/* コンテンツ: 登録フォーム */}
      <CardContent>
        <form onSubmit={handleSignUp} className="space-y-4">
          {/* エラーメッセージ表示エリア */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* メールアドレス入力フィールド */}
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"               // HTML5のメール形式バリデーション
              placeholder="example@email.com"
              value={email}              // 現在の入力値
              onChange={(e) => setEmail(e.target.value)}  // 入力時に state を更新
              required                   // 必須入力
              disabled={loading}         // ローディング中は入力無効
            />
          </div>

          {/* パスワード入力フィールド */}
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"            // パスワード形式（入力内容を隠す）
              placeholder="8文字以上"
              value={password}           // 現在の入力値
              onChange={(e) => setPassword(e.target.value)}  // 入力時に state を更新
              required                   // 必須入力
              disabled={loading}         // ローディング中は入力無効
              minLength={8}              // 最小8文字のバリデーション
            />
            {/* パスワード要件の説明 */}
            <p className="text-xs text-gray-500">
              パスワードは8文字以上で、大文字、小文字、数字を含める必要があります
            </p>
          </div>

          {/* 登録ボタン */}
          <Button type="submit" className="w-full" disabled={loading}>
            {/* ローディング中は「登録中...」、通常時は「新規登録」を表示 */}
            {loading ? '登録中...' : '新規登録'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
