/**
 * 収支一覧ページ
 *
 * パス: /dashboard/transactions
 * 登録された収支の一覧を表示するページです。
 */

'use client';

// React フック
import { useEffect, useState, useCallback } from 'react';

// Next.js コンポーネント
import Link from 'next/link';

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
import { TransactionList } from '@/components/transactions/TransactionList';
import { EditTransactionModal } from '@/components/transactions/EditTransactionModal';

// ユーティリティ関数
import { getUserFamily } from '@/lib/family-utils';

// アイコン
import { Plus } from 'lucide-react';

// データクライアントを生成
const client = generateClient<Schema>();

/**
 * TransactionsPageコンポーネント
 *
 * 収支の一覧を表示します。
 */
export default function TransactionsPage() {
  // useAuth: 現在のユーザー情報を取得
  const { user } = useAuth();

  // useState: コンポーネントの状態管理
  // transactions: 収支の配列
  const [transactions, setTransactions] = useState<Array<Schema['Transaction']['type']>>([]);

  // categories: カテゴリの配列
  const [categories, setCategories] = useState<Array<Schema['Category']['type']>>([]);

  // categoryMap: カテゴリマップ（id → Category）
  const [categoryMap, setCategoryMap] = useState<Map<string, Schema['Category']['type']>>(new Map());

  // familyId: ユーザーの所属グループID
  const [familyId, setFamilyId] = useState<string | null>(null);

  // loading: ローディング状態
  const [loading, setLoading] = useState(true);

  // error: エラーメッセージ
  const [error, setError] = useState('');

  // deleteDialogOpen: 削除確認ダイアログの開閉状態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // deletingTransaction: 削除対象の収支
  const [deletingTransaction, setDeletingTransaction] = useState<Schema['Transaction']['type'] | null>(null);

  // editDialogOpen: 編集ダイアログの開閉状態
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // editingTransaction: 編集対象の収支
  const [editingTransaction, setEditingTransaction] = useState<Schema['Transaction']['type'] | null>(null);

  /**
   * ユーザーの所属グループ、カテゴリ、収支を取得
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
        const { data: categoriesData } = await client.models.Category.list({
          filter: {
            familyId: { eq: family.id },
          },
        });

        setCategories(categoriesData);

        // カテゴリマップを作成
        const map = new Map<string, Schema['Category']['type']>();
        categoriesData.forEach((category) => {
          map.set(category.id, category);
        });
        setCategoryMap(map);

        // 3. 収支一覧を取得
        await fetchTransactions(family.id);
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
   * 収支一覧を取得
   */
  const fetchTransactions = useCallback(async (familyId: string) => {
    try {
      const { data, errors } = await client.models.Transaction.list({
        filter: {
          familyId: { eq: familyId },
        },
      });

      if (errors) {
        throw new Error('収支の取得に失敗しました');
      }

      // 日付降順でソート
      const sorted = data.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setTransactions(sorted);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      throw err;
    }
  }, []);

  /**
   * 編集ボタンのハンドラー
   */
  const handleEdit = useCallback((transaction: Schema['Transaction']['type']) => {
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  }, []);

  /**
   * 編集更新後のハンドラー
   */
  const handleTransactionUpdated = useCallback(async () => {
    if (familyId) {
      await fetchTransactions(familyId);
    }
  }, [familyId, fetchTransactions]);

  /**
   * 削除ボタンのハンドラー
   */
  const handleDelete = useCallback((transaction: Schema['Transaction']['type']) => {
    setDeletingTransaction(transaction);
    setDeleteDialogOpen(true);
  }, []);

  /**
   * 削除確認ハンドラー
   */
  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;

    try {
      const { errors } = await client.models.Transaction.delete({
        id: deletingTransaction.id,
      });

      if (errors) {
        throw new Error('収支の削除に失敗しました');
      }

      // 収支一覧を再取得
      if (familyId) {
        await fetchTransactions(familyId);
      }

      setDeleteDialogOpen(false);
      setDeletingTransaction(null);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError('収支の削除中にエラーが発生しました');
      setDeleteDialogOpen(false);
    }
  };

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
      {/* 新規登録ボタン */}
      <div className="flex justify-end">
        <Link href="/dashboard/transactions/new" prefetch={true}>
          <Button className="bg-primary hover:bg-primary/90 text-sm md:text-base h-9 md:h-10 px-3 md:px-4">
            <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">収支を</span>記録
          </Button>
        </Link>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">{error}</div>
      )}

      {/* 収支一覧 */}
      <TransactionList
        transactions={transactions}
        categoryMap={categoryMap}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* 編集モーダル */}
      <EditTransactionModal
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        transaction={editingTransaction}
        familyId={familyId}
        onTransactionUpdated={handleTransactionUpdated}
      />

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>収支を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。本当に削除しますか？
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
