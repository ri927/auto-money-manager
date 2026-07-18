/**
 * グループ参加ページ
 *
 * パス: /dashboard/family/join/[token]
 * 招待リンクからグループに参加するためのページです。
 */

'use client';

// React フック
import { useEffect, useState } from 'react';

// Next.js ルーティング
import { useParams, useRouter } from 'next/navigation';

// Amplify Data クライアント
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

// 認証コンテキスト
import { useAuth } from '@/contexts/AuthContext';

// UIコンポーネント
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ユーティリティ関数
import { verifyInviteToken, checkExistingMember } from '@/lib/family-utils';

// データクライアントを生成
const client = generateClient<Schema>();

/**
 * JoinFamilyPageコンポーネント
 *
 * 招待トークンを検証し、グループに参加する処理を実行します。
 */
export default function JoinFamilyPage() {
  // useParams: URLパラメータを取得
  const params = useParams();
  const token = params.token as string;

  // useRouter: ページ遷移用
  const router = useRouter();

  // useAuth: 現在のユーザー情報を取得
  const { user } = useAuth();

  // useState: コンポーネントの状態管理
  // status: 処理状態（verifying, joining, success, error）
  const [status, setStatus] = useState<'verifying' | 'joining' | 'success' | 'error'>('verifying');

  // message: ステータスメッセージ
  const [message, setMessage] = useState('招待リンクを確認中...');

  /**
   * グループ参加処理
   *
   * useEffect: コンポーネントのマウント時に実行
   * 処理の流れ:
   * 1. 招待トークンを検証
   * 2. 既に参加済みかチェック
   * 3. FamilyMemberを作成
   * 4. ダッシュボードへリダイレクト
   */
  useEffect(() => {
    const joinFamily = async () => {
      // ユーザー情報がない場合、処理を中断
      if (!user) {
        setStatus('error');
        setMessage('ユーザー情報を取得できませんでした');
        return;
      }

      try {
        // 1. 招待トークンを検証
        const { familyId, email } = verifyInviteToken(token);

        // 2. 既に参加済みかチェック
        const isExistingMember = await checkExistingMember(familyId, user.userId);

        if (isExistingMember) {
          setStatus('error');
          setMessage('既にこのグループに参加しています');
          return;
        }

        // 3. グループに参加中のステータスに変更
        setStatus('joining');
        setMessage('グループに参加中...');

        // 4. FamilyMemberを作成
        const { errors } = await client.models.FamilyMember.create({
          familyId,
          userId: user.userId,
          email: user.signInDetails?.loginId || email,
          name: user.username || '',
          role: 'member',
        });

        // エラーチェック
        if (errors) {
          throw new Error('グループへの参加に失敗しました');
        }

        // 5. 成功ステータスに変更
        setStatus('success');
        setMessage('グループに参加しました！');

        // 6. 3秒後にダッシュボードへリダイレクト
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } catch (err) {
        // エラー処理
        console.error('Error joining family:', err);
        setStatus('error');

        // エラーメッセージを設定
        if (err instanceof Error) {
          setMessage(err.message);
        } else {
          setMessage('グループへの参加中にエラーが発生しました');
        }
      }
    };

    joinFamily();
  }, [token, user, router]);

  /**
   * ダッシュボードへ移動ボタンのハンドラー
   */
  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {status === 'success' ? '✓ 参加完了' : 'グループに参加'}
          </CardTitle>
          <CardDescription>
            {status === 'verifying' && '招待リンクを確認しています...'}
            {status === 'joining' && 'グループに参加しています...'}
            {status === 'success' && 'グループに正常に参加しました'}
            {status === 'error' && 'エラーが発生しました'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* ローディング中またはグループ参加中 */}
          {(status === 'verifying' || status === 'joining') && (
            <div className="flex flex-col items-center py-8">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-gray-600">{message}</p>
            </div>
          )}

          {/* 成功 */}
          {status === 'success' && (
            <div className="space-y-4">
              <div className="rounded-md bg-green-50 p-4 text-green-800">
                {message}
              </div>
              <p className="text-sm text-gray-600">
                まもなくダッシュボードに移動します...
              </p>
              <Button onClick={handleGoToDashboard} className="w-full">
                今すぐダッシュボードへ
              </Button>
            </div>
          )}

          {/* エラー */}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="rounded-md bg-red-50 p-4 text-red-800">
                {message}
              </div>
              <Button onClick={handleGoToDashboard} variant="outline" className="w-full">
                ダッシュボードへ戻る
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
