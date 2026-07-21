import { ParsedEmail } from '../parsers/types';

/**
 * 生のメール文字列を解析してParsedEmail形式に変換
 *
 * SESから受け取る生のメールデータには、ヘッダーと本文が含まれています。
 * このユーティリティは、ヘッダーから送信元と件名を抽出し、
 * 本文を取り出します。
 *
 * @param rawEmail 生のメールデータ（文字列）
 * @returns パースされたメールオブジェクト
 */
export function parseEmail(rawEmail: string): ParsedEmail {
  // メールをヘッダー部分と本文部分に分割
  // メールは通常、ヘッダーと本文の間に空行がある
  const parts = rawEmail.split(/\r?\n\r?\n/);
  const headers = parts[0] || '';
  const body = parts.slice(1).join('\n\n');

  // 送信元メールアドレスを抽出
  // パターン: "From: sender@example.com" または "From: Name <sender@example.com>"
  const fromMatch = headers.match(/^From:\s*(.+?)(?:\r?\n|$)/im);
  let from = fromMatch?.[1] || '';

  // メールアドレスが <> で囲まれている場合は抽出
  const emailMatch = from.match(/<([^>]+)>/);
  if (emailMatch) {
    from = emailMatch[1];
  }

  // 件名を抽出
  // パターン: "Subject: メール件名"
  const subjectMatch = headers.match(/^Subject:\s*(.+?)(?:\r?\n|$)/im);
  const subject = subjectMatch?.[1] || '';

  // 受信日時を抽出（オプション）
  const dateMatch = headers.match(/^Date:\s*(.+?)(?:\r?\n|$)/im);
  const receivedAt = dateMatch?.[1];

  return {
    from: from.trim(),
    subject: subject.trim(),
    body: body.trim(),
    receivedAt,
  };
}

/**
 * S3からメールを取得
 *
 * SESはメールをS3に保存します。このユーティリティは、
 * S3バケットからメールの生データを取得します。
 *
 * @param bucket S3バケット名
 * @param key S3オブジェクトキー（メールID）
 * @returns 生のメールデータ
 */
export async function fetchEmailFromS3(
  bucket: string,
  key: string
): Promise<string> {
  // TODO: 実装時にAWS SDKをインポート
  // import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

  try {
    // S3クライアントの作成
    // const s3Client = new S3Client({});

    // メールデータを取得
    // const response = await s3Client.send(
    //   new GetObjectCommand({
    //     Bucket: bucket,
    //     Key: key,
    //   })
    // );

    // ストリームを文字列に変換
    // const bodyStream = response.Body;
    // const bodyString = await bodyStream?.transformToString();

    // return bodyString || '';

    // 仮実装（実際にはS3から取得）
    console.warn('fetchEmailFromS3: 仮実装です。実際にはS3から取得する必要があります');
    return '';
  } catch (error) {
    console.error('S3からのメール取得に失敗しました:', error);
    throw error;
  }
}
