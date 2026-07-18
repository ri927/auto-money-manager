/**
 * ダッシュボードページコンポーネント（マネーフォワード風デザイン）
 *
 * パス: /dashboard
 * 家計の概要（収入・支出・収支）、最近の取引、カテゴリ別支出などを表示します。
 * 月次カレンダーで日ごとの収支を確認できます。
 */
'use client';

// React フック
import { useEffect, useState, useMemo } from 'react';

// Amplify Data クライアント
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

// 認証コンテキスト
import { useAuth } from '@/contexts/AuthContext';

// UIコンポーネント（shadcn/ui）
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// 子コンポーネント
import { MonthlyCalendar } from '@/components/dashboard/MonthlyCalendar';
import { DailyTransactionsModal } from '@/components/dashboard/DailyTransactionsModal';

// ユーティリティ関数
import { getUserFamily } from '@/lib/family-utils';
// TODO: Amplify Sandbox 起動後にコメント解除
// import { processRecurringTransactions } from '@/lib/recurring-processor';

// lucide-react: アイコンライブラリ
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, Tag } from 'lucide-react';

// ユーティリティ関数
import { cn } from '@/lib/utils';

// データクライアントを生成
const client = generateClient<Schema>();

/**
 * 日ごとの収支データの型定義
 */
interface DailyBalance {
  date: string; // YYYY-MM-DD形式
  income: number;
  expense: number;
  balance: number;
}

/**
 * DashboardPageコンポーネント
 *
 * ダッシュボード画面を表示します。
 */
