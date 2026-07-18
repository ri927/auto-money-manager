/**
 * ダッシュボードクライアントレイアウトコンポーネント（マネーフォワード風・モバイル対応）
 *
 * クライアント側で認証ガードを適用するためのラッパーコンポーネント。
 * app/dashboard/layout.tsx から使用されます。
 * サイドバーナビゲーションを使用したレイアウト。
 * モバイルではハンバーガーメニューでサイドバーを開閉。
 */

'use client';

// React の型定義とフック
import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';

// 認証ガードコンポーネント
import { AuthGuard } from '@/components/auth/AuthGuard';

// サイドバーナビゲーション
import { Sidebar } from '@/components/dashboard/Sidebar';

// ボトムナビゲーション（モバイル専用）
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';

// UIコンポーネント
import { Button } from '@/components/ui/button';

// アイコン
import { Menu } from 'lucide-react';

/**
 * DashboardClientLayout のプロパティ型定義
 */
interface DashboardClientLayoutProps {
  children: ReactNode; // 子ページのコンテンツ
}

/**
 * パスに基づいてページタイトルと説明を取得
 */
function getPageInfo(pathname: string): { title: string; description: string } {
  if (pathname === '/dashboard') {
    return { title: 'ダッシュボード', description: '家計の状況を一目で確認' };
  } else if (pathname === '/dashboard/transactions') {
    return { title: '収支一覧', description: 'すべての収支を管理' };
  } else if (pathname.startsWith('/dashboard/transactions/')) {
    return { title: '収支登録', description: '新しい収支を記録' };
  } else if (pathname === '/dashboard/categories') {
    return { title: 'カテゴリ管理', description: 'カテゴリを追加・編集' };
  } else if (pathname === '/dashboard/family') {
    return { title: '家族グループ', description: 'グループを管理' };
  } else if (pathname === '/dashboard/reports') {
    return { title: 'レポート', description: '収支の分析とグラフ表示' };
  } else if (pathname === '/dashboard/settings') {
    return { title: '設定', description: 'アプリの設定' };
  } else if (pathname === '/dashboard/menu') {
    return { title: 'メニュー', description: '設定とその他の機能' };
  }
  return { title: 'ダッシュボード', description: '' };
}

/**
 * DashboardClientLayoutコンポーネント
 *
 * 認証ガードを適用し、認証済みユーザーのみがダッシュボードにアクセスできるようにします。
 * サイドバー + メインコンテンツの2カラムレイアウト。
 * モバイル対応: ハンバーガーメニューでサイドバーを開閉。
 *
 * @param children - 子ページのコンテンツ
 */
export function DashboardClientLayout({ children }: DashboardClientLayoutProps) {
  // サイドバーの開閉状態を管理
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 現在のパスを取得
  const pathname = usePathname();
  const pageInfo = getPageInfo(pathname);

  return (
    // AuthGuard で囲むことで、未認証ユーザーをログインページにリダイレクト
    <AuthGuard>
      <div className="flex">
        {/* サイドバーナビゲーション（デスクトップのみ、固定位置） */}
        <div className="hidden md:block md:fixed md:left-0 md:top-0 md:h-screen md:w-[220px] md:z-20">
          <Sidebar isOpen={true} onClose={() => {}} />
        </div>

        {/*
          メインコンテンツエリア
          デスクトップ: ml-[220px]（サイドバー幅分の左マージン）
          モバイル: ml-0（ボトムナビゲーションを使用）
        */}
        <div className="flex-1 md:ml-[220px]">
          {/*
            トップバー（デスクトップのみ、スクロール時に上部固定）
          */}
          <header className="hidden md:flex sticky top-0 z-10 h-16 border-b bg-white px-4 md:px-6 items-center justify-between">
            {/* 左側: ページタイトル */}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{pageInfo.title}</h1>
              {pageInfo.description && (
                <p className="text-xs text-gray-500">{pageInfo.description}</p>
              )}
            </div>

            {/* 右側: ユーザー情報など（将来的に追加） */}
            <div className="flex items-center gap-4 ml-auto">
              {/* <span className="text-sm text-gray-600">ユーザー名</span> */}
            </div>
          </header>

          {/*
            ページコンテンツ
            モバイル: p-0 pb-16（ボトムナビゲーション分の下部マージン）
            デスクトップ: p-6 pb-6（通常のパディング）
          */}
          <main className="bg-background p-0 md:p-6 pb-16 md:pb-6">
            {children}
          </main>
        </div>
      </div>

      {/* ボトムナビゲーション（モバイルのみ、固定位置） */}
      <BottomNavigation />
    </AuthGuard>
  );
}
