# 🏠 自動家計簿管理アプリ (Auto Money Manager)

[![GitHub](https://img.shields.io/badge/GitHub-ri927%2Fauto--money--manager-blue?logo=github)](https://github.com/ri927/auto-money-manager)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![AWS Amplify](https://img.shields.io/badge/AWS-Amplify%20Gen%202-orange?logo=amazon-aws)](https://aws.amazon.com/amplify/)

家族で共有できる自動家計簿管理Webアプリケーションです。
クレジットカードの利用通知メールを自動解析して、家計を簡単に管理できます。

## ✨ 主な機能

- 🔐 **ユーザー認証**: AWS Cognito による安全なサインアップ・ログイン
- 👨‍👩‍👧‍👦 **家族共有**: 家族全員で収支を確認・管理
- 💰 **収支管理**: 手動入力、一覧表示、フィルタリング
- 🔄 **繰り返し取引**: サブスクや固定費の自動記録
- 🗂️ **カテゴリ管理**: カスタマイズ可能な収支カテゴリ
- 📅 **月次カレンダー**: 日ごとの収支を視覚的に確認
- 📱 **レスポンシブ対応**: デスクトップ・モバイル両対応

### 🚧 今後実装予定
- 📧 メール自動解析（クレジットカード利用通知）
- 🤖 AI自動分類（ルールベース）
- 📊 レポート機能（月次レポート、グラフ表示）
- 💰 予算管理（カテゴリ別予算設定と超過アラート）

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 16** (App Router)
- **TypeScript 5**
- **React 19**
- **Tailwind CSS 4** + **shadcn/ui**
- **Lucide React** (アイコン)

### バックエンド・インフラ (AWS)
- **AWS Amplify Gen 2** (ホスティング、認証、バックエンド統合)
- **Amazon Cognito** (ユーザー認証)
- **Amazon DynamoDB** (NoSQL データベース)
- **AWS AppSync** (GraphQL API)
- **Amazon SES** + **Lambda** (メール処理 - 予定)

### 開発ツール
- **Storybook** (UIコンポーネントカタログ)
- **Vitest** (テスト)
- **ESLint** (コード品質)

## 📁 プロジェクト構造

```
.
├── amplify/              # Amplify バックエンド設定
│   ├── auth/            # 認証設定
│   ├── data/            # データスキーマ (DynamoDB)
│   └── backend.ts       # バックエンドエントリーポイント
├── app/                  # Next.js App Router
│   ├── auth/            # 認証ページ (サインイン・サインアップ)
│   ├── dashboard/       # ダッシュボード
│   └── page.tsx         # ランディングページ
├── components/          # Reactコンポーネント
│   ├── auth/           # 認証関連コンポーネント
│   ├── dashboard/      # ダッシュボードコンポーネント
│   └── ui/             # shadcn/ui コンポーネント
└── lib/                 # ユーティリティ・設定
    ├── amplify-client.ts  # Amplify クライアント設定
    └── amplify-server.ts  # Amplify サーバー設定
```

## 🚀 セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. AWS Amplify のセットアップ

#### AWS CLI のインストールと設定

```bash
# AWS CLI がインストールされていない場合
brew install awscli  # macOS
# または
pip install awscli  # Python

# AWS 認証情報の設定
aws configure
```

以下の情報を入力:
- AWS Access Key ID
- AWS Secret Access Key
- Default region name (例: ap-northeast-1)
- Default output format (json)

#### Amplify サンドボックスの起動

```bash
npm run amplify:sandbox
```

初回起動時、以下が自動で作成されます:
- Cognito User Pool (認証)
- DynamoDB テーブル (データストア)
- AppSync API (GraphQL)

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 🌐 AWS Amplify へのデプロイ

このアプリは AWS Amplify Hosting に簡単にデプロイできます。

### クイックデプロイ

1. AWS Amplify Console を開く
2. GitHub リポジトリ `ri927/auto-money-manager` を接続
3. `amplify.yml` が自動検出されます
4. **保存してデプロイ** をクリック

詳細な手順は **[DEPLOYMENT.md](./DEPLOYMENT.md)** を参照してください。

### デプロイ設定ファイル

- `amplify.yml`: Amplify Hosting ビルド設定
- `DEPLOYMENT.md`: 詳細なデプロイガイド

### 推定コスト

AWS 無料枠内で運用可能（月額 $0）：
- ビルド: 1,000分/月まで無料
- ホスティング: 15GB 保存 + 15GB 配信/月まで無料

## 📝 実装状況

### ✅ 完成している機能

#### Phase 1: 基本機能 (MVP)
- ✅ プロジェクト環境のセットアップ
- ✅ AWS Amplify Gen 2 の初期化と認証設定
- ✅ データベーススキーマ設計（6モデル）
- ✅ ユーザー認証機能（サインアップ・ログイン）
- ✅ 家族グループ作成・招待機能
- ✅ 収支入力フォーム
- ✅ 収支一覧表示・フィルタリング
- ✅ カテゴリ管理機能
- ✅ 繰り返し取引機能（サブスク・固定費）

#### UI/UX
- ✅ マネーフォワード風デザイン
- ✅ レスポンシブ対応（モバイル・デスクトップ）
- ✅ サイドバーナビゲーション
- ✅ ボトムナビゲーション（モバイル）
- ✅ 月次カレンダー表示
- ✅ ダークテーマ対応（CSS変数）

#### 開発環境
- ✅ TypeScript 完全対応
- ✅ ESLint + Prettier 設定
- ✅ Storybook セットアップ
- ✅ Vitest テスト環境
- ✅ GitHub リポジトリ
- ✅ Amplify デプロイ設定

### 🚧 今後の実装予定

#### Phase 2: 自動化機能
- [ ] Amazon SES + Lambda でメール受信
- [ ] クレジットカードメール解析（楽天、三井住友、JCB等）
- [ ] 自動取引記録
- [ ] カテゴリルールベース自動分類の拡張

#### Phase 3: レポート・分析
- [ ] 月次サマリー（収入・支出・収支）
- [ ] カテゴリ別円グラフ
- [ ] 月次推移折れ線グラフ
- [ ] 予算管理機能
- [ ] 予算超過アラート

## 🔐 環境変数

Amplify Sandbox を使用する場合、環境変数の設定は不要です。
`amplify_outputs.json` が自動生成されます。

## 📊 データベーススキーマ

### テーブル構成

1. **Family**: 家族グループ
2. **FamilyMember**: 家族メンバー
3. **Transaction**: 取引記録 (収支データ)
4. **Category**: カテゴリマスタ
5. **CategoryRule**: 自動分類ルール

詳細は `amplify/data/resource.ts` を参照してください。

## 💰 コスト見積もり

AWS 無料枠内で収まる想定:
- **DynamoDB**: 25GB, 200M req/月まで無料
- **Cognito**: 50,000 MAU まで無料
- **Lambda**: 100万 req/月まで無料
- **SES**: 受信 1,000通/月まで無料
- **Amplify Hosting**: 5GB 転送/月まで無料

→ **月額: ほぼ $0** (無料枠内)

## 🤝 コントリビューション

バグ報告や機能要望は Issue をお願いします。

## 📄 ライセンス

MIT License
