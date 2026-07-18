/**
 * 月次カレンダーコンポーネント
 *
 * 選択した月のカレンダーを表示し、各日の収支額を表示します。
 * マネーフォワード風のデザイン。
 */

'use client';

// React フック
import { useState, useMemo } from 'react';

// UIコンポーネント
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// アイコン
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ユーティリティ関数
import { cn } from '@/lib/utils';

/**
 * 日ごとの収支データの型定義
 */
interface DailyBalance {
  date: string; // YYYY-MM-DD形式
  income: number; // 収入
  expense: number; // 支出
  balance: number; // 収支（収入 - 支出）
}

/**
 * MonthlyCalendarのプロパティ型定義
 */
interface MonthlyCalendarProps {
  // 日ごとの収支データ
  dailyBalances: DailyBalance[];
  // 選択中の年月が変更された時のコールバック
  onMonthChange?: (year: number, month: number) => void;
  // 日付がクリックされた時のコールバック
  onDayClick?: (dateString: string) => void;
}

/**
 * MonthlyCalendarコンポーネント
 *
 * 月次カレンダーを表示し、各日の収支を表示します。
 *
 * @param dailyBalances - 日ごとの収支データ配列
 * @param onMonthChange - 月変更時のコールバック（オプション）
 * @param onDayClick - 日付クリック時のコールバック（オプション）
 */
