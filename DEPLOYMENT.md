# AWS Amplify へのデプロイガイド

このドキュメントでは、自動家計簿管理アプリを AWS Amplify Hosting にデプロイする手順を説明します。

## 📋 前提条件

- AWS アカウント
- GitHub リポジトリへのアクセス権限
- AWS Amplify の基本的な知識

## 🚀 デプロイ手順

### 1. AWS Amplify Console にアクセス

1. [AWS Amplify Console](https://console.aws.amazon.com/amplify/) を開く
2. **新しいアプリケーション** → **ホスティングされたウェブアプリケーション** をクリック

### 2. リポジトリの接続

1. **GitHub** を選択
2. GitHub アカウントで認証
3. リポジトリ: `ri927/auto-money-manager` を選択
4. ブランチ: `main` を選択
5. **次へ** をクリック

### 3. ビルド設定の確認

1. アプリケーション名: `auto-money-manager`（任意の名前）
2. 環境: `production`（または `dev`, `staging` など）
3. ビルド設定は `amplify.yml` が自動検出されます
4. **次へ** をクリック

### 4. 詳細設定

#### サービスロールの作成

初回デプロイ時は、Amplify 用のサービスロールを作成する必要があります：

1. **新しいサービスロールを作成** を選択
2. IAM コンソールが開くので、デフォルト設定でロールを作成
3. 作成したロールを Amplify Console で選択

#### 環境変数の設定（オプション）

以下の環境変数を設定できます（任意）：

| キー | 値の例 | 説明 |
|------|--------|------|
| `NEXT_PUBLIC_APP_NAME` | `自動家計簿管理アプリ` | アプリ名 |
| `NEXT_PUBLIC_APP_VERSION` | `1.0.0` | バージョン |
| `_LIVE_UPDATES` | `[{"name":"Amplify CLI","pkg":"@aws-amplify/cli","type":"npm","version":"latest"}]` | Amplify CLI の自動更新 |

### 5. デプロイの確認

1. **保存してデプロイ** をクリック
2. デプロイプロセスが開始されます（約5-10分）

デプロイフェーズ：
```
1. ✅ Provision（環境のプロビジョニング）
2. ✅ Backend（Amplify Gen 2 バックエンドのデプロイ）
   - Cognito（認証）
   - AppSync（GraphQL API）
   - DynamoDB（データベース）
3. ✅ Build（Next.js アプリのビルド）
4. ✅ Deploy（配信）
5. ✅ Verify（検証）
```

### 6. デプロイ完了

デプロイが完了すると、以下のようなURLが発行されます：

```
https://main.xxxxxxxxxxxxxx.amplifyapp.com
```

このURLにアクセスしてアプリが正常に動作することを確認してください。

## 🔧 ビルドエラーのトラブルシューティング

### エラー: "npm ERR! 404 Not Found"

**原因**: パッケージが見つからない

**解決策**:
```bash
# ローカルで依存関係を確認
npm install
npm run build
```

### エラー: "Amplify outputs not found"

**原因**: バックエンドのデプロイが失敗

**解決策**:
1. Amplify Console の **Backend environments** タブを確認
2. **Redeploy** をクリック

### エラー: "Build failed"

**原因**: TypeScript エラーまたはビルドエラー

**解決策**:
```bash
# ローカルで型チェック
npx tsc --noEmit

# ローカルでビルド
npm run build
```

## 🌐 カスタムドメインの設定

### 1. ドメインの追加

1. Amplify Console で対象アプリを選択
2. **ドメイン管理** → **ドメインを追加** をクリック
3. 所有しているドメインを入力（例: `myapp.com`）
4. DNS レコードの設定手順に従う

### 2. DNS レコードの設定

Amplify が提供する以下のレコードを、ドメインの DNS 設定に追加：

```
Type: CNAME
Name: www
Value: xxxxxxxxxxxxxx.cloudfront.net
```

### 3. SSL/TLS 証明書

Amplify が自動的に AWS Certificate Manager (ACM) で証明書を発行します（無料）。

## 🔒 セキュリティ設定

### 基本認証の有効化（オプション）

開発環境や本番前の環境を保護する場合：

1. Amplify Console → **アクセスコントロール**
2. **アクセス設定を管理** → **基本認証を有効化**
3. ユーザー名とパスワードを設定

### 環境変数の保護

機密情報は環境変数として設定し、コードにハードコーディングしない：

1. Amplify Console → **環境変数**
2. **変数を管理**
3. キーと値を追加

## 📊 モニタリング

### アクセスログ

Amplify Console → **モニタリング** → **アクセスログ**

### パフォーマンスメトリクス

- リクエスト数
- データ転送量
- エラー率
- レスポンスタイム

## 🔄 継続的デプロイメント (CI/CD)

Amplify は GitHub との連携により、自動的に CI/CD が設定されます：

1. `main` ブランチへのプッシュ → 本番環境へ自動デプロイ
2. Pull Request 作成 → プレビュー環境が自動作成
3. コミット履歴から以前のバージョンへロールバック可能

### ブランチ別環境の作成

1. Amplify Console → **アプリ設定** → **ブランチ**
2. **ブランチを接続** をクリック
3. `develop` や `staging` ブランチを選択
4. 独立した環境が作成されます

## 💰 コスト見積もり

AWS Amplify Hosting の料金（2024年7月時点）：

- **ビルド時間**: $0.01/分
- **ホスティング**: $0.15/GB（保存）+ $0.15/GB（配信）
- **無料枠**:
  - ビルド時間: 1,000分/月
  - ホスティング: 15GB 保存 + 15GB 配信/月

**月間コスト見積もり（小規模利用）**:
- ビルド: 100回 × 5分 = 500分 → $0（無料枠内）
- ホスティング: 1GB 保存 + 5GB 配信 → $0（無料枠内）

**合計: $0/月**（無料枠内で運用可能）

## 🆘 サポート

デプロイに問題がある場合：

1. [AWS Amplify ドキュメント](https://docs.amplify.aws/)
2. [GitHub Issues](https://github.com/ri927/auto-money-manager/issues)
3. [AWS サポート](https://console.aws.amazon.com/support/)

## 📝 次のステップ

- [ ] カスタムドメインの設定
- [ ] 基本認証の有効化（開発環境）
- [ ] CloudWatch によるモニタリング設定
- [ ] 複数環境（dev/staging/prod）の作成
- [ ] バックアップ戦略の策定

---

**デプロイガイド作成日**: 2026-07-18
**対象バージョン**: v1.0.0
