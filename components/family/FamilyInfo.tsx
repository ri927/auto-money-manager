/**
 * グループ情報表示コンポーネント
 *
 * グループの詳細情報、メンバー一覧、招待フォームを表示します。
 */

'use client';

// React フック
import { useEffect, useState } from 'react';

// Amplify Data クライアント
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

// UIコンポーネント
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// 子コンポーネント
import { MemberList } from './MemberList';
import { InviteForm } from './InviteForm';

// データクライアントを生成
const client = generateClient<Schema>();

/**
 * FamilyInfoのプロパティ型定義
 */
interface FamilyInfoProps {
  familyId: string; // グループID
}

/**
 * FamilyInfoコンポーネント
 *
 * グループの情報を取得して表示します。
 * - グループ名
 * - メンバー一覧
 * - 招待フォーム
 *
 * @param familyId - グループID
 */
export function FamilyInfo({ familyId }: FamilyInfoProps) {
  // useState: コンポーネントの状態管理
  // family: グループ情報
  const [family, setFamily] = useState<Schema['Family']['type'] | null>(null);

  // members: メンバー一覧
  const [members, setMembers] = useState<Array<Schema['FamilyMember']['type']>>([]);

  // loading: ローディング状態
  const [loading, setLoading] = useState(true);

  // error: エラーメッセージ
  const [error, setError] = useState('');

  /**
   * グループ情報とメンバー情報を取得
   *
   * useEffect: コンポーネントのマウント時に実行
   */
  useEffect(() => {
    const fetchFamilyData = async () => {
      try {
        // 1. Family 情報を取得
        const { data: familyData, errors: familyErrors } = await client.models.Family.get({
          id: familyId,
        });

        if (familyErrors || !familyData) {
          throw new Error('グループ情報の取得に失敗しました');
        }

        setFamily(familyData);

        // 2. FamilyMember 情報を取得
        const { data: membersData, errors: membersErrors } = await client.models.FamilyMember.list({
          filter: {
            familyId: { eq: familyId },
          },
        });

        if (membersErrors) {
          throw new Error('メンバー情報の取得に失敗しました');
        }

        setMembers(membersData);
      } catch (err) {
        console.error('Error fetching family data:', err);
        setError('グループ情報の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyData();
  }, [familyId]);

  // ローディング中の表示
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // エラー時の表示
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-red-800">
        {error}
      </div>
    );
  }

  // グループ情報が取得できない場合
  if (!family) {
    return (
      <div className="rounded-md bg-yellow-50 p-4 text-yellow-800">
        グループ情報が見つかりません
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* グループ情報カード */}
      <Card>
        <CardHeader>
          <CardTitle>{family.name}</CardTitle>
          <CardDescription>グループの詳細情報</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* メンバー一覧 */}
          <MemberList members={members} />

          {/* メンバー招待フォーム */}
          <div className="border-t pt-6">
            <h3 className="mb-4 text-sm font-medium text-gray-700">
              新しいメンバーを招待
            </h3>
            <InviteForm familyId={familyId} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
