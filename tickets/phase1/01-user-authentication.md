# チケット #01: ユーザー認証機能の実装

## 📋 概要
Amazon Cognito を使用したユーザー認証機能（サインアップ、ログイン、ログアウト）を実装する。

## 🎯 目的
ユーザーがアカウントを作成し、セキュアにログイン・ログアウトできるようにする。

## ✅ 受入基準

### サインアップ
- [ ] メールアドレスとパスワードで新規登録ができる
- [ ] パスワードは8文字以上、大文字・小文字・数字を含む必要がある
- [ ] 登録後、確認コードがメールで送信される
- [ ] 確認コードを入力してアカウントを有効化できる
- [ ] バリデーションエラーが適切に表示される
- [ ] 既に登録済みのメールアドレスではエラーになる

### ログイン
- [ ] メールアドレスとパスワードでログインできる
- [ ] ログイン成功後、ダッシュボードにリダイレクトされる
- [ ] 認証情報が間違っている場合、エラーメッセージが表示される
- [ ] ログイン状態が保持される（JWT Token）

### ログアウト
- [ ] ログアウトボタンをクリックするとログアウトできる
- [ ] ログアウト後、ログインページにリダイレクトされる
- [ ] セッションが適切にクリアされる

## 🔧 技術的詳細

### 使用技術
- **認証**: Amazon Cognito (Amplify Auth)
- **フロントエンド**: Next.js App Router, TypeScript
- **UIコンポーネント**: shadcn/ui (Button, Input, Label, Card)

### 実装ファイル
```
amplify/auth/resource.ts          # Cognito設定
lib/amplify-client.ts             # Amplifyクライアント設定
lib/amplify-server.ts             # Amplifyサーバー設定
app/auth/signup/page.tsx          # サインアップページ
app/auth/signin/page.tsx          # ログインページ
components/auth/SignUpForm.tsx    # サインアップフォーム（既存）
components/auth/SignInForm.tsx    # ログインフォーム
components/auth/AuthProvider.tsx  # 認証コンテキスト
```

### Amplify Auth 設定
```typescript
// amplify/auth/resource.ts
import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: {
      required: true,
      mutable: false,
    },
  },
});
```

### 認証フロー
1. **サインアップ**: ユーザー → Next.js → Cognito → メール送信 → 確認コード入力 → アカウント有効化
2. **ログイン**: ユーザー → Next.js → Cognito → JWT Token → セッション保存
3. **ログアウト**: ユーザー → セッションクリア → ログインページへ

## 📝 実装手順

### 1. Amplify Auth リソースの作成
```bash
# amplify/auth/resource.ts を作成
```

### 2. Amplify バックエンドエントリーポイントの作成
```typescript
// amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

defineBackend({
  auth,
  data,
});
```

### 3. SignInForm コンポーネントの作成
```typescript
// components/auth/SignInForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignInForm() {
  // 実装...
}
```

### 4. ログインページの作成
```typescript
// app/auth/signin/page.tsx
import { SignInForm } from '@/components/auth/SignInForm';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignInForm />
    </div>
  );
}
```

### 5. サインアップページの作成
```typescript
// app/auth/signup/page.tsx
import { SignUpForm } from '@/components/auth/SignUpForm';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUpForm />
    </div>
  );
}
```

### 6. 認証コンテキストの作成
```typescript
// components/auth/AuthProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';

// ユーザー情報を全コンポーネントで共有
```

### 7. ルートレイアウトでAmplify設定
```typescript
// app/layout.tsx
import { Amplify } from 'aws-amplify';
import config from '@/amplify_outputs.json';

Amplify.configure(config, { ssr: true });
```

## 🧪 テスト項目

### 手動テスト
1. サインアップフローの完全なテスト
   - メールアドレス入力 → パスワード入力 → 登録 → メール確認 → コード入力 → 成功
2. ログインフローのテスト
   - 正しい認証情報でログイン → ダッシュボード遷移
   - 間違った認証情報 → エラーメッセージ表示
3. ログアウトのテスト
   - ログアウト → ログインページ遷移
4. セッション永続性のテスト
   - ログイン → ページリロード → ログイン状態維持

### バリデーションテスト
- [ ] 空のメールアドレス → エラー
- [ ] 無効なメールアドレス形式 → エラー
- [ ] 8文字未満のパスワード → エラー
- [ ] 大文字・小文字・数字を含まないパスワード → エラー

## 🚀 完了条件
- [ ] Amplify Sandbox でCognitoが正常に動作している
- [ ] サインアップ、ログイン、ログアウトが正常に動作する
- [ ] エラーハンドリングが適切に実装されている
- [ ] UI/UXが仕様書通りに実装されている
- [ ] すべてのテスト項目がパスしている

## 📊 優先度
**高** - MVP の基盤となる機能

## ⏱️ 見積もり工数
**3-4時間**
- Amplify Auth設定: 1時間
- SignInFormコンポーネント: 1時間
- ページ作成とルーティング: 1時間
- テスト・修正: 1時間

## 🔗 関連チケット
- #02 - 家族グループ管理（認証後の機能）
- #03 - 収支の手動入力（認証が必要）

## 📌 備考
- SignUpForm は既に実装済み（コメント付き）
- Amplify Gen 2 を使用するため、`amplify_outputs.json` が自動生成される
- 本番環境では、メールテンプレートのカスタマイズを検討
