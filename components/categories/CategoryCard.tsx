/**
 * カテゴリカードコンポーネント（マネーフォワード風デザイン）
 *
 * 1つのカテゴリを表示するカードです。
 * カテゴリ名、色、アイコンを表示し、編集・削除ボタンを提供します。
 */

'use client';

// Amplify Data の型定義
import type { Schema } from '@/amplify/data/resource';

// UIコンポーネント
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// アイコン
import { Pencil, Trash2, Tag } from 'lucide-react';
import * as Icons from 'lucide-react';

/**
 * CategoryCardのプロパティ型定義
 */
interface CategoryCardProps {
  // カテゴリ情報
  category: Schema['Category']['type'];

  // 編集ボタンのクリックハンドラー
  onEdit: (category: Schema['Category']['type']) => void;

  // 削除ボタンのクリックハンドラー
  onDelete: (category: Schema['Category']['type']) => void;
}

/**
 * CategoryCardコンポーネント
 *
 * カテゴリをカード形式で表示します。
 *
 * @param category - カテゴリ情報
 * @param onEdit - 編集ボタンのクリックハンドラー
 * @param onDelete - 削除ボタンのクリックハンドラー
 */
export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  /**
   * アイコンコンポーネントを取得
   *
   * lucide-react からアイコン名を使ってコンポーネントを取得します。
   * アイコン名が存在しない場合は、デフォルトのCircleアイコンを返します。
   */
  const getIconComponent = (iconName: string) => {
    // アイコン名をキーとして、lucide-reactからコンポーネントを取得
    const Icon = (Icons as any)[iconName];

    // アイコンが存在しない場合は、デフォルトのCircleアイコンを返す
    return Icon || Icons.Circle;
  };

  // アイコンコンポーネントを取得（デフォルトはTagアイコン）
  const IconComponent = getIconComponent(category.icon || 'Tag');

  return (
    <Card className="group hover:shadow-md transition-all border-none shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* 左側: カテゴリ情報 */}
          <div className="flex items-center gap-4">
            {/* カテゴリアイコン（丸型、背景透明度付き） */}
            <div
              className="rounded-xl p-3 transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <IconComponent
                className="h-6 w-6"
                style={{ color: category.color }}
              />
            </div>

            {/* カテゴリ名 */}
            <div>
              <p className="font-semibold text-gray-900">{category.name}</p>
              <p className="text-xs text-gray-500">
                {category.type === 'income' ? '収入' : '支出'}
              </p>
            </div>
          </div>

          {/* 右側: 編集・削除ボタン（ホバー時に表示） */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* 編集ボタン */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(category)}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {/* 削除ボタン */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(category)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
