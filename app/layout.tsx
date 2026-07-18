/**
 * ルートレイアウトコンポーネント
 *
 * アプリケーション全体の最上位レイアウト。
 * すべてのページで共通のHTML構造、フォント、メタデータを定義します。
 *
 * Next.js App Router の layout.tsx: アプリケーション全体に適用される親レイアウト
 */

// Next.jsのメタデータ型をインポート
import type { Metadata } from "next";

// Google Fonts からフォントをインポート（next/font で最適化）
// Geist: サンセリフフォント（通常テキスト用）
// Geist_Mono: 等幅フォント（コード表示用）
import { Geist, Geist_Mono } from "next/font/google";

// グローバルCSSをインポート（Tailwind CSSの設定など）
import "./globals.css";

// 認証などのContextプロバイダーをまとめたコンポーネント
// Amplifyの設定はProvidersコンポーネント内で行われます
import { Providers } from "@/components/providers/Providers";

/**
 * Geist サンセリフフォントの設定
 *
 * variable: CSS変数名（--font-geist-sans）
 * subsets: フォントのサブセット（latin: ラテン文字のみ）
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Geist 等幅フォントの設定
 *
 * 主にコードブロックやプログラミング関連のテキスト表示に使用
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * メタデータのエクスポート
 *
 * Next.js が自動的にHTMLの<head>タグ内に出力します。
 * SEO（検索エンジン最適化）に重要な情報です。
 */
export const metadata: Metadata = {
  title: "家計簿アプリ | Auto Money Manager",           // ブラウザのタブに表示されるタイトル
  description: "家族で共有できる自動家計簿管理アプリ",  // 検索結果に表示される説明文
};

/**
 * RootLayoutコンポーネント
 *
 * @param children - 子ページのコンポーネント
 *                   Next.jsが各ページのコンテンツを自動的に渡します
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /**
     * html要素
     *
     * lang="ja": 日本語ページであることを宣言（アクセシビリティとSEOに重要）
     * className: フォント変数とスタイルを適用
     *   - geistSans.variable, geistMono.variable: CSS変数を登録
     *   - antialiased: フォントのアンチエイリアス（滑らかな表示）
     */
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      {/*
        body要素
        children: 各ページのコンテンツがここに表示される
      */}
      <body>
        {/* Providersで囲むことで、認証状態などをアプリ全体で共有 */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
