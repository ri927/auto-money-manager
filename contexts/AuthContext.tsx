/**
 * 認証コンテキスト
 *
 * アプリ全体で認証状態とユーザー情報を共有するためのContextを提供します。
 * これにより、どのコンポーネントからでもログイン状態やユーザー情報にアクセスできます。
 */

'use client';

// React の Context と Hooks をインポート
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// AWS Amplify の認証機能をインポート
import { getCurrentUser, signOut as amplifySignOut, fetchAuthSession } from 'aws-amplify/auth';
import type { AuthUser } from 'aws-amplify/auth';

/**
 * 認証コンテキストの型定義
 *
 * AuthContext が提供する値の型を定義します。
 */
interface AuthContextType {
  // 現在ログインしているユーザー（未ログインの場合は null）
  user: AuthUser | null;

  // ログイン状態のローディング中フラグ
  loading: boolean;

  // ログアウト関数
  signOut: () => Promise<void>;

  // 認証状態を再取得する関数（ログイン後などに呼び出す）
  refreshAuth: () => Promise<void>;
}

/**
 * AuthContext の作成
 *
 * createContext: React の Context を作成する関数
 * 初期値は undefined（Provider でラップされていない場合のエラー検出用）
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider のプロパティ型定義
 */
interface AuthProviderProps {
  children: ReactNode; // 子要素（このProviderでラップされるコンポーネント）
}

/**
 * AuthProvider コンポーネント
 *
 * アプリ全体を囲んで、認証状態を提供します。
 * app/layout.tsx でこのコンポーネントを使用します。
 *
 * @param children - 子コンポーネント
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // 状態管理
  // user: 現在ログインしているユーザー情報
  const [user, setUser] = useState<AuthUser | null>(null);

  // loading: 認証状態の確認中フラグ
  const [loading, setLoading] = useState(true);

  /**
   * 認証状態をチェックする関数
   *
   * Amplify から現在のユーザー情報とセッションを取得します。
   * ログイン済みの場合は user に設定、未ログインの場合は null にします。
   */
  const checkAuth = async () => {
    try {
      // セッションの確認（トークンの有効性チェック）
      await fetchAuthSession();

      // 現在のユーザー情報を取得
      const currentUser = await getCurrentUser();

      // ユーザー情報を state に設定
      setUser(currentUser);
    } catch (error) {
      // エラーが発生した場合（未ログインまたはセッション切れ）
      // user を null に設定
      setUser(null);
    } finally {
      // 成功・失敗に関わらず、loading を false に設定
      setLoading(false);
    }
  };

  /**
   * ログアウト関数
   *
   * Amplify のログアウト処理を実行し、user を null にします。
   */
  const signOut = async () => {
    try {
      // Amplify のログアウト処理を実行
      await amplifySignOut();

      // ユーザー情報をクリア
      setUser(null);
    } catch (error) {
      // エラーが発生した場合（通常は発生しない）
      console.error('Sign out error:', error);
      throw error;
    }
  };

  /**
   * 認証状態を再取得する関数
   *
   * ログイン後やユーザー情報更新後に呼び出して、最新の状態を取得します。
   */
  const refreshAuth = async () => {
    await checkAuth();
  };

  /**
   * useEffect: コンポーネントのマウント時に実行
   *
   * アプリの初回ロード時に認証状態をチェックします。
   * 依存配列が空 [] なので、マウント時に1回だけ実行されます。
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Context.Provider を使って、子コンポーネントに認証情報を提供
   *
   * value: AuthContext を通じて提供される値
   */
  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth カスタムフック
 *
 * 認証情報にアクセスするためのフックです。
 * コンポーネント内で const { user, loading, signOut } = useAuth(); のように使用します。
 *
 * @returns AuthContextType - 認証情報オブジェクト
 * @throws Error - AuthProvider でラップされていない場合
 */
export function useAuth() {
  // useContext で AuthContext の値を取得
  const context = useContext(AuthContext);

  // context が undefined の場合、AuthProvider でラップされていないことを示す
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // 認証情報を返す
  return context;
}