export function MonthlyCalendar({ dailyBalances, onMonthChange, onDayClick }: MonthlyCalendarProps) {
  // 現在の日付を取得
  const today = new Date();

  // 選択中の年月を管理（デフォルトは今月）
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 月は0-11なので+1

  /**
   * 前月へ移動
   */
  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      // 1月の場合は前年の12月へ
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
      onMonthChange?.(currentYear - 1, 12);
    } else {
      setCurrentMonth(currentMonth - 1);
      onMonthChange?.(currentYear, currentMonth - 1);
    }
  };

  /**
   * 次月へ移動
   */
  const goToNextMonth = () => {
    if (currentMonth === 12) {
      // 12月の場合は翌年の1月へ
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
      onMonthChange?.(currentYear + 1, 1);
    } else {
      setCurrentMonth(currentMonth + 1);
      onMonthChange?.(currentYear, currentMonth + 1);
    }
  };

  /**
   * カレンダーの日付セルデータを生成
   */
  const calendarDays = useMemo(() => {
    // 選択中の月の1日を取得
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);

    // 選択中の月の最終日を取得
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);

    // 月の日数
    const daysInMonth = lastDayOfMonth.getDate();

    // 1日の曜日（0: 日曜日, 1: 月曜日, ...）
    const firstDayOfWeek = firstDayOfMonth.getDay();

    // カレンダーの日付セル配列
    const days: Array<{
      date: number;
      dateString: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      income: number;
      expense: number;
      balance: number;
    }> = [];

    // 前月の末尾の日付を追加（カレンダーの空白を埋める）
    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = prevMonthLastDay - i;
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const dateString = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

      days.push({
        date,
        dateString,
        isCurrentMonth: false,
        isToday: false,
        income: 0,
        expense: 0,
        balance: 0,
      });
    }

    // 当月の日付を追加
    for (let date = 1; date <= daysInMonth; date++) {
      const dateString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

      // その日の収支データを取得
      const dayBalance = dailyBalances.find((b) => b.date === dateString);

      // 今日かどうかをチェック
      const isToday =
        currentYear === today.getFullYear() &&
        currentMonth === today.getMonth() + 1 &&
        date === today.getDate();

      days.push({
        date,
        dateString,
        isCurrentMonth: true,
        isToday,
        income: dayBalance?.income || 0,
        expense: dayBalance?.expense || 0,
        balance: dayBalance?.balance || 0,
      });
    }

    // 次月の先頭の日付を追加（カレンダーを6週分にする）
    const totalCells = 42; // 6週 x 7日
    const remainingCells = totalCells - days.length;

    for (let date = 1; date <= remainingCells; date++) {
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      const dateString = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

      days.push({
        date,
        dateString,
        isCurrentMonth: false,
        isToday: false,
        income: 0,
        expense: 0,
        balance: 0,
      });
    }

    return days;
  }, [currentYear, currentMonth, dailyBalances, today]);

  /**
   * 金額をフォーマット（カンマ区切り、符号なし）
   */
  const formatAmount = (amount: number): string => {
    if (amount === 0) return '';
    return amount.toLocaleString();
  };

  return (
    <Card className="shadow-sm border-none">
      <CardHeader className="border-b bg-gray-50/50 p-2 md:p-6">
        <div className="flex items-center justify-between">
          {/* 月表示 */}
          <CardTitle className="text-sm md:text-lg font-bold">
            {currentYear}年 {currentMonth}月
          </CardTitle>

          {/* 前月・次月ボタン */}
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={goToPreviousMonth}
              aria-label="前月"
              className="h-6 w-6 md:h-8 md:w-8"
            >
              <ChevronLeft className="h-2.5 w-2.5 md:h-4 md:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={goToNextMonth}
              aria-label="次月"
              className="h-6 w-6 md:h-8 md:w-8"
            >
              <ChevronRight className="h-2.5 w-2.5 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-1 md:p-4">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-px md:gap-1 mb-0.5 md:mb-2">
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <div
              key={day}
              className={cn(
                'text-center text-[8px] md:text-xs font-semibold py-0.5 md:py-2',
                index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-600'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日付セル */}
        <div className="grid grid-cols-7 gap-px md:gap-1">
          {calendarDays.map((day, index) => {
            // 日曜日か土曜日かを判定
            const dayOfWeek = index % 7;
            const isSunday = dayOfWeek === 0;
            const isSaturday = dayOfWeek === 6;

            return (
              <button
                key={`${day.dateString}-${index}`}
                onClick={() => day.isCurrentMonth && onDayClick?.(day.dateString)}
                disabled={!day.isCurrentMonth}
                aria-label={
                  day.isCurrentMonth
                    ? `${day.date}日${day.isToday ? '（今日）' : ''}${
                        day.income > 0 || day.expense > 0
                          ? ` 収入${day.income.toLocaleString()}円 支出${day.expense.toLocaleString()}円`
                          : ''
                      }`
                    : undefined
                }
                aria-current={day.isToday ? 'date' : undefined}
                className={cn(
                  'relative min-h-[36px] md:min-h-[80px] p-1 md:p-2 rounded border md:rounded-lg transition-all text-left w-full',
                  day.isCurrentMonth
                    ? 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer active:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1'
                    : 'bg-gray-50/50 border-gray-100 cursor-not-allowed',
                  day.isToday && 'ring-1 md:ring-2 ring-primary border-primary'
                )}
              >
                {/* 日付 */}
                <div
                  className={cn(
                    'text-[9px] md:text-xs font-semibold mb-0.5 md:mb-1 leading-none',
                    day.isCurrentMonth
                      ? isSunday
                        ? 'text-red-600'
                        : isSaturday
                        ? 'text-blue-600'
                        : 'text-gray-900'
                      : 'text-gray-400'
                  )}
                >
                  {day.date}
                </div>

                {/* 収支額（当月のみ表示） */}
                {day.isCurrentMonth && (day.balance !== 0 || day.income > 0 || day.expense > 0) && (
                  <div className="space-y-px">
                    {/* 収入（緑色） */}
                    {day.income > 0 && (
                      <div className="text-[7px] md:text-[10px] font-medium text-income tabular-nums leading-none">
                        {formatAmount(day.income)}
                      </div>
                    )}
                    {/* 支出（赤色） */}
                    {day.expense > 0 && (
                      <div className="text-[7px] md:text-[10px] font-medium text-expense tabular-nums leading-none">
                        {formatAmount(day.expense)}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 凡例（モバイルでは非表示） */}
        <div className="hidden md:flex mt-4 pt-4 border-t items-center justify-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-income"></div>
            <span>収入</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-expense"></div>
            <span>支出</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-primary"></div>
            <span>今日</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
