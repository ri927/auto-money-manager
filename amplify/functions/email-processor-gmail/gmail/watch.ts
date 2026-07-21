/**
 * Gmail Push通知（Watch）の設定
 *
 * Gmail APIのPush通知機能を使用して、新しいメールが届いたときに
 * Google Cloud Pub/Subにメッセージを送信します。
 */

import { google, gmail_v1 } from 'googleapis';

/**
 * Watch設定のレスポンス
 */
export interface WatchResponse {
  /** 履歴ID */
  historyId: string;
  /** 有効期限（ミリ秒）*/
  expiration: string;
}

/**
 * Gmail Push通知を設定
 *
 * 新しいメールが届いたときにPub/Subトピックにメッセージを送信します。
 * 有効期限は7日間で、期限切れ前に再設定が必要です。
 *
 * @param auth OAuth2クライアント
 * @param topicName Pub/Subトピックのフルネーム
 *   例: "projects/PROJECT_ID/topics/gmail-push-notifications"
 * @returns Watch設定のレスポンス
 */
export async function setupWatch(
  auth: InstanceType<typeof google.auth.OAuth2>,
  topicName: string
): Promise<WatchResponse> {
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    const response = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName,
        labelIds: ['INBOX'], // 受信トレイのメールのみ監視
        // labelFilterAction: 'include', // labelIdsに含まれるメールのみ
      },
    });

    const historyId = response.data.historyId;
    const expiration = response.data.expiration;

    if (!historyId || !expiration) {
      throw new Error('Watch設定のレスポンスが不正です');
    }

    console.log('Gmail Push通知を設定しました:', {
      historyId,
      expiration: new Date(parseInt(expiration)),
    });

    return {
      historyId,
      expiration,
    };
  } catch (error) {
    console.error('Gmail Watch設定エラー:', error);
    throw error;
  }
}

/**
 * Gmail Push通知を停止
 *
 * Push通知を無効にします。
 *
 * @param auth OAuth2クライアント
 */
export async function stopWatch(auth: InstanceType<typeof google.auth.OAuth2>): Promise<void> {
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    await gmail.users.stop({
      userId: 'me',
    });

    console.log('Gmail Push通知を停止しました');
  } catch (error) {
    console.error('Gmail Watch停止エラー:', error);
    throw error;
  }
}

/**
 * 履歴IDから新しいメッセージを取得
 *
 * 前回のhistoryIdから現在までの間に追加されたメッセージを取得します。
 * Pub/Sub通知を受け取った際に使用します。
 *
 * @param auth OAuth2クライアント
 * @param startHistoryId 開始履歴ID
 * @returns 新しいメッセージIDの配列
 */
export async function getNewMessages(
  auth: InstanceType<typeof google.auth.OAuth2>,
  startHistoryId: string
): Promise<string[]> {
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    console.log(`履歴取得開始: startHistoryId=${startHistoryId}`);

    // まず、history APIで新しいメッセージを取得
    const response = await gmail.users.history.list({
      userId: 'me',
      startHistoryId,
      historyTypes: ['messageAdded'], // 追加されたメッセージのみ
    });

    const history = response.data.history || [];
    const messageIds: string[] = [];

    // 履歴から新しいメッセージIDを抽出
    for (const record of history) {
      if (record.messagesAdded) {
        for (const added of record.messagesAdded) {
          if (added.message?.id) {
            messageIds.push(added.message.id);
          }
        }
      }
    }

    console.log(`履歴から${messageIds.length}件のメッセージを検出しました`);

    // 履歴から取得できなかった場合、最新のメッセージを直接取得
    if (messageIds.length === 0) {
      console.log('履歴から取得できなかったため、最新メールを直接取得します');
      const messagesResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 1, // 最新1件のみ取得
        labelIds: ['INBOX'],
      });

      const messages = messagesResponse.data.messages || [];
      console.log(`最新${messages.length}件のメッセージを取得しました`);

      for (const message of messages) {
        if (message.id) {
          messageIds.push(message.id);
        }
      }
    }

    console.log(`新しいメッセージを${messageIds.length}件検出しました`);
    return messageIds;
  } catch (error) {
    console.error('履歴取得エラー:', error);

    // エラー時は最新メールを直接取得してフォールバック
    try {
      console.log('エラーのため、最新メールを直接取得します');
      const messagesResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 1, // 最新1件のみ取得
        labelIds: ['INBOX'],
      });

      const messages = messagesResponse.data.messages || [];
      const messageIds: string[] = [];

      for (const message of messages) {
        if (message.id) {
          messageIds.push(message.id);
        }
      }

      console.log(`フォールバックで${messageIds.length}件のメッセージを取得しました`);
      return messageIds;
    } catch (fallbackError) {
      console.error('フォールバックも失敗:', fallbackError);
      return [];
    }
  }
}

/**
 * Watch設定の有効期限が切れているかチェック
 *
 * @param expiration 有効期限（ミリ秒）
 * @returns 期限切れの場合true
 */
export function isWatchExpired(expiration: string): boolean {
  const expirationDate = new Date(parseInt(expiration));
  const now = new Date();

  // 期限の1日前（余裕を持って再設定）
  const threshold = new Date(expirationDate.getTime() - 24 * 60 * 60 * 1000);

  return now >= threshold;
}
