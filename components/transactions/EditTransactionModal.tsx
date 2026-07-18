/**
 * 収支編集モーダルコンポーネント
 *
 * 既存の収支を編集するためのモーダル。
 */

'use client';

// React フック
import { useState, useEffect } from 'react';

// Amplify Data クライアント
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

// UIコンポーネント
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

// データクライアントを生成
const client = generateClient<Schema>();

/**
 * EditTransactionModalのプロパティ型定義
 */
interface EditTransactionModalProps {
  // モーダルの表示状態
  isOpen: boolean;
  // モーダルを閉じるコールバック
  onClose: () => void;
  // 編集する収支
  transaction: Schema['Transaction']['type'] | null;
  // 家族ID
  familyId: string | null;
  // 収支が更新された時のコールバック
  onTransactionUpdated?: () => void;
}

/**
 * EditTransactionModalコンポーネント
 */
export function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  familyId,
  onTransactionUpdated,
}: EditTransactionModalProps) {
  // useState: 状態管理
  const [categories, setCategories] = useState<Array<Schema['Category']['type']>>([]);
  const [loading, setLoading] = useState(false);

  // フォーム入力値
  const [date, setDate] = useState<string>('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  /**
   * カテゴリ一覧を取得
   */
  useEffect(() => {
    const fetchCategories = async () => {
      if (!familyId) return;

      try {
        const { data } = await client.models.Category.list({
          filter: { familyId: { eq: familyId } },
        });
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, familyId]);

  /**
   * 収支データをフォームに設定
   */
  useEffect(() => {
    if (transaction) {
      const transactionDate = new Date(transaction.date);
      setDate(transactionDate.toISOString().split('T')[0]);
      setType(transaction.type || 'expense');
      setAmount(transaction.amount.toString());
      setCategoryId(transaction.categoryId || '');
      setDescription(transaction.description || '');
      setPaymentMethod(transaction.paymentMethod || '');
    }
  }, [transaction]);

  /**
   * 収支を更新
   */
  const handleSave = async () => {
    if (!transaction) return;

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
      const { errors } = await client.models.Transaction.update({
        id: transaction.id,
        date: new Date(date).toISOString(),
        amount: parseFloat(amount),
        type,
        categoryId,
        description,
        paymentMethod,
      });

      if (errors) {
        throw new Error('収支の更新に失敗しました');
      }

      onTransactionUpdated?.();
      onClose();
    } catch (err) {
      console.error('Error updating transaction:', err);
      alert('更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // カテゴリをフィルタ
  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>収支を編集</DialogTitle>
          <DialogDescription>
            収支の詳細を編集できます
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 日付 */}
          <div className="space-y-2">
            <Label htmlFor="date">日付</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={loading}
              aria-required="true"
            />
          </div>

          {/* 種別 */}
          <div className="space-y-2">
            <Label htmlFor="edit-type">種別</Label>
            <Select value={type} onValueChange={(value) => setType(value as 'income' | 'expense')}>
              <SelectTrigger id="edit-type" aria-label="収支の種別を選択" aria-required="true">
                <SelectValue>
                  {type === 'income' ? '収入' : '支出'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">支出</SelectItem>
                <SelectItem value="income">収入</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 金額 */}
          <div className="space-y-2">
            <Label htmlFor="amount">金額</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="1"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={loading}
              aria-required="true"
            />
          </div>

          {/* カテゴリ */}
          <div className="space-y-2">
            <Label htmlFor="edit-category">カテゴリ</Label>
            <Select value={categoryId} onValueChange={(value) => value && setCategoryId(value)}>
              <SelectTrigger id="edit-category" aria-label="カテゴリを選択" aria-required="true">
                <SelectValue placeholder="カテゴリを選択">
                  {categoryId
                    ? filteredCategories.find((c) => c.id === categoryId)?.name || 'カテゴリを選択'
                    : 'カテゴリを選択'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 説明 */}
          <div className="space-y-2">
            <Label htmlFor="description">説明（任意）</Label>
            <Input
              id="description"
              type="text"
              placeholder="例: スーパーで食材購入"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* 支払い方法 */}
          <div className="space-y-2">
            <Label htmlFor="edit-payment">支払い方法（任意）</Label>
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value || '')}>
              <SelectTrigger id="edit-payment" aria-label="支払い方法を選択">
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
                <SelectItem value="cash">現金</SelectItem>
                <SelectItem value="credit">クレジットカード</SelectItem>
                <SelectItem value="debit">デビットカード</SelectItem>
                <SelectItem value="e-money">電子マネー</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
