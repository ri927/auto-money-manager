/**
 * 収支入力フォームコンポーネント
 *
 * 収入・支出を手動で入力するためのフォームです。
 * 日付、種別、金額、カテゴリ、説明、支払い方法を入力できます。
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// ユーティリティ関数
import { calculateNextExecutionDate } from '@/lib/recurring-utils';

// データクライアントを生成
const client = generateClient<Schema>();

/**
 * TransactionFormのプロパティ型定義
 */
interface TransactionFormProps {
  familyId: string; // グループID
  userId: string;   // ユーザーID
}

/**
 * TransactionFormコンポーネント
 *
 * 収支を入力するフォームです。
 *
 * @param familyId - グループID
 * @param userId - ユーザーID
 */
export function TransactionForm({ familyId, userId }: TransactionFormProps) {
  // useRouter: ページ遷移用
  const router = useRouter();

  // useState: コンポーネントの状態管理
  // date: 取引日付（デフォルトは今日）
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // type: 取引種別（income or expense）
  const [type, setType] = useState<'income' | 'expense'>('expense');

  // amount: 金額
  const [amount, setAmount] = useState<string>('');

  // categoryId: カテゴリID
  const [categoryId, setCategoryId] = useState<string>('');

  // description: 説明
  const [description, setDescription] = useState<string>('');

  // paymentMethod: 支払い方法
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  // 繰り返し設定の有効/無効
  const [isRecurring, setIsRecurring] = useState(false);

  // 繰り返し設定の状態
  const [recurringName, setRecurringName] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [interval, setInterval] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [hasEndDate, setHasEndDate] = useState(false);

  // categories: カテゴリ一覧
  const [categories, setCategories] = useState<Array<Schema['Category']['type']>>([]);

  // loading: ローディング状態
  const [loading, setLoading] = useState(false);

  // error: エラーメッセージ
  const [error, setError] = useState('');

  /**
   * カテゴリ一覧を取得
   */
  useEffect(() => {
    const fetchCategories = async () => {
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
      }
    };

    fetchCategories();
  }, [familyId]);

  /**
   * 種別が変更されたときに、カテゴリをリセット
   */
  useEffect(() => {
    setCategoryId('');
  }, [type]);

  /**
   * フォーム送信ハンドラー
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 基本バリデーション
    if (!date) {
      setError('日付を入力してください');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('金額は0より大きい数値を入力してください');
      return;
    }

    if (!categoryId) {
      setError('カテゴリを選択してください');
      return;
    }

    // 繰り返し設定のバリデーション
    if (isRecurring) {
      if (!recurringName.trim()) {
        setError('繰り返し取引の名前を入力してください');
        return;
      }

      if (frequency === 'weekly' && (dayOfWeek < 0 || dayOfWeek > 6)) {
        setError('曜日を選択してください');
        return;
      }

      if ((frequency === 'monthly' || frequency === 'yearly') && (dayOfMonth < 1 || dayOfMonth > 31)) {
        setError('月の日付は 1〜31 の範囲で指定してください');
        return;
      }

      if (hasEndDate && endDate && new Date(endDate) < new Date(startDate)) {
        setError('終了日は開始日より後にしてください');
        return;
      }
    }

    setLoading(true);

    try {
      if (isRecurring) {
        // TODO: Amplify Sandbox 起動後にコメント解除
        // 繰り返し取引を作成
        // const nextExecutionDate = calculateNextExecutionDate(
        //   new Date(startDate),
        //   frequency,
        //   interval,
        //   frequency === 'monthly' || frequency === 'yearly' ? dayOfMonth : undefined,
        //   frequency === 'weekly' ? dayOfWeek : undefined
        // );

        // const { errors } = await client.models.RecurringTransaction.create({
        //   familyId,
        //   name: recurringName,
        //   description,
        //   amount: parseFloat(amount),
        //   type,
        //   categoryId,
        //   paymentMethod,
        //   frequency,
        //   interval,
        //   dayOfMonth: frequency === 'monthly' || frequency === 'yearly' ? dayOfMonth : undefined,
        //   dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
        //   startDate,
        //   endDate: hasEndDate ? endDate : undefined,
        //   nextExecutionDate: nextExecutionDate.toISOString().split('T')[0],
        //   isActive: true,
        //   createdBy: userId,
        // });

        // if (errors) {
        //   throw new Error('繰り返し取引の登録に失敗しました');
        // }

        // 一時的に通常の取引として作成
        setError('繰り返し取引機能は現在準備中です。Amplify Sandbox を起動してください。');
        setLoading(false);
        return;
      } else {
        // 通常の取引を作成
        const { errors } = await client.models.Transaction.create({
          familyId,
          date: new Date(date).toISOString(),
          amount: parseFloat(amount),
          type,
          categoryId,
          description,
          paymentMethod,
          createdBy: userId,
          source: 'manual',
        });

        if (errors) {
          throw new Error('収支の登録に失敗しました');
        }
      }

      // 成功したら、収支一覧ページへリダイレクト
      router.push('/dashboard/transactions');
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError('登録中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  /**
   * キャンセルボタンのハンドラー
   */
  const handleCancel = () => {
    router.back();
  };

  // 種別に応じてカテゴリをフィルタ
  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <Card className="w-full shadow-sm border-none">
      <CardHeader className="p-3 md:p-6">
        <CardTitle className="text-lg md:text-xl">収支を記録</CardTitle>
        <CardDescription className="text-sm md:text-base">日々の収入・支出を記録します</CardDescription>
      </CardHeader>

      <CardContent className="p-3 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-6">
          {/* エラーメッセージ */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm md:text-base text-red-800">
              {error}
            </div>
          )}

          {/* 日付 */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm md:text-base font-medium">日付</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={loading}
              className="h-11 md:h-10 text-base md:text-sm"
            />
          </div>

          {/* 種別 */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm md:text-base font-medium">種別</Label>
            <Select value={type} onValueChange={(value) => setType(value as 'income' | 'expense')}>
              <SelectTrigger className="h-11 md:h-10 text-base md:text-sm">
                <SelectValue>
                  {type === 'income' ? '収入' : '支出'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense" className="text-base md:text-sm py-3 md:py-2">支出</SelectItem>
                <SelectItem value="income" className="text-base md:text-sm py-3 md:py-2">収入</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 金額 */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm md:text-base font-medium">金額</Label>
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
              className="h-11 md:h-10 text-base md:text-sm"
            />
          </div>

          {/* カテゴリ */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm md:text-base font-medium">カテゴリ</Label>
            <Select value={categoryId} onValueChange={(value) => value && setCategoryId(value)}>
              <SelectTrigger className="h-11 md:h-10 text-base md:text-sm">
                <SelectValue placeholder="カテゴリを選択">
                  {categoryId
                    ? filteredCategories.find((c) => c.id === categoryId)?.name || 'カテゴリを選択'
                    : 'カテゴリを選択'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id} className="text-base md:text-sm py-3 md:py-2">
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 説明 */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm md:text-base font-medium">説明（任意）</Label>
            <Input
              id="description"
              type="text"
              placeholder="例: スーパーで食材購入"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="h-11 md:h-10 text-base md:text-sm"
            />
          </div>

          {/* 支払い方法 */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="text-sm md:text-base font-medium">支払い方法（任意）</Label>
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value || '')}>
              <SelectTrigger className="h-11 md:h-10 text-base md:text-sm">
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
                <SelectItem value="cash" className="text-base md:text-sm py-3 md:py-2">現金</SelectItem>
                <SelectItem value="credit" className="text-base md:text-sm py-3 md:py-2">クレジットカード</SelectItem>
                <SelectItem value="debit" className="text-base md:text-sm py-3 md:py-2">デビットカード</SelectItem>
                <SelectItem value="e-money" className="text-base md:text-sm py-3 md:py-2">電子マネー</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 繰り返し設定 */}
          <div className="space-y-2 md:space-y-3 border-t pt-4">
            <div className="flex items-center gap-2 md:gap-3">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-5 w-5 md:h-4 md:w-4 rounded border-gray-300"
                disabled={loading}
              />
              <Label htmlFor="isRecurring" className="font-medium cursor-pointer text-sm md:text-base">
                繰り返し設定を有効にする（サブスクや固定費）
              </Label>
            </div>

            {/* 繰り返し設定が有効な場合のみ表示 */}
            {isRecurring && (
              <div className="ml-4 md:ml-7 space-y-3 md:space-y-4 border-l-2 border-blue-200 pl-2 md:pl-4">
                {/* 繰り返し名 */}
                <div className="space-y-2">
                  <Label htmlFor="recurringName" className="text-sm md:text-base font-medium">繰り返し取引の名前 *</Label>
                  <Input
                    id="recurringName"
                    type="text"
                    placeholder="例: Netflix サブスク"
                    value={recurringName}
                    onChange={(e) => setRecurringName(e.target.value)}
                    required={isRecurring}
                    disabled={loading}
                    className="h-11 md:h-10 text-base md:text-sm"
                  />
                </div>

                {/* 頻度 */}
                <div className="space-y-2">
                  <Label htmlFor="frequency" className="text-sm md:text-base font-medium">頻度 *</Label>
                  <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
                    <SelectTrigger className="h-11 md:h-10 text-base md:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily" className="text-base md:text-sm py-3 md:py-2">毎日</SelectItem>
                      <SelectItem value="weekly" className="text-base md:text-sm py-3 md:py-2">毎週</SelectItem>
                      <SelectItem value="monthly" className="text-base md:text-sm py-3 md:py-2">毎月</SelectItem>
                      <SelectItem value="yearly" className="text-base md:text-sm py-3 md:py-2">毎年</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 間隔 */}
                <div className="space-y-2">
                  <Label htmlFor="interval" className="text-sm md:text-base font-medium">間隔</Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    value={interval}
                    onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                    disabled={loading}
                    className="h-11 md:h-10 text-base md:text-sm"
                  />
                  <p className="text-xs md:text-sm text-gray-500">
                    {frequency === 'daily' && `${interval}日ごと`}
                    {frequency === 'weekly' && `${interval}週間ごと`}
                    {frequency === 'monthly' && `${interval}ヶ月ごと`}
                    {frequency === 'yearly' && `${interval}年ごと`}
                  </p>
                </div>

                {/* 月の日付（monthly/yearly の場合のみ） */}
                {(frequency === 'monthly' || frequency === 'yearly') && (
                  <div className="space-y-2">
                    <Label htmlFor="dayOfMonth" className="text-sm md:text-base font-medium">月の何日 *</Label>
                    <Input
                      id="dayOfMonth"
                      type="number"
                      min="1"
                      max="31"
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
                      required
                      disabled={loading}
                      className="h-11 md:h-10 text-base md:text-sm"
                    />
                  </div>
                )}

                {/* 曜日（weekly の場合のみ） */}
                {frequency === 'weekly' && (
                  <div className="space-y-2">
                    <Label htmlFor="dayOfWeek" className="text-sm md:text-base font-medium">曜日 *</Label>
                    <Select value={String(dayOfWeek ?? 0)} onValueChange={(v) => setDayOfWeek(v ? parseInt(v) : 0)}>
                      <SelectTrigger className="h-11 md:h-10 text-base md:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0" className="text-base md:text-sm py-3 md:py-2">日曜日</SelectItem>
                        <SelectItem value="1" className="text-base md:text-sm py-3 md:py-2">月曜日</SelectItem>
                        <SelectItem value="2" className="text-base md:text-sm py-3 md:py-2">火曜日</SelectItem>
                        <SelectItem value="3" className="text-base md:text-sm py-3 md:py-2">水曜日</SelectItem>
                        <SelectItem value="4" className="text-base md:text-sm py-3 md:py-2">木曜日</SelectItem>
                        <SelectItem value="5" className="text-base md:text-sm py-3 md:py-2">金曜日</SelectItem>
                        <SelectItem value="6" className="text-base md:text-sm py-3 md:py-2">土曜日</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* 開始日 */}
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm md:text-base font-medium">開始日 *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required={isRecurring}
                    disabled={loading}
                    className="h-11 md:h-10 text-base md:text-sm"
                  />
                </div>

                {/* 終了日（オプション） */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 md:gap-3">
                    <input
                      type="checkbox"
                      id="hasEndDate"
                      checked={hasEndDate}
                      onChange={(e) => setHasEndDate(e.target.checked)}
                      className="h-5 w-5 md:h-4 md:w-4 rounded border-gray-300"
                      disabled={loading}
                    />
                    <Label htmlFor="hasEndDate" className="cursor-pointer text-sm md:text-base">終了日を設定する</Label>
                  </div>

                  {hasEndDate && (
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      disabled={loading}
                      className="h-11 md:h-10 text-base md:text-sm"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ボタン */}
          <div className="flex gap-2 md:gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 h-11 md:h-10 text-base md:text-sm"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 md:h-10 text-base md:text-sm"
            >
              {loading ? '保存中...' : isRecurring ? '繰り返し設定を保存' : '保存'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
