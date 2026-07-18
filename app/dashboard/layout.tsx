/**
 * ダッシュボードレイアウトコンポーネント
 *
 * /dashboard 配下のすべてのページで共通のレイアウトを提供します。
 * 認証ガードを適用し、ナビゲーションバーを表示し、子ページをその下に配置します。
 *
 * Next.js App Router の layout.tsx: 親レイアウトとして機能し、
 * このディレクトリ配下のすべてのページで自動的に適用されます。
 */

// ダッシュボードクライアントレイアウトコンポーネントをインポート
// （認証ガードとナビゲーションバーを含むクライアントコンポーネント）
import { DashboardClientLayout } from '@/components/dashboard/DashboardClientLayout';

/**
 * DashboardLayoutコンポーネント
 *
 * @param children - 子ページのコンポーネント（React.ReactNode）
 *                   Next.jsが自動的にページコンポーネントを渡します
 *
 * 例: /dashboard/page.tsx の内容が children として渡される
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // DashboardClientLayout で囲むことで、認証ガードとレイアウトを適用
    <DashboardClientLayout>
      {children}
    </DashboardClientLayout>
  );
}
