/**
 * 収支入力ページ
 *
 * パス: /dashboard/transactions/new
 * 新しい収支を手動で入力するページです。
 */

'use client';

// React フック
import { useEffect, useState } from 'react';

// 認証コンテキスト
import { useAuth } from '@/contexts/AuthContext';

// ユーティリティ関数
import { getUserFamily } from '@/lib/family-utils';

// 収支入力フォームコンポーネント
import { TransactionForm } from '@/components/transactions/TransactionForm';

/**
 * NewTransactionPageコンポーネント
 *
 * 収支入力フォームを表示します。
 */
export default function NewTransactionPage() {
  // useAuth: 現在のユーザー情報を取得
  const { user } = useAuth();

  // useState: コンポーネントの状態管理
  // familyId: ユーザーの所属グループID
  const [familyId, setFamilyId] = useState<string | null>(null);

  // loading: ローディング状態
  const [loading, setLoading] = useState(true);

  // error: エラーメッセージ
  const [error, setError] = useState('');

  /**
   * ユーザーの所属グループを取得
   */
  useEffect(() => {
    const fetchUserFamily = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const family = await getUserFamily(user.userId);

        if (!family) {
          setError('グループに所属していません。まずグループを作成してください。');
          setLoading(false);
          return;
        }

        setFamilyId(family.id);
      } catch (err) {
        console.error('Error fetching user family:', err);
        setError('グループ情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchUserFamily();
  }, [user]);

  // ローディング中の表示
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  // エラー時の表示
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4 text-red-800">{error}</div>
      </div>
    );
  }

  // グループIDとユーザーIDが取得できたら、フォームを表示
  if (familyId && user) {
    return (
      <div className="container mx-auto flex min-h-full items-center justify-center px-4 py-8">
        <TransactionForm familyId={familyId} userId={user.userId} />
      </div>
    );
  }

  // その他のエラー
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="rounded-md bg-red-50 p-4 text-red-800">
        ユーザー情報またはグループ情報を取得できませんでした
      </div>
    </div>
  );
}
