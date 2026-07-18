# チケット #06: ルールベース自動分類機能の実装

## 📋 概要
キーワードマッチングによる自動カテゴリ分類ルールのCRUD機能を実装する。

## 🎯 目的
取引の説明文にキーワードが含まれている場合、自動的にカテゴリを割り当てることで、手動分類の手間を削減する。

## ✅ 受入基準

### ルール一覧表示
- [ ] カテゴリごとにルールがグループ化されて表示される
- [ ] 各ルールのキーワード、優先度、有効/無効状態が表示される
- [ ] 見やすいUI（アコーディオンまたはカード形式）

### ルール追加
- [ ] 「ルール追加」ボタンからモーダルが開く
- [ ] カテゴリ、キーワード、優先度を入力できる
- [ ] デフォルト優先度は100
- [ ] 保存後、一覧に即座に反映される

### ルール編集
- [ ] 各ルールの「編集」ボタンからモーダルが開く
- [ ] 既存の情報が入力された状態で表示される
- [ ] 更新後、一覧に即座に反映される

### ルール削除
- [ ] 各ルールの「削除」ボタンから確認ダイアログが表示される
- [ ] 削除後、一覧から削除される

### 有効/無効トグル
- [ ] 各ルールにトグルスイッチがある
- [ ] クリックで有効/無効を切り替えられる
- [ ] 無効化されたルールは自動分類に使用されない

### 自動分類ロジック
- [ ] 取引入力時、説明文に対してルールが適用される
- [ ] 複数マッチした場合、優先度が最小（数値が小さい）のルールを採用
- [ ] マッチしたカテゴリが自動選択される
- [ ] ユーザーは推奨を上書きできる

## 🔧 技術的詳細

### 使用技術
- **データベース**: DynamoDB (Amplify Data)
- **API**: AWS AppSync (GraphQL)
- **フロントエンド**: Next.js, TypeScript, shadcn/ui
- **トグルスイッチ**: shadcn/ui Switch

### データモデル
```typescript
// CategoryRule テーブル
{
  id: string;
  familyId: string;
  categoryId: string;
  keyword: string;        // マッチングキーワード（例: "スーパー"）
  priority: number;       // 優先度（低いほど優先、デフォルト: 100）
  isActive: boolean;      // 有効/無効
  createdAt: datetime;
  updatedAt: datetime;
}
```

### 実装ファイル
```
app/dashboard/rules/page.tsx              # ルール管理ページ
components/rules/RuleList.tsx             # ルール一覧
components/rules/RuleCard.tsx             # ルールカード
components/rules/RuleModal.tsx            # 追加・編集モーダル
lib/category-rules.ts                     # ルール適用ロジック（既存）
```

### GraphQL Operations
```graphql
# ルール一覧取得
query ListCategoryRules($familyId: ID!) {
  listCategoryRules(familyId: $familyId) {
    items {
      id
      categoryId
      category {
        id
        name
        type
        color
      }
      keyword
      priority
      isActive
      createdAt
    }
  }
}

# ルール作成
mutation CreateCategoryRule($input: CreateCategoryRuleInput!) {
  createCategoryRule(input: $input) {
    id
    categoryId
    keyword
    priority
    isActive
  }
}

# ルール更新
mutation UpdateCategoryRule($input: UpdateCategoryRuleInput!) {
  updateCategoryRule(input: $input) {
    id
    keyword
    priority
    isActive
  }
}

# ルール削除
mutation DeleteCategoryRule($input: DeleteCategoryRuleInput!) {
  deleteCategoryRule(input: $input) {
    id
  }
}
```

## 📝 実装手順

### 1. ルールカードコンポーネントの作成
```typescript
// components/rules/RuleCard.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2 } from 'lucide-react';

/**
 * ルールカードコンポーネント
 *
 * 1つのカテゴリルールを表示するカード
 */
interface RuleCardProps {
  rule: {
    id: string;
    categoryId: string;
    category: {
      name: string;
      color: string;
    };
    keyword: string;
    priority: number;
    isActive: boolean;
  };
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function RuleCard({ rule, onToggle, onEdit, onDelete }: RuleCardProps) {
  return (
    <Card className={!rule.isActive ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* カテゴリ色 */}
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: rule.category.color }}
          />

          {/* ルール情報 */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{rule.keyword}</span>
              <span className="text-sm text-gray-500">→ {rule.category.name}</span>
            </div>
            <p className="text-xs text-gray-500">優先度: {rule.priority}</p>
          </div>

          {/* 有効/無効トグル */}
          <Switch
            checked={rule.isActive}
            onCheckedChange={(checked) => onToggle(rule.id, checked)}
            aria-label="ルールを有効化/無効化"
          />

          {/* アクションボタン */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              aria-label="ルールを編集"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              aria-label="ルールを削除"
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

### 2. ルールモーダルコンポーネントの作成
```typescript
// components/rules/RuleModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * ルール追加・編集モーダル
 */
interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: any) => void;
  categories: any[];  // カテゴリ一覧
  initialData?: {
    id?: string;
    categoryId: string;
    keyword: string;
    priority: number;
  };
}

export function RuleModal({ isOpen, onClose, onSave, categories, initialData }: RuleModalProps) {
  // フォームの状態管理
  const [categoryId, setCategoryId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [priority, setPriority] = useState(100);
  const [loading, setLoading] = useState(false);

  // initialDataが変更されたらフォームに反映
  useEffect(() => {
    if (initialData) {
      setCategoryId(initialData.categoryId);
      setKeyword(initialData.keyword);
      setPriority(initialData.priority);
    } else {
      // 新規作成時はリセット
      setCategoryId('');
      setKeyword('');
      setPriority(100);
    }
  }, [initialData, isOpen]);

  // バリデーション
  const validate = () => {
    if (!categoryId) {
      alert('カテゴリを選択してください');
      return false;
    }
    if (!keyword.trim()) {
      alert('キーワードを入力してください');
      return false;
    }
    if (priority < 1) {
      alert('優先度は1以上の数値を入力してください');
      return false;
    }
    return true;
  };

  // 保存処理
  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      await onSave({
        ...(initialData?.id && { id: initialData.id }),
        categoryId,
        keyword: keyword.trim(),
        priority,
        isActive: true,
      });

      onClose();
    } catch (error) {
      console.error('Error saving rule:', error);
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
            {initialData ? 'ルールを編集' : 'ルールを追加'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* カテゴリ選択 */}
          <div className="space-y-2">
            <Label htmlFor="category">カテゴリ</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name} ({category.type === 'income' ? '収入' : '支出'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* キーワード */}
          <div className="space-y-2">
            <Label htmlFor="keyword">キーワード</Label>
            <Input
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="スーパー"
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              取引の説明文にこのキーワードが含まれる場合、自動的にカテゴリが割り当てられます
            </p>
          </div>

          {/* 優先度 */}
          <div className="space-y-2">
            <Label htmlFor="priority">優先度</Label>
            <Input
              id="priority"
              type="number"
              min="1"
              step="1"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value))}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              数値が小さいほど優先されます（デフォルト: 100）
            </p>
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

### 3. ルール管理ページの作成
```typescript
// app/dashboard/rules/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { RuleCard } from '@/components/rules/RuleCard';
import { RuleModal } from '@/components/rules/RuleModal';

const client = generateClient<Schema>();

export default function RulesPage() {
  // 状態管理
  const [rules, setRules] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  // TODO: familyIdを取得
  const familyId = 'family-id-placeholder';

  // ルール一覧とカテゴリ一覧を取得
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ルール一覧を取得
      const { data: rulesData } = await client.models.CategoryRule.list({
        filter: { familyId: { eq: familyId } },
      });

      // カテゴリ一覧を取得
      const { data: categoriesData } = await client.models.Category.list({
        filter: { familyId: { eq: familyId } },
      });

      setRules(rulesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ルール保存（新規 or 更新）
  const handleSave = async (rule: any) => {
    if (rule.id) {
      // 更新
      await client.models.CategoryRule.update({
        id: rule.id,
        keyword: rule.keyword,
        priority: rule.priority,
        isActive: rule.isActive,
      });
    } else {
      // 新規作成
      await client.models.CategoryRule.create({
        familyId,
        categoryId: rule.categoryId,
        keyword: rule.keyword,
        priority: rule.priority,
        isActive: true,
      });
    }

    await fetchData();
  };

  // ルール削除
  const handleDelete = async (id: string) => {
    if (!confirm('このルールを削除してもよろしいですか?')) return;

    try {
      await client.models.CategoryRule.delete({ id });
      await fetchData();
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('削除に失敗しました');
    }
  };

  // 有効/無効トグル
  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await client.models.CategoryRule.update({
        id,
        isActive,
      });

      // ローカル状態を更新
      setRules((prev) =>
        prev.map((rule) =>
          rule.id === id ? { ...rule, isActive } : rule
        )
      );
    } catch (error) {
      console.error('Error toggling rule:', error);
      alert('更新に失敗しました');
    }
  };

  // カテゴリごとにルールをグループ化
  const groupedRules = categories.map((category) => ({
    category,
    rules: rules.filter((rule) => rule.categoryId === category.id),
  }));

  if (loading) {
    return <div className="container mx-auto p-6">読み込み中...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ルール管理</h1>
          <p className="text-gray-600">自動カテゴリ分類のルールを設定</p>
        </div>
        <Button onClick={() => { setEditingRule(null); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          ルール追加
        </Button>
      </div>

      {/* カテゴリごとにルール表示 */}
      {groupedRules.map(({ category, rules: categoryRules }) => (
        <div key={category.id}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            {category.name}
            <span className="text-sm text-gray-500">
              ({categoryRules.length}件のルール)
            </span>
          </h2>

          {categoryRules.length === 0 ? (
            <p className="text-gray-500 text-sm mb-4">ルールがありません</p>
          ) : (
            <div className="space-y-2 mb-6">
              {categoryRules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onToggle={handleToggle}
                  onEdit={() => { setEditingRule(rule); setIsModalOpen(true); }}
                  onDelete={() => handleDelete(rule.id)}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {rules.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          ルールが設定されていません。ルールを追加して、自動分類を始めましょう。
        </div>
      )}

      {/* モーダル */}
      <RuleModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingRule(null); }}
        onSave={handleSave}
        categories={categories}
        initialData={editingRule}
      />
    </div>
  );
}
```

