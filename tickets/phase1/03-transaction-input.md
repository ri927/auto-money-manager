# チケット #03: 収支の手動入力機能の実装

## 📋 概要
収入・支出を手動で入力するフォーム機能を実装する。

## 🎯 目的
ユーザーが日々の収支を簡単に記録できるようにする。

## ✅ 受入基準

### 入力フォーム
- [ ] 日付を選択できる（デフォルトは今日）
- [ ] 種別（収入 or 支出）を選択できる
- [ ] 金額を数値入力できる
- [ ] カテゴリをプルダウンから選択できる
- [ ] 説明をテキストで入力できる（任意）
- [ ] 支払い方法を選択できる（現金、クレジット、デビット、電子マネー）
- [ ] 「保存」ボタンで DynamoDB に保存できる
- [ ] 「キャンセル」ボタンで前画面に戻れる

### バリデーション
- [ ] 日付が必須（未選択時はエラー表示）
- [ ] 金額が必須かつ0より大きい数値（エラー時はメッセージ表示）
- [ ] カテゴリが必須（未選択時はエラー表示）
- [ ] 入力エラーがある場合は保存できない

### 自動分類
- [ ] 説明文にキーワードが含まれる場合、自動的にカテゴリを推奨
- [ ] 推奨カテゴリが表示される
- [ ] ユーザーは推奨を上書きできる

### 保存後の動作
- [ ] 保存成功後、収支一覧ページにリダイレクト
- [ ] 成功メッセージが表示される
- [ ] 保存したデータが DynamoDB に正しく記録される

## 🔧 技術的詳細

### 使用技術
- **データベース**: DynamoDB (Amplify Data)
- **API**: AWS AppSync (GraphQL)
- **フロントエンド**: Next.js, TypeScript, shadcn/ui
- **フォーム**: React Hook Form (推奨) or useState

### データモデル
```typescript
// Transaction テーブル
{
  id: string;
  familyId: string;
  date: datetime;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  description: string;
  paymentMethod: string;
  createdBy: string;   // Cognito User ID
  source: 'manual';    // 手動入力
  createdAt: datetime;
  updatedAt: datetime;
}
```

### 実装ファイル
```
app/dashboard/transactions/new/page.tsx    # 収支入力ページ
components/transactions/TransactionForm.tsx # 収支入力フォーム
lib/transaction-utils.ts                   # 取引関連ユーティリティ
lib/category-rules.ts                      # カテゴリ自動分類ロジック
```

### GraphQL Operations
```graphql
# 取引作成
mutation CreateTransaction($input: CreateTransactionInput!) {
  createTransaction(input: $input) {
    id
    familyId
    date
    amount
    type
    categoryId
    description
    paymentMethod
    source
    createdBy
    createdAt
  }
}

# カテゴリ一覧取得
query ListCategories($familyId: ID!) {
  listCategories(familyId: $familyId) {
    items {
      id
      name
      type
      color
      icon
    }
  }
}

# カテゴリルール一覧取得
query ListCategoryRules($familyId: ID!) {
  listCategoryRules(familyId: $familyId) {
    items {
      id
      categoryId
      keyword
      priority
      isActive
    }
  }
}
```

## 📝 実装手順

### 1. 収支入力フォームコンポーネントの作成
```typescript
// components/transactions/TransactionForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const client = generateClient<Schema>();

interface TransactionFormProps {
  familyId: string;
  userId: string;
}

export function TransactionForm({ familyId, userId }: TransactionFormProps) {
  const router = useRouter();

  // フォームの状態管理
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('現金');

  // カテゴリ一覧
  const [categories, setCategories] = useState<any[]>([]);
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(null);

  // エラー・ローディング状態
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // カテゴリ一覧を取得
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await client.models.Category.list({
        filter: { familyId: { eq: familyId }, type: { eq: type } },
      });
      setCategories(data);
    };

    fetchCategories();
  }, [familyId, type]);

  // 説明文が変更されたらカテゴリを自動推奨
  useEffect(() => {
    const suggestCategory = async () => {
      if (!description) return;

      const suggested = await suggestCategoryFromDescription(description, familyId);
      if (suggested) {
        setSuggestedCategoryId(suggested.id);
        setCategoryId(suggested.id);
      }
    };

    // デバウンス処理（500ms 待ってから実行）
    const timer = setTimeout(suggestCategory, 500);
    return () => clearTimeout(timer);
  }, [description, familyId]);

  // バリデーション
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!date) {
      newErrors.date = '日付を入力してください';
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = '金額は0より大きい数値を入力してください';
    }

    if (!categoryId) {
      newErrors.categoryId = 'カテゴリを選択してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      await client.models.Transaction.create({
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

      // 成功したら一覧ページへ
      router.push('/dashboard/transactions');
    } catch (error) {
      console.error('Error creating transaction:', error);
      setErrors({ submit: '保存に失敗しました。もう一度お試しください。' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>収支を記録</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* エラーメッセージ */}
          {errors.submit && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {errors.submit}
            </div>
          )}

          {/* 種別選択 */}
          <div className="space-y-2">
            <Label>種別</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={type === 'expense' ? 'default' : 'outline'}
                onClick={() => setType('expense')}
              >
                支出
              </Button>
              <Button
                type="button"
                variant={type === 'income' ? 'default' : 'outline'}
                onClick={() => setType('income')}
              >
                収入
              </Button>
            </div>
          </div>

          {/* 日付 */}
          <div className="space-y-2">
            <Label htmlFor="date">日付</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={loading}
            />
            {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
          </div>

          {/* 金額 */}
          <div className="space-y-2">
            <Label htmlFor="amount">金額（円）</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="1"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
            />
            {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
          </div>

          {/* カテゴリ */}
          <div className="space-y-2">
            <Label htmlFor="category">カテゴリ</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                    {category.id === suggestedCategoryId && ' (推奨)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-sm text-red-600">{errors.categoryId}</p>}
          </div>

          {/* 説明 */}
          <div className="space-y-2">
            <Label htmlFor="description">説明（任意）</Label>
            <Input
              id="description"
              type="text"
              placeholder="スーパーで食材購入"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* 支払い方法 */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">支払い方法</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="現金">現金</SelectItem>
                <SelectItem value="クレジットカード">クレジットカード</SelectItem>
                <SelectItem value="デビットカード">デビットカード</SelectItem>
                <SelectItem value="電子マネー">電子マネー</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ボタン */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? '保存中...' : '保存'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1"
            >
              キャンセル
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

### 2. カテゴリ自動推奨ロジックの実装
```typescript
// lib/category-rules.ts

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

