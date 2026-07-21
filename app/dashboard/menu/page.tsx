/**
 * メニューページコンポーネント
 *
 * パス: /dashboard/menu
 * モバイルのボトムナビゲーションから「メニュー」を選択した際に表示されます。
 * カテゴリ、家族、設定などの二次的な機能へのリンクを提供します。
 */
'use client';

// Next.jsのコンポーネント
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 認証コンテキスト
import { useAuth } from '@/contexts/AuthContext';

// UIコンポーネント
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// アイコン
import {
  Tag,         // タグアイコン（カテゴリ）
  Users,       // ユーザーアイコン（家族）
  Settings,    // 設定アイコン
  LogOut,      // ログアウトアイコン
  ChevronRight, // 右矢印アイコン
  Calendar,    // カレンダーアイコン
} from 'lucide-react';

/**
 * メニュー項目の定義
 */
const menuItems = [
  { href: '/dashboard/calendar', label: 'カレンダー', icon: Calendar, description: '日付別の取引確認' },
  { href: '/dashboard/categories', label: 'カテゴリ管理', icon: Tag, description: 'カテゴリの追加・編集' },
  { href: '/dashboard/family', label: '家族グループ', icon: Users, description: 'メンバーの招待・管理' },
  { href: '/dashboard/settings', label: '設定', icon: Settings, description: 'アプリの設定変更' },
];

/**
 * MenuPageコンポーネント
 *
 * メニュー画面を表示します。
 */
export default function MenuPage() {
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

  return (
    <div className="container mx-auto p-3 md:p-6 space-y-3 md:space-y-6">
      {/* メニュー項目 */}
      <div className="space-y-3 md:space-y-4">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} prefetch={true}>
              <Card className="shadow-sm border-none hover:shadow-md transition-shadow">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    {/* 左側: アイコン + ラベル */}
                    <div className="flex items-center gap-3 md:gap-4">
                      {/* アイコン背景 */}
                      <div className="rounded-lg md:rounded-xl p-2 md:p-3 bg-primary/10">
                        <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                      </div>

                      {/* ラベルと説明 */}
                      <div>
                        <p className="font-semibold text-sm md:text-base text-gray-900">{item.label}</p>
                        <p className="text-[10px] md:text-xs text-gray-500">{item.description}</p>
                      </div>
                    </div>

                    {/* 右側: 矢印アイコン */}
                    <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* ログアウトボタン */}
      <div>
        <Button
          variant="outline"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-11 md:h-12 text-sm md:text-base"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          ログアウト
        </Button>
      </div>
    </div>
  );
}
