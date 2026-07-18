/**
 * 家族グループ関連のユーティリティ関数
 *
 * グループの作成、招待、参加などの共通処理を提供します。
 */

// Amplify Data クライアントを生成する関数
import { generateClient } from 'aws-amplify/data';

// スキーマの型定義をインポート
import type { Schema } from '@/amplify/data/resource';

// データクライアントを生成（GraphQL API との通信用）
const client = generateClient<Schema>();

/**
 * 招待トークンのペイロード型定義
 */
interface InviteTokenPayload {
  familyId: string;  // グループID
  email: string;     // 招待されるユーザーのメールアドレス
  exp: number;       // 有効期限（タイムスタンプ）
}

/**
 * 招待トークンを生成
 *
 * グループへの招待リンクに使用されるトークンを作成します。
 * トークンには、グループID、招待先メールアドレス、有効期限が含まれます。
 *
 * @param familyId - グループID
 * @param email - 招待するユーザーのメールアドレス
 * @returns Base64エンコードされた招待トークン
 */
export function generateInviteToken(familyId: string, email: string): string {
  // トークンのペイロードを作成
  // exp: 有効期限を7日後に設定（7 * 24 * 60 * 60 * 1000 ミリ秒）
  const payload: InviteTokenPayload = {
    familyId,
    email,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };

  // ペイロードをJSON文字列に変換し、Base64エンコード
  return btoa(JSON.stringify(payload));
}

/**
 * 招待トークンを検証
 *
 * 招待リンクのトークンをデコードし、有効性をチェックします。
 *
 * @param token - Base64エンコードされた招待トークン
 * @returns デコードされたグループIDとメールアドレス
 * @throws Error - トークンが無効または有効期限切れの場合
 */
export function verifyInviteToken(token: string): { familyId: string; email: string } {
  try {
    // Base64デコードしてJSON文字列に変換
    const payload: InviteTokenPayload = JSON.parse(atob(token));

    // 有効期限のチェック
    if (payload.exp < Date.now()) {
      throw new Error('招待リンクの有効期限が切れています');
    }

    // グループIDとメールアドレスを返す
    return {
      familyId: payload.familyId,
      email: payload.email,
    };
  } catch (error) {
    // デコードエラーまたはその他のエラー
    throw new Error('無効な招待リンクです');
  }
}

/**
 * ユーザーが既にグループに参加しているかチェック
 *
 * 同じグループに複数回参加するのを防ぐために使用します。
 *
 * @param familyId - グループID
 * @param userId - ユーザーID（Cognito User ID）
 * @returns 既に参加している場合は true、そうでない場合は false
 */
export async function checkExistingMember(familyId: string, userId: string): Promise<boolean> {
  try {
    // FamilyMember テーブルから、指定されたグループとユーザーの組み合わせを検索
    const { data } = await client.models.FamilyMember.list({
      filter: {
        and: [
          { familyId: { eq: familyId } },
          { userId: { eq: userId } },
        ],
      },
    });

    // データが存在する場合は true（既に参加済み）
    return data.length > 0;
  } catch (error) {
    console.error('Error checking existing member:', error);
    return false;
  }
}

/**
 * ユーザーの所属グループを取得
 *
 * ユーザーが参加しているグループの一覧を取得します。
 * 現在は最初のグループのみを返しますが、将来的に複数グループに対応可能です。
 *
 * @param userId - ユーザーID（Cognito User ID）
 * @returns ユーザーが参加しているグループ情報、参加していない場合は null
 */
export async function getUserFamily(userId: string) {
  try {
    // FamilyMember テーブルから、指定されたユーザーのレコードを取得
    const { data } = await client.models.FamilyMember.list({
      filter: {
        userId: { eq: userId },
      },
    });

    // 最初のグループを返す（複数グループ対応は将来の拡張）
    // data[0]?.family が存在しない場合は null を返す
    if (data.length === 0) {
      return null;
    }

    // FamilyMember から Family の情報を取得
    const familyMember = data[0];
    const { data: family } = await client.models.Family.get({
      id: familyMember.familyId,
    });

    return family;
  } catch (error) {
    console.error('Error getting user family:', error);
    return null;
  }
}

/**
 * デフォルトカテゴリを自動作成
 *
 * グループ作成時に、基本的なカテゴリを自動的に作成します。
 * 支出カテゴリ: 食費、光熱費、交通費、娯楽費、医療費、教育費、その他
 * 収入カテゴリ: 給与、ボーナス、その他
 *
 * @param familyId - グループID
 */
export async function createDefaultCategories(familyId: string): Promise<void> {
  // デフォルトカテゴリの定義
  const defaultCategories = [
    // 支出カテゴリ
    { name: '食費', type: 'expense' as const, color: '#f87171', icon: 'Utensils' },
    { name: '光熱費', type: 'expense' as const, color: '#60a5fa', icon: 'Zap' },
    { name: '交通費', type: 'expense' as const, color: '#a78bfa', icon: 'Car' },
    { name: '娯楽費', type: 'expense' as const, color: '#fb923c', icon: 'Film' },
    { name: '医療費', type: 'expense' as const, color: '#ec4899', icon: 'Heart' },
    { name: '教育費', type: 'expense' as const, color: '#14b8a6', icon: 'Book' },
    { name: 'その他（支出）', type: 'expense' as const, color: '#94a3b8', icon: 'MoreHorizontal' },

    // 収入カテゴリ
    { name: '給与', type: 'income' as const, color: '#22c55e', icon: 'DollarSign' },
    { name: 'ボーナス', type: 'income' as const, color: '#10b981', icon: 'TrendingUp' },
    { name: 'その他（収入）', type: 'income' as const, color: '#84cc16', icon: 'PlusCircle' },
  ];

  try {
    // 各カテゴリを作成
    await Promise.all(
      defaultCategories.map((category) =>
        client.models.Category.create({
          familyId,
          name: category.name,
          type: category.type,
          color: category.color,
          icon: category.icon,
        })
      )
    );

    console.log('Default categories created successfully');
  } catch (error) {
    console.error('Error creating default categories:', error);
    throw error;
  }
}
