/**
 * グループ作成ページ
 *
 * パス: /dashboard/family/create
 * 新しい家族グループを作成するためのページです。
 */

// グループ作成フォームコンポーネント
import { CreateFamilyForm } from '@/components/family/CreateFamilyForm';

/**
 * CreateFamilyPageコンポーネント
 *
 * グループ作成フォームを中央に表示します。
 */
export default function CreateFamilyPage() {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      {/* グループ作成フォームを表示 */}
      <CreateFamilyForm />
    </div>
  );
}
