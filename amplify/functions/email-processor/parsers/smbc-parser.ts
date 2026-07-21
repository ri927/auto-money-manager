import { EmailParser, ParsedEmail, TransactionData } from './types';

/**
 * 三井住友Amazonカード専用メール解析パーサー
 *
 * 対応メールフォーマット例:
 * ```
 * 件名: 【三井住友カード】ご利用のお知らせ
 * 送信元: vpass@vpass.ne.jp
 *
 * 本文:
 * ご利用日：2024年7月4日
 * ご利用金額：5,432円
 * ご利用先：Amazon.co.jp
 * カード：Amazon Mastercard (****1234)
 * ```
 */
export class SMBCParser implements EmailParser {
  /**
   * 三井住友カード（Vpass）の送信元ドメイン
   */
  private static readonly SUPPORTED_DOMAINS = [
    'vpass.ne.jp',
    'smbc-card.com',
  ];

  /**
   * 三井住友Amazonカードのメールかどうかを判定
   *
   * 判定条件:
   * 1. 送信元がVpassドメインである
   * 2. 件名または本文に「Amazon」が含まれる
   *
   * @param email パースされたメール
   * @returns 三井住友Amazonカードのメールの場合true
   */
  supports(email: ParsedEmail): boolean {
    // デバッグ用ログ
    console.log('=== SMBCParser.supports() デバッグ ===');
    console.log('From:', email.from);
    console.log('Subject:', email.subject);
    console.log('Body length:', email.body.length);
    console.log('Body preview (first 500 chars):', email.body.substring(0, 500));

    // 1. 送信元ドメインのチェック（Fromヘッダーまたは本文）
    const isFromVpass = SMBCParser.SUPPORTED_DOMAINS.some(domain =>
      email.from.toLowerCase().includes(domain)
    );
    console.log('isFromVpass:', isFromVpass);

    // 転送メールの場合、Fromヘッダーが変わることがあるため、
    // 本文に三井住友カード関連のキーワードがあるかもチェック
    const hasVpassKeyword =
      email.body.toLowerCase().includes('vpass') ||
      email.body.toLowerCase().includes('三井住友カード') ||
      email.subject.toLowerCase().includes('三井住友カード');
    console.log('hasVpassKeyword:', hasVpassKeyword);
    console.log('  - body includes vpass:', email.body.toLowerCase().includes('vpass'));
    console.log('  - body includes 三井住友カード:', email.body.toLowerCase().includes('三井住友カード'));
    console.log('  - subject includes 三井住友カード:', email.subject.toLowerCase().includes('三井住友カード'));

    // FromがVpassドメイン、または本文にVpassキーワードがある場合
    if (!isFromVpass && !hasVpassKeyword) {
      console.log('❌ Vpassチェック失敗: FromもKeywordも該当しない');
      return false;
    }

    // 2. Amazonカードであることをチェック
    // 件名または本文に「Amazon」が含まれているか確認（全角・半角両対応）
    const subjectLower = email.subject.toLowerCase();
    const bodyLower = email.body.toLowerCase();

    const containsAmazon =
      subjectLower.includes('amazon') ||
      bodyLower.includes('amazon') ||
      subjectLower.includes('ａｍａｚｏｎ') || // 全角小文字
      bodyLower.includes('ａｍａｚｏｎ') ||
      email.subject.includes('Ａｍａｚｏｎ') || // 全角（大文字小文字混在）
      email.body.includes('Ａｍａｚｏｎ') ||
      email.body.includes('ａｍａｚｏｎ'); // 全角小文字

    console.log('containsAmazon:', containsAmazon);
    console.log('  - subject includes amazon (半角):', subjectLower.includes('amazon'));
    console.log('  - body includes amazon (半角):', bodyLower.includes('amazon'));
    console.log('  - subject includes Ａｍａｚｏｎ (全角):', email.subject.includes('Ａｍａｚｏｎ'));
    console.log('  - body includes Ａｍａｚｏｎ (全角):', email.body.includes('Ａｍａｚｏｎ'));

    if (!containsAmazon) {
      console.log('❌ Amazonチェック失敗');
      return false;
    }

    console.log('✅ すべてのチェックに合格しました');
    return true;
  }

  /**
   * 三井住友Amazonカードのメールから取引データを抽出
   *
   * 抽出する情報:
   * - ご利用日: 取引日時
   * - ご利用金額: 金額
   * - ご利用先: 店舗名（通常はAmazon.co.jpなど）
   *
   * @param email パースされたメール
   * @returns 抽出された取引データ、パース失敗時はnull
   */
  parse(email: ParsedEmail): TransactionData | null {
    const body = email.body;

    try {
      console.log('=== SMBCParser.parse() デバッグ ===');
      console.log('Body preview:', body.substring(0, 1000));

      // 1. 利用日を抽出（複数のパターンに対応）
      // パターン1: "ご利用日時：2026/07/19 15:51" (スラッシュ区切り＋時刻)
      // パターン2: "ご利用日：2024年7月4日" (年月日形式)
      let dateMatch = body.match(/ご利用日時[：:]\s*(\d{4})\/(\d{1,2})\/(\d{1,2})/);
      if (!dateMatch) {
        dateMatch = body.match(/ご利用日[：:]\s*(\d{4})年(\d{1,2})月(\d{1,2})日/);
      }

      // 2. 利用金額を抽出（複数のパターンに対応）
      // パターン1: "6,980円" (行の後ろに金額のみ)
      // パターン2: "ご利用金額：5,432円"
      let amountMatch = body.match(/([\d,]+)円/);
      if (!amountMatch) {
        amountMatch = body.match(/ご利用金額[：:]\s*([\d,]+)円/);
      }

      // 3. 利用先を抽出（複数のパターンに対応）
      // パターン1: "Mastercard加盟店（買物）"
      // パターン2: "ご利用先：Amazon.co.jp"
      let merchantMatch = body.match(/(Mastercard加盟店[^円\n]+)/);
      if (!merchantMatch) {
        merchantMatch = body.match(/ご利用先[：:]\s*(.+?)(?:\n|$)/);
      }

      console.log('dateMatch:', dateMatch);
      console.log('amountMatch:', amountMatch);
      console.log('merchantMatch:', merchantMatch);

      // 必須フィールドのチェック
      if (!dateMatch || !amountMatch) {
        console.error('SMBCParser: 日付または金額が見つかりませんでした');
        console.error('  dateMatch:', dateMatch);
        console.error('  amountMatch:', amountMatch);
        return null;
      }

      // 日付をISO 8601形式に変換
      const year = dateMatch[1];
      const month = dateMatch[2].padStart(2, '0');
      const day = dateMatch[3].padStart(2, '0');
      const date = `${year}-${month}-${day}T12:00:00Z`;

      // 金額をパース（カンマを除去して数値化）
      const amount = parseInt(amountMatch[1].replace(/,/g, ''), 10);

      // 店舗名を取得（見つからない場合はデフォルト値）
      const description = merchantMatch?.[1]?.trim() || 'Amazon';

      return {
        date,
        amount,
        description,
        paymentMethod: 'credit',
        type: 'expense', // クレジットカード利用通知は支出
      };
    } catch (error) {
      console.error('SMBCParser: メール解析中にエラーが発生しました', error);
      return null;
    }
  }
}
