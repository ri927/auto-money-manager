/**
 * 繰り返し取引一覧ページ
 *
 * パス: /dashboard/recurring
 * 繰り返し取引（サブスク、固定費など）の管理画面です。
 * 一覧表示、一時停止/再開、削除機能を提供します。
 */
'use client';

// React フック
import { useEffect, useState } from 'react';

// 認証コンテキスト
import { useAuth } from '@/contexts/AuthContext';

// ユーティリティ関数
import { getUserFamily } from '@/lib/family-utils';

// Amplify Data クライアント
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

// UIコンポーネント
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// ルーティング
import { useRouter } from 'next/navigation';

// アイコン
import { Pencil, Trash2, Pause, Play, Plus } from 'lucide-react';

const client = generateClient<Schema>();

/**
 * RecurringTransactionsPageコンポーネント
 */
export default function RecurringTransactionsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // 状態管理
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [recurringTransactions, setRecurringTransactions] = useState<Array<Schema['RecurringTransaction']['type']>>([]);
  const [categories, setCategories] = useState<Map<string, Schema['Category']['type']>>(new Map());
  const [loading, setLoading] = useState(true);

  /**
   * データ取得
   */
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // 1. ユーザーの所属グループを取得
        const family = await getUserFamily(user.userId);
        if (!family) return;

        setFamilyId(family.id);

        // 2. 繰り返し取引を取得
        // TODO: Amplify Sandbox 起動後にコメント解除
        // const { data: recurring } = await client.models.RecurringTransaction.list({
        //   filter: { familyId: { eq: family.id } },
        // });
        // setRecurringTransactions(recurring);

        // 3. カテゴリを取得
        const { data: cats } = await client.models.Category.list({
          filter: { familyId: { eq: family.id } },
        });
        const categoryMap = new Map(cats.map((c) => [c.id, c]));
        setCategories(categoryMap);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  /**
   * 一時停止/再開
   */
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    // TODO: Amplify Sandbox 起動後にコメント解除
    alert('繰り返し取引機能は現在準備中です。Amplify Sandbox を起動してください。');
    return;

    // try {
    //   await client.models.RecurringTransaction.update({
    //     id,
    //     isActive: !currentStatus,
    //   });

    //   // 状態を更新
    //   setRecurringTransactions((prev) =>
    //     prev.map((rt) => (rt.id === id ? { ...rt, isActive: !currentStatus } : rt))
    //   );
    // } catch (error) {
    //   console.error('Error toggling active status:', error);
    // }
  };

  /**
   * 削除
   */
  const handleDelete = async (id: string) => {
    // TODO: Amplify Sandbox 起動後にコメント解除
    alert('繰り返し取引機能は現在準備中です。Amplify Sandbox を起動してください。');
    return;

    // if (!confirm('この繰り返し設定を削除しますか?')) return;

    // try {
    //   await client.models.RecurringTransaction.delete({ id });
    //   setRecurringTransactions((prev) => prev.filter((rt) => rt.id !== id));
    // } catch (error) {
    //   console.error('Error deleting recurring transaction:', error);
    // }
  };

  /**
   * 頻度の表示
   */
  const formatFrequency = (rt: Schema['RecurringTransaction']['type']) => {
    const freqMap = {
      daily: '日',
      weekly: '週',
      monthly: 'ヶ月',
      yearly: '年',
    };
    const unit = freqMap[rt.frequency || 'monthly'];
    const interval = rt.interval || 1;
    return interval === 1 ? `毎${unit}` : `${interval}${unit}ごと`;
  };

  // ローディング中
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">繰り返し取引</h1>
          <p className="text-sm text-gray-500 mt-1">サブスクや固定費を管理</p>
        </div>
        <Button onClick={() => router.push('/dashboard/transactions/new')}>
          <Plus className="mr-2 h-4 w-4" />
          新規作成
        </Button>
      </div>

      {/* 一覧 */}
      {recurringTransactions.length === 0 ? (
        <Card className="p-8 text-center text-gray-500 shadow-sm">
          繰り返し取引が登録されていません
        </Card>
      ) : (
        <div className="space-y-4">
          {recurringTransactions.map((rt) => {
            const category = categories.get(rt.categoryId || '');

            return (
              <Card key={rt.id} className="p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  {/* 左: 繰り返し取引情報 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">{rt.name}</h3>
                      {!rt.isActive && (
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                          一時停止中
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span
                        className={`font-semibold text-lg ${
                          rt.type === 'income' ? 'text-blue-600' : 'text-orange-600'
                        }`}
                      >
                        {rt.type === 'income' ? '+' : '-'}¥{rt.amount?.toLocaleString()}
                      </span>
                      {category && (
                        <span className="flex items-center gap-1">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: category.color || '#6b7280' }}
                          />
                          {category.name}
                        </span>
                      )}
                      <span>{formatFrequency(rt)}</span>
                    </div>

                    <div className="text-sm text-gray-500">
                      次回実行日: {rt.nextExecutionDate ? new Date(rt.nextExecutionDate).toLocaleDateString('ja-JP') : '-'}
                      {rt.endDate && (
                        <> • 終了日: {new Date(rt.endDate).toLocaleDateString('ja-JP')}</>
                      )}
                    </div>
                  </div>

                  {/* 右: アクションボタン */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(rt.id, rt.isActive || false)}
                      title={rt.isActive ? '一時停止' : '再開'}
                    >
                      {rt.isActive ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(rt.id)}
                      title="削除"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
