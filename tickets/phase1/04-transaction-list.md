# チケット #04: 収支一覧表示機能の実装

## 📋 概要
収支の一覧表示、フィルタ、検索、編集、削除機能を実装する。

## 🎯 目的
ユーザーが記録した収支を一覧で確認し、管理できるようにする。

## ✅ 受入基準

### 一覧表示
- [ ] 収支がテーブル形式で表示される
- [ ] 日付降順でソートされる
- [ ] 表示項目: 日付、種別、金額、カテゴリ、説明、アクション
- [ ] ページネーション機能がある（20件ごと）
- [ ] モバイルでもレスポンシブに表示される

### フィルタ機能
- [ ] 日付範囲でフィルタできる（今月、先月、カスタム範囲）
- [ ] カテゴリで複数選択フィルタできる
- [ ] 種別（収入 or 支出）でフィルタできる
- [ ] フィルタをクリアできる

### 検索機能
- [ ] 説明文で部分一致検索できる
- [ ] リアルタイムで検索結果が更新される

### 編集・削除
- [ ] 各行に編集・削除ボタンがある
- [ ] 編集ボタンクリック → モーダルで編集フォーム表示
- [ ] 削除ボタンクリック → 確認ダイアログ → 削除実行
- [ ] 編集・削除が即座に一覧に反映される

## 🔧 技術的詳細

### 使用技術
- **データベース**: DynamoDB (Amplify Data)
- **API**: AWS AppSync (GraphQL)
- **フロントエンド**: Next.js, TypeScript, shadcn/ui Table
- **状態管理**: useState, useEffect

### 実装ファイル
```
app/dashboard/transactions/page.tsx         # 収支一覧ページ
components/transactions/TransactionList.tsx # 一覧テーブル
components/transactions/TransactionFilter.tsx # フィルタコンポーネント
components/transactions/TransactionEditModal.tsx # 編集モーダル
components/transactions/DeleteConfirmDialog.tsx # 削除確認ダイアログ
lib/transaction-utils.ts                    # 取引ユーティリティ関数
```

### GraphQL Operations
```graphql
# 取引一覧取得（フィルタ付き）
query ListTransactions(
  $familyId: ID!
  $filter: ModelTransactionFilterInput
  $limit: Int
  $nextToken: String
) {
  listTransactions(
    familyId: $familyId
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      date
      amount
      type
      category {
        id
        name
        color
      }
      description
      paymentMethod
      source
      createdBy
      createdAt
    }
    nextToken
  }
}

# 取引更新
mutation UpdateTransaction($input: UpdateTransactionInput!) {
  updateTransaction(input: $input) {
    id
    date
    amount
    type
    categoryId
    description
    paymentMethod
  }
}

# 取引削除
mutation DeleteTransaction($input: DeleteTransactionInput!) {
  deleteTransaction(input: $input) {
    id
  }
}
```

## 📝 実装手順

### 1. 取引一覧コンポーネントの作成
```typescript
// components/transactions/TransactionList.tsx
'use client';

import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

const client = generateClient<Schema>();

interface TransactionListProps {
  familyId: string;
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    categoryIds?: string[];
    type?: 'income' | 'expense';
    searchQuery?: string;
  };
}

export function TransactionList({ familyId, filters }: TransactionListProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextToken, setNextToken] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [familyId, filters]);

  const fetchTransactions = async () => {
    setLoading(true);

    try {
      // フィルタ条件を構築
      const filter: any = { familyId: { eq: familyId } };

      if (filters?.dateFrom) {
        filter.date = { ...filter.date, ge: new Date(filters.dateFrom).toISOString() };
      }
      if (filters?.dateTo) {
        filter.date = { ...filter.date, le: new Date(filters.dateTo).toISOString() };
      }
      if (filters?.type) {
        filter.type = { eq: filters.type };
      }
      if (filters?.categoryIds && filters.categoryIds.length > 0) {
        filter.categoryId = { in: filters.categoryIds };
      }
      if (filters?.searchQuery) {
        filter.description = { contains: filters.searchQuery };
      }

      const { data, nextToken: token } = await client.models.Transaction.list({
        filter,
        limit: 20,
      });

      setTransactions(data);
      setNextToken(token);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この取引を削除してもよろしいですか?')) return;

    try {
      await client.models.Transaction.delete({ id });
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('削除に失敗しました');
    }
  };

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        取引が見つかりませんでした。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日付</TableHead>
            <TableHead>種別</TableHead>
            <TableHead>金額</TableHead>
            <TableHead>カテゴリ</TableHead>
            <TableHead>説明</TableHead>
            <TableHead className="text-right">アクション</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                {new Date(transaction.date).toLocaleDateString('ja-JP')}
              </TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    transaction.type === 'income'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {transaction.type === 'income' ? '収入' : '支出'}
                </span>
              </TableCell>
              <TableCell
                className={
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }
              >
                {transaction.type === 'income' ? '+' : '-'}¥
                {transaction.amount.toLocaleString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: transaction.category?.color || '#ccc' }}
                  />
                  {transaction.category?.name || '未分類'}
                </div>
              </TableCell>
              <TableCell>{transaction.description || '-'}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(transaction)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(transaction.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* ページネーション */}
      {nextToken && (
        <div className="text-center">
          <Button onClick={() => loadMore()}>さらに読み込む</Button>
        </div>
      )}
    </div>
  );
}
```

