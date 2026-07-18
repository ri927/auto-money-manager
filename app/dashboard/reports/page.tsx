/**
 * レポートページコンポーネント
 *
 * パス: /dashboard/reports
 * 月次サマリー、カテゴリ別グラフ、月次推移グラフなどを表示します。
 */
'use client';

// UIコンポーネント
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// アイコン
import { BarChart3 } from 'lucide-react';

/**
 * ReportsPageコンポーネント
 *
 * レポート画面を表示します（現在は準備中）。
 */
export default function ReportsPage() {
  return (
    <div className="container mx-auto p-3 md:p-6">
      {/* 準備中カード */}
      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            レポート機能
          </CardTitle>
          <CardDescription>現在準備中です</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              以下の機能を実装予定です：
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>月次サマリー（収入・支出・収支の合計）</li>
              <li>カテゴリ別支出の円グラフ</li>
              <li>カテゴリ別支出の棒グラフ</li>
              <li>月次推移の折れ線グラフ</li>
              <li>前月比・前年比の比較</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
