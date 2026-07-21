/**
 * Gmail APIクライアント
 *
 * Gmail APIを使用してメールを取得・操作します。
 */

import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { ParsedEmail } from '../../email-processor/parsers/types';

/**
 * Gmail APIクライアント
 */
export class GmailClient {
  private gmail: gmail_v1.Gmail;

  constructor(auth: OAuth2Client) {
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  /**
   * メッセージIDからメールの詳細を取得
   *
   * @param messageId Gmail メッセージID
   * @returns パースされたメール
   */
  async getMessage(messageId: string): Promise<ParsedEmail> {
    try {
      // メッセージの詳細を取得（format: full で完全な内容を取得）
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const message = response.data;

      if (!message.payload) {
        throw new Error('メッセージのペイロードが空です');
      }

      // ヘッダーから送信元と件名を抽出
      const headers = message.payload.headers || [];
      const from = this.getHeader(headers, 'From') || '';
      const subject = this.getHeader(headers, 'Subject') || '';
      const date = this.getHeader(headers, 'Date') || '';

      // メール本文を抽出
      const body = this.extractBody(message.payload);

      return {
        from: this.extractEmailAddress(from),
        subject,
        body,
        receivedAt: date,
      };
    } catch (error) {
      console.error('Gmail APIエラー:', error);
      throw error;
    }
  }

  /**
   * ヘッダーから特定の値を取得
   *
   * @param headers ヘッダー配列
   * @param name ヘッダー名
   * @returns ヘッダーの値
   */
  private getHeader(
    headers: gmail_v1.Schema$MessagePartHeader[],
    name: string
  ): string | undefined {
    const header = headers.find(
      h => h.name?.toLowerCase() === name.toLowerCase()
    );
    return header?.value || undefined;
  }

  /**
   * 送信元からメールアドレスを抽出
   *
   * "Name <email@example.com>" → "email@example.com"
   *
   * @param from Fromヘッダーの値
   * @returns メールアドレス
   */
  private extractEmailAddress(from: string): string {
    const match = from.match(/<([^>]+)>/);
    return match ? match[1] : from;
  }

  /**
   * メッセージペイロードから本文を抽出
   *
   * Gmail APIのメッセージは複雑な構造（マルチパート）を持つため、
   * 再帰的に探索して本文を見つけます。
   *
   * @param payload メッセージペイロード
   * @returns メール本文（プレーンテキスト）
   */
  private extractBody(payload: gmail_v1.Schema$MessagePart): string {
    // シンプルなケース: 直接bodyがある場合
    if (payload.body?.data) {
      return this.decodeBase64(payload.body.data);
    }

    // マルチパートの場合: partsを再帰的に探索
    if (payload.parts && payload.parts.length > 0) {
      for (const part of payload.parts) {
        // プレーンテキストを優先
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return this.decodeBase64(part.body.data);
        }
      }

      // プレーンテキストがない場合、HTMLから抽出
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          const html = this.decodeBase64(part.body.data);
          // 簡易的なHTMLタグ除去（実際にはライブラリを使用推奨）
          return html.replace(/<[^>]*>/g, '');
        }
      }

      // ネストされたマルチパート
      for (const part of payload.parts) {
        if (part.parts) {
          const body = this.extractBody(part);
          if (body) return body;
        }
      }
    }

    return '';
  }

  /**
   * Base64エンコードされた文字列をデコード
   *
   * Gmail APIはBase64（URL-safe）でエンコードされた本文を返します。
   *
   * @param data Base64エンコードされた文字列
   * @returns デコードされた文字列
   */
  private decodeBase64(data: string): string {
    // URL-safe Base64を通常のBase64に変換
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    // Base64デコード
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  /**
   * メッセージに既読マークを付ける
   *
   * 処理済みのメールを既読にして、受信トレイから消します。
   *
   * @param messageId Gmail メッセージID
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
      console.log(`メッセージを既読にしました: ${messageId}`);
    } catch (error) {
      console.error('既読マーク失敗:', error);
      // エラーでも処理は続行
    }
  }

  /**
   * メッセージにラベルを付ける
   *
   * 処理済みのメールに「処理済み」ラベルを付けます。
   *
   * @param messageId Gmail メッセージID
   * @param labelId ラベルID
   */
  async addLabel(messageId: string, labelId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [labelId],
        },
      });
      console.log(`ラベルを追加しました: ${messageId} → ${labelId}`);
    } catch (error) {
      console.error('ラベル追加失敗:', error);
    }
  }
}
