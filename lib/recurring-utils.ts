/**
 * 繰り返し取引関連のユーティリティ関数
 *
 * このファイルには、繰り返し取引の次回実行日を計算したり、
 * 実行すべきかを判定したりする関数が含まれています。
 */

/**
 * 次回実行日を計算
 *
 * @param currentDate - 現在の日付
 * @param frequency - 頻度 ('daily' | 'weekly' | 'monthly' | 'yearly')
 * @param interval - 間隔（例: 2 = 2ヶ月ごと）
 * @param dayOfMonth - 月の何日か (monthly/yearly用、1-31)
 * @param dayOfWeek - 曜日 (weekly用、0=日曜, 6=土曜)
 * @returns 次回実行日
 */
export function calculateNextExecutionDate(
  currentDate: Date,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
  interval: number,
  dayOfMonth?: number,
  dayOfWeek?: number
): Date {
  const next = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      // 日次: interval 日後
      next.setDate(next.getDate() + interval);
      break;

    case 'weekly':
      // 週次: 次の指定曜日まで進める
      if (dayOfWeek === undefined) {
        throw new Error('dayOfWeek is required for weekly frequency');
      }
      const currentDay = next.getDay();
      const daysUntilNext = (dayOfWeek - currentDay + 7) % 7 || 7 * interval;
      next.setDate(next.getDate() + daysUntilNext);
      break;

    case 'monthly':
      // 月次: interval ヶ月後の指定日
      if (dayOfMonth === undefined) {
        throw new Error('dayOfMonth is required for monthly frequency');
      }
      next.setMonth(next.getMonth() + interval);
      // 月末対応（例: 1/31 → 2/28）
      next.setDate(Math.min(dayOfMonth, getLastDayOfMonth(next)));
      break;

    case 'yearly':
      // 年次: interval 年後の指定日
      if (dayOfMonth === undefined) {
        throw new Error('dayOfMonth is required for yearly frequency');
      }
      next.setFullYear(next.getFullYear() + interval);
      // うるう年対応
      next.setDate(Math.min(dayOfMonth, getLastDayOfMonth(next)));
      break;
  }

  return next;
}

/**
 * 指定月の最終日を取得
 *
 * @param date - 対象の日付
 * @returns 月末日（1-31）
 */
function getLastDayOfMonth(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  // 次の月の0日目 = 今月の最終日
  return new Date(year, month + 1, 0).getDate();
}

/**
 * 実行すべき繰り返し取引をチェック
 *
 * @param recurringTransaction - 繰り返し取引オブジェクト
 * @param today - 今日の日付（デフォルト: 現在日時）
 * @returns 実行すべきかどうか
 */
export function shouldExecuteRecurringTransaction(
  recurringTransaction: {
    isActive: boolean | null | undefined;
    startDate: string;
    endDate?: string | null;
    nextExecutionDate: string;
    lastExecutedAt?: string | null;
  },
  today: Date = new Date()
): boolean {
  // 無効化されている場合は実行しない
  if (!recurringTransaction.isActive) {
    return false;
  }

  // 開始日より前の場合は実行しない
  const startDate = new Date(recurringTransaction.startDate);
  if (today < startDate) {
    return false;
  }

  // 終了日を過ぎている場合は実行しない
  if (recurringTransaction.endDate) {
    const endDate = new Date(recurringTransaction.endDate);
    if (today > endDate) {
      return false;
    }
  }

  // 今日既に実行済みかチェック（重複実行防止）
  if (recurringTransaction.lastExecutedAt) {
    const lastExecuted = new Date(recurringTransaction.lastExecutedAt);
    // 年月日が一致する場合は既に実行済み
    if (
      lastExecuted.getFullYear() === today.getFullYear() &&
      lastExecuted.getMonth() === today.getMonth() &&
      lastExecuted.getDate() === today.getDate()
    ) {
      return false; // 既に実行済み
    }
  }

  // 次回実行日と一致するか（年月日のみ比較）
  const nextExecution = new Date(recurringTransaction.nextExecutionDate);
  return (
    today.getFullYear() === nextExecution.getFullYear() &&
    today.getMonth() === nextExecution.getMonth() &&
    today.getDate() === nextExecution.getDate()
  );
}
