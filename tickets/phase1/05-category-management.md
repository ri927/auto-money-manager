# チケット #05: カテゴリ管理機能の実装

## 📋 概要
収支のカテゴリ（食費、交通費など）のCRUD（作成・読み取り・更新・削除）機能を実装する。

## 🎯 目的
ユーザーが自分の家族に合わせたカテゴリを作成・管理できるようにする。

## ✅ 受入基準

### カテゴリ一覧表示
- [ ] 収入カテゴリと支出カテゴリが分けて表示される
- [ ] カテゴリ名、色、アイコンが表示される
- [ ] カード形式で見やすく表示される

### カテゴリ追加
- [ ] 「カテゴリ追加」ボタンからモーダルが開く
- [ ] カテゴリ名、種別、色、アイコンを入力できる
- [ ] 色はカラーピッカーで選択できる
- [ ] アイコンはリストから選択できる
- [ ] 保存後、一覧に即座に反映される

### カテゴリ編集
- [ ] 各カテゴリの「編集」ボタンからモーダルが開く
- [ ] 既存の情報が入力された状態で表示される
- [ ] 更新後、一覧に即座に反映される

### カテゴリ削除
- [ ] 各カテゴリの「削除」ボタンから確認ダイアログが表示される
- [ ] 使用中のカテゴリは削除不可（警告表示）
- [ ] 未使用カテゴリのみ削除可能

### デフォルトカテゴリ
- [ ] 家族グループ作成時に自動的にデフォルトカテゴリが作成される
- [ ] 支出: 食費、光熱費、交通費、娯楽費、医療費、教育費、その他
- [ ] 収入: 給与、ボーナス、その他

## 🔧 技術的詳細

### 使用技術
- **データベース**: DynamoDB (Amplify Data)
- **API**: AWS AppSync (GraphQL)
- **フロントエンド**: Next.js, TypeScript, shadcn/ui
- **カラーピッカー**: react-colorful (推奨) or shadcn/ui カスタム

### データモデル
```typescript
// Category テーブル
{
  id: string;
  familyId: string;
  name: string;
  type: 'income' | 'expense';
  color: string;  // hex形式 (#FF5733)
  icon: string;   // アイコン名 (lucide-react)
  createdAt: datetime;
  updatedAt: datetime;
}
```

### 実装ファイル
```
app/dashboard/categories/page.tsx         # カテゴリ管理ページ
components/categories/CategoryList.tsx    # カテゴリ一覧
components/categories/CategoryCard.tsx    # カテゴリカード
components/categories/CategoryModal.tsx   # 追加・編集モーダル
lib/default-categories.ts                 # デフォルトカテゴリ定義
lib/category-utils.ts                     # カテゴリユーティリティ
```

### GraphQL Operations
```graphql
# カテゴリ一覧取得
query ListCategories($familyId: ID!) {
  listCategories(familyId: $familyId) {
    items {
      id
      name
      type
      color
      icon
      createdAt
    }
  }
}

# カテゴリ作成
mutation CreateCategory($input: CreateCategoryInput!) {
  createCategory(input: $input) {
    id
    name
    type
    color
    icon
  }
}

# カテゴリ更新
mutation UpdateCategory($input: UpdateCategoryInput!) {
  updateCategory(input: $input) {
    id
    name
    color
    icon
  }
}

# カテゴリ削除
mutation DeleteCategory($input: DeleteCategoryInput!) {
  deleteCategory(input: $input) {
    id
  }
}

# カテゴリの使用状況確認
query CheckCategoryUsage($categoryId: ID!) {
  listTransactions(filter: { categoryId: { eq: $categoryId } }, limit: 1) {
    items {
      id
    }
  }
}
```

## 📝 実装手順

