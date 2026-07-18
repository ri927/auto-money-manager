@AGENTS.md

# 自動家計簿管理アプリ - 詳細仕様書

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [技術スタック](#技術スタック)
3. [システムアーキテクチャ](#システムアーキテクチャ)
4. [データモデル](#データモデル)
5. [機能仕様](#機能仕様)
6. [画面仕様](#画面仕様)
7. [API仕様](#api仕様)
8. [メール解析仕様](#メール解析仕様)
9. [セキュリティ](#セキュリティ)
10. [開発ガイドライン](#開発ガイドライン)

---

## プロジェクト概要

### プロダクト名
**Auto Money Manager (自動家計簿管理アプリ)**

### 目的
家族で共有できる自動家計簿アプリを構築し、クレジットカードの利用通知メールを自動解析して収支を記録することで、家計管理の手間を削減する。

### ターゲットユーザー
- 家族2-3人での利用を想定
- 全員が全データを閲覧・編集可能
- クレジットカードを主に使用する家庭

### 主要機能
1. ユーザー認証（サインアップ・ログイン）
2. 家族グループ管理（作成・招待・参加）
3. 収支の手動入力
4. メール自動取り込み（クレジットカード利用通知）
5. ルールベース自動カテゴリ分類
6. 収支一覧・検索・フィルタ
7. 月次レポート・グラフ表示

---

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript 5+
- **スタイリング**: Tailwind CSS 4
- **UIコンポーネント**: shadcn/ui
- **アイコン**: lucide-react
- **状態管理**: React Hooks (useState, useEffect, useContext)
- **フォームバリデーション**: HTML5 標準バリデーション

### バックエンド・インフラ
- **ホスティング**: AWS Amplify Hosting
- **認証**: Amazon Cognito (Amplify Auth)
- **データベース**: Amazon DynamoDB
- **API**: AWS AppSync (GraphQL)
- **メール処理**: Amazon SES + AWS Lambda
- **ファイルストレージ**: Amazon S3 (将来的なレシート画像保存用)

### 開発ツール
- **パッケージマネージャー**: npm
- **リンター**: ESLint
- **フォーマッター**: Prettier (推奨)
- **バージョン管理**: Git

---

## システムアーキテクチャ

### 全体構成図

```
┌─────────────┐
│   ユーザー   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│     Next.js Frontend (Vercel)       │
│  - App Router                       │
│  - SSR/SSG                          │
│  - Tailwind CSS + shadcn/ui         │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│       AWS Amplify Gen 2             │
├─────────────────────────────────────┤
│  Amazon Cognito (認証)               │
│  AWS AppSync (GraphQL API)          │
│  Amazon DynamoDB (データストア)       │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│    メール処理パイプライン            │
├─────────────────────────────────────┤
│  1. Amazon SES (メール受信)          │
│  2. AWS Lambda (解析・パース)        │
│  3. DynamoDB (取引記録保存)          │
└─────────────────────────────────────┘
```

### データフロー

#### 1. ユーザー登録・認証フロー
```
ユーザー → Next.js → Cognito → JWT Token → Next.js → ユーザー
```

#### 2. 収支手動入力フロー
```
ユーザー → Next.js → AppSync (GraphQL) → DynamoDB
                    ↓
              自動分類ルール適用
                    ↓
              カテゴリ自動設定
```

#### 3. メール自動取り込みフロー
```
クレジットカード会社
    ↓ (利用通知メール)
専用メールアドレス
    ↓
Amazon SES (受信)
    ↓ (S3にメール保存 & Lambda起動)
AWS Lambda
    ↓ (メール解析・パース)
    ├─ 日付抽出
    ├─ 金額抽出
    ├─ 店舗名抽出
    └─ カテゴリ自動判定
    ↓
AppSync (GraphQL Mutation)
    ↓
DynamoDB (Transaction保存)
    ↓
Next.js (リアルタイム更新 via Subscription)
    ↓
ユーザー画面に反映
```

---

## データモデル

### DynamoDB テーブル設計

#### 1. Family (家族グループ)
```typescript
{
  id: string;              // PK: UUID
  name: string;            // グループ名
  createdAt: datetime;     // 作成日時
  updatedAt: datetime;     // 更新日時
  owner: string;           // オーナーのユーザーID
}
```

**アクセスパターン**
- ユーザーが所属する家族グループを取得
- グループIDで家族情報を取得

#### 2. FamilyMember (家族メンバー)
```typescript
{
  id: string;              // PK: UUID
  familyId: string;        // FK: Family.id
  userId: string;          // Cognito User ID
  email: string;           // メールアドレス
  name: string;            // 表示名
  role: 'admin' | 'member'; // 役割
  createdAt: datetime;     // 参加日時
}
```

**GSI (Global Secondary Index)**
- `userId-index`: userId で検索（ユーザーの所属グループ取得）
- `familyId-index`: familyId で検索（グループのメンバー一覧取得）

#### 3. Transaction (取引記録)
```typescript
{
  id: string;                        // PK: UUID
  familyId: string;                  // FK: Family.id
  date: datetime;                    // 取引日時
  amount: number;                    // 金額（正: 収入, 負: 支出）
  type: 'income' | 'expense';        // 種別
  categoryId: string;                // FK: Category.id
  description: string;               // 説明・メモ
  paymentMethod: string;             // 支払い方法 (現金、クレジット、etc)
  createdBy: string;                 // 作成者 User ID
  source: 'manual' | 'email' | 'api'; // データソース
  originalEmail: string;             // 元のメール内容 (email の場合)
  createdAt: datetime;               // 作成日時
  updatedAt: datetime;               // 更新日時
}
```

**GSI**
- `familyId-date-index`: familyId + date で検索（月次レポート用）
- `familyId-categoryId-index`: familyId + categoryId で検索（カテゴリ別集計）

#### 4. Category (カテゴリ)
```typescript
{
  id: string;                   // PK: UUID
  familyId: string;             // FK: Family.id
  name: string;                 // カテゴリ名
  type: 'income' | 'expense';   // 種別
  color: string;                // 表示色 (hex)
  icon: string;                 // アイコン名
  createdAt: datetime;          // 作成日時
  updatedAt: datetime;          // 更新日時
}
```

**デフォルトカテゴリ（初期データ）**
- 支出: 食費、光熱費、交通費、娯楽費、医療費、教育費、その他
- 収入: 給与、ボーナス、その他

**GSI**
- `familyId-index`: familyId で検索

#### 5. CategoryRule (自動分類ルール)
```typescript
{
  id: string;              // PK: UUID
  familyId: string;        // FK: Family.id
  categoryId: string;      // FK: Category.id
  keyword: string;         // マッチングキーワード
  priority: number;        // 優先度（低いほど優先）
  isActive: boolean;       // 有効/無効
  createdAt: datetime;     // 作成日時
  updatedAt: datetime;     // 更新日時
}
```

**ルール適用ロジック**
1. Transaction の description に対して、すべての CategoryRule の keyword でマッチング
2. マッチした場合、priority が最小のルールを採用
3. 該当カテゴリを自動設定

**GSI**
- `familyId-index`: familyId で検索
- `categoryId-index`: categoryId で検索

---

## 機能仕様

### Phase 1: MVP (Minimum Viable Product)

#### 1.1 ユーザー認証
- **サインアップ**
  - メールアドレス + パスワードで新規登録
  - パスワード要件: 8文字以上、大文字・小文字・数字を含む
  - メール確認コードによる認証
- **ログイン**
  - メールアドレス + パスワードでログイン
  - セッション管理（JWT Token）
- **ログアウト**
  - セッションの破棄

#### 1.2 家族グループ管理
- **グループ作成**
  - グループ名を入力して作成
  - 作成者が自動的に admin 権限で登録
- **メンバー招待**
  - メールアドレスで招待
  - 招待リンクを生成して共有
- **グループ参加**
  - 招待リンクからグループに参加
  - 参加時は member 権限

#### 1.3 収支の手動入力
- **入力フォーム**
  - 日付: デフォルトは今日
  - 種別: 収入 or 支出
  - 金額: 数値入力
  - カテゴリ: プルダウン選択
  - 説明: テキスト入力（任意）
  - 支払い方法: プルダウン選択（現金、クレジット、デビット、電子マネー）
- **バリデーション**
  - 日付: 必須
  - 金額: 必須、0より大きい数値
  - カテゴリ: 必須
- **保存処理**
  - DynamoDB に Transaction として保存
  - 自動分類ルールを適用（description にキーワードが含まれる場合）

#### 1.4 収支一覧表示
- **一覧表示**
  - 日付降順で表示
  - カード形式またはテーブル形式
  - 表示項目: 日付、種別、金額、カテゴリ、説明
- **フィルタ機能**
  - 日付範囲: 今月、先月、カスタム範囲
  - カテゴリ: 複数選択可能
  - 種別: 収入 or 支出
- **検索機能**
  - 説明文での部分一致検索
- **編集・削除**
  - 各取引の編集・削除が可能
  - 削除時は確認ダイアログ表示

#### 1.5 カテゴリ管理
- **カテゴリ一覧**
  - 収入・支出別に表示
  - カテゴリ名、色、アイコン表示
- **カテゴリ追加**
  - 名前、種別、色、アイコンを設定
- **カテゴリ編集**
  - 既存カテゴリの情報を更新
- **カテゴリ削除**
  - 使用中のカテゴリは削除不可（警告表示）
  - 未使用カテゴリのみ削除可能

#### 1.6 ルールベース自動分類
- **ルール一覧**
  - カテゴリごとにルール表示
  - キーワード、優先度、有効/無効状態
- **ルール追加**
  - カテゴリ選択
  - キーワード入力
  - 優先度設定（デフォルト: 100）
- **ルール編集・削除**
  - 既存ルールの更新・削除
- **自動分類ロジック**
  - 取引の説明文に対してキーワードマッチング
  - 複数マッチ時は優先度が低い方を採用

### Phase 2: 自動化機能

#### 2.1 メール自動取り込み
- **SESセットアップ**
  - 専用メールアドレス作成（例: `receipts@yourdomain.com`）
  - SES でメール受信設定
  - S3 バケットにメール保存
  - Lambda 関数をトリガー
- **クレジットカードメール解析**
  - 対応カード会社
    - 楽天カード
    - 三井住友カード
    - JCBカード
    - セゾンカード
    - その他主要カード
  - 解析内容
    - 利用日時
    - 利用金額
    - 利用店舗名
    - カード種別
- **自動取引記録**
  - Lambda で解析後、AppSync API 経由で DynamoDB に保存
  - source を 'email' に設定
  - originalEmail に元のメール内容を保存
  - 自動分類ルールを適用

#### 2.2 Lambda関数仕様
```typescript
// Lambda Handler
export async function handler(event: SESEvent) {
  // 1. S3からメール取得
  const email = await getEmailFromS3(event);

  // 2. メールパース
  const parsed = parseEmail(email);

  // 3. カード会社判定
  const cardType = detectCardType(parsed.from);

  // 4. 情報抽出
  const transaction = extractTransactionInfo(parsed.body, cardType);

  // 5. GraphQL Mutation で保存
  await createTransaction({
    ...transaction,
    source: 'email',
    originalEmail: email.body,
  });

  return { statusCode: 200 };
}
```

### Phase 3: レポート・分析

#### 3.1 月次サマリー
- **表示項目**
  - 今月の収入合計
  - 今月の支出合計
  - 収支（収入 - 支出）
  - 前月比（増減率）
- **月選択**
  - 月選択ドロップダウン
  - 前月・次月ボタン

#### 3.2 カテゴリ別グラフ
- **円グラフ**
  - カテゴリ別支出割合
  - 凡例表示
  - 金額とパーセンテージ表示
- **棒グラフ**
  - カテゴリ別支出金額
  - 横軸: カテゴリ、縦軸: 金額

#### 3.3 月次推移グラフ
- **折れ線グラフ**
  - 横軸: 月
  - 縦軸: 金額
  - 収入・支出・収支の3本の線
- **期間選択**
  - 過去3ヶ月、6ヶ月、12ヶ月

---

## 画面仕様

### 1. ランディングページ (`/`)
- **ヘッダー**
  - アプリ名・ロゴ
  - 「無料で始める」「ログイン」ボタン
- **ヒーローセクション**
  - キャッチコピー
  - 主要機能の説明
  - CTA ボタン
- **機能紹介セクション**
  - メール自動解析
  - AI自動分類
  - 家族で共有
- **フッター**
  - 利用規約、プライバシーポリシーへのリンク

### 2. サインアップページ (`/auth/signup`)
- **フォーム**
  - メールアドレス入力
  - パスワード入力
  - パスワード要件の表示
  - 「新規登録」ボタン
- **確認コード入力**
  - メール送信後、確認コード入力画面に遷移
  - 6桁の確認コード入力
  - 「確認」ボタン
- **エラー表示**
  - バリデーションエラー
  - API エラー

### 3. ログインページ (`/auth/signin`)
- **フォーム**
  - メールアドレス入力
  - パスワード入力
  - 「ログイン」ボタン
- **リンク**
  - 「アカウントをお持ちでない方はこちら」→ サインアップページ
  - 「パスワードを忘れた方」→ パスワードリセットページ

### 4. ダッシュボード (`/dashboard`)
- **ナビゲーション**
  - サイドバー or トップバー
  - メニュー項目
    - ダッシュボード
    - 収支一覧
    - 収支入力
    - カテゴリ管理
    - ルール管理
    - 家族グループ
    - 設定
- **サマリーカード**
  - 今月の収入
  - 今月の支出
  - 収支
- **最近の取引**
  - 直近5件の取引履歴
- **カテゴリ別支出**
  - カテゴリ別の支出一覧（上位5件）

### 5. 収支一覧ページ (`/dashboard/transactions`)
- **フィルタエリア**
  - 日付範囲選択
  - カテゴリフィルタ
  - 種別フィルタ
  - 検索ボックス
- **テーブル**
  - カラム: 日付、種別、金額、カテゴリ、説明、アクション
  - ソート機能（日付、金額）
  - ページネーション
- **アクション**
  - 編集アイコン → 編集モーダル
  - 削除アイコン → 確認ダイアログ → 削除

### 6. 収支入力ページ (`/dashboard/transactions/new`)
- **フォーム**
  - 日付ピッカー
  - 種別ラジオボタン（収入 / 支出）
  - 金額入力
  - カテゴリ選択
  - 説明入力（テキストエリア）
  - 支払い方法選択
  - 「保存」「キャンセル」ボタン
- **バリデーション**
  - リアルタイムバリデーション
  - エラーメッセージ表示

### 7. カテゴリ管理ページ (`/dashboard/categories`)
- **カテゴリ一覧**
  - 収入カテゴリセクション
  - 支出カテゴリセクション
  - 各カテゴリカード
    - カテゴリ名、色、アイコン
    - 編集・削除ボタン
- **カテゴリ追加ボタン**
  - モーダルで追加フォーム表示

### 8. ルール管理ページ (`/dashboard/rules`)
- **ルール一覧**
  - カテゴリごとにグループ化
  - 各ルール
    - キーワード、優先度、有効/無効トグル
    - 編集・削除ボタン
- **ルール追加ボタン**
  - モーダルで追加フォーム表示

### 9. 家族グループページ (`/dashboard/family`)
- **グループ情報**
  - グループ名
  - メンバー一覧（名前、メール、役割）
- **メンバー招待**
  - メールアドレス入力
  - 「招待」ボタン
  - 招待リンク生成・コピー
- **グループ設定**
  - グループ名変更
  - グループ削除（オーナーのみ）

### 10. レポートページ (`/dashboard/reports`)
- **月選択**
  - 月選択ドロップダウン
  - 前月・次月ボタン
- **サマリーカード**
  - 収入、支出、収支
  - 前月比表示
- **グラフエリア**
  - カテゴリ別円グラフ
  - カテゴリ別棒グラフ
  - 月次推移折れ線グラフ

---

## API仕様

### GraphQL スキーマ

Amplify Data の定義は `amplify/data/resource.ts` を参照。

#### Queries

```graphql
# 家族グループ取得
query GetFamily($id: ID!) {
  getFamily(id: $id) {
    id
    name
    createdAt
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

# 取引一覧取得
query ListTransactions($familyId: ID!, $filter: ModelTransactionFilterInput, $limit: Int, $nextToken: String) {
  listTransactions(familyId: $familyId, filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      date
      amount
      type
      category {
        id
        name
        color
      }
      description
      paymentMethod
      source
    }
    nextToken
  }
}

# カテゴリ一覧取得
query ListCategories($familyId: ID!) {
  listCategories(familyId: $familyId) {
    items {
      id
      name
      type
      color
      icon
    }
  }
}

# ルール一覧取得
query ListCategoryRules($familyId: ID!) {
  listCategoryRules(familyId: $familyId) {
    items {
      id
      categoryId
      category {
        name
      }
      keyword
      priority
      isActive
    }
  }
}
```

#### Mutations

```graphql
# 家族グループ作成
mutation CreateFamily($input: CreateFamilyInput!) {
  createFamily(input: $input) {
    id
    name
    createdAt
  }
}

# 取引作成
mutation CreateTransaction($input: CreateTransactionInput!) {
  createTransaction(input: $input) {
    id
    date
    amount
    type
    categoryId
    description
    paymentMethod
    source
  }
}

# 取引更新
mutation UpdateTransaction($input: UpdateTransactionInput!) {
  updateTransaction(input: $input) {
    id
    date
    amount
    type
    categoryId
    description
  }
}

# 取引削除
mutation DeleteTransaction($input: DeleteTransactionInput!) {
  deleteTransaction(input: $input) {
    id
  }
}

# カテゴリ作成
mutation CreateCategory($input: CreateCategoryInput!) {
  createCategory(input: $input) {
    id
    name
    type
    color
    icon
  }
}

# ルール作成
mutation CreateCategoryRule($input: CreateCategoryRuleInput!) {
  createCategoryRule(input: $input) {
    id
    categoryId
    keyword
    priority
    isActive
  }
}
```

#### Subscriptions

```graphql
# 取引のリアルタイム更新
subscription OnCreateTransaction($familyId: ID!) {
  onCreateTransaction(familyId: $familyId) {
    id
    date
    amount
    type
    category {
      name
      color
    }
    description
  }
}
```

---

## メール解析仕様

### 対応カード会社とメールフォーマット

#### 1. 楽天カード
- **送信元**: `mail@rakuten-card.co.jp`
- **件名**: `【楽天カード】カードご利用のお知らせ`
- **解析パターン**
```
利用日時：2024/07/04 12:34
利用金額：5,432円
利用先：スーパーマーケット
カード：楽天カード（****1234）
```

#### 2. 三井住友カード
- **送信元**: `vpass@vpass.ne.jp`
- **件名**: `【三井住友カード】ご利用のお知らせ`
- **解析パターン**
```
ご利用日：2024年7月4日
ご利用金額：5,432円
ご利用先：スーパーマーケット
```

#### 3. JCBカード
- **送信元**: `jcb-card@jcb.co.jp`
- **件名**: `【JCB】カードご利用のお知らせ`
- **解析パターン**
```
利用日：2024/07/04
利用額：5,432円
利用先：スーパーマーケット
```

### Lambda 解析ロジック

```typescript
interface ParsedTransaction {
  date: string;
  amount: number;
  description: string;
  cardType: string;
}

function parseEmail(emailBody: string, from: string): ParsedTransaction | null {
  // カード会社判定
  const cardType = detectCardType(from);

  // カード会社別解析
  switch (cardType) {
    case 'rakuten':
      return parseRakutenEmail(emailBody);
    case 'smbc':
      return parseSMBCEmail(emailBody);
    case 'jcb':
      return parseJCBEmail(emailBody);
    default:
      return null;
  }
}

function parseRakutenEmail(body: string): ParsedTransaction {
  // 正規表現でパース
  const dateMatch = body.match(/利用日時[：:]\s*(\d{4}\/\d{2}\/\d{2})/);
  const amountMatch = body.match(/利用金額[：:]\s*([\d,]+)円/);
  const shopMatch = body.match(/利用先[：:]\s*(.+)/);

  return {
    date: dateMatch?.[1] || '',
    amount: parseInt(amountMatch?.[1]?.replace(/,/g, '') || '0'),
    description: shopMatch?.[1]?.trim() || '',
    cardType: 'rakuten',
  };
}
```

### カテゴリ自動判定

店舗名キーワードからカテゴリを推測:

```typescript
const CATEGORY_KEYWORDS = {
  '食費': ['スーパー', 'コンビニ', 'ファミリーマート', 'セブンイレブン', 'ローソン', '食品'],
  '交通費': ['JR', '駅', 'タクシー', 'バス', '電車', 'Suica', 'PASMO'],
  '娯楽費': ['映画', 'カラオケ', 'ゲーム', '書店', '本屋'],
  '光熱費': ['電力', 'ガス', '水道'],
};

function suggestCategory(description: string): string | null {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => description.includes(keyword))) {
      return category;
    }
  }
  return null;
}
```

---

## セキュリティ

### 認証・認可
- **Cognito による認証**
  - JWT Token ベースの認証
  - トークン有効期限: 1時間
  - リフレッシュトークン: 30日
- **AppSync の認可**
  - COGNITO_USER_POOLS 認証モード
  - owner ベースのアクセス制御
  - 家族グループ内のデータのみアクセス可能

### データ保護
- **暗号化**
  - DynamoDB: 保存時暗号化（AWS KMS）
  - 通信: HTTPS/TLS 1.2+
- **個人情報**
  - メールアドレス、名前のみ保存
  - クレジットカード番号は保存しない
  - メール本文は originalEmail として保存（解析用）

### セキュアコーディング
- **XSS 対策**
  - React の自動エスケープを活用
  - dangerouslySetInnerHTML は使用しない
- **CSRF 対策**
  - Same-Site Cookie
  - CSRF トークン（Amplify が自動で対応）
- **SQLインジェクション対策**
  - DynamoDB（NoSQL）のため該当せず
  - GraphQL のパラメータバインディングを使用

---

## 開発ガイドライン

### コーディング規約
 - 処理を記述する際は初心者でも分かるようにコメントを添える

#### TypeScript
- **命名規則**
  - コンポーネント: PascalCase (`TransactionForm`)
  - 関数: camelCase (`createTransaction`)
  - 定数: UPPER_SNAKE_CASE (`MAX_AMOUNT`)
  - 型: PascalCase (`Transaction`, `Category`)
- **型定義**
  - any は使用禁止
  - 必ず型を明示
  - Amplify が生成する型を活用

#### React
- **コンポーネント設計**
  - 関数コンポーネント + Hooks を使用
  - Props は interface で定義
  - デフォルト Props は避ける（TypeScript の optional で対応）
- **ディレクトリ構造**
  ```
  app/
    dashboard/
      page.tsx              # ページコンポーネント
      layout.tsx            # レイアウトコンポーネント
  components/
    dashboard/
      TransactionList.tsx   # 機能別コンポーネント
    ui/
      button.tsx            # shadcn/ui コンポーネント
  lib/
    utils.ts                # ユーティリティ関数
  ```

#### CSS / Tailwind
- **ユーティリティファースト**
  - Tailwind のユーティリティクラスを優先
  - カスタム CSS は最小限に
- **レスポンシブ対応**
  - モバイルファースト
  - ブレークポイント: `sm:`, `md:`, `lg:`

### Git ワークフロー
- **ブランチ戦略**
  - `main`: 本番環境
  - `develop`: 開発環境
  - `feature/*`: 機能開発
  - `bugfix/*`: バグ修正
- **コミットメッセージ**
  - フォーマット: `<type>: <subject>`
  - type: feat, fix, docs, style, refactor, test, chore
  - 例: `feat: add transaction list page`

### テスト
- **単体テスト**
  - Jest + React Testing Library
  - コンポーネントのテスト
  - ユーティリティ関数のテスト
- **E2Eテスト**
  - Playwright (将来的)
  - 主要フローのテスト

### パフォーマンス最適化
- **Next.js 最適化**
  - Server Components を活用
  - 画像最適化（next/image）
  - フォント最適化（next/font）
- **DynamoDB 最適化**
  - GSI の適切な設計
  - Scan は避け、Query を使用
  - Pagination の実装

### デプロイ
- **Amplify Hosting**
  - Git Push で自動デプロイ
  - プレビュー環境（PR ごと）
  - 本番環境（main ブランチ）
- **環境変数**
  - Amplify Console で管理
  - `amplify_outputs.json` は自動生成

---

## 将来的な拡張機能

### Phase 4: 高度な機能
1. **予算管理**
   - カテゴリ別月次予算設定
   - 予算超過アラート（メール通知）
2. **レシート撮影・OCR**
   - スマホカメラでレシート撮影
   - Amazon Textract で OCR
   - 自動で取引記録作成
3. **銀行・カードAPI連携**
   - オープンバンキング API
   - クレジットカード会社 API
   - 自動同期
4. **AI分析・アドバイス**
   - Amazon Bedrock で支出分析
   - 節約アドバイス生成
   - 異常支出検知
5. **モバイルアプリ**
   - React Native
   - iOS / Android 対応

---

## 付録

### 参考資料
- [AWS Amplify Gen 2 ドキュメント](https://docs.amplify.aws/)
- [Next.js ドキュメント](https://nextjs.org/docs)
- [shadcn/ui ドキュメント](https://ui.shadcn.com/)
- [DynamoDB ベストプラクティス](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

### 用語集
- **MVP**: Minimum Viable Product（最小実用製品）
- **GSI**: Global Secondary Index（DynamoDB のセカンダリインデックス）
- **SES**: Amazon Simple Email Service
- **AppSync**: AWS が提供する GraphQL サービス
- **Cognito**: AWS の認証サービス
- **OCR**: Optical Character Recognition（光学文字認識）

---

**最終更新日**: 2024-07-04
**バージョン**: 1.0.0
