/**
 * カテゴリ管理ページ
 *
 * パス: /dashboard/categories
 * カテゴリのCRUD（作成・読み取り・更新・削除）を行うページです。
 */

'use client';

// React フック
import { useEffect, useState, useCallback } from 'react';

// Amplify Data クライアント
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

// 認証コンテキスト
import { useAuth } from '@/contexts/AuthContext';

// UIコンポーネント
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// 子コンポーネント
import { CategoryList } from '@/components/categories/CategoryList';
import { CategoryModal } from '@/components/categories/CategoryModal';

// ユーティリティ関数
import { getUserFamily } from '@/lib/family-utils';

// アイコン
import { Plus } from 'lucide-react';

// データクライアントを生成
const client = generateClient<Schema>();

/**
 * CategoriesPageコンポーネント
 *
 * カテゴリの一覧を表示し、追加・編集・削除機能を提供します。
 */
export default function CategoriesPage() {
  // useAuth: 現在のユーザー情報を取得
  const { user } = useAuth();

  // useState: コンポーネントの状態管理
  // categories: カテゴリの配列
  const [categories, setCategories] = useState<Array<Schema['Category']['type']>>([]);

  // familyId: ユーザーの所属グループID
  const [familyId, setFamilyId] = useState<string | null>(null);

  // loading: ローディング状態
  const [loading, setLoading] = useState(true);

  // error: エラーメッセージ
  const [error, setError] = useState('');

  // modalOpen: モーダルの開閉状態
  const [modalOpen, setModalOpen] = useState(false);

  // editingCategory: 編集対象のカテゴリ
  const [editingCategory, setEditingCategory] = useState<Schema['Category']['type'] | undefined>();

  // deleteDialogOpen: 削除確認ダイアログの開閉状態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // deletingCategory: 削除対象のカテゴリ
  const [deletingCategory, setDeletingCategory] = useState<Schema['Category']['type'] | null>(null);

  /**
   * カテゴリ一覧を取得
   */
  const fetchCategories = useCallback(async (familyId: string) => {
    try {
      const { data, errors } = await client.models.Category.list({
        filter: {
          familyId: { eq: familyId },
        },
      });

      if (errors) {
        throw new Error('カテゴリの取得に失敗しました');
      }

      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      throw err;
    }
  }, []);

  /**
   * ユーザーの所属グループとカテゴリを取得
   */
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 1. ユーザーの所属グループを取得
        const family = await getUserFamily(user.userId);

        if (!family) {
          setError('グループに所属していません。まずグループを作成してください。');
          setLoading(false);
          return;
        }

        setFamilyId(family.id);

        // 2. カテゴリ一覧を取得
        await fetchCategories(family.id);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  /**
   * カテゴリ追加ボタンのハンドラー
   */
  const handleAdd = useCallback(() => {
    setEditingCategory(undefined);
    setModalOpen(true);
  }, []);

  /**
   * カテゴリ編集ボタンのハンドラー
   */
  const handleEdit = useCallback((category: Schema['Category']['type']) => {
    setEditingCategory(category);
    setModalOpen(true);
  }, []);

  /**
   * カテゴリ削除ボタンのハンドラー
   */
  const handleDelete = useCallback((category: Schema['Category']['type']) => {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  }, []);

  /**
   * 削除確認ハンドラー
   */
  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;

    try {
      // カテゴリの使用状況をチェック
      const { data: transactions } = await client.models.Transaction.list({
        filter: {
          categoryId: { eq: deletingCategory.id },
        },
        limit: 1,
      });

      // 使用中のカテゴリは削除不可
      if (transactions && transactions.length > 0) {
        setError('このカテゴリは使用されているため削除できません');
        setDeleteDialogOpen(false);
        return;
      }

      // カテゴリを削除
      const { errors } = await client.models.Category.delete({
        id: deletingCategory.id,
      });

      if (errors) {
        throw new Error('カテゴリの削除に失敗しました');
      }

      // カテゴリ一覧を再取得
      if (familyId) {
        await fetchCategories(familyId);
      }

      setDeleteDialogOpen(false);
      setDeletingCategory(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('カテゴリの削除中にエラーが発生しました');
      setDeleteDialogOpen(false);
    }
  };

  /**
   * モーダル保存成功時のコールバック
   */
  const handleSuccess = useCallback(async () => {
    // カテゴリ一覧を再取得
    if (familyId) {
      await fetchCategories(familyId);
    }
  }, [familyId, fetchCategories]);

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
  if (error && !familyId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4 text-red-800">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* カテゴリ追加ボタン */}
      <div className="flex justify-end">
        <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-sm md:text-base h-9 md:h-10 px-3 md:px-4">
          <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">カテゴリ</span>追加
        </Button>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">{error}</div>
      )}

      {/* カテゴリ一覧 */}
      <CategoryList
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* カテゴリ追加・編集モーダル */}
      {familyId && (
        <CategoryModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          familyId={familyId}
          category={editingCategory}
          onSuccess={handleSuccess}
        />
      )}

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>カテゴリを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deletingCategory?.name}」を削除します。この操作は取り消せません。
              使用中のカテゴリは削除できません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
