import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* パフォーマンス最適化設定 */

  // 本番環境でReactのStrict Modeを無効化（パフォーマンス向上）
  reactStrictMode: true,

  // 画像最適化設定
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // ビルド時の最適化
  compiler: {
    // 本番環境でconsole.logを削除
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // 実験的機能: 最適化オプション
  experimental: {
    // CSS最適化
    optimizeCss: true,
    // スクロール復元の改善
    scrollRestoration: true,
  },
};

export default nextConfig;
