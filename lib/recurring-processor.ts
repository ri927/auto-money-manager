/**
 * 繰り返し取引の自動処理プロセッサ
 *
 * このファイルには、繰り返し取引から実際の Transaction を自動生成する
 * ロジックが含まれています。ダッシュボード表示時に呼び出されます。
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { calculateNextExecutionDate, shouldExecuteRecurringTransaction } from './recurring-utils';

const client = generateClient<Schema>();

/**
 * 繰り返し取引を実行し、通常の取引を生成
 *
 * この関数は、ダッシュボードページで呼び出され、実行すべき繰り返し取引を
 * チェックして、条件に合致する場合は Transaction を自動生成します。
 *
 * @param familyId - 家族グループID
 */
export async function processRecurringTransactions(familyId: string): Promise<void> {
  try {
    // 有効な繰り返し取引を取得
    const { data: recurringTransactions } = await client.models.RecurringTransaction.list({
      filter: {
        and: [
          { familyId: { eq: familyId } },
          { isActive: { eq: true } },
        ],
      },
    });

    // 今日の日付（時刻をリセット）
    const today = new Date();
    today.setHours(0, 0, 0, 0); // UTC 0:00 に設定

    // 各繰り返し取引について処理
    for (const recurring of recurringTransactions) {
      // 実行すべきかチェック
      if (shouldExecuteRecurringTransaction(recurring, today)) {
        // Transaction を作成
        const { errors } = await client.models.Transaction.create({
          familyId: recurring.familyId,
          date: today.toISOString(),
          amount: recurring.amount,
          type: recurring.type,
          categoryId: recurring.categoryId,
          description: `${recurring.name}${recurring.description ? ` - ${recurring.description}` : ''}`,
          paymentMethod: recurring.paymentMethod,
          createdBy: recurring.createdBy,
          source: 'api', // 自動生成を示す
        });

        if (errors) {
          console.error('Error creating transaction from recurring:', errors);
          continue; // エラーの場合は次へ
        }

        // 次回実行日を計算
        const nextExecution = calculateNextExecutionDate(
          new Date(recurring.nextExecutionDate),
          recurring.frequency as 'daily' | 'weekly' | 'monthly' | 'yearly',
          recurring.interval || 1,
          recurring.dayOfMonth || undefined,
          recurring.dayOfWeek || undefined
        );

        // RecurringTransaction を更新
        await client.models.RecurringTransaction.update({
          id: recurring.id,
          nextExecutionDate: nextExecution.toISOString().split('T')[0],
          lastExecutedAt: new Date().toISOString(),
        });

        console.log(`✅ Recurring transaction executed: ${recurring.name}`);
      }
    }
  } catch (error) {
    console.error('Error processing recurring transactions:', error);
  }
}
