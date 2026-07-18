# チケット #02: 家族グループ管理機能の実装

## 📋 概要
家族グループの作成、メンバー招待、参加機能を実装する。

## 🎯 目的
家族で収支を共有できるグループを作成し、メンバーを招待して管理できるようにする。

## ✅ 受入基準

### グループ作成
- [ ] ログイン後、グループ作成ページにアクセスできる
- [ ] グループ名を入力してグループを作成できる
- [ ] 作成者が自動的に admin 権限で登録される
- [ ] グループ作成後、FamilyMember レコードも自動作成される

### メンバー招待
- [ ] メールアドレスで他のユーザーを招待できる
- [ ] 招待リンクが生成される
- [ ] 招待リンクをコピーできる
- [ ] 招待メールが送信される（将来的）

### グループ参加
- [ ] 招待リンクからグループに参加できる
- [ ] 参加時は member 権限で登録される
- [ ] 既に参加済みの場合はエラーメッセージを表示

### グループ情報表示
- [ ] グループ名が表示される
- [ ] メンバー一覧が表示される（名前、メール、役割）
- [ ] 自分の役割が表示される

### グループ設定（admin のみ）
- [ ] グループ名を変更できる
- [ ] グループを削除できる（確認ダイアログ表示）
- [ ] メンバーを削除できる（自分以外）

## 🔧 技術的詳細

### 使用技術
- **データベース**: DynamoDB (Amplify Data)
- **API**: AWS AppSync (GraphQL)
- **フロントエンド**: Next.js, TypeScript, shadcn/ui

### データモデル
```typescript
// Family テーブル
{
  id: string;
  name: string;
  createdAt: datetime;
  updatedAt: datetime;
  owner: string; // Cognito User ID
}

// FamilyMember テーブル
{
  id: string;
  familyId: string;
  userId: string;   // Cognito User ID
  email: string;
  name: string;
  role: 'admin' | 'member';
  createdAt: datetime;
}
```

### 実装ファイル
```
app/dashboard/family/page.tsx              # 家族グループページ
app/dashboard/family/create/page.tsx       # グループ作成ページ
app/dashboard/family/join/[token]/page.tsx # グループ参加ページ
components/family/FamilyInfo.tsx           # グループ情報表示
components/family/MemberList.tsx           # メンバー一覧
components/family/InviteForm.tsx           # 招待フォーム
components/family/CreateFamilyForm.tsx     # グループ作成フォーム
lib/family-utils.ts                        # グループ関連ユーティリティ
```

### GraphQL Operations
```graphql
# グループ作成
mutation CreateFamily($input: CreateFamilyInput!) {
  createFamily(input: $input) {
    id
    name
    owner
    createdAt
  }
}

# メンバー追加
mutation CreateFamilyMember($input: CreateFamilyMemberInput!) {
  createFamilyMember(input: $input) {
    id
    familyId
    userId
    email
    name
    role
  }
}

# グループ取得
query GetFamily($id: ID!) {
  getFamily(id: $id) {
    id
    name
    owner
    members {
      items {
        id
        userId
        email
        name
        role
      }
    }
  }
}

# ユーザーの所属グループ取得
query ListFamilyMembersByUserId($userId: ID!) {
  listFamilyMembersByUserId(userId: $userId) {
    items {
      id
      familyId
      family {
        id
        name
      }
      role
    }
  }
}
```

## 📝 実装手順

### 1. Amplify Data スキーマの更新
```typescript
// amplify/data/resource.ts
// Family と FamilyMember のスキーマを定義（既存）
```

### 2. グループ作成フォームの実装
```typescript
// components/family/CreateFamilyForm.tsx
'use client';

import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export function CreateFamilyForm() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Familyを作成
      const { data: family } = await client.models.Family.create({
        name,
      });

      // 2. FamilyMemberを作成（自分をadminとして追加）
      await client.models.FamilyMember.create({
        familyId: family.id,
        userId: currentUser.userId,
        email: currentUser.email,
        name: currentUser.name,
        role: 'admin',
      });

      // 3. ダッシュボードへリダイレクト
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating family:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* フォーム実装 */}
    </form>
  );
}
```

### 3. メンバー招待機能の実装
```typescript
// components/family/InviteForm.tsx
'use client';

import { useState } from 'react';

export function InviteForm({ familyId }: { familyId: string }) {
  const [email, setEmail] = useState('');

  const generateInviteLink = () => {
    // 招待トークンを生成（JWT or UUID）
    const token = generateInviteToken(familyId, email);
    const inviteUrl = `${window.location.origin}/dashboard/family/join/${token}`;

    // クリップボードにコピー
    navigator.clipboard.writeText(inviteUrl);

    return inviteUrl;
  };

  const handleInvite = async () => {
    const inviteUrl = generateInviteLink();
    // TODO: 招待メール送信（Phase 2）
    alert(`招待リンクをコピーしました: ${inviteUrl}`);
  };

  return (
    <div>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス"
      />
      <Button onClick={handleInvite}>招待リンクを生成</Button>
    </div>
  );
}
```

