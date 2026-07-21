/**
 * カテゴリ自動分類ロジック
 *
 * CategoryRuleテーブルのキーワードルールを使用して、
 * 取引の説明文から適切なカテゴリを自動判定します。
 */

import { callGraphQLQuery } from '../graphql/mutations';

/**
 * 取引の説明文からカテゴリを自動判定
 *
 * ロジック:
 * 1. 有効なCategoryRuleをすべて取得
 * 2. 説明文に対してキーワードマッチング（大文字小文字を区別しない）
 * 3. 複数マッチした場合、priorityが最も小さい（優先度が高い）ルールを採用
 *
 * @param description 取引の説明文（店舗名など）
 * @param familyId 家族グループID
 * @returns カテゴリID（マッチしない場合はnull）
 */
export async function suggestCategory(
  description: string,
  familyId: string
): Promise<string | null> {
  try {
    // 1. 有効なCategoryRuleを取得
    const query = `
      query ListCategoryRules($filter: ModelCategoryRuleFilterInput) {
        listCategoryRules(filter: $filter) {
          items {
            id
            categoryId
            keyword
            priority
            isActive
          }
        }
      }
    `;

    const variables = {
      filter: {
        familyId: { eq: familyId },
        isActive: { eq: true },
      },
    };

    const data = await callGraphQLQuery(query, variables);

    const rules = data?.listCategoryRules?.items || [];

    if (rules.length === 0) {
      console.log('有効なCategoryRuleが見つかりませんでした');
      return null;
    }

    // 2. キーワードマッチング（大文字小文字を区別しない）
    const descriptionLower = description.toLowerCase();
    const matches = rules.filter(rule =>
      descriptionLower.includes(rule.keyword.toLowerCase())
    );

    if (matches.length === 0) {
      console.log(`マッチするルールが見つかりませんでした: "${description}"`);
      return null;
    }

    // 3. 優先度が最も高い（数値が小さい）ルールを選択
    const bestMatch = matches.reduce((prev, curr) =>
      (curr.priority || 100) < (prev.priority || 100) ? curr : prev
    );

    console.log(
      `カテゴリ自動分類成功: "${description}" → カテゴリID: ${bestMatch.categoryId} (キーワード: ${bestMatch.keyword})`
    );

    return bestMatch.categoryId;
  } catch (error) {
    console.error('カテゴリ自動分類中にエラーが発生しました:', error);
    return null;
  }
}

/**
 * デフォルトカテゴリキーワードマップ
 *
 * CategoryRuleがまだ設定されていない場合の基本的なマッピング。
 * 実際の運用では、ユーザーがCategoryRuleを設定することを推奨。
 */
export const DEFAULT_CATEGORY_KEYWORDS: Record<string, string[]> = {
  食費: [
    'スーパー',
    'コンビニ',
    'ファミリーマート',
    'セブンイレブン',
    'ローソン',
    'イオン',
    '西友',
    'ライフ',
    '食品',
    'レストラン',
    'カフェ',
    'マクドナルド',
    'スターバックス',
  ],
  交通費: [
    'JR',
    '駅',
    'タクシー',
    'バス',
    '電車',
    'Suica',
    'PASMO',
    'ICOCA',
    '定期',
    '回数券',
  ],
  娯楽費: [
    '映画',
    'カラオケ',
    'ゲーム',
    '書店',
    '本屋',
    'TSUTAYA',
    'アミューズメント',
    'レジャー',
  ],
  光熱費: ['電力', 'ガス', '水道', '東京電力', '東京ガス'],
  通信費: ['携帯', 'スマホ', 'ドコモ', 'au', 'ソフトバンク', 'インターネット', 'WiFi'],
  医療費: ['病院', 'クリニック', '薬局', 'ドラッグストア', '歯科'],
  教育費: ['学校', '塾', '予備校', '教材', '書籍'],
};

/**
 * デフォルトキーワードマップを使用してカテゴリを推測
 * （CategoryRuleが設定されていない初期状態での代替手段）
 *
 * @param description 取引の説明文
 * @returns カテゴリ名（マッチしない場合は'その他'）
 */
export function suggestCategoryByDefaultKeywords(
  description: string
): string {
  const descriptionLower = description.toLowerCase();

  for (const [category, keywords] of Object.entries(DEFAULT_CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => descriptionLower.includes(keyword.toLowerCase()))) {
      return category;
    }
  }

  return 'その他';
}
