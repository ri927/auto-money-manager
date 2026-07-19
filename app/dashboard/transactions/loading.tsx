/**
 * 収支一覧ページローディングコンポーネント
 */

export default function TransactionsLoading() {
  return (
    <div className="space-y-3 md:space-y-4">
      {/* ボタンスケルトン */}
      <div className="flex justify-end">
        <div className="h-9 md:h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* リストスケルトン */}
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-white border rounded-lg p-3 md:p-4 shadow-sm animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-48"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
