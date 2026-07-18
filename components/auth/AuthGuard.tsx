/**
 * 認証ガードコンポーネント
 *
 * 認証が必要なページを保護します。
 * 未認証のユーザーは自動的にログインページにリダイレクトされます。
 */

'use client';

// React と Next.js のフック
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 認証コンテキストフック
import { useAuth } from '@/contexts/AuthContext';

/**
 * AuthGuard のプロパティ型定義
 */
interface AuthGuardProps {
  children: React.ReactNode; // 保護する子コンポーネント
}

/**
 * AuthGuard コンポーネント
 *
 * 認証状態をチェックし、未認証の場合はログインページにリダイレクトします。
 * ログイン済みの場合は、子コンポーネントを表示します。
 *
 * @param children - 保護する子コンポーネント
 */
export function AuthGuard({ children }: AuthGuardProps) {
  // useAuth: 認証状態を取得
  const { user, loading } = useAuth();

  // useRouter: ページ遷移用
  const router = useRouter();

  /**
   * 認証状態の変化を監視
   *
   * - loading が false（認証チェック完了）で、user が null（未認証）の場合、
   *   ログインページにリダイレクトします。
   */
  useEffect(() => {
    // loading が true の場合は、まだ認証状態を確認中なので何もしない
    if (loading) {
      return;
    }

    // user が null（未認証）の場合、ログインページにリダイレクト
    if (!user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  /**
   * レンダリング
   *
   * - loading が true の場合: ローディング表示
   * - user が null（未認証）の場合: null（リダイレクト処理中）
   * - user が存在する（認証済み）の場合: 子コンポーネントを表示
   */

  // 認証状態を確認中の場合、ローディング表示
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未認証の場合、null を返す（リダイレクト処理中）
  if (!user) {
    return null;
  }

  // 認証済みの場合、子コンポーネントを表示
  return <>{children}</>;
}
