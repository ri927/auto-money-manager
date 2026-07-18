/**
 * グループ作成フォームコンポーネント
 *
 * 新しい家族グループを作成するためのフォーム。
 * グループ作成後、作成者を admin 権限で自動登録し、
 * デフォルトカテゴリも自動作成します。
 */

'use client';

// React フック
import { useState } from 'react';

// Next.js ルーティング
import { useRouter } from 'next/navigation';

// Amplify Data クライアント
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

// 認証コンテキスト（現在のユーザー情報を取得）
import { useAuth } from '@/contexts/AuthContext';

// UIコンポーネント
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// ユーティリティ関数
import { createDefaultCategories } from '@/lib/family-utils';

// データクライアントを生成
const client = generateClient<Schema>();

/**
 * CreateFamilyFormコンポーネント
 *
 * グループ名を入力して、新しいグループを作成します。
 */
export function CreateFamilyForm() {
  // useRouter: ページ遷移用
  const router = useRouter();

  // useAuth: 現在のユーザー情報を取得
  const { user } = useAuth();

  // useState: コンポーネントの状態管理
  // name: グループ名
  const [name, setName] = useState('');

  // error: エラーメッセージ
  const [error, setError] = useState('');

  // loading: ローディング状態
  const [loading, setLoading] = useState(false);

  /**
   * フォーム送信時のハンドラー
   *
   * 処理の流れ:
   * 1. Family テーブルにグループを作成
   * 2. FamilyMember テーブルに作成者を admin として追加
   * 3. デフォルトカテゴリを自動作成
   * 4. ダッシュボードページへ遷移
   */
  const handleSubmit = async (e: React.FormEvent) => {
    // デフォルトのフォーム送信動作を防止
    e.preventDefault();

    // エラーをクリア
    setError('');

    // グループ名が空の場合、エラーを表示
    if (!name.trim()) {
      setError('グループ名を入力してください');
      return;
    }

    // ユーザー情報がない場合、エラーを表示
    if (!user) {
      setError('ユーザー情報を取得できませんでした');
      return;
    }

    // ローディング状態を開始
    setLoading(true);

    try {
      // 1. Family テーブルにグループを作成
      const { data: family, errors: familyErrors } = await client.models.Family.create({
        name: name.trim(),
      });

      // エラーチェック
      if (familyErrors || !family) {
        throw new Error('グループの作成に失敗しました');
      }

      // 2. FamilyMember テーブルに作成者を admin として追加
      const { errors: memberErrors } = await client.models.FamilyMember.create({
        familyId: family.id,
        userId: user.userId,
        email: user.signInDetails?.loginId || '',
        name: user.username || '',
        role: 'admin',
      });

      // エラーチェック
      if (memberErrors) {
        throw new Error('メンバーの追加に失敗しました');
      }

      // 3. デフォルトカテゴリを自動作成
      await createDefaultCategories(family.id);

      // 4. ダッシュボードページへ遷移
      router.push('/dashboard');
    } catch (err) {
      // エラー処理
      console.error('Error creating family:', err);
      setError('グループの作成中にエラーが発生しました');
    } finally {
      // ローディング状態を解除
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      {/* カードヘッダー */}
      <CardHeader>
        <CardTitle>家族グループを作成</CardTitle>
        <CardDescription>
          新しいグループを作成して、家族で収支を共有しましょう
        </CardDescription>
      </CardHeader>

      {/* カードコンテンツ */}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* エラーメッセージ表示 */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* グループ名入力フィールド */}
          <div className="space-y-2">
            <Label htmlFor="name">グループ名</Label>
            <Input
              id="name"
              type="text"
              placeholder="例: 〇〇家の家計簿"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* 送信ボタン */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '作成中...' : 'グループを作成'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
