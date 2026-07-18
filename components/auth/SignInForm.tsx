/**
 * ログインフォームコンポーネント
 *
 * ユーザーがメールアドレスとパスワードでログインするためのフォーム。
 * AWS Amplify Auth を使用して認証を行います。
 */

// 'use client' ディレクティブ: このコンポーネントがクライアントサイドで動作することを示す
// Next.js App Router では、デフォルトがサーバーコンポーネントなので、
// useState や useRouter などのクライアント機能を使う場合は必須
'use client';

// Reactの状態管理フック（useState）をインポート
import { useState } from 'react';

// Next.jsのルーティングフック（画面遷移に使用）
import { useRouter } from 'next/navigation';

// AWS Amplify の認証機能（サインイン関数）をインポート
import { signIn } from 'aws-amplify/auth';

// 認証コンテキストフック（認証状態の更新に使用）
import { useAuth } from '@/contexts/AuthContext';

// UIコンポーネント（shadcn/ui）をインポート
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// アイコンをインポート（パスワード表示/非表示切り替え用）
import { Eye, EyeOff } from 'lucide-react';

/**
 * SignInFormコンポーネント
 *
 * ログインフォームを表示し、認証処理を実行します。
 */
export function SignInForm() {
  // useRouter: Next.jsのルーティング機能（ページ遷移に使用）
  const router = useRouter();

  // useAuth: 認証コンテキストから refreshAuth 関数を取得
  const { refreshAuth } = useAuth();

  // useState: コンポーネントの状態を管理するフック
  // 各状態変数と、その更新用関数のペアを定義

  // メールアドレスの入力値を管理
  const [email, setEmail] = useState('');

  // パスワードの入力値を管理
  const [password, setPassword] = useState('');

  // エラーメッセージを管理（エラーがない場合は空文字）
  const [error, setError] = useState('');

  // ローディング状態を管理（送信中はtrue）
  const [loading, setLoading] = useState(false);

  // パスワード表示/非表示の状態を管理（デフォルトは非表示: false）
  const [showPassword, setShowPassword] = useState(false);

  /**
   * フォーム送信時のハンドラー関数
   *
   * @param e - フォーム送信イベント
   *
   * 処理の流れ:
   * 1. デフォルトのフォーム送信動作（ページリロード）を防止
   * 2. エラーをクリアして、ローディング状態を開始
   * 3. Amplify の signIn を実行してログイン
   * 4. 成功したらダッシュボードページへ遷移
   * 5. 失敗したらエラーメッセージを表示
   * 6. 最後にローディング状態を解除
   */
  const handleSubmit = async (e: React.FormEvent) => {
    // フォームのデフォルト送信動作（ページリロード）を防止
    e.preventDefault();

    // エラー状態をクリア（前回のエラーメッセージを消す）
    setError('');

    // ローディング状態を true にする（ボタンを無効化、ローディング表示）
    setLoading(true);

    try {
      // AWS Amplify の signIn 関数を実行してログイン処理
      // username にメールアドレスを指定（Cognito の設定による）
      await signIn({
        username: email,
        password,
      });

      // 認証状態を更新（AuthContext に現在のユーザー情報を設定）
      await refreshAuth();

      // ログイン成功後、ダッシュボードページへ遷移
      router.push('/dashboard');
    } catch (err) {
      // エラーが発生した場合の処理

      // コンソールにエラー内容を出力（デバッグ用）
      console.error('Sign in error:', err);

      // ユーザーにわかりやすいエラーメッセージを設定
      setError('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
    } finally {
      // try/catch の結果にかかわらず、必ず実行される処理
      // ローディング状態を false に戻す
      setLoading(false);
    }
  };

  /**
   * JSXを返す: UIの構造を定義
   *
   * Card コンポーネントを使用してフォームを囲む
   * w-full: 幅100%、max-w-md: 最大幅を中サイズに制限
   */
  return (
    <Card className="w-full max-w-md">
      {/* カードのヘッダー部分: タイトルと説明 */}
      <CardHeader>
        <CardTitle>ログイン</CardTitle>
        <CardDescription>
          アカウントにログインして家計簿を管理しましょう
        </CardDescription>
      </CardHeader>

      {/* カードのコンテンツ部分: フォーム本体 */}
      <CardContent>
        {/*
          form要素: 送信時に handleSubmit 関数を実行
          space-y-4: 子要素間に縦方向のスペース（1rem）を追加
        */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/*
            エラーメッセージ表示エリア
            error が存在する（truthy）場合のみ表示される
            && 演算子: 左側が true の場合、右側を表示
          */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* メールアドレス入力フィールド */}
          <div className="space-y-2">
            {/* Label: 入力フィールドのラベル、htmlFor で関連付け */}
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"             // HTML5のメール形式バリデーション
              placeholder="example@email.com"
              value={email}            // 現在の入力値（state と連動）
              onChange={(e) => setEmail(e.target.value)}  // 入力時に state を更新
              required                 // 必須入力
              disabled={loading}       // ローディング中は入力無効
            />
          </div>

          {/* パスワード入力フィールド */}
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            {/* 入力フィールドと表示/非表示ボタンを横並びにする */}
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}  // 状態に応じてtypeを切り替え
                placeholder="••••••••"
                value={password}         // 現在の入力値（state と連動）
                onChange={(e) => setPassword(e.target.value)}  // 入力時に state を更新
                required                 // 必須入力
                disabled={loading}       // ローディング中は入力無効
                className="pr-10"        // 右側のパディングを追加（ボタンと重ならないように）
              />
              {/* パスワード表示/非表示切り替えボタン */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}  // クリックで表示/非表示を切り替え
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                disabled={loading}       // ローディング中は無効
                aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
              >
                {/* showPassword の状態に応じてアイコンを切り替え */}
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />  // 表示中はEyeOffアイコン
                ) : (
                  <Eye className="h-5 w-5" />      // 非表示中はEyeアイコン
                )}
              </button>
            </div>
          </div>

          {/* 送信ボタン */}
          <Button type="submit" className="w-full" disabled={loading}>
            {/*
              三項演算子: loading が true なら「ログイン中...」、
              false なら「ログイン」を表示
            */}
            {loading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
