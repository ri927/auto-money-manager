/**
 * メンバー招待フォームコンポーネント
 *
 * グループに新しいメンバーを招待するためのフォーム。
 * メールアドレスを入力して、招待リンクを生成します。
 */

'use client';

// React フック
import { useState } from 'react';

// UIコンポーネント
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// アイコン
import { Copy, Check } from 'lucide-react';

// ユーティリティ関数
import { generateInviteToken } from '@/lib/family-utils';

/**
 * InviteFormのプロパティ型定義
 */
interface InviteFormProps {
  familyId: string; // グループID
}

/**
 * InviteFormコンポーネント
 *
 * メールアドレスを入力して、招待リンクを生成・コピーします。
 *
 * @param familyId - グループID
 */
export function InviteForm({ familyId }: InviteFormProps) {
  // useState: コンポーネントの状態管理
  // email: 招待先のメールアドレス
  const [email, setEmail] = useState('');

  // inviteUrl: 生成された招待リンク
  const [inviteUrl, setInviteUrl] = useState('');

  // copied: リンクがコピーされたかどうか
  const [copied, setCopied] = useState(false);

  /**
   * 招待リンクを生成
   *
   * メールアドレスをもとに招待トークンを生成し、
   * 招待リンクURLを作成します。
   */
  const handleGenerateLink = () => {
    // メールアドレスが空の場合、処理を中断
    if (!email.trim()) {
      return;
    }

    // 招待トークンを生成
    const token = generateInviteToken(familyId, email);

    // 招待リンクURLを生成
    const url = `${window.location.origin}/dashboard/family/join/${token}`;

    // 招待リンクを state に設定
    setInviteUrl(url);

    // コピー状態をリセット
    setCopied(false);
  };

  /**
   * 招待リンクをクリップボードにコピー
   *
   * navigator.clipboard API を使用して、
   * 生成された招待リンクをコピーします。
   */
  const handleCopy = async () => {
    try {
      // クリップボードにコピー
      await navigator.clipboard.writeText(inviteUrl);

      // コピー成功フラグを設定
      setCopied(true);

      // 2秒後にコピー状態をリセット
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* 招待フォーム */}
      <div className="space-y-2">
        <Label htmlFor="invite-email">招待するメールアドレス</Label>
        <div className="flex gap-2">
          <Input
            id="invite-email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={handleGenerateLink} disabled={!email.trim()}>
            リンク生成
          </Button>
        </div>
      </div>

      {/* 生成された招待リンク */}
      {inviteUrl && (
        <div className="space-y-2">
          <Label htmlFor="invite-url">招待リンク</Label>
          <div className="flex gap-2">
            <Input
              id="invite-url"
              type="text"
              value={inviteUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              onClick={handleCopy}
              variant={copied ? 'default' : 'outline'}
              size="icon"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            {copied
              ? '✓ コピーしました！'
              : 'このリンクを招待したい人に送ってください（有効期限: 7日間）'}
          </p>
        </div>
      )}
    </div>
  );
}
