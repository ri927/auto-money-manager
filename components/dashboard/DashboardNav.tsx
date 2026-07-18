/**
 * ダッシュボードナビゲーションコンポーネント
 *
 * ダッシュボード画面のトップに表示されるナビゲーションバー。
 * 主要ページへのリンクとログアウト機能を提供します。
 */

// クライアントサイドコンポーネント（usePathnameなどのフックを使用）
'use client';

// Next.jsのコンポーネント・フック
import Link from 'next/link';
import { usePathname } from 'next/navigation';  // 現在のパスを取得するフック
import { useRouter } from 'next/navigation';    // ルーティング用フック

// 認証コンテキストフック（ログアウト機能を提供）
import { useAuth } from '@/contexts/AuthContext';

// UIコンポーネント
import { Button } from '@/components/ui/button';

// lucide-react: アイコンライブラリ
import {
  Home,        // ホームアイコン
  PlusCircle,  // プラスアイコン（新規追加）
  List,        // リストアイコン
  Tag,         // タグアイコン（カテゴリ）
  Users,       // ユーザーアイコン（家族）
  BarChart3,   // グラフアイコン（レポート）
  LogOut,      // ログアウトアイコン
} from 'lucide-react';

/**
 * ナビゲーションアイテムの定義
 *
 * 各アイテムには以下の情報を含む:
 * - href: リンク先のパス
 * - label: 表示するテキスト
 * - icon: 表示するアイコンコンポーネント
 */
const navItems = [
  { href: '/dashboard', label: 'ホーム', icon: Home },
  { href: '/dashboard/transactions/new', label: '収支入力', icon: PlusCircle },
  { href: '/dashboard/transactions', label: '収支一覧', icon: List },
  { href: '/dashboard/categories', label: 'カテゴリ', icon: Tag },
  { href: '/dashboard/family', label: '家族', icon: Users },
  { href: '/dashboard/reports', label: 'レポート', icon: BarChart3 },
];

/**
 * DashboardNavコンポーネント
 *
 * ナビゲーションバーを表示し、ページ遷移とログアウト機能を提供します。
 */
export function DashboardNav() {
  // usePathname: 現在のURLパスを取得（アクティブなリンクをハイライトするために使用）
  const pathname = usePathname();

  // useRouter: ページ遷移を制御するためのルーター
  const router = useRouter();

  // useAuth: 認証コンテキストから signOut 関数を取得
  const { signOut } = useAuth();

  /**
   * ログアウト処理のハンドラー
   *
   * 処理の流れ:
   * 1. AuthContext の signOut を実行してログアウト
   * 2. 成功したらホームページ（/）へ遷移
   * 3. エラーが発生したらコンソールにログ出力
   */
  const handleSignOut = async () => {
    try {
      // AuthContext の signOut 関数でログアウト
      await signOut();

      // ホームページへ遷移
      router.push('/');
    } catch (error) {
      // エラーが発生した場合、コンソールに出力
      console.error('Sign out error:', error);
    }
  };

  /**
   * ナビゲーションバーのJSXを返す
   *
   * レイアウト:
   * - 左側: アプリ名とナビゲーションリンク
   * - 右側: ログアウトボタン
   */
  return (
    /**
     * nav要素: ナビゲーションバー本体
     *
     * flex: フレックスボックスレイアウト
     * h-16: 高さ4rem（64px）
     * items-center: 縦方向中央揃え
     * justify-between: 左右に要素を配置（間にスペースを作る）
     * border-b: 下側にボーダー
     * bg-white: 白背景
     * px-6: 左右にパディング（1.5rem）
     */
    <nav className="flex h-16 items-center justify-between border-b bg-white px-6">
      {/* 左側のコンテナ: アプリ名とナビゲーションリンク */}
      <div className="flex items-center gap-8">
        {/* アプリ名（ロゴ） */}
        <Link href="/dashboard" className="text-xl font-bold text-blue-600">
          家計簿アプリ
        </Link>

        {/*
          ナビゲーションリンクのコンテナ
          hidden: デフォルトで非表示（モバイル対応）
          md:flex: 中サイズ以上の画面でフレックス表示
          gap-1: 子要素間にスペース（0.25rem）
        */}
        <div className="hidden gap-1 md:flex">
          {/*
            navItems 配列をループして、各ナビゲーションリンクを生成
            map: 配列の各要素に対して処理を実行し、新しい配列を返す
          */}
          {navItems.map((item) => {
            // アイコンコンポーネントを変数に代入
            const Icon = item.icon;

            // 現在のパスとリンク先のパスが一致するかチェック（アクティブ判定）
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}  // Reactのリスト要素には一意なkeyが必要
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  // isActive に応じてスタイルを切り替える
                  // アクティブな場合: 青い背景と青いテキスト
                  // 非アクティブな場合: グレーのテキスト、ホバー時にグレーの背景
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {/* アイコン表示（h-4 w-4: 16x16px） */}
                <Icon className="h-4 w-4" />
                {/* ラベルテキスト */}
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/*
        ログアウトボタン（右側）
        variant="ghost": ゴーストスタイル（背景透明、ホバー時に背景表示）
        size="sm": 小サイズ
        onClick: クリック時に handleSignOut 関数を実行
      */}
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        {/* ログアウトアイコン（mr-2: 右側にマージン 0.5rem） */}
        <LogOut className="mr-2 h-4 w-4" />
        ログアウト
      </Button>
    </nav>
  );
}