### 2. フィルタコンポーネントの作成
```typescript
// components/transactions/TransactionFilter.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterState {
  dateFrom: string;
  dateTo: string;
  categoryIds: string[];
  type: 'all' | 'income' | 'expense';
  searchQuery: string;
}

export function TransactionFilter({ onFilterChange }: { onFilterChange: (filters: FilterState) => void }) {
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    categoryIds: [],
    type: 'all',
    searchQuery: '',
  });

  const handleApply = () => {
    onFilterChange(filters);
  };

  const handleClear = () => {
    const cleared = {
      dateFrom: '',
      dateTo: '',
      categoryIds: [],
      type: 'all' as const,
      searchQuery: '',
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 日付範囲 */}
        <div className="space-y-2">
          <Label>期間（開始）</Label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>期間（終了）</Label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </div>

        {/* 種別 */}
        <div className="space-y-2">
          <Label>種別</Label>
          <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="income">収入</SelectItem>
              <SelectItem value="expense">支出</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 検索 */}
        <div className="space-y-2">
          <Label>検索</Label>
          <Input
            type="text"
            placeholder="説明文で検索"
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
          />
        </div>
      </div>

      {/* ボタン */}
      <div className="flex gap-2">
        <Button onClick={handleApply}>フィルタ適用</Button>
        <Button variant="outline" onClick={handleClear}>クリア</Button>
      </div>
    </div>
  );
}
```

### 3. 収支一覧ページの作成
```typescript
// app/dashboard/transactions/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionFilter } from '@/components/transactions/TransactionFilter';

export default function TransactionsPage() {
  const [filters, setFilters] = useState({});

  // TODO: familyId を取得
  const familyId = 'family-id-placeholder';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">収支一覧</h1>
          <p className="text-gray-600">家計の収支を確認・管理</p>
        </div>
        <Link href="/dashboard/transactions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            収支を記録
          </Button>
        </Link>
      </div>

      {/* フィルタ */}
      <TransactionFilter onFilterChange={setFilters} />

      {/* 一覧 */}
      <TransactionList familyId={familyId} filters={filters} />
    </div>
  );
}
```

## 🧪 テスト項目

### 手動テスト
1. 一覧表示
   - 収支一覧ページにアクセス → データが表示される
2. フィルタ機能
   - 日付範囲でフィルタ → 該当データのみ表示
   - カテゴリでフィルタ → 該当データのみ表示
   - 種別でフィルタ → 収入 or 支出のみ表示
3. 検索機能
   - 説明文で検索 → 部分一致で絞り込まれる
4. 編集
   - 編集ボタン → モーダル表示 → 編集 → 保存 → 一覧に反映
5. 削除
   - 削除ボタン → 確認ダイアログ → 削除 → 一覧から削除される
6. ページネーション
   - 20件以上のデータ → 「さらに読み込む」ボタン表示 → クリック → 次のデータ読み込み

### エラーケーステスト
- [ ] データが0件の場合 → 「取引が見つかりませんでした」表示
- [ ] ネットワークエラー → エラーメッセージ表示
- [ ] 削除失敗 → エラーメッセージ表示

## 🚀 完了条件
- [ ] 収支一覧が正常に表示される
- [ ] フィルタ機能が正常に動作する
- [ ] 検索機能が正常に動作する
- [ ] 編集・削除が正常に動作する
- [ ] ページネーションが正常に動作する
- [ ] レスポンシブ対応されている
- [ ] すべてのテスト項目がパスしている

## 📊 優先度
**高** - MVPのコア機能

## ⏱️ 見積もり工数
**5-6時間**
- TransactionListコンポーネント: 2時間
- TransactionFilterコンポーネント: 1.5時間
- 編集・削除機能: 1.5時間
- ページ作成: 0.5時間
- テスト・修正: 1時間

## 🔗 関連チケット
- #03 - 収支の手動入力（入力後の遷移先）
- #05 - カテゴリ管理（カテゴリ表示）

## 📌 備考
- shadcn/ui の Table コンポーネントを使用
- ページネーションは「さらに読み込む」方式（無限スクロールも検討）
- 編集モーダルは TransactionForm を再利用可能
- モバイルではカード形式の表示も検討
