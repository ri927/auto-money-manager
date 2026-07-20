/**
 * 収支一覧コンポーネント（マネーフォワード風デザイン）
 *
 * 収支の一覧をテーブル形式で表示します。
 */

'use client';

// Amplify Data の型定義
import type { Schema } from '@/amplify/data/resource';

// UIコンポーネント
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ユーティリティ関数
import { cn } from '@/lib/utils';

// アイコン
import { Pencil, Trash2 } from 'lucide-react';

/**
 * TransactionListのプロパティ型定義
 */
interface TransactionListProps {
  // 収支の配列
  transactions: Array<Schema['Transaction']['type']>;

  // カテゴリマップ（categoryId → Category）
  categoryMap: Map<string, Schema['Category']['type']>;

  // 編集ハンドラー
  onEdit: (transaction: Schema['Transaction']['type']) => void;

  // 削除ハンドラー
  onDelete: (transaction: Schema['Transaction']['type']) => void;
}

/**
 * TransactionListコンポーネント
 *
 * 収支をテーブル形式で表示します。
 *
 * @param transactions - 収支の配列
 * @param categoryMap - カテゴリマップ
 * @param onEdit - 編集ハンドラー
 * @param onDelete - 削除ハンドラー
 */
export function TransactionList({
  transactions,
  categoryMap,
  onEdit,
  onDelete,
}: TransactionListProps) {
  /**
   * 日付をフォーマット
   */
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  /**
   * 金額をフォーマット
   */
  const formatAmount = (amount: number, type: string) => {
    const formatted = amount.toLocaleString('ja-JP');
    return type === 'income' ? `+¥${formatted}` : `-¥${formatted}`;
  };

  // 収支がない場合
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        収支がまだ登録されていません
      </div>
    );
  }

  return (
    <>
      {/* モバイル: カード表示 */}
      <div className="md:hidden space-y-2">
        {transactions.map((transaction) => {
          const category = categoryMap.get(transaction.categoryId || '');

          return (
            <Card key={transaction.id} className="shadow-sm border-none p-3">
              {/* 上部: 日付とカテゴリ */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  {/* カテゴリ */}
                  {category ? (
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color || '#6b7280' }}
                      />
                      <span className="text-base font-medium truncate">{category.name}</span>
                    </div>
                  ) : (
                    <span className="text-base text-gray-400 mb-1 block">未分類</span>
                  )}
                  {/* 説明 */}
                  {transaction.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                      {transaction.description}
                    </p>
                  )}
                </div>

                {/* 金額（右側） */}
                <div
                  className={cn(
                    'text-xl font-bold tabular-nums ml-3 flex-shrink-0',
                    transaction.type === 'income' ? 'text-income' : 'text-expense'
                  )}
                >
                  {formatAmount(transaction.amount, transaction.type || 'expense')}
                </div>
              </div>

              {/* 下部: 日付、支払方法、アクションボタン */}
              <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="flex-shrink-0">{formatDate(transaction.date)}</span>
                  {transaction.paymentMethod && (
                    <>
                      <span className="flex-shrink-0">•</span>
                      <span className="truncate">
                        {transaction.paymentMethod === 'cash' && '現金'}
                        {transaction.paymentMethod === 'credit' && 'クレジット'}
                        {transaction.paymentMethod === 'debit' && 'デビット'}
                        {transaction.paymentMethod === 'e-money' && '電子マネー'}
                      </span>
                    </>
                  )}
                </div>

                {/* アクションボタン */}
                <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => onEdit(transaction)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => onDelete(transaction)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* デスクトップ: テーブル表示 */}
      <Card className="hidden md:block shadow-sm border-none">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
              <TableHead className="font-semibold">日付</TableHead>
              <TableHead className="font-semibold">カテゴリ</TableHead>
              <TableHead className="font-semibold">説明</TableHead>
              <TableHead className="font-semibold text-right">金額</TableHead>
              <TableHead className="font-semibold">支払方法</TableHead>
              <TableHead className="font-semibold text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const category = categoryMap.get(transaction.categoryId || '');

              return (
                <TableRow key={transaction.id} className="hover:bg-gray-50/50">
                  {/* 日付 */}
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(transaction.date)}
                  </TableCell>

                  {/* カテゴリ */}
                  <TableCell>
                    {category ? (
                      <div className="flex items-center gap-2">
                        {/* カラードット */}
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: category.color || '#6b7280' }}
                        />
                        <span className="text-sm">{category.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">未分類</span>
                    )}
                  </TableCell>

                  {/* 説明 */}
                  <TableCell className="text-sm max-w-xs truncate">
                    {transaction.description || '-'}
                  </TableCell>

                  {/* 金額 */}
                  <TableCell
                    className={cn(
                      'text-right font-semibold tabular-nums',
                      transaction.type === 'income' ? 'text-income' : 'text-expense'
                    )}
                  >
                    {formatAmount(transaction.amount, transaction.type || 'expense')}
                  </TableCell>

                  {/* 支払方法 */}
                  <TableCell className="text-sm text-gray-600">
                    {transaction.paymentMethod === 'cash' && '現金'}
                    {transaction.paymentMethod === 'credit' && 'クレジット'}
                    {transaction.paymentMethod === 'debit' && 'デビット'}
                    {transaction.paymentMethod === 'e-money' && '電子マネー'}
                    {!transaction.paymentMethod && '-'}
                  </TableCell>

                  {/* 操作ボタン */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(transaction)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(transaction)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
