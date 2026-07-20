/**
 * レポートページコンポーネント
 *
 * パス: /dashboard/reports
 * 月次サマリー、カテゴリ別グラフ、月次推移グラフなどを表示します。
 */
'use client';

// React フック
import { useEffect, useState, useMemo, useCallback } from 'react';

// Amplify Data クライアント
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

// 認証コンテキスト
import { useAuth } from '@/contexts/AuthContext';

// UIコンポーネント（shadcn/ui）
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// グラフライブラリ
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

// アイコン
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';

// ユーティリティ関数
import { getUserFamily } from '@/lib/family-utils';
import { cn } from '@/lib/utils';

// データクライアントを生成
const client = generateClient<Schema>();

// グラフの色パレット
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

/**
 * 月次サマリーデータの型定義
 */
interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
  previousMonthIncome: number;
  previousMonthExpense: number;
  previousMonthBalance: number;
  incomeChange: number;
  expenseChange: number;
  balanceChange: number;
}

/**
 * カテゴリ別データの型定義
 */
interface CategoryData {
  categoryId: string;
  categoryName: string;
  amount: number;
  color: string;
  percentage: number;
}

/**
 * 月次推移データの型定義
 */
interface MonthlyTrendData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

/**
 * ReportsPageコンポーネント
 *
 * レポート画面を表示します。
 */