export default function DashboardPage() {
  // useAuth: 現在のユーザー情報を取得
  const { user } = useAuth();

  // useState: コンポーネントの状態管理
  const [transactions, setTransactions] = useState<Array<Schema['Transaction']['type']>>([]);
  const [categories, setCategories] = useState<Array<Schema['Category']['type']>>([]);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * カテゴリ一覧を取得
   */
  const fetchCategories = async (familyId: string) => {
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
  };

  /**
   * 収支一覧を取得（選択した月のデータ）
   */
  const fetchTransactions = async (familyId: string, year: number, month: number) => {
    try {
      // 選択した月の開始日と終了日を計算
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data, errors } = await client.models.Transaction.list({
        filter: {
          familyId: { eq: familyId },
          date: { between: [startDate, endDate] },
        },
      });

      if (errors) {
        throw new Error('収支の取得に失敗しました');
      }

      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      throw err;
    }
  };

  /**
   * ユーザーの所属グループと収支データを取得
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
          setLoading(false);
          return;
        }

        setFamilyId(family.id);

        // 2. 繰り返し取引の自動処理（Transaction を自動生成）
        // TODO: Amplify Sandbox 起動後にコメント解除
        // await processRecurringTransactions(family.id);

        // 3. カテゴリ一覧を取得
        await fetchCategories(family.id);

        // 4. 収支一覧を取得
        await fetchTransactions(family.id, selectedYear, selectedMonth);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, selectedYear, selectedMonth]);

  /**
   * 月変更時のハンドラー
   */
  const handleMonthChange = async (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);

    if (familyId) {
      await fetchTransactions(familyId, year, month);
    }
  };

  /**
   * 日付クリック時のハンドラー
   */
  const handleDayClick = (dateString: string) => {
    setSelectedDate(dateString);
    setIsModalOpen(true);
  };

  /**
   * 収支が更新された時のハンドラー
   */
  const handleTransactionUpdated = async () => {
    if (familyId) {
      await fetchTransactions(familyId, selectedYear, selectedMonth);
    }
  };

  /**
   * 今月の統計データを計算
   */
  const stats = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [transactions]);

  /**
   * 日ごとの収支データを計算
   */
  const dailyBalances = useMemo<DailyBalance[]>(() => {
    const balanceMap = new Map<string, DailyBalance>();

    transactions.forEach((transaction) => {
      const dateKey = transaction.date.split('T')[0]; // YYYY-MM-DD形式に変換

      if (!balanceMap.has(dateKey)) {
        balanceMap.set(dateKey, {
          date: dateKey,
          income: 0,
          expense: 0,
          balance: 0,
        });
      }

      const dayBalance = balanceMap.get(dateKey)!;

      if (transaction.type === 'income') {
        dayBalance.income += transaction.amount;
      } else {
        dayBalance.expense += transaction.amount;
      }

      dayBalance.balance = dayBalance.income - dayBalance.expense;
    });

    return Array.from(balanceMap.values());
  }, [transactions]);

  /**
   * カテゴリ別支出データを計算（支出のみ、上位3件）
   */
  const categoryExpenses = useMemo(() => {
    const categoryMap = new Map<string, { categoryId: string; amount: number }>();

    transactions
      .filter((t) => t.type === 'expense' && t.categoryId)
      .forEach((transaction) => {
        const categoryId = transaction.categoryId!;
        const existing = categoryMap.get(categoryId);
        if (existing) {
          existing.amount += transaction.amount;
        } else {
          categoryMap.set(categoryId, { categoryId, amount: transaction.amount });
        }
      });

    // 金額順にソートして上位3件を取得
    return Array.from(categoryMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [transactions]);

  // ローディング中の表示
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    /**
     * メインコンテナ
     *
     * container: 中央揃えのコンテナ
     * mx-auto: 左右のマージンを自動（中央配置）
     * モバイル: p-2 space-y-1 (超コンパクト)
     * デスクトップ: p-6 space-y-2
     */
    <div className="container mx-auto p-2 md:p-6 space-y-1 md:space-y-2">
      {/* 月次カレンダー（メイン表示） */}
      <MonthlyCalendar
        dailyBalances={dailyBalances}
        onMonthChange={handleMonthChange}
        onDayClick={handleDayClick}
      />

      {/*
        統計カード
        モバイル: 横並び（1行3列）超コンパクト表示
        デスクトップ: グリッドレイアウト（3列）
      */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-1 md:gap-4">
        {/* 収入カード */}
        <div className="bg-white border border-gray-200 rounded p-1.5 md:rounded-lg md:p-4 shadow-sm">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1">
              <p className="text-[9px] md:text-sm text-gray-500 mb-0.5 md:mb-0 leading-tight">収入</p>
              <p className="text-xs md:text-2xl font-bold text-income tabular-nums leading-tight">
                <span className="md:hidden">¥{(stats.income / 10000).toFixed(0)}万</span>
                <span className="hidden md:inline">¥{stats.income.toLocaleString()}</span>
              </p>
            </div>
            <div className="hidden md:block rounded-full bg-blue-50 p-2">
              <ArrowUpCircle className="h-6 w-6 text-income" />
            </div>
          </div>
        </div>

        {/* 支出カード */}
        <div className="bg-white border border-gray-200 rounded p-1.5 md:rounded-lg md:p-4 shadow-sm">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1">
              <p className="text-[9px] md:text-sm text-gray-500 mb-0.5 md:mb-0 leading-tight">支出</p>
              <p className="text-xs md:text-2xl font-bold text-expense tabular-nums leading-tight">
                <span className="md:hidden">¥{(stats.expense / 10000).toFixed(0)}万</span>
                <span className="hidden md:inline">¥{stats.expense.toLocaleString()}</span>
              </p>
            </div>
            <div className="hidden md:block rounded-full bg-orange-50 p-2">
              <ArrowDownCircle className="h-6 w-6 text-expense" />
            </div>
          </div>
        </div>

        {/* 収支カード */}
        <div className="bg-white border border-gray-200 rounded p-1.5 md:rounded-lg md:p-4 shadow-sm">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1">
              <p className="text-[9px] md:text-sm text-gray-500 mb-0.5 md:mb-0 leading-tight">収支</p>
              <p className="text-xs md:text-2xl font-bold text-gray-900 tabular-nums leading-tight">
                <span className="md:hidden">¥{(stats.balance / 10000).toFixed(0)}万</span>
                <span className="hidden md:inline">¥{stats.balance.toLocaleString()}</span>
              </p>
            </div>
            <div className="hidden md:block rounded-full bg-teal-50 p-2">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/*
        2列グリッドレイアウト（最近の取引とカテゴリ別支出）
        モバイルでは非表示
        md:grid-cols-2: 中サイズ以上の画面で2列表示
      */}
      <div className="hidden md:grid md:grid-cols-2 gap-4">
        {/* 最近の取引カード（マネーフォワード風デザイン） */}
        <Card className="shadow-sm border-none">
          <CardHeader className="border-b bg-gray-50/50 p-3 md:p-6">
            <CardTitle className="text-base md:text-lg">最近の取引</CardTitle>
            <CardDescription className="text-xs md:text-sm">直近5件の取引履歴</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* 取引一覧（divide-y: 各アイテム間にボーダー） */}
            <div className="divide-y">
              {transactions.length > 0 ? (
                transactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map((transaction) => {
                    const date = new Date(transaction.date);
                    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;

                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-2 md:p-4 hover:bg-gray-50/50 transition-colors"
                      >
                        {/* 左側: カテゴリアイコン + 詳細 */}
                        <div className="flex items-center gap-2 md:gap-3">
                          {/* カテゴリアイコン背景 */}
                          <div
                            className={cn(
                              'rounded-lg p-1 md:p-2',
                              transaction.type === 'income' ? 'bg-blue-50' : 'bg-orange-50'
                            )}
                          >
                            <Tag
                              className={cn(
                                'h-3 w-3 md:h-4 md:w-4',
                                transaction.type === 'income' ? 'text-blue-600' : 'text-orange-600'
                              )}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-xs md:text-sm">{transaction.description || '未入力'}</p>
                            <p className="text-[10px] md:text-xs text-gray-500">{formattedDate}</p>
                          </div>
                        </div>

                        {/* 右側: 金額 */}
                        <p
                          className={cn(
                            'font-semibold tabular-nums text-xs md:text-base',
                            transaction.type === 'income' ? 'text-income' : 'text-expense'
                          )}
                        >
                          {transaction.type === 'income' ? '+' : '-'}¥
                          {transaction.amount.toLocaleString()}
                        </p>
                      </div>
                    );
                  })
              ) : (
                <div className="p-4 md:p-8 text-center text-gray-500">
                  <p className="text-xs md:text-sm">取引履歴がありません</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* カテゴリ別支出カード（マネーフォワード風デザイン） */}
        <Card className="shadow-sm border-none">
          <CardHeader className="border-b bg-gray-50/50 p-3 md:p-6">
            <CardTitle className="text-base md:text-lg">カテゴリ別支出</CardTitle>
            <CardDescription className="text-xs md:text-sm">今月の支出内訳</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* カテゴリ一覧（divide-y: 各アイテム間にボーダー） */}
            <div className="divide-y">
              {categoryExpenses.length > 0 ? (
                categoryExpenses.map((expense) => {
                  const category = categories.find((c) => c.id === expense.categoryId);
                  return (
                    <div
                      key={expense.categoryId}
                      className="flex items-center justify-between p-2 md:p-4 hover:bg-gray-50/50 transition-colors"
                    >
                      {/* 左側: カラードットとカテゴリ名 */}
                      <div className="flex items-center gap-2 md:gap-3">
                        {/* カテゴリを表す色付きドット */}
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: category?.color || '#6B7280' }}
                        ></div>
                        <span className="text-xs md:text-sm">{category?.name || '不明'}</span>
                      </div>
                      {/* 右側: 金額（等幅フォント） */}
                      <span className="font-semibold tabular-nums text-xs md:text-base">¥{expense.amount.toLocaleString()}</span>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 md:p-8 text-center text-gray-500">
                  <p className="text-xs md:text-sm">支出データがありません</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/*
        はじめにカード（初回利用者向けガイド）
        モバイルでは非表示
        bg-blue-50: 薄い青の背景色
        border-blue-200: 青いボーダー
      */}
      <Card className="hidden md:block bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🎉</span> はじめに
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>家計簿アプリへようこそ！以下の手順で始めましょう：</p>
          {/*
            順序付きリスト
            list-decimal: 数字付きリスト（1, 2, 3...）
            list-inside: リストマーカーを内側に配置
          */}
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>家族グループを作成または参加</li>
            <li>カテゴリを設定</li>
            <li>収支を入力して記録開始</li>
            <li>メール転送設定で自動記録</li>
          </ol>
        </CardContent>
      </Card>

      {/* 日次収支モーダル */}
      <DailyTransactionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        familyId={familyId}
        userId={user?.userId || null}
        onTransactionUpdated={handleTransactionUpdated}
      />
    </div>
  );
}
