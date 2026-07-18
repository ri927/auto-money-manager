/**
 * サイドバーナビゲーションコンポーネント（マネーフォワード風・モバイル対応）
 *
 * 左側に固定表示されるサイドバーで、主要ページへのリンクとログアウト機能を提供します。
 * モバイルではハンバーガーメニューから開閉できるオーバーレイ表示。
 */

'use client';

// React フック
import { useEffect } from 'react';

// Next.jsのコンポーネント・フック
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

// 認証コンテキストフック
import { useAuth } from '@/contexts/AuthContext';

// UIコンポーネント
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// lucide-react: アイコンライブラリ
import {
  Home,        // ホームアイコン
  PlusCircle,  // プラスアイコン（新規追加）
  List,        // リストアイコン
  BarChart3,   // グラフアイコン（レポート）
  RefreshCw,   // 繰り返しアイコン
  Menu,        // メニューアイコン（その他）
  LogOut,      // ログアウトアイコン
  X,           // 閉じるアイコン
} from 'lucide-react';

/**
 * ナビゲーションアイテムの定義
 * モバイル版のBottomNavigationと統一
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
 * Sidebarのプロパティ型定義
 */
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Sidebarコンポーネント
 *
 * 左側固定のサイドバーナビゲーション（デスクトップ）
 * オーバーレイサイドバー（モバイル）
 */
export function Sidebar({ isOpen, onClose }: SidebarProps) {
  // 現在のURLパスを取得
  const pathname = usePathname();

  // ページ遷移用のルーター
  const router = useRouter();

  // 認証コンテキストから signOut 関数を取得
  const { signOut } = useAuth();

  /**
   * ログアウト処理のハンドラー
   */
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  /**
   * ナビゲーションリンククリック時にモバイルメニューを閉じる
   */
  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  /**
   * ESCキーでメニューを閉じる
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  /**
   * モバイルメニュー開閉時にbodyのスクロールを制御
   * PC版では常に開いているので、モバイル時のみスクロールを制御
   */
  useEffect(() => {
    // モバイル（768px未満）かつメニューが開いている時のみbodyのスクロールを無効化
    const isMobile = window.innerWidth < 768;

    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* オーバーレイ背景（モバイルのみ） */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* サイドバー本体 */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-[280px] bg-sidebar text-sidebar-foreground flex flex-col z-50 transition-transform duration-300',
          // モバイル: スライドイン/アウト
          'md:translate-x-0 md:w-[220px]',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* ヘッダー */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
          <Link href="/dashboard" className="text-lg font-bold text-white" onClick={handleNavClick}>
            家計簿アプリ
          </Link>

          {/* 閉じるボタン（モバイルのみ） */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onClose}
            aria-label="メニューを閉じる"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* ナビゲーションエリア */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-white'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ログアウトボタン（下部固定） */}
        <div className="border-t border-sidebar-border p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </Button>
        </div>
      </aside>
    </>
  );
}
