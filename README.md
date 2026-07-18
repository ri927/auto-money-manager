# 🏠 自動家計簿管理アプリ (Auto Money Manager)

家族で共有できる自動家計簿管理Webアプリケーションです。
クレジットカードの利用通知メールを自動解析して、家計を簡単に管理できます。

## ✨ 主な機能

- 📧 **メール自動解析**: クレジットカード利用通知メールを自動取り込み
- 🤖 **AI自動分類**: ルールベースで支出を自動カテゴリ分類
- 👨‍👩‍👧‍👦 **家族共有**: 家族全員で収支を確認・管理
- 📊 **レポート機能**: 月次レポート、グラフ表示、支出分析
- 💰 **予算管理**: カテゴリ別予算設定と超過アラート

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**

### バックエンド・インフラ (AWS)
- **AWS Amplify** (ホスティング、認証、バックエンド統合)
- **Amazon Cognito** (ユーザー認証)
- **DynamoDB** (データベース)
- **AWS AppSync** (GraphQL API)
- **Amazon SES** + **Lambda** (メール処理)

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

## 📝 次の実装ステップ

現在、以下が完成しています:
- ✅ プロジェクト環境のセットアップ
- ✅ AWS Amplify の初期化と認証設定
- ✅ データベーススキーマ設計
- ✅ 基本的なページ構造とレイアウト
- ✅ ユーザー認証機能 (サインアップ・ログイン)
- ✅ ダッシュボードレイアウト

### Phase 1: 基本機能の実装 (MVP)
- [ ] 家族グループ作成・招待機能
- [ ] 収支入力フォーム
- [ ] 収支一覧表示
- [ ] カテゴリ管理機能
- [ ] ルールベース自動分類

### Phase 2: 自動化機能
- [ ] Amazon SES + Lambda でメール受信
- [ ] クレジットカードメール解析
- [ ] 自動取引記録

### Phase 3: レポート・分析
- [ ] 月次サマリー
- [ ] カテゴリ別円グラフ
- [ ] 月次推移グラフ

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
