/**
 * 既存カテゴリのアイコンを更新するマイグレーションスクリプト
 *
 * 使い方:
 * npx tsx scripts/update-category-icons.ts
 */

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';

// Amplifyの設定
Amplify.configure(outputs);

const client = generateClient<Schema>();

/**
 * カテゴリ名からアイコン名を取得
 */
function getIconByName(name: string): string {
  const iconMap: Record<string, string> = {
    '食費': 'Utensils',
    '光熱費': 'Zap',
    '交通費': 'Car',
    '娯楽費': 'Film',
    '医療費': 'Heart',
    '教育費': 'Book',
    'その他（支出）': 'MoreHorizontal',
    '給与': 'DollarSign',
    'ボーナス': 'TrendingUp',
    'その他（収入）': 'PlusCircle',
  };

  return iconMap[name] || 'MoreHorizontal';
}

/**
 * メイン処理
 */
async function main() {
  try {
    console.log('📝 既存カテゴリのアイコンを更新します...\n');

    // すべてのカテゴリを取得
    const { data: categories, errors } = await client.models.Category.list();

    if (errors) {
      throw new Error('カテゴリの取得に失敗しました');
    }

    console.log(`✅ ${categories.length}件のカテゴリを取得しました\n`);

    // 各カテゴリのアイコンを更新
    let updatedCount = 0;
    let skippedCount = 0;

    for (const category of categories) {
      const newIcon = getIconByName(category.name);
      const currentIcon = category.icon || '';

      // 既に正しいアイコンが設定されている場合はスキップ
      if (currentIcon === newIcon) {
        console.log(`⏭️  スキップ: ${category.name} (既に ${newIcon} が設定済み)`);
        skippedCount++;
        continue;
      }

      // アイコンを更新
      const { errors: updateErrors } = await client.models.Category.update({
        id: category.id,
        icon: newIcon,
      });

      if (updateErrors) {
        console.error(`❌ エラー: ${category.name} の更新に失敗しました`, updateErrors);
        continue;
      }

      console.log(`✨ 更新: ${category.name} (${currentIcon || 'なし'} → ${newIcon})`);
      updatedCount++;
    }

    console.log('\n📊 更新結果:');
    console.log(`   更新: ${updatedCount}件`);
    console.log(`   スキップ: ${skippedCount}件`);
    console.log(`   合計: ${categories.length}件`);
    console.log('\n✅ マイグレーション完了！');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトを実行
main();
