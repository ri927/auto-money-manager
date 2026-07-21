/**
 * カレンダーページ
 *
 * パス: /dashboard/calendar
 * 取引データをカレンダー形式で表示します。
 */

'use client';

// React フック
import { useEffect, useState, useMemo } from 'react';

// Amplify Data クライアント
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

// 認証コンテキスト
import { useAuth } from '@/contexts/AuthContext';

// UIコンポーネント
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';

// ユーティリティ関数
import { getUserFamily } from '@/lib/family-utils';
import { formatCurrency } from '@/lib/utils';

// アイコン
import { ChevronLeft, ChevronRight } from 'lucide-react';

// データクライアントを生成
const client = generateClient<Schema>();

/**
 * CalendarPageコンポーネント
 *
 * カレンダー形式で取引データを表示します。
 */
export default function CalendarPage() {
  // useAuth: 現在のユーザー情報を取得
  const { user } = useAuth();

  // useState: コンポーネントの状態管理
  // selectedDate: 選択された日付
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // currentMonth: 表示中の月
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

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

  /**
   * 初期化処理
   * ユーザーの所属グループを取得し、カテゴリと収支データを読み込みます。
   */
  useEffect(() => {
    async function initialize() {
      if (!user) return;

      try {
        setLoading(true);

        // 1. ユーザーの所属グループを取得
        const family = await getUserFamily(user.userId);
        if (!family) {
          setError('家族グループに参加していません。まずはグループを作成または参加してください。');
          setLoading(false);
          return;
        }

        setFamilyId(family.id);

        // 2. カテゴリを取得
        const { data: categoryData } = await client.models.Category.list({
          filter: {
            familyId: { eq: family.id },
          },
        });

        setCategories(categoryData || []);

        // カテゴリマップを作成
        const map = new Map<string, Schema['Category']['type']>();
        categoryData?.forEach((cat) => {
          map.set(cat.id, cat);
        });
        setCategoryMap(map);

        // 3. 表示中の月の取引データを取得
        await fetchTransactionsForMonth(family.id, currentMonth);

        setLoading(false);
      } catch (err) {
        console.error('Error initializing calendar:', err);
        setError('データの読み込みに失敗しました。');
        setLoading(false);
      }
    }

    initialize();
  }, [user]);

  /**
   * 指定された月の取引データを取得
   */
  const fetchTransactionsForMonth = async (familyId: string, month: Date) => {
    try {
      // 月の開始日と終了日を計算
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

      // 取引データを取得（日付でフィルタ）
      const { data: transactionData } = await client.models.Transaction.list({
        filter: {
          familyId: { eq: familyId },
          date: {
            between: [startOfMonth.toISOString(), endOfMonth.toISOString()],
          },
        },
      });

      // 日付降順にソート
      const sortedTransactions = (transactionData || []).sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setTransactions(sortedTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  /**
   * 月を変更
   */
  const changeMonth = (offset: number) => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    setCurrentMonth(newMonth);

    if (familyId) {
      fetchTransactionsForMonth(familyId, newMonth);
    }
  };

  /**
   * 日付ごとの取引を集計
   */
  const transactionsByDate = useMemo(() => {
    const map = new Map<string, Array<Schema['Transaction']['type']>>();

    transactions.forEach((transaction) => {
      const dateKey = new Date(transaction.date).toLocaleDateString('ja-JP');
      const existing = map.get(dateKey) || [];
      existing.push(transaction);
      map.set(dateKey, existing);
    });

    return map;
  }, [transactions]);

  /**
   * 日付ごとの合計金額を計算
   */
  const dailyTotals = useMemo(() => {
    const map = new Map<string, number>();

    transactions.forEach((transaction) => {
      const dateKey = new Date(transaction.date).toLocaleDateString('ja-JP');
      const current = map.get(dateKey) || 0;
      const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      map.set(dateKey, current + amount);
    });

    return map;
  }, [transactions]);

  /**
   * 選択された日付の取引を取得
   */
  const selectedDateTransactions = useMemo(() => {
    const dateKey = selectedDate.toLocaleDateString('ja-JP');
    return transactionsByDate.get(dateKey) || [];
  }, [selectedDate, transactionsByDate]);

  /**
   * カレンダーのセルをカスタマイズ
   */
  const modifiers = useMemo(() => {
    const hasTransactions: Date[] = [];

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      hasTransactions.push(date);
    });

    return {
      hasTransactions,
    };
  }, [transactions]);

  if (loading) {
    return (
      <div className="container mx-auto p-3 md:p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-3 md:p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 md:p-6 space-y-3 md:space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold">カレンダー</h1>

        {/* 月切り替え */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm md:text-base font-semibold min-w-[120px] text-center">
            {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
          </span>
          <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* カレンダー */}
      <Card>
        <CardContent className="p-3 md:p-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            modifiers={modifiers}
            className="rounded-md border-0"
          />
        </CardContent>
      </Card>

      {/* 選択された日の取引一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            {selectedDate.toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}の取引
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedDateTransactions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              この日の取引はありません
            </p>
          ) : (
            <>
              {/* 日次サマリー */}
              <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">合計</span>
                  <span className={`text-base md:text-lg font-semibold ${
                    (dailyTotals.get(selectedDate.toLocaleDateString('ja-JP')) || 0) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(dailyTotals.get(selectedDate.toLocaleDateString('ja-JP')) || 0)}
                  </span>
                </div>
              </div>

              {/* 取引リスト */}
              <div className="space-y-2">
                {selectedDateTransactions.map((transaction) => {
                  const category = categoryMap.get(transaction.categoryId);

                  return (
                    <div
                      key={transaction.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {category && (
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                            )}
                            <span className="text-sm font-medium">
                              {category?.name || '未分類'}
                            </span>
                          </div>
                          <p className="text-xs md:text-sm text-gray-600">
                            {transaction.description}
                          </p>
                          {transaction.source === 'email' && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded">
                              メール自動取得
                            </span>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p
                            className={`text-base md:text-lg font-semibold ${
                              transaction.type === 'income'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-[10px] md:text-xs text-gray-500">
                            {transaction.paymentMethod}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
