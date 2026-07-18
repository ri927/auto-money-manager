/**
 * 家族グループページ
 *
 * パス: /dashboard/family
 * ユーザーの所属グループを表示するページです。
 * グループに所属していない場合は、グループ作成を促します。
 */

'use client';

// React フック
import { useEffect, useState } from 'react';

// Next.js コンポーネント
import Link from 'next/link';

// 認証コンテキスト
import { useAuth } from '@/contexts/AuthContext';

// UIコンポーネント
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// グループ情報コンポーネント
import { FamilyInfo } from '@/components/family/FamilyInfo';

// ユーティリティ関数
import { getUserFamily } from '@/lib/family-utils';

// アイコン
import { Users } from 'lucide-react';

/**
 * FamilyPageコンポーネント
 *
 * ユーザーの所属グループを取得して表示します。
 * グループに所属していない場合は、グループ作成ページへのリンクを表示します。
 */
export default function FamilyPage() {
  // useAuth: 現在のユーザー情報を取得
  const { user } = useAuth();

  // useState: コンポーネントの状態管理
  // familyId: ユーザーの所属グループID
  const [familyId, setFamilyId] = useState<string | null>(null);

  // loading: ローディング状態
  const [loading, setLoading] = useState(true);

  // error: エラーメッセージ
  const [error, setError] = useState('');

  /**
   * ユーザーの所属グループを取得
   *
   * useEffect: コンポーネントのマウント時に実行
   */
  useEffect(() => {
    const fetchUserFamily = async () => {
      // ユーザー情報がない場合、処理を中断
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // ユーザーの所属グループを取得
        const family = await getUserFamily(user.userId);

        if (family) {
          setFamilyId(family.id);
        }
      } catch (err) {
        console.error('Error fetching user family:', err);
        setError('グループ情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchUserFamily();
  }, [user]);

  // ローディング中の表示
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  // エラー時の表示
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4 text-red-800">
          {error}
        </div>
      </div>
    );
  }

  // グループに所属している場合、グループ情報を表示
  if (familyId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <FamilyInfo familyId={familyId} />
      </div>
    );
  }

  // グループに所属していない場合、グループ作成を促す
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <Users className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle>家族グループに参加しましょう</CardTitle>
          <CardDescription>
            グループを作成して、家族で収支を共有しましょう。
            または、既存のグループに招待されている場合は、招待リンクから参加できます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* グループ作成ボタン */}
          <Link href="/dashboard/family/create">
            <Button className="w-full" size="lg">
              新しいグループを作成
            </Button>
          </Link>

          {/* 説明テキスト */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              既に招待リンクをお持ちの方は、そのリンクをクリックして参加してください。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
