import { defineAuth } from '@aws-amplify/backend';

/**
 * 認証設定
 *
 * 個人使用のため、自己サインアップを無効化しています。
 * ユーザーはAWS Cognitoコンソールで管理者が事前に作成したアカウントのみを使用できます。
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
    familyName: {
      required: false,
      mutable: true,
    },
    givenName: {
      required: false,
      mutable: true,
    },
  },
  // 自己サインアップを無効化（管理者のみがユーザーを作成可能）
  accountRecovery: 'EMAIL_ONLY',
});
