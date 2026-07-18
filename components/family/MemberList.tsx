/**
 * メンバー一覧コンポーネント
 *
 * グループに所属するメンバーの一覧を表示します。
 * 各メンバーの名前、メールアドレス、役割を表示します。
 */

'use client';

// Amplify Data の型定義
import type { Schema } from '@/amplify/data/resource';

// アイコン
import { Crown, User } from 'lucide-react';

/**
 * MemberListのプロパティ型定義
 */
interface MemberListProps {
  // メンバーの配列（FamilyMember型の配列）
  members: Array<Schema['FamilyMember']['type']>;
}

/**
 * MemberListコンポーネント
 *
 * グループメンバーの一覧をカード形式で表示します。
 *
 * @param members - メンバーの配列
 */
export function MemberList({ members }: MemberListProps) {
  // メンバーが存在しない場合のメッセージ
  if (!members || members.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        メンバーがいません
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* メンバー一覧のヘッダー */}
      <h3 className="text-sm font-medium text-gray-700">メンバー一覧</h3>

      {/* メンバーのリスト */}
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-lg border bg-white p-3"
          >
            {/* 左側: メンバー情報 */}
            <div className="flex items-center gap-3">
              {/* 役割アイコン */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                {member.role === 'admin' ? (
                  <Crown className="h-5 w-5 text-blue-600" />
                ) : (
                  <User className="h-5 w-5 text-blue-600" />
                )}
              </div>

              {/* メンバー情報 */}
              <div>
                {/* 名前 */}
                <p className="font-medium text-gray-900">
                  {member.name || 'ユーザー'}
                </p>
                {/* メールアドレス */}
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
            </div>

            {/* 右側: 役割バッジ */}
            <div>
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  member.role === 'admin'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {member.role === 'admin' ? '管理者' : 'メンバー'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
