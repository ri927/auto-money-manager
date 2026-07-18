/**
 * ボトムナビゲーションバーコンポーネント（モバイル専用）
 *
 * スマートフォンで画面下部に固定表示されるナビゲーションバー。
 * 主要なページへのクイックアクセスを提供します。
 */

'use client';

// Next.jsのコンポーネント
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ユーティリティ関数
import { cn } from '@/lib/utils';

// アイコン
import {
  Home,        // ホームアイコン
  PlusCircle,  // プラスアイコン（新規追加）
  List,        // リストアイコン
  RefreshCw,   // 繰り返しアイコン
  BarChart3,   // グラフアイコン（レポート）
  Menu,        // メニューアイコン（その他）
} from 'lucide-react';

/**
 * ナビゲーションアイテムの定義
 */
const navItems = [
  { href: '/dashboard', label: 'ホーム', icon: Home },
  { href: '/dashboard/transactions/new', label: '入力', icon: PlusCircle },
  { href: '/dashboard/transactions', label: '一覧', icon: List },
  { href: '/dashboard/recurring', label: '繰り返し', icon: RefreshCw },
  { href: '/dashboard/reports', label: 'レポート', icon: BarChart3 },
  { href: '/dashboard/menu', label: 'メニュー', icon: Menu },
];

/**
 * BottomNavigationコンポーネント
 *
 * モバイル専用の画面下部ナビゲーションバー。
 * 主要な5つの画面へのリンクを提供します。
 */
export function BottomNavigation() {
  // 現在のURLパスを取得
  const pathname = usePathname();

  /**
   * アクティブ状態の判定
   * パスが完全一致、または子パスの場合にアクティブとみなす
   */
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    // 画面下部に固定表示（モバイルのみ）
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                active
                  ? 'text-primary'
                  : 'text-gray-500 active:bg-gray-50'
              )}
            >
              {/* アイコン */}
              <Icon className={cn(
                'h-5 w-5',
                active && 'stroke-[2.5]'
              )} />

              {/* ラベル */}
              <span className={cn(
                'text-[10px]',
                active ? 'font-semibold' : 'font-medium'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
