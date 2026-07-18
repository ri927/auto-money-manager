import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // 家族グループ
  Family: a
    .model({
      name: a.string().required(),
      members: a.hasMany('FamilyMember', 'familyId'),
      transactions: a.hasMany('Transaction', 'familyId'),
      categories: a.hasMany('Category', 'familyId'),
      categoryRules: a.hasMany('CategoryRule', 'familyId'),
      recurringTransactions: a.hasMany('RecurringTransaction', 'familyId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // 家族メンバー
  FamilyMember: a
    .model({
      familyId: a.id().required(),
      family: a.belongsTo('Family', 'familyId'),
      userId: a.string().required(),
      email: a.email().required(),
      name: a.string(),
      role: a.enum(['admin', 'member']),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // 取引記録
  Transaction: a
    .model({
      familyId: a.id().required(),
      family: a.belongsTo('Family', 'familyId'),
      date: a.datetime().required(),
      amount: a.float().required(),
      type: a.enum(['income', 'expense']),
      categoryId: a.id(),
      category: a.belongsTo('Category', 'categoryId'),
      description: a.string(),
      paymentMethod: a.string(),
      createdBy: a.string(),
      source: a.enum(['manual', 'email', 'api']),
      originalEmail: a.string(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  // カテゴリ
  Category: a
    .model({
      familyId: a.id().required(),
      family: a.belongsTo('Family', 'familyId'),
      name: a.string().required(),
      type: a.enum(['income', 'expense']),
      color: a.string(),
      icon: a.string(),
      transactions: a.hasMany('Transaction', 'categoryId'),
      recurringTransactions: a.hasMany('RecurringTransaction', 'categoryId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  // カテゴリ自動分類ルール
  CategoryRule: a
    .model({
      familyId: a.id().required(),
      family: a.belongsTo('Family', 'familyId'),
      categoryId: a.id().required(),
      keyword: a.string().required(),
      priority: a.integer(),
      isActive: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  // 繰り返し取引テンプレート
  RecurringTransaction: a
    .model({
      familyId: a.id().required(),
      family: a.belongsTo('Family', 'familyId'),

      // 基本情報
      name: a.string().required(), // 繰り返し取引の名前 (例: "Netflix サブスク")
      description: a.string(), // 説明

      // 取引情報
      amount: a.float().required(), // 金額
      type: a.enum(['income', 'expense']), // 種別
      categoryId: a.id(),
      category: a.belongsTo('Category', 'categoryId'),
      paymentMethod: a.string(), // 支払い方法

      // 繰り返し設定
      frequency: a.enum(['daily', 'weekly', 'monthly', 'yearly']), // 頻度
      interval: a.integer().default(1), // 間隔（例: 2 = 2ヶ月ごと）
      dayOfMonth: a.integer(), // 月の何日か (monthly/yearly用、1-31)
      dayOfWeek: a.integer(), // 曜日 (weekly用、0=日曜, 6=土曜)

      // 開始・終了日
      startDate: a.date().required(), // 開始日
      endDate: a.date(), // 終了日（null = 無期限）

      // 次回実行日（自動計算）
      nextExecutionDate: a.date().required(),

      // ステータス
      isActive: a.boolean().default(true), // 有効/一時停止

      // メタデータ
      createdBy: a.string(),
      lastExecutedAt: a.datetime(), // 最後に実行された日時
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
