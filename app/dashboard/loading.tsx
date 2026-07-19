/**
 * ダッシュボードローディングコンポーネント
 *
 * Next.jsのストリーミング機能で使用される。
 * ページのデータ取得中に表示されるローディング UI。
 */

export default function DashboardLoading() {
  return (
    <div className="container mx-auto p-2 md:p-6 space-y-1 md:space-y-2">
      {/* カレンダースケルトン */}
      <div className="bg-white rounded-lg p-4 shadow-sm animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>

      {/* 統計カードスケルトン */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-1 md:gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded p-1.5 md:rounded-lg md:p-4 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </div>

      {/* カードスケルトン（デスクトップのみ） */}
      <div className="hidden md:grid md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
            <div className="border-b bg-gray-50/50 p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
