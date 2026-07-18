/**
 * ログインページ
 *
 * パス: /auth/signin
 * ユーザーがログインするためのページです。
 * SignInFormコンポーネントを表示し、新規登録ページへのリンクも提供します。
 *
 * すでにログイン済みの場合は、自動的にダッシュボードにリダイレクトされます。
 */

'use client';

// React の useEffect フックをインポート
import { useEffect } from 'react';

// Next.jsのLinkコンポーネント（ページ遷移用）
import Link from 'next/link';

// Next.jsのルーティングフック（リダイレクトに使用）
import { useRouter } from 'next/navigation';

// 認証コンテキストフック（ログイン状態の確認に使用）
import { useAuth } from '@/contexts/AuthContext';

// ログインフォームコンポーネント
import { SignInForm } from '@/components/auth/SignInForm';

/**
 * SignInPageコンポーネント
 *
 * デフォルトエクスポート: Next.js App Router のページコンポーネントとして機能
 */
export default function SignInPage() {
  // useRouter: Next.jsのルーティング機能
  const router = useRouter();

  // useAuth: 認証情報を取得
  const { user, loading } = useAuth();

  /**
   * ログイン済みユーザーをダッシュボードにリダイレクト
   *
   * useEffect: コンポーネントのマウント時と、user/loading の変更時に実行
   * - loading が false（認証チェック完了）
   * - user が存在する（ログイン済み）
   * の両方が満たされた場合、ダッシュボードにリダイレクト
   */
  useEffect(() => {
    // 認証チェックが完了し、ユーザーがログイン済みの場合
    if (!loading && user) {
      // ダッシュボードにリダイレクト
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  /**
   * ローディング中は空のdivを表示
   * （一瞬ログインフォームが表示されるのを防ぐ）
   */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  /**
   * ログイン済みユーザーには何も表示しない
   * （リダイレクト処理が実行されるため）
   */
  if (user) {
    return null;
  }

  return (
    /**
     * 外側のコンテナ
     *
     * flex: フレックスボックスレイアウト
     * min-h-screen: 画面の高さ全体を使用
     * items-center: 縦方向中央揃え
     * justify-center: 横方向中央揃え
     * bg-gray-50: 薄いグレーの背景色
     * px-4: 左右にパディング（1rem）
     */
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      {/*
        内側のコンテナ
        w-full: 幅100%
        max-w-md: 最大幅を中サイズに制限
        space-y-4: 子要素間に縦方向のスペース（1rem）を追加
      */}
      <div className="w-full max-w-md space-y-4">
        {/* ログインフォームコンポーネントを表示 */}
        <SignInForm />

        {/* ホームページへ戻るリンク */}
        <p className="text-center text-sm text-gray-600">
          <Link href="/" className="hover:underline">
            ← ホームに戻る
          </Link>
        </p>
      </div>
    </div>
  );
}