### 1. デフォルトカテゴリの定義
```typescript
// lib/default-categories.ts

/**
 * デフォルトカテゴリの定義
 *
 * 家族グループ作成時に自動的に作成されるカテゴリ
 */
export const DEFAULT_CATEGORIES = {
  // 支出カテゴリ
  expense: [
    { name: '食費', color: '#FF6B6B', icon: 'UtensilsCrossed' },
    { name: '光熱費', color: '#4ECDC4', icon: 'Lightbulb' },
    { name: '交通費', color: '#45B7D1', icon: 'Bus' },
    { name: '娯楽費', color: '#FFA07A', icon: 'Gamepad2' },
    { name: '医療費', color: '#98D8C8', icon: 'HeartPulse' },
    { name: '教育費', color: '#F7DC6F', icon: 'GraduationCap' },
    { name: 'その他', color: '#95A5A6', icon: 'MoreHorizontal' },
  ],
  // 収入カテゴリ
  income: [
    { name: '給与', color: '#2ECC71', icon: 'Banknote' },
    { name: 'ボーナス', color: '#27AE60', icon: 'Gift' },
    { name: 'その他', color: '#16A085', icon: 'MoreHorizontal' },
  ],
};

/**
 * 家族グループ作成時にデフォルトカテゴリを作成
 *
 * @param familyId - 家族グループID
 */
export async function createDefaultCategories(familyId: string) {
  const client = generateClient<Schema>();

  // 支出カテゴリを作成
  for (const category of DEFAULT_CATEGORIES.expense) {
    await client.models.Category.create({
      familyId,
      name: category.name,
      type: 'expense',
      color: category.color,
      icon: category.icon,
    });
  }

  // 収入カテゴリを作成
  for (const category of DEFAULT_CATEGORIES.income) {
    await client.models.Category.create({
      familyId,
      name: category.name,
      type: 'income',
      color: category.color,
      icon: category.icon,
    });
  }
}
```

### 2. カテゴリカードコンポーネントの作成
```typescript
// components/categories/CategoryCard.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import * as Icons from 'lucide-react';

/**
 * カテゴリカードコンポーネント
 *
 * 1つのカテゴリを表示するカード
 */
interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    type: 'income' | 'expense';
    color: string;
    icon: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  // アイコンコンポーネントを動的に取得
  // @ts-ignore - lucide-reactのアイコンを動的に取得
  const IconComponent = Icons[category.icon] || Icons.Circle;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* カテゴリ情報エリア */}
        <div className="flex items-center gap-3">
          {/* アイコン（カテゴリの色で表示） */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <IconComponent
              className="w-6 h-6"
              style={{ color: category.color }}
            />
          </div>

          {/* カテゴリ名と種別 */}
          <div className="flex-1">
            <h3 className="font-semibold">{category.name}</h3>
            <p className="text-sm text-gray-500">
              {category.type === 'income' ? '収入' : '支出'}
            </p>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              aria-label="カテゴリを編集"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              aria-label="カテゴリを削除"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 3. カテゴリモーダルコンポーネントの作成
```typescript
// components/categories/CategoryModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * カテゴリ追加・編集モーダル
 */
interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: any) => void;
  initialData?: {
    id?: string;
    name: string;
    type: 'income' | 'expense';
    color: string;
    icon: string;
  };
}

