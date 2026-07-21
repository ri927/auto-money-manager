/**
 * メール解析で使用する型定義
 */

/**
 * パースされたメールの基本構造
 */
export interface ParsedEmail {
  /** 送信元メールアドレス */
  from: string;
  /** 件名 */
  subject: string;
  /** メール本文 */
  body: string;
  /** メール受信日時 */
  receivedAt?: string;
}

/**
 * 抽出された取引データ
 */
export interface TransactionData {
  /** 取引日時（ISO 8601形式） */
  date: string;
  /** 金額（正の数値、支出の場合も正） */
  amount: number;
  /** 説明・店舗名など */
  description: string;
  /** 支払い方法 */
  paymentMethod: string;
  /** 取引種別 */
  type: 'income' | 'expense';
}

/**
 * カード種別
 */
export type CardType = 'smbc' | 'rakuten' | 'jcb' | 'saison' | 'unknown';

/**
 * メールパーサーインターフェース
 * 各カード会社のパーサーはこのインターフェースを実装する
 */
export interface EmailParser {
  /**
   * メールをパースして取引データを抽出
   * @param email パースされたメール
   * @returns 抽出された取引データ、パース失敗時はnull
   */
  parse(email: ParsedEmail): TransactionData | null;

  /**
   * このパーサーがサポートするメールかどうかを判定
   * @param email パースされたメール
   * @returns サポートする場合はtrue
   */
  supports(email: ParsedEmail): boolean;
}