/**
 * 説明文からカテゴリを自動推奨
 */
export async function suggestCategoryFromDescription(
  description: string,
  familyId: string
): Promise<{ id: string; name: string } | null> {
  // 1. カテゴリルールを取得
  const { data: rules } = await client.models.CategoryRule.list({
    filter: {
      familyId: { eq: familyId },
      isActive: { eq: true },
    },
  });

  if (!rules || rules.length === 0) return null;

  // 2. キーワードマッチング
  const matchedRules = rules.filter((rule) =>
    description.includes(rule.keyword)
  );

  if (matchedRules.length === 0) return null;

  // 3. 優先度が最も低い（数値が小さい）ルールを選択
  const bestMatch = matchedRules.reduce((prev, current) =>
    (current.priority || 100) < (prev.priority || 100) ? current : prev
  );

  // 4. カテゴリ情報を取得
  const { data: category } = await client.models.Category.get({
    id: bestMatch.categoryId,
  });

  return category ? { id: category.id, name: category.name } : null;
}
```

### 3. 収支入力ページの作成
```typescript
// app/dashboard/transactions/new/page.tsx

import { TransactionForm } from '@/components/transactions/TransactionForm';
import { getCurrentUser } from 'aws-amplify/auth/server';
import { getUserFamily } from '@/lib/family-utils';

export default async function NewTransactionPage() {
  // サーバーサイドで現在のユーザーと家族グループを取得
  const user = await getCurrentUser();
  const family = await getUserFamily(user.userId);

  if (!family) {
    return (
      <div className="container mx-auto p-6">
        <p>まず家族グループを作成してください。</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <TransactionForm familyId={family.id} userId={user.userId} />
    </div>
  );
}
```

## 🧪 テスト項目

### 手動テスト
1. 収入入力フロー
   - 種別「収入」選択 → 日付・金額・カテゴリ・説明入力 → 保存 → 一覧ページ遷移
2. 支出入力フロー
   - 種別「支出」選択 → 日付・金額・カテゴリ・説明入力 → 保存 → 一覧ページ遷移
3. カテゴリ自動推奨
   - 説明に「スーパー」入力 → 「食費」カテゴリが自動選択される
4. バリデーション
   - 金額未入力 → エラー表示
   - カテゴリ未選択 → エラー表示
5. キャンセル
   - キャンセルボタン → 前画面に戻る

### エラーケーステスト
- [ ] 金額が0または負の値 → エラー
- [ ] 日付未選択 → エラー
- [ ] カテゴリ未選択 → エラー
- [ ] ネットワークエラー時のハンドリング

## 🚀 完了条件
- [ ] 収支入力フォームが正常に動作する
- [ ] バリデーションが正しく機能する
- [ ] カテゴリ自動推奨が動作する
- [ ] DynamoDB にデータが正しく保存される
- [ ] エラーハンドリングが適切に実装されている
- [ ] すべてのテスト項目がパスしている

## 📊 優先度
**高** - MVPのコア機能

## ⏱️ 見積もり工数
**4-5時間**
- TransactionFormコンポーネント: 2時間
- カテゴリ自動推奨ロジック: 1時間
- ページ作成: 0.5時間
- バリデーション実装: 0.5時間
- テスト・修正: 1時間

## 🔗 関連チケット
- #02 - 家族グループ管理（familyId が必要）
- #04 - 収支一覧表示（保存後の遷移先）
- #05 - カテゴリ管理（カテゴリの前提）
- #06 - ルールベース自動分類（自動推奨の前提）

## 📌 備考
- React Hook Form を使用すると、バリデーションとフォーム管理が簡潔になる
- 日付ピッカーは shadcn/ui の Calendar コンポーネントを使用することも検討
- デフォルトカテゴリは家族グループ作成時に自動作成する（チケット #05 で実装）