### 4. 自動分類ロジックの更新
```typescript
// lib/category-rules.ts（既存ファイルの更新）

/**
 * 説明文からカテゴリを自動推奨
 *
 * @param description - 取引の説明文
 * @param familyId - 家族グループID
 * @returns 推奨されたカテゴリ、またはnull
 */
export async function suggestCategoryFromDescription(
  description: string,
  familyId: string
): Promise<{ id: string; name: string } | null> {
  // 1. 有効なカテゴリルールを取得
  const { data: rules } = await client.models.CategoryRule.list({
    filter: {
      familyId: { eq: familyId },
      isActive: { eq: true },  // 有効なルールのみ
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

## 🧪 テスト項目

### 手動テスト
1. ルール一覧表示
   - ページアクセス → カテゴリごとにルールが表示される
2. ルール追加
   - 「ルール追加」→ モーダル表示 → 入力 → 保存 → 一覧に追加される
3. ルール編集
   - 編集ボタン → モーダル表示（既存データ表示） → 更新 → 一覧に反映
4. ルール削除
   - 削除ボタン → 確認ダイアログ → 削除 → 一覧から削除
5. 有効/無効トグル
   - トグルをクリック → 状態が切り替わる
6. 自動分類テスト
   - 取引入力画面で説明に「スーパー」と入力 → 「食費」が自動選択される
   - 複数マッチする場合 → 優先度が低いルールが適用される
   - 無効化されたルール → 自動分類に使用されない

### エラーケーステスト
- [ ] カテゴリ未選択 → エラー
- [ ] キーワード未入力 → エラー
- [ ] 優先度が0以下 → エラー
- [ ] ネットワークエラー → エラーメッセージ

## 🚀 完了条件
- [ ] ルール一覧が正常に表示される
- [ ] ルールの追加・編集・削除が正常に動作する
- [ ] 有効/無効トグルが正常に動作する
- [ ] 自動分類ロジックが正常に動作する
- [ ] 優先度に基づいた分類が正しく機能する
- [ ] すべてのテスト項目がパスしている

## 📊 優先度
**中** - 利便性向上の機能

## ⏱️ 見積もり工数
**4-5時間**
- RuleCardコンポーネント: 1時間
- RuleModalコンポーネント: 1.5時間
- ページ作成: 1時間
- 自動分類ロジック統合: 0.5時間
- テスト・修正: 1時間

## 🔗 関連チケット
- #03 - 収支の手動入力（自動分類が適用される）
- #05 - カテゴリ管理（カテゴリが必要）

## 📌 備考
- shadcn/ui の Switch コンポーネントを使用
- ルールの優先度は数値が小さいほど優先（1が最優先）
- 将来的には機械学習による自動分類も検討可能
- ルールのエクスポート/インポート機能は Phase 4 で検討
