/**
 * GraphQL Mutation操作
 *
 * Lambda関数からAppSync GraphQL APIを通じて
 * DynamoDBに取引データを保存します。
 */

import { SignatureV4 } from '@aws-sdk/signature-v4';
import { Sha256 } from '@aws-crypto/sha256-js';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

// Amplify設定（Lambda環境変数から取得）
const graphqlApiId = process.env.AMPLIFY_DATA_GRAPHQL_API_ID;
const region = process.env.AWS_REGION || 'us-east-1';

if (!graphqlApiId) {
  throw new Error('AMPLIFY_DATA_GRAPHQL_API_ID environment variable is not set');
}

// AppSync GraphQLエンドポイントURLを構築
const graphqlEndpoint = `https://${graphqlApiId}.appsync-api.${region}.amazonaws.com/graphql`;

console.log('GraphQL設定:', {
  endpoint: graphqlEndpoint,
  region,
  apiId: graphqlApiId,
});

/**
 * AppSync GraphQL APIにIAM認証でリクエストを送信
 */
async function callGraphQL(query: string, variables: Record<string, any>): Promise<any> {
  const endpoint = new URL(graphqlEndpoint);

  const requestBody = JSON.stringify({
    query,
    variables,
  });

  const request = new HttpRequest({
    method: 'POST',
    protocol: endpoint.protocol,
    hostname: endpoint.hostname,
    path: endpoint.pathname,
    headers: {
      'Content-Type': 'application/json',
      host: endpoint.hostname,
    },
    body: requestBody,
  });

  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region,
    service: 'appsync',
    sha256: Sha256,
  });

  const signedRequest = await signer.sign(request);

  const response = await fetch(graphqlEndpoint, {
    method: 'POST',
    headers: signedRequest.headers,
    body: requestBody,
  });

  const result = await response.json();

  if (result.errors) {
    console.error('GraphQLエラー:', JSON.stringify(result.errors, null, 2));
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

/**
 * GraphQL Queryを実行（外部からも使用可能）
 */
export async function callGraphQLQuery(query: string, variables: Record<string, any> = {}): Promise<any> {
  return callGraphQL(query, variables);
}

/**
 * 取引作成用の入力データ型
 */
export interface CreateTransactionInput {
  /** 家族グループID */
  familyId: string;
  /** 取引日時（ISO 8601形式） */
  date: string;
  /** 金額 */
  amount: number;
  /** 取引種別 */
  type: 'income' | 'expense';
  /** カテゴリID（オプション、自動分類できなかった場合はnull） */
  categoryId: string | null;
  /** 説明・店舗名 */
  description: string;
  /** 支払い方法 */
  paymentMethod: string;
  /** データソース（メール自動取り込みの場合は'email'） */
  source: 'manual' | 'email' | 'api';
  /** 元のメール内容（sourceが'email'の場合のみ） */
  originalEmail?: string;
  /** 作成者（メール自動取り込みの場合はシステムユーザー） */
  createdBy: string;
}

/**
 * 取引をDynamoDBに作成
 *
 * @param input 取引データ
 * @returns 作成された取引のID
 * @throws エラーが発生した場合
 */
export async function createTransaction(
  input: CreateTransactionInput
): Promise<string> {
  try {
    const mutation = `
      mutation CreateTransaction($input: CreateTransactionInput!) {
        createTransaction(input: $input) {
          id
          familyId
          date
          amount
          type
          categoryId
          description
          paymentMethod
          source
          createdBy
          createdAt
          updatedAt
        }
      }
    `;

    const variables = {
      input: {
        familyId: input.familyId,
        date: input.date,
        amount: input.amount,
        type: input.type,
        categoryId: input.categoryId,
        description: input.description,
        paymentMethod: input.paymentMethod,
        source: input.source,
        originalEmail: input.originalEmail,
        createdBy: input.createdBy,
      },
    };

    console.log('GraphQL Mutation実行:', JSON.stringify(variables, null, 2));

    const data = await callGraphQL(mutation, variables);

    if (!data || !data.createTransaction) {
      throw new Error('取引データがnullです');
    }

    console.log(`取引が正常に作成されました: ID=${data.createTransaction.id}`);
    return data.createTransaction.id;
  } catch (error) {
    console.error('取引作成中にエラーが発生しました:', error);
    throw error;
  }
}

/**
 * 取引を更新
 *
 * メール解析後に手動で修正が必要な場合などに使用
 *
 * @param id 取引ID
 * @param updates 更新内容
 * @returns 更新された取引のID
 */
export async function updateTransaction(
  id: string,
  updates: Partial<CreateTransactionInput>
): Promise<string> {
  try {
    const mutation = `
      mutation UpdateTransaction($input: UpdateTransactionInput!) {
        updateTransaction(input: $input) {
          id
          updatedAt
        }
      }
    `;

    const variables = {
      input: {
        id,
        ...updates,
      },
    };

    await callGraphQL(mutation, variables);

    console.log(`取引が正常に更新されました: ID=${id}`);
    return id;
  } catch (error) {
    console.error('取引更新中にエラーが発生しました:', error);
    throw error;
  }
}
