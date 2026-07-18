/**
 * Amplifyクライアント設定ファイル
 *
 * このファイルはクライアントサイド（ブラウザ上）でAWS Amplifyを使用するための設定を行います。
 * AWS Amplifyは、認証やデータベースなどのバックエンド機能を簡単に利用できるサービスです。
 */

'use client';

// AWS Amplifyのメインライブラリをインポート
import { Amplify } from 'aws-amplify';

// Amplifyの設定情報（API エンドポイントや認証設定など）を読み込む
// @/は プロジェクトのルートディレクトリを指すエイリアスです
import outputs from '@/amplify_outputs.json';

/**
 * Amplifyの初期設定を実行
 *
 * outputs: バックエンドの設定情報（自動生成されたJSON）
 */
Amplify.configure(outputs);

// 設定済みのAmplifyオブジェクトを他のファイルでも使えるようにエクスポート
export { Amplify };
