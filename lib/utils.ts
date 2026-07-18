/**
 * ユーティリティ関数集
 *
 * プロジェクト全体で使われる汎用的な便利関数をまとめたファイルです。
 */

// clsx: 条件付きでクラス名を結合するライブラリ
// ClassValue: clsxが受け付けるクラス名の型定義
import { clsx, type ClassValue } from "clsx"

// tailwind-merge: Tailwind CSSのクラス名を賢く結合するライブラリ
// 重複するスタイルを自動的に解決してくれます
import { twMerge } from "tailwind-merge"

/**
 * クラス名を結合するユーティリティ関数（cn = classnames の略）
 *
 * @param inputs - 結合したいクラス名（文字列、配列、オブジェクトなど）
 * @returns 最適化されたクラス名の文字列
 *
 * 使用例:
 * cn('px-2 py-1', 'bg-blue-500') → 'px-2 py-1 bg-blue-500'
 * cn('px-2', condition && 'px-4') → condition が true なら 'px-4'（後の方が優先）
 *
 * 機能:
 * 1. clsx で条件付きクラス名を処理
 * 2. twMerge で Tailwind の競合を解決（例: 'px-2 px-4' → 'px-4'）
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