### 4. グループ参加ページの実装
```typescript
// app/dashboard/family/join/[token]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function JoinFamilyPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  useEffect(() => {
    const joinFamily = async () => {
      try {
        // 1. トークンを検証
        const { familyId, email } = verifyInviteToken(token);

        // 2. 既に参加済みかチェック
        const existingMember = await checkExistingMember(familyId, currentUser.userId);
        if (existingMember) {
          throw new Error('既にこのグループに参加しています');
        }

        // 3. FamilyMemberを作成
        await client.models.FamilyMember.create({
          familyId,
          userId: currentUser.userId,
          email: currentUser.email,
          name: currentUser.name,
          role: 'member',
        });

        // 4. ダッシュボードへリダイレクト
        router.push('/dashboard');
      } catch (error) {
        console.error('Error joining family:', error);
      }
    };

    joinFamily();
  }, [token]);

  return <div>グループに参加中...</div>;
}
```

### 5. グループ情報表示の実装
```typescript
// components/family/FamilyInfo.tsx
'use client';

import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';

export function FamilyInfo({ familyId }: { familyId: string }) {
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFamily = async () => {
      const { data } = await client.models.Family.get({ id: familyId });
      setFamily(data);
      setLoading(false);
    };

    fetchFamily();
  }, [familyId]);

  if (loading) return <div>読み込み中...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{family.name}</CardTitle>
        <CardDescription>グループ情報</CardDescription>
      </CardHeader>
      <CardContent>
        <MemberList members={family.members.items} />
        <InviteForm familyId={familyId} />
      </CardContent>
    </Card>
  );
}
```

### 6. ユーティリティ関数の実装
```typescript
// lib/family-utils.ts

/**
 * 招待トークンを生成
 */
export function generateInviteToken(familyId: string, email: string): string {
  // JWTまたはUUIDを使用
  const payload = { familyId, email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  return btoa(JSON.stringify(payload));
}

/**
 * 招待トークンを検証
 */
export function verifyInviteToken(token: string): { familyId: string; email: string } {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) {
      throw new Error('招待リンクの有効期限が切れています');
    }
    return { familyId: payload.familyId, email: payload.email };
  } catch (error) {
    throw new Error('無効な招待リンクです');
  }
}

/**
 * ユーザーが既にグループに参加しているかチェック
 */
export async function checkExistingMember(familyId: string, userId: string): Promise<boolean> {
  const { data } = await client.models.FamilyMember.list({
    filter: {
      familyId: { eq: familyId },
      userId: { eq: userId },
    },
  });
  return data.length > 0;
}

/**
 * ユーザーの所属グループを取得
 */
export async function getUserFamily(userId: string) {
  const { data } = await client.models.FamilyMember.list({
    filter: {
      userId: { eq: userId },
    },
  });
  return data[0]?.family || null;
}
```

## 🧪 テスト項目

### 手動テスト
1. グループ作成フロー
   - グループ名入力 → 作成 → ダッシュボード遷移 → Family & FamilyMember レコード作成確認
2. 招待リンク生成
   - メールアドレス入力 → 招待リンク生成 → クリップボードにコピー
3. グループ参加フロー
   - 招待リンククリック → 参加 → ダッシュボード遷移 → FamilyMember レコード作成確認
4. グループ情報表示
   - グループ名表示 → メンバー一覧表示 → 役割表示
5. グループ設定（admin）
   - グループ名変更 → 更新確認
   - グループ削除 → 確認ダイアログ → 削除確認

### エラーケーステスト
- [ ] 空のグループ名 → エラー
- [ ] 既に参加済みのグループへの参加 → エラー
- [ ] 無効な招待トークン → エラー
- [ ] 有効期限切れの招待トークン → エラー
- [ ] member 権限でグループ設定へのアクセス → 権限エラー

## 🚀 完了条件
- [ ] グループ作成、招待、参加が正常に動作する
- [ ] グループ情報が正しく表示される
- [ ] 権限制御が適切に実装されている（admin のみ設定変更可能）
- [ ] エラーハンドリングが適切に実装されている
- [ ] すべてのテスト項目がパスしている

## 📊 優先度
**高** - MVPの重要機能

## ⏱️ 見積もり工数
**5-6時間**
- データモデル確認: 0.5時間
- グループ作成機能: 1.5時間
- 招待機能: 2時間
- グループ参加機能: 1時間
- グループ情報表示: 1時間
- テスト・修正: 1時間

## 🔗 関連チケット
- #01 - ユーザー認証（前提条件）
- #03 - 収支の手動入力（グループIDが必要）

## 📌 備考
- 招待メール送信機能は Phase 2 で実装予定
- トークン検証にはJWTの使用を推奨（セキュリティ向上）
- グループ削除時は、関連する Transaction, Category, CategoryRule も削除する必要がある（カスケード削除）
