/**
 * 設定ページコンポーネント
 *
 * パス: /dashboard/settings
 * アプリの設定を管理します。
 */
'use client';

// UIコンポーネント
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// アイコン
import { Settings } from 'lucide-react';

/**
 * SettingsPageコンポーネント
 *
 * 設定画面を表示します（現在は準備中）。
 */
export default function SettingsPage() {
  return (
    <div className="container mx-auto p-3 md:p-6">
      {/* 準備中カード */}
      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            設定機能
          </CardTitle>
          <CardDescription>現在準備中です</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              以下の機能を実装予定です：
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>プロフィール設定（名前、メールアドレス）</li>
              <li>パスワード変更</li>
              <li>通知設定（メール通知の有効/無効）</li>
              <li>テーマ設定（ライト/ダークモード）</li>
              <li>言語設定</li>
              <li>データエクスポート</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
