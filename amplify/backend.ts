import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
// import { emailProcessor } from './functions/email-processor/resource';
// import { emailBucket } from './storage/email-bucket/resource';
import { emailProcessorGmail } from './functions/email-processor-gmail/resource';
import { gmailWatchRenewal } from './functions/gmail-watch-renewal/resource';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * バックエンドリソースの定義
 *
 * - auth: ユーザー認証（Amazon Cognito）
 * - data: データストア（DynamoDB + AppSync GraphQL）
 * - emailProcessorGmail: メール自動取り込みLambda関数（Gmail API版）
 * - gmailWatchRenewal: Gmail Watch自動更新Lambda関数（毎日実行）
 *
 * 注: SES版のemailProcessorとemailBucketはGmail API版では不要のためコメントアウト
 */
export const backend = defineBackend({
  auth,
  data,
  // emailProcessor,
  // emailBucket,
  emailProcessorGmail,
  gmailWatchRenewal,
});

/**
 * Lambda関数の環境変数を設定
 *
 * Gmail API版では、SES版の環境変数設定は不要のためコメントアウト
 */

// SES版の環境変数設定（Gmail API版では不要）
// backend.emailProcessor.addEnvironment('API_ENDPOINT', backend.data.url);
// backend.emailProcessor.addEnvironment('EMAIL_BUCKET', backend.emailBucket.resources.bucket.bucketName);
// backend.emailProcessor.addEnvironment('FAMILY_ID', 'REPLACE_WITH_ACTUAL_FAMILY_ID');

/**
 * AWS Secrets Managerの設定
 *
 * Gmail API認証情報をSecrets Managerから取得するように設定します。
 * これにより、機密情報をコードに含めずに安全に管理できます。
 */

// Secrets Managerのシークレット名（リージョンとアカウントIDは自動的に解決されます）
const SECRET_NAME = 'prod/gmail-api/credentials';
const AWS_REGION = 'us-east-1';

// Lambda関数にSecrets Managerへのアクセス権限を付与
const secretsManagerPolicy = new PolicyStatement({
  actions: ['secretsmanager:GetSecretValue'],
  resources: [
    `arn:aws:secretsmanager:${AWS_REGION}:*:secret:${SECRET_NAME}*`,
  ],
});

// email-processor-gmail関数に権限を付与
backend.emailProcessorGmail.resources.lambda.addToRolePolicy(secretsManagerPolicy);

// gmail-watch-renewal関数に権限を付与
backend.gmailWatchRenewal.resources.lambda.addToRolePolicy(secretsManagerPolicy);

// Lambda関数にAppSync GraphQL APIへのアクセス権限を付与
const appsyncPolicy = new PolicyStatement({
  actions: [
    'appsync:GraphQL',
  ],
  resources: [
    `${backend.data.resources.graphqlApi.arn}/*`,
  ],
});
backend.emailProcessorGmail.resources.lambda.addToRolePolicy(appsyncPolicy);

// 環境変数を設定
// 注: AWS_REGIONはLambdaランタイムが自動的に設定するため、手動設定不要
backend.emailProcessorGmail.addEnvironment('SECRET_NAME', SECRET_NAME);
backend.emailProcessorGmail.addEnvironment('FAMILY_ID', 'bd48b63f-3299-4e4a-b8e6-319f7ea871a0');
backend.emailProcessorGmail.addEnvironment('GOOGLE_CLOUD_PROJECT_ID', 'auto-money-manager');

// Amplify Data GraphQL API IDを環境変数として設定
backend.emailProcessorGmail.addEnvironment('AMPLIFY_DATA_GRAPHQL_API_ID', backend.data.resources.graphqlApi.apiId);

backend.gmailWatchRenewal.addEnvironment('SECRET_NAME', SECRET_NAME);
backend.gmailWatchRenewal.addEnvironment('GOOGLE_CLOUD_PROJECT_ID', 'auto-money-manager');

/**
 * セットアップ手順:
 *
 * 1. AWS Secrets Managerにシークレットを作成:
 *    aws secretsmanager create-secret \
 *      --name prod/gmail-api/credentials \
 *      --description "Gmail API credentials" \
 *      --secret-string '{
 *        "GMAIL_CLIENT_ID":"YOUR_CLIENT_ID",
 *        "GMAIL_CLIENT_SECRET":"YOUR_CLIENT_SECRET",
 *        "GMAIL_REFRESH_TOKEN":"YOUR_REFRESH_TOKEN",
 *        "GOOGLE_CLOUD_PROJECT_ID":"auto-money-manager"
 *      }' \
 *      --region us-east-1
 *
 * 2. 初回認証でリフレッシュトークンを取得後、シークレットを更新:
 *    aws secretsmanager update-secret \
 *      --secret-id prod/gmail-api/credentials \
 *      --secret-string '{
 *        "GMAIL_CLIENT_ID":"YOUR_CLIENT_ID",
 *        "GMAIL_CLIENT_SECRET":"YOUR_CLIENT_SECRET",
 *        "GMAIL_REFRESH_TOKEN":"ACTUAL_REFRESH_TOKEN",
 *        "GOOGLE_CLOUD_PROJECT_ID":"auto-money-manager"
 *      }' \
 *      --region us-east-1
 *
 * 注意事項:
 * - AWS_REGIONはLambdaランタイムが自動的に設定するため、環境変数として設定不要です
 * - SECRET_NAMEとGOOGLE_CLOUD_PROJECT_IDは環境変数として明示的に設定しています
 * - FAMILY_IDは後でDynamoDBから実際の家族IDに置き換えてください
 */
