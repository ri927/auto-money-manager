/**
 * カテゴリ一覧コンポーネント
 *
 * カテゴリを収入・支出別に表示します。
 */

'use client';

// Amplify Data の型定義
import type { Schema } from '@/amplify/data/resource';

// 子コンポーネント
import { CategoryCard } from './CategoryCard';

/**
 * CategoryListのプロパティ型定義
 */
interface CategoryListProps {
  // カテゴリの配列
  categories: Array<Schema['Category']['type']>;

  // 編集ハンドラー
  onEdit: (category: Schema['Category']['type']) => void;

  // 削除ハンドラー
  onDelete: (category: Schema['Category']['type']) => void;
}

/**
 * CategoryListコンポーネント
 *
 * カテゴリを収入・支出に分けて一覧表示します。
 *
 * @param categories - カテゴリの配列
 * @param onEdit - 編集ハンドラー
 * @param onDelete - 削除ハンドラー
 */
export function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  // カテゴリを種別で分類
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  return (
    <div className="space-y-8">
      {/* 支出カテゴリ */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">支出カテゴリ</h2>
        {expenseCategories.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {expenseCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">支出カテゴリがありません</p>
        )}
      </div>

      {/* 収入カテゴリ */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">収入カテゴリ</h2>
        {incomeCategories.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {incomeCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">収入カテゴリがありません</p>
        )}
      </div>
    </div>
  );
}
