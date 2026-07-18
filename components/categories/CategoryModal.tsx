/**
 * カテゴリ追加・編集モーダルコンポーネント
 *
 * カテゴリの新規作成または編集を行うモーダルダイアログです。
 * カテゴリ名、種別、色、アイコンを入力できます。
 */

'use client';

// React フック
import { useState, useEffect } from 'react';

// Amplify Data クライアント
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

// UIコンポーネント
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// データクライアントを生成
const client = generateClient<Schema>();

/**
 * CategoryModalのプロパティ型定義
 */
interface CategoryModalProps {
  // モーダルの開閉状態
  open: boolean;

  // モーダルを閉じるハンドラー
  onClose: () => void;

  // グループID
  familyId: string;

  // 編集対象のカテゴリ（新規作成の場合は undefined）
  category?: Schema['Category']['type'];

  // 保存成功時のコールバック
  onSuccess: () => void;
}

/**
 * よく使われるアイコンのリスト
 */
const ICON_OPTIONS = [
  { value: 'Utensils', label: '食事' },
  { value: 'Zap', label: '電気' },
  { value: 'Car', label: '車' },
  { value: 'Film', label: '娯楽' },
  { value: 'Heart', label: '医療' },
  { value: 'Book', label: '教育' },
  { value: 'ShoppingCart', label: '買い物' },
  { value: 'Home', label: '住宅' },
  { value: 'Smartphone', label: '通信' },
  { value: 'DollarSign', label: '給与' },
  { value: 'TrendingUp', label: '収入' },
  { value: 'Gift', label: 'ボーナス' },
  { value: 'PlusCircle', label: '追加' },
  { value: 'MoreHorizontal', label: 'その他' },
];

/**
 * CategoryModalコンポーネント
 *
 * カテゴリの追加・編集用モーダルダイアログ。
 *
 * @param open - モーダルの開閉状態
 * @param onClose - モーダルを閉じるハンドラー
 * @param familyId - グループID
 * @param category - 編集対象のカテゴリ（新規作成の場合は undefined）
 * @param onSuccess - 保存成功時のコールバック
 */
export function CategoryModal({
  open,
  onClose,
  familyId,
  category,
  onSuccess,
}: CategoryModalProps) {
  // useState: コンポーネントの状態管理
  // name: カテゴリ名
  const [name, setName] = useState('');

  // type: カテゴリ種別（income or expense）
  const [type, setType] = useState<'income' | 'expense'>('expense');

  // color: カテゴリ色
  const [color, setColor] = useState('#94a3b8');

  // icon: アイコン名
  const [icon, setIcon] = useState('MoreHorizontal');

  // loading: ローディング状態
  const [loading, setLoading] = useState(false);

  // error: エラーメッセージ
  const [error, setError] = useState('');

  /**
   * 編集モード時、カテゴリ情報をフォームに設定
   */
  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type as 'income' | 'expense');
      setColor(category.color || '#94a3b8');
      setIcon(category.icon || 'MoreHorizontal');
    } else {
      // 新規作成モード時、フォームをリセット
      setName('');
      setType('expense');
      setColor('#94a3b8');
      setIcon('MoreHorizontal');
    }
    setError('');
  }, [category, open]);

  /**
   * フォーム送信ハンドラー
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (category) {
        // 編集モード: 既存カテゴリを更新
        const { errors } = await client.models.Category.update({
          id: category.id,
          name,
          color,
          icon,
        });

        if (errors) {
          throw new Error('カテゴリの更新に失敗しました');
        }
      } else {
        // 新規作成モード: 新しいカテゴリを作成
        const { errors } = await client.models.Category.create({
          familyId,
          name,
          type,
          color,
          icon,
        });

        if (errors) {
          throw new Error('カテゴリの作成に失敗しました');
        }
      }

      // 成功時、モーダルを閉じてコールバックを実行
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving category:', err);
      setError('カテゴリの保存中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {category ? 'カテゴリを編集' : '新しいカテゴリを追加'}
          </DialogTitle>
          <DialogDescription>
            カテゴリの情報を入力してください
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* エラーメッセージ */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* カテゴリ名 */}
          <div className="space-y-2">
            <Label htmlFor="name">カテゴリ名</Label>
            <Input
              id="name"
              type="text"
              placeholder="例: 食費"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* 種別（新規作成時のみ） */}
          {!category && (
            <div className="space-y-2">
              <Label htmlFor="type">種別</Label>
              <Select value={type} onValueChange={(value) => setType(value as 'income' | 'expense')}>
                <SelectTrigger>
                  <SelectValue>
                    {type === 'income' ? '収入' : '支出'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">支出</SelectItem>
                  <SelectItem value="income">収入</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 色 */}
          <div className="space-y-2">
            <Label htmlFor="color">色</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={loading}
                className="h-10 w-20"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
            </div>
          </div>

          {/* アイコン */}
          <div className="space-y-2">
            <Label htmlFor="icon">アイコン</Label>
            <Select value={icon} onValueChange={(value) => value && setIcon(value)}>
              <SelectTrigger>
                <SelectValue>
                  {ICON_OPTIONS.find((opt) => opt.value === icon)?.label || icon}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ICON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* フッター */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