export function CategoryModal({ isOpen, onClose, onSave, initialData }: CategoryModalProps) {
  // フォームの状態管理
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [color, setColor] = useState('#FF6B6B');
  const [icon, setIcon] = useState('Circle');
  const [loading, setLoading] = useState(false);

  // initialDataが変更されたらフォームに反映
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setColor(initialData.color);
      setIcon(initialData.icon);
    } else {
      // 新規作成時はリセット
      setName('');
      setType('expense');
      setColor('#FF6B6B');
      setIcon('Circle');
    }
  }, [initialData, isOpen]);

  // 保存処理
  const handleSave = async () => {
    if (!name) {
      alert('カテゴリ名を入力してください');
      return;
    }

    setLoading(true);

    try {
      await onSave({
        ...(initialData?.id && { id: initialData.id }),
        name,
        type,
        color,
        icon,
      });

      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'カテゴリを編集' : 'カテゴリを追加'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* カテゴリ名 */}
          <div className="space-y-2">
            <Label htmlFor="name">カテゴリ名</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="食費"
              disabled={loading}
            />
          </div>

          {/* 種別 */}
          <div className="space-y-2">
            <Label htmlFor="type">種別</Label>
            <Select value={type} onValueChange={(v) => setType(v as any)} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">支出</SelectItem>
                <SelectItem value="income">収入</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 色 */}
          <div className="space-y-2">
            <Label htmlFor="color">色</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10"
                disabled={loading}
              />
              <span className="text-sm text-gray-600">{color}</span>
            </div>
          </div>

          {/* アイコン（簡易版：後で拡張可能） */}
          <div className="space-y-2">
            <Label htmlFor="icon">アイコン</Label>
            <Select value={icon} onValueChange={setIcon} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UtensilsCrossed">食事</SelectItem>
                <SelectItem value="Lightbulb">電球</SelectItem>
                <SelectItem value="Bus">バス</SelectItem>
                <SelectItem value="Gamepad2">ゲーム</SelectItem>
                <SelectItem value="HeartPulse">医療</SelectItem>
                <SelectItem value="GraduationCap">教育</SelectItem>
                <SelectItem value="Banknote">お金</SelectItem>
                <SelectItem value="Gift">ギフト</SelectItem>
                <SelectItem value="Circle">円</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ボタン */}
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? '保存中...' : '保存'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              キャンセル
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 4. カテゴリ管理ページの作成
```typescript
// app/dashboard/categories/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { CategoryModal } from '@/components/categories/CategoryModal';

const client = generateClient<Schema>();

export default function CategoriesPage() {
  // 状態管理
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  // TODO: familyIdを取得
  const familyId = 'family-id-placeholder';

  // カテゴリ一覧を取得
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await client.models.Category.list({
        filter: { familyId: { eq: familyId } },
      });
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // カテゴリ保存（新規 or 更新）
  const handleSave = async (category: any) => {
    if (category.id) {
      // 更新
      await client.models.Category.update({
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
      });
    } else {
      // 新規作成
      await client.models.Category.create({
        familyId,
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon,
      });
    }

    await fetchCategories();
  };

  // カテゴリ削除
  const handleDelete = async (id: string) => {
    // 使用状況を確認
    const { data: transactions } = await client.models.Transaction.list({
      filter: { categoryId: { eq: id } },
      limit: 1,
    });

    if (transactions.length > 0) {
      alert('このカテゴリは使用中のため削除できません');
      return;
    }

    if (!confirm('このカテゴリを削除してもよろしいですか?')) return;

    try {
      await client.models.Category.delete({ id });
      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('削除に失敗しました');
    }
  };

  // 収入・支出カテゴリに分割
  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  if (loading) {
    return <div className="container mx-auto p-6">読み込み中...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">カテゴリ管理</h1>
          <p className="text-gray-600">収支のカテゴリを管理</p>
        </div>
        <Button onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          カテゴリ追加
        </Button>
      </div>

      {/* 支出カテゴリ */}
      <div>
        <h2 className="text-xl font-semibold mb-4">支出カテゴリ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenseCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={() => { setEditingCategory(category); setIsModalOpen(true); }}
              onDelete={() => handleDelete(category.id)}
            />
          ))}
        </div>
      </div>

      {/* 収入カテゴリ */}
      <div>
        <h2 className="text-xl font-semibold mb-4">収入カテゴリ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {incomeCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={() => { setEditingCategory(category); setIsModalOpen(true); }}
              onDelete={() => handleDelete(category.id)}
            />
          ))}
        </div>
      </div>

      {/* モーダル */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCategory(null); }}
        onSave={handleSave}
        initialData={editingCategory}
      />
    </div>
  );
}
```

## 🧪 テスト項目

### 手動テスト
1. カテゴリ一覧表示
   - ページアクセス → デフォルトカテゴリが表示される
2. カテゴリ追加
   - 「カテゴリ追加」→ モーダル表示 → 入力 → 保存 → 一覧に追加される
3. カテゴリ編集
   - 編集ボタン → モーダル表示（既存データ表示） → 更新 → 一覧に反映
4. カテゴリ削除
   - 未使用カテゴリの削除ボタン → 確認ダイアログ → 削除 → 一覧から削除
   - 使用中カテゴリの削除ボタン → 警告メッセージ表示

### エラーケーステスト
- [ ] カテゴリ名未入力 → エラー
- [ ] 使用中カテゴリの削除 → 警告表示
- [ ] ネットワークエラー → エラーメッセージ

## 🚀 完了条件
- [ ] カテゴリ一覧が正常に表示される
- [ ] カテゴリの追加・編集・削除が正常に動作する
- [ ] デフォルトカテゴリが家族グループ作成時に自動作成される
- [ ] 使用中カテゴリの削除制限が機能する
- [ ] すべてのテスト項目がパスしている

## 📊 優先度
**高** - 収支入力の前提機能

## ⏱️ 見積もり工数
**4-5時間**
- デフォルトカテゴリ定義: 0.5時間
- CategoryCardコンポーネント: 1時間
- CategoryModalコンポーネント: 1.5時間
- ページ作成: 1時間
- 削除制限ロジック: 0.5時間
- テスト・修正: 1時間

## 🔗 関連チケット
- #02 - 家族グループ管理（グループ作成時にデフォルトカテゴリ作成）
- #03 - 収支の手動入力（カテゴリ選択）
- #06 - ルールベース自動分類（カテゴリルールで使用）

## 📌 備考
- lucide-reactのアイコンを使用
- カラーピッカーはHTML5の`<input type="color">`を使用（簡易版）
- より高度なアイコン選択UIは将来的に実装可能
- カテゴリの並び替え機能は Phase 4 で検討
