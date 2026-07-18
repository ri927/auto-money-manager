/**
 * ホームページ（ランディングページ）
 *
 * パス: /
 * アプリケーションの最初に表示されるページ。
 * アプリの紹介、主要機能の説明、サインアップ/ログインへの導線を提供します。
 *
 * ログイン済みの場合は、ダッシュボードへのリンクを表示します。
 */

'use client';

// Next.jsのLinkコンポーネント（ページ遷移用）
import Link from "next/link";

// 認証コンテキストフック（ログイン状態の確認に使用）
import { useAuth } from "@/contexts/AuthContext";

// UIコンポーネント（ボタン）
import { Button } from "@/components/ui/button";

/**
 * Homeコンポーネント
 *
 * ランディングページを表示します。
 */
export default function Home() {
  // useAuth: 認証情報を取得
  const { user, loading } = useAuth();
  return (
    /**
     * 外側のコンテナ
     *
     * flex: フレックスボックスレイアウト
     * min-h-screen: 最小高さを画面全体に
     * flex-col: 縦方向に配置
     * items-center: 中央揃え（横方向）
     * justify-center: 中央揃え（縦方向）
     * bg-gradient-to-b from-blue-50 to-white: 上から下へのグラデーション背景（薄い青から白へ）
     */
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      {/*
        メインコンテンツエリア
        container: 中央揃えのコンテナ
        mx-auto: 左右のマージンを自動（中央配置）
        max-w-4xl: 最大幅を4XLサイズに制限
        gap-8: 子要素間にスペース（2rem）
        px-4: 左右にパディング（1rem）
        py-16: 上下にパディング（4rem）
        text-center: テキストを中央揃え
      */}
      <main className="container mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 py-16 text-center">
        {/*
          メインタイトル
          text-5xl: 大きいフォントサイズ（3rem）
          sm:text-6xl: 小サイズ以上の画面ではさらに大きく（3.75rem）
          font-bold: 太字
          tracking-tight: 文字間隔を狭く
        */}
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          家族で使う
          <br />
          {/* 青色でハイライトされた部分 */}
          <span className="text-blue-600">自動家計簿アプリ</span>
        </h1>

        {/* サブタイトル（アプリの説明） */}
        <p className="max-w-2xl text-lg leading-8 text-gray-600">
          クレジットカードの利用通知メールを自動で解析。
          家族みんなで収支を共有して、賢くお金を管理しましょう。
        </p>

        {/*
          CTA（Call To Action）ボタンエリア
          mt-6: 上側にマージン（1.5rem）

          ログイン状態に応じて表示を切り替え:
          - ローディング中: 「読み込み中...」
          - ログイン済み: 「ダッシュボードへ」
          - 未ログイン: 「ログイン」
        */}
        <div className="mt-6">
          {loading ? (
            // 認証状態の確認中
            <Button size="lg" className="text-lg" disabled>
              読み込み中...
            </Button>
          ) : user ? (
            // ログイン済みの場合、ダッシュボードへのリンク
            <Link href="/dashboard">
              <Button size="lg" className="text-lg">
                ダッシュボードへ
              </Button>
            </Link>
          ) : (
            // 未ログインの場合、ログインページへのリンク
            <Link href="/auth/signin">
              <Button size="lg" className="text-lg">
                ログイン
              </Button>
            </Link>
          )}
        </div>

        {/*
          機能紹介セクション（3列グリッド）
          mt-16: 上側にマージン（4rem）
          grid: グリッドレイアウト
          w-full: 幅100%
          max-w-3xl: 最大幅を3XLサイズに制限
          gap-8: グリッド間のスペース（2rem）
          sm:grid-cols-3: 小サイズ以上の画面で3列表示
        */}
        <div className="mt-16 grid w-full max-w-3xl gap-8 sm:grid-cols-3">
          {/*
            機能カード1: メール自動解析
            rounded-lg: 角を丸く
            border: ボーダー
            bg-white: 白背景
            p-6: パディング（1.5rem）
            shadow-sm: 小さいシャドウ（影）
          */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            {/* 絵文字アイコン（mb-3: 下側にマージン 0.75rem） */}
            <div className="mb-3 text-3xl">📧</div>
            {/* 機能タイトル */}
            <h3 className="mb-2 font-semibold">メール自動解析</h3>
            {/* 機能説明 */}
            <p className="text-sm text-gray-600">
              クレジットカード利用通知を自動で取り込み
            </p>
          </div>

          {/* 機能カード2: AI自動分類 */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-3 text-3xl">🤖</div>
            <h3 className="mb-2 font-semibold">AI自動分類</h3>
            <p className="text-sm text-gray-600">
              支出を自動でカテゴリ分類して管理
            </p>
          </div>

          {/* 機能カード3: 家族で共有 */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-3 text-3xl">👨‍👩‍👧‍👦</div>
            <h3 className="mb-2 font-semibold">家族で共有</h3>
            <p className="text-sm text-gray-600">
              家族全員で収支を確認・管理
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
