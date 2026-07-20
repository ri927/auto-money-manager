/**
 * 日次収支モーダルコンポーネント
 *
 * 選択した日付の収支一覧を表示し、追加・編集・削除ができます。
 */

'use client';

// React フック
import { useState, useEffect } from 'react';

// Next.js ルーティング
import { useRouter } from 'next/navigation';

// Amplify Data クライアント
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

// UIコンポーネント
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

// アイコン
import { Plus, Pencil, Trash2 } from 'lucide-react';

// ユーティリティ関数
import { cn } from '@/lib/utils';

// データクライアントを生成
const client = generateClient<Schema>();

/**
 * DailyTransactionsModalのプロパティ型定義
 */
interface DailyTransactionsModalProps {
  // モーダルの表示状態
  isOpen: boolean;
  // モーダルを閉じるコールバック
  onClose: () => void;
  // 選択された日付（YYYY-MM-DD形式）
  selectedDate: string | null;
  // 家族ID
  familyId: string | null;
  // ユーザーID
  userId: string | null;
  // 収支が更新された時のコールバック
  onTransactionUpdated?: () => void;
}

/**
 * DailyTransactionsModalコンポーネント
 */
export function DailyTransactionsModal({
  isOpen,
  onClose,
  selectedDate,
  familyId,
  userId,
  onTransactionUpdated,
}: DailyTransactionsModalProps) {
  const router = useRouter();

  // useState: 状態管理
  const [transactions, setTransactions] = useState<Array<Schema['Transaction']['type']>>([]);
  const [categories, setCategories] = useState<Array<Schema['Category']['type']>>([]);
  const [loading, setLoading] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Schema['Transaction']['type'] | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<Schema['Transaction']['type'] | null>(null);

  // フォーム入力値
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  /**
   * 収支データを取得
   */
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !selectedDate || !familyId) return;

      setLoading(true);
      try {
        // カテゴリ一覧を取得
        const { data: categoryData } = await client.models.Category.list({
          filter: { familyId: { eq: familyId } },
        });
        setCategories(categoryData);

        // その日の収支を取得
        const { data: transactionData } = await client.models.Transaction.list({
          filter: {
            familyId: { eq: familyId },
            date: { eq: new Date(selectedDate).toISOString() },
          },
        });
        setTransactions(transactionData);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, selectedDate, familyId]);

  /**
   * フォームをリセット
   */
  const resetForm = () => {
    setType('expense');
    setAmount('');
    setCategoryId('');
    setDescription('');
    setPaymentMethod('');
    setIsAddMode(false);
    setEditingTransaction(null);
  };

  /**
   * 追加モードを開始
   */
  const startAddMode = () => {
    resetForm();
    setIsAddMode(true);
  };

  /**
   * 編集モードを開始
   */
  const startEditMode = (transaction: Schema['Transaction']['type']) => {
    setEditingTransaction(transaction);
    setType(transaction.type || 'expense');
    setAmount(transaction.amount.toString());
    setCategoryId(transaction.categoryId || '');
    setDescription(transaction.description || '');
    setPaymentMethod(transaction.paymentMethod || '');
    setIsAddMode(true);
  };

  /**
   * 収支を保存
   */
  const handleSave = async () => {
    if (!familyId || !userId || !selectedDate) return;

    // バリデーション
    if (!amount || parseFloat(amount) <= 0) {
      alert('金額を入力してください');
      return;
    }

    if (!categoryId) {
      alert('カテゴリを選択してください');
      return;
    }

    setLoading(true);
    try {
      if (editingTransaction) {
        // 更新
        await client.models.Transaction.update({
          id: editingTransaction.id,
          amount: parseFloat(amount),
          type,
          categoryId,
          description,
          paymentMethod,
        });
      } else {
        // 新規作成
        await client.models.Transaction.create({
          familyId,
          date: new Date(selectedDate).toISOString(),
          amount: parseFloat(amount),
          type,
          categoryId,
          description,
          paymentMethod,
          createdBy: userId,
          source: 'manual',
        });
      }

      // 収支一覧を再取得
      const { data } = await client.models.Transaction.list({
        filter: {
          familyId: { eq: familyId },
          date: { eq: new Date(selectedDate).toISOString() },
        },
      });
      setTransactions(data);

      resetForm();
      onTransactionUpdated?.();
    } catch (err) {
      console.error('Error saving transaction:', err);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 削除確認ダイアログを開く
   */
  const confirmDelete = (transaction: Schema['Transaction']['type']) => {
    setDeletingTransaction(transaction);
    setDeleteConfirmOpen(true);
  };

  /**
   * 収支を削除
   */
  const handleDelete = async () => {
    if (!deletingTransaction || !familyId) return;

    setLoading(true);
    try {
      await client.models.Transaction.delete({ id: deletingTransaction.id });

      // 収支一覧を再取得
      const { data } = await client.models.Transaction.list({
        filter: {
          familyId: { eq: familyId },
          date: { eq: new Date(selectedDate!).toISOString() },
        },
      });
      setTransactions(data);

      setDeleteConfirmOpen(false);
      setDeletingTransaction(null);
      onTransactionUpdated?.();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      alert('削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  /**
   * モーダルを閉じる
   */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 日付フォーマット
  const formattedDate = selectedDate
    ? new Date(selectedDate).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      })
    : '';

  // カテゴリをフィルタ
  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl w-[96vw] max-h-[92vh] overflow-y-auto">
          <DialogHeader className="pb-3 md:pb-4">
            <DialogTitle className="text-base md:text-xl font-bold">{formattedDate}の収支</DialogTitle>
            <DialogDescription className="text-xs md:text-base">
              この日の収支を確認・編集できます
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 md:space-y-4">
            {/* 追加ボタン - モバイルでタップしやすく */}
            {!isAddMode && (
              <Button onClick={startAddMode} className="w-full h-12 md:h-10 text-base md:text-sm font-semibold">
                <Plus className="h-5 w-5 md:h-4 md:w-4 mr-2" />
                収支を追加
              </Button>
            )}

            {/* 追加・編集フォーム */}
            {isAddMode && (
              <div className="border rounded-lg p-3 md:p-4 bg-gray-50 space-y-3 md:space-y-3">
                <h3 className="font-bold text-base md:text-lg">
                  {editingTransaction ? '収支を編集' : '新しい収支'}
                </h3>

                {/* 種別 */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="transaction-type" className="text-sm md:text-sm font-semibold">種別</Label>
                  <Select value={type} onValueChange={(value) => setType(value as 'income' | 'expense')}>
                    <SelectTrigger id="transaction-type" aria-label="収支の種別を選択" className="h-12 md:h-10 text-base md:text-sm">
                      <SelectValue>
                        {type === 'income' ? '収入' : '支出'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense" className="text-base md:text-sm py-3.5 md:py-2">支出</SelectItem>
                      <SelectItem value="income" className="text-base md:text-sm py-3.5 md:py-2">収入</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 金額 */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="transaction-amount" className="text-sm md:text-sm font-semibold">金額</Label>
                  <Input
                    id="transaction-amount"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="1000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    aria-required="true"
                    className="h-12 md:h-10 text-base md:text-sm"
                  />
                </div>

                {/* カテゴリ */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="transaction-category" className="text-sm md:text-sm font-semibold">カテゴリ</Label>
                  <Select value={categoryId} onValueChange={(value) => value && setCategoryId(value)}>
                    <SelectTrigger id="transaction-category" aria-label="カテゴリを選択" aria-required="true" className="h-12 md:h-10 text-base md:text-sm">
                      <SelectValue placeholder="カテゴリを選択">
                        {categoryId
                          ? filteredCategories.find((c) => c.id === categoryId)?.name || 'カテゴリを選択'
                          : 'カテゴリを選択'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id} className="text-base md:text-sm py-3.5 md:py-2">
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 説明 */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="transaction-description" className="text-sm md:text-sm font-semibold">説明（任意）</Label>
                  <Input
                    id="transaction-description"
                    type="text"
                    placeholder="例: スーパーで食材購入"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    className="h-12 md:h-10 text-base md:text-sm"
                  />
                </div>

                {/* 支払い方法 */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="transaction-payment" className="text-sm md:text-sm font-semibold">支払い方法（任意）</Label>
                  <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value || '')}>
                    <SelectTrigger id="transaction-payment" aria-label="支払い方法を選択" className="h-12 md:h-10 text-base md:text-sm">
                      <SelectValue placeholder="選択してください">
                        {paymentMethod === 'cash'
                          ? '現金'
                          : paymentMethod === 'credit'
                          ? 'クレジットカード'
                          : paymentMethod === 'debit'
                          ? 'デビットカード'
                          : paymentMethod === 'e-money'
                          ? '電子マネー'
                          : '選択してください'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash" className="text-base md:text-sm py-3.5 md:py-2">現金</SelectItem>
                      <SelectItem value="credit" className="text-base md:text-sm py-3.5 md:py-2">クレジットカード</SelectItem>
                      <SelectItem value="debit" className="text-base md:text-sm py-3.5 md:py-2">デビットカード</SelectItem>
                      <SelectItem value="e-money" className="text-base md:text-sm py-3.5 md:py-2">電子マネー</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ボタン - モバイルでタップしやすく */}
                <div className="flex gap-2 md:gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={loading}
                    className="flex-1 h-12 md:h-10 text-base md:text-sm font-semibold"
                  >
                    キャンセル
                  </Button>
                  <Button onClick={handleSave} disabled={loading} className="flex-1 h-12 md:h-10 text-base md:text-sm font-semibold">
                    {loading ? '保存中...' : '保存'}
                  </Button>
                </div>
              </div>
            )}

            {/* 収支一覧 */}
            {transactions.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-bold text-sm md:text-base text-gray-700">登録済みの収支</h3>
                <div className="divide-y border rounded-lg">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 md:p-4 hover:bg-gray-50 min-h-[68px] md:min-h-[60px]"
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="font-semibold text-sm md:text-base truncate">
                          {transaction.description || '未入力'}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                          {transaction.type === 'income' ? '収入' : '支出'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                        <p
                          className={cn(
                            'font-bold tabular-nums text-base md:text-base',
                            transaction.type === 'income' ? 'text-income' : 'text-expense'
                          )}
                        >
                          {transaction.type === 'income' ? '+' : '-'}¥
                          {transaction.amount.toLocaleString()}
                        </p>
                        <div className="flex gap-0.5 md:gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditMode(transaction)}
                            aria-label={`${transaction.description || '未入力'}を編集`}
                            className="h-10 w-10 md:h-8 md:w-8"
                          >
                            <Pencil className="h-4.5 w-4.5 md:h-3.5 md:w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(transaction)}
                            aria-label={`${transaction.description || '未入力'}を削除`}
                            className="h-10 w-10 md:h-8 md:w-8"
                          >
                            <Trash2 className="h-4.5 w-4.5 md:h-3.5 md:w-3.5 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              !isAddMode && (
                <div className="text-center py-10 md:py-12 text-gray-500">
                  <p className="text-sm md:text-base">この日の収支はまだありません</p>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="w-[92vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base md:text-xl font-bold">収支を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription className="text-sm md:text-base">
              この操作は取り消せません。本当に削除しますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto h-12 md:h-10 text-base md:text-sm font-semibold">キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="w-full sm:w-auto h-12 md:h-10 text-base md:text-sm font-semibold bg-red-600 hover:bg-red-700">
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
