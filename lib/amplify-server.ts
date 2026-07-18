/**
 * Amplifyサーバー設定ファイル
 *
 * このファイルはサーバーサイド（Next.jsのServer Components や API Routes）で
 * AWS Amplifyを使用するための設定を行います。
 */

// Next.js専用のAmplifyアダプターから、サーバーランナー作成関数をインポート
import { createServerRunner } from '@aws-amplify/adapter-nextjs';

// Amplifyの設定情報を読み込む（クライアント側と同じ設定を使用）
import outputs from '@/amplify_outputs.json';

/**
 * サーバーサイドでAmplifyを使うためのコンテキストランナーを作成
 *
 * runWithAmplifyServerContext: この関数を使うことで、サーバーサイドのコードから
 * Amplifyの機能（認証状態の確認、データベースへのアクセスなど）を安全に実行できます
 *
 * 使用例:
 * const result = await runWithAmplifyServerContext({
 *   nextServerContext: { cookies },
 *   operation: (contextSpec) => getCurrentUser(contextSpec)
 * });
 */
export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs,
});
