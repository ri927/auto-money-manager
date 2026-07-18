/**
 * Providersコンポーネント
 *
 * アプリ全体のContextプロバイダーをまとめて管理します。
 * サーバーコンポーネント（layout.tsx）から、クライアントコンポーネント（Contexts）を
 * 分離するための中間コンポーネントです。
 */

'use client';

// React の型定義をインポート
import { ReactNode } from 'react';

// Amplifyの設定を最初にロード（認証機能を使う前に必須）
import '@/lib/amplify-client';

// 認証プロバイダーをインポート
import { AuthProvider } from '@/contexts/AuthContext';

/**
 * Providers のプロパティ型定義
 */
interface ProvidersProps {
  children: ReactNode; // 子要素（アプリ全体のコンテンツ）
}

/**
 * Providersコンポーネント
 *
 * 複数のContextプロバイダーを組み合わせて、アプリ全体を囲みます。
 * 将来的に他のプロバイダー（ThemeProvider、DataProviderなど）を追加する場合は、
 * ここに追加していきます。
 *
 * @param children - 子コンポーネント（アプリのコンテンツ）
 */
export function Providers({ children }: ProvidersProps) {
  return (
    // AuthProviderでアプリ全体を囲む
    // これにより、すべてのコンポーネントでuseAuth()が使用可能になります
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