export default function ReportsPage() {
  // useAuth: 現在のユーザー情報を取得
  const { user } = useAuth();

  // useState: コンポーネントの状態管理
  const [transactions, setTransactions] = useState<Array<Schema['Transaction']['type']>>([]);
  const [categories, setCategories] = useState<Array<Schema['Category']['type']>>([]);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [trendPeriod, setTrendPeriod] = useState<'3' | '6' | '12'>('6');

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
    }
  }, []);

  /**
   * 指定期間の取引を取得
   */
  const fetchTransactions = useCallback(async (familyId: string, startDate: Date, endDate: Date) => {
    try {
      const { data, errors } = await client.models.Transaction.list({
        filter: {
          familyId: { eq: familyId },
          date: {
            between: [startDate.toISOString(), endDate.toISOString()],
          },
        },
      });

      if (errors) {
        throw new Error('取引の取得に失敗しました');
      }

      return data;
    } catch (err) {
      console.error('Error fetching transactions:', err);
      return [];
    }
  }, []);

  /**
   * 月次サマリーを計算
   */
  const monthlySummary = useMemo<MonthlySummary>(() => {
    // 選択した月の取引をフィルタリング
    const currentMonthTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getFullYear() === selectedYear &&
        transactionDate.getMonth() + 1 === selectedMonth
      );
    });

    // 前月の取引をフィルタリング
    const previousMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const previousYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const previousMonthTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getFullYear() === previousYear &&
        transactionDate.getMonth() + 1 === previousMonth
      );
    });

    // 当月の収入・支出・収支を計算
    const income = currentMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = currentMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const balance = income - expense;

    // 前月の収入・支出・収支を計算
    const previousMonthIncome = previousMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const previousMonthExpense = previousMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const previousMonthBalance = previousMonthIncome - previousMonthExpense;

    // 前月比を計算（パーセンテージ）
    const incomeChange = previousMonthIncome > 0
      ? ((income - previousMonthIncome) / previousMonthIncome) * 100
      : 0;
    const expenseChange = previousMonthExpense > 0
      ? ((expense - previousMonthExpense) / previousMonthExpense) * 100
      : 0;
    const balanceChange = previousMonthBalance > 0
      ? ((balance - previousMonthBalance) / previousMonthBalance) * 100
      : 0;

    return {
      income,
      expense,
      balance,
      previousMonthIncome,
      previousMonthExpense,
      previousMonthBalance,
      incomeChange,
      expenseChange,
      balanceChange,
    };
  }, [transactions, selectedYear, selectedMonth]);

  /**
   * カテゴリ別支出データを計算
   */
  const categoryExpenseData = useMemo<CategoryData[]>(() => {
    // 選択した月の支出取引をフィルタリング
    const currentMonthExpenses = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getFullYear() === selectedYear &&
        transactionDate.getMonth() + 1 === selectedMonth &&
        t.type === 'expense'
      );
    });

    // カテゴリ別に支出を集計
    const categoryMap = new Map<string, { name: string; amount: number; color: string }>();

    currentMonthExpenses.forEach((t) => {
      const categoryId = t.categoryId || 'uncategorized';
      const category = categories.find((c) => c.id === categoryId);
      const categoryName = category?.name || '未分類';
      const categoryColor = category?.color || '#999999';

      if (categoryMap.has(categoryId)) {
        categoryMap.get(categoryId)!.amount += Math.abs(t.amount);
      } else {
        categoryMap.set(categoryId, {
          name: categoryName,
          amount: Math.abs(t.amount),
          color: categoryColor,
        });
      }
    });

    // 支出合計を計算
    const totalExpense = Array.from(categoryMap.values()).reduce(
      (sum, item) => sum + item.amount,
      0
    );

    // パーセンテージを計算してソート
    return Array.from(categoryMap.entries())
      .map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.name,
        amount: data.amount,
        color: data.color,
        percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, categories, selectedYear, selectedMonth]);

  /**
   * 月次推移データを計算
   */
  const monthlyTrendData = useMemo<MonthlyTrendData[]>(() => {
    const months = parseInt(trendPeriod);
    const data: MonthlyTrendData[] = [];

    // 過去N ヶ月分のデータを生成
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(selectedYear, selectedMonth - 1 - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      // その月の取引をフィルタリング
      const monthTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getFullYear() === year &&
          transactionDate.getMonth() + 1 === month
        );
      });

      // 収入・支出・収支を計算
      const income = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const balance = income - expense;

      data.push({
        month: `${year}/${month}`,
        income,
        expense,
        balance,
      });
    }

    return data;
  }, [transactions, selectedYear, selectedMonth, trendPeriod]);

  /**
   * ユーザーの家族グループを取得
   */
  useEffect(() => {
    if (!user) return;

    const fetchFamily = async () => {
      try {
        const family = await getUserFamily(user.userId);
        if (family) {
          setFamilyId(family.id);
          await fetchCategories(family.id);
        }
      } catch (err) {
        console.error('Error fetching family:', err);
      }
    };

    fetchFamily();
  }, [user, fetchCategories]);

  /**
   * 取引データを取得（トレンド期間分）
   */
  useEffect(() => {
    if (!familyId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // トレンド期間の開始月を計算
        const months = parseInt(trendPeriod);
        const startDate = new Date(selectedYear, selectedMonth - 1 - months, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

        const data = await fetchTransactions(familyId, startDate, endDate);
        setTransactions(data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [familyId, selectedYear, selectedMonth, trendPeriod, fetchTransactions]);

  /**
   * 前月へ移動
   */
  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  /**
   * 次月へ移動
   */
  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  /**
   * ローディング中の表示
   */
  if (loading) {
    return (
      <div className="container mx-auto p-3 md:p-6">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 md:p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">レポート</h1>
        </div>
      </div>

      {/* 月選択 */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
              className="shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-xl font-semibold">
                {selectedYear}年 {selectedMonth}月
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 月次サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 収入カード */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-green-500" />
              収入
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-green-600">
                ¥{monthlySummary.income.toLocaleString()}
              </p>
              {monthlySummary.previousMonthIncome > 0 && (
                <p className={cn(
                  'text-sm flex items-center gap-1',
                  monthlySummary.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  <TrendingUp className="h-3 w-3" />
                  前月比 {monthlySummary.incomeChange >= 0 ? '+' : ''}
                  {monthlySummary.incomeChange.toFixed(1)}%
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 支出カード */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-red-500" />
              支出
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-red-600">
                ¥{monthlySummary.expense.toLocaleString()}
              </p>
              {monthlySummary.previousMonthExpense > 0 && (
                <p className={cn(
                  'text-sm flex items-center gap-1',
                  monthlySummary.expenseChange <= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  <TrendingUp className="h-3 w-3" />
                  前月比 {monthlySummary.expenseChange >= 0 ? '+' : ''}
                  {monthlySummary.expenseChange.toFixed(1)}%
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 収支カード */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              収支
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className={cn(
                'text-2xl font-bold',
                monthlySummary.balance >= 0 ? 'text-blue-600' : 'text-red-600'
              )}>
                ¥{monthlySummary.balance.toLocaleString()}
              </p>
              {monthlySummary.previousMonthBalance !== 0 && (
                <p className={cn(
                  'text-sm flex items-center gap-1',
                  monthlySummary.balanceChange >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  <TrendingUp className="h-3 w-3" />
                  前月比 {monthlySummary.balanceChange >= 0 ? '+' : ''}
                  {monthlySummary.balanceChange.toFixed(1)}%
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* カテゴリ別支出グラフ */}
      {categoryExpenseData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 円グラフ */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>カテゴリ別支出割合</CardTitle>
              <CardDescription>
                {selectedYear}年{selectedMonth}月の支出内訳
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryExpenseData}
                    dataKey="amount"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry: any) => `${entry.categoryName}: ${entry.percentage.toFixed(1)}%`}
                  >
                    {categoryExpenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => `¥${Number(value || 0).toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 棒グラフ */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>カテゴリ別支出金額</CardTitle>
              <CardDescription>
                {selectedYear}年{selectedMonth}月の支出金額
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryExpenseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="categoryName"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => `¥${Number(value || 0).toLocaleString()}`}
                  />
                  <Bar dataKey="amount" name="支出金額">
                    {categoryExpenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 月次推移グラフ */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>月次推移</CardTitle>
              <CardDescription>収入・支出・収支の推移</CardDescription>
            </div>
            <Select value={trendPeriod} onValueChange={(value) => setTrendPeriod(value as '3' | '6' | '12')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3ヶ月</SelectItem>
                <SelectItem value="6">6ヶ月</SelectItem>
                <SelectItem value="12">12ヶ月</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: any) => `¥${Number(value || 0).toLocaleString()}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                name="収入"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="支出"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="balance"
                name="収支"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* データがない場合のメッセージ */}
      {transactions.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              データがありません。取引を追加してください。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
