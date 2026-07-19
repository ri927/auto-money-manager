/**
 * メニューページローディングコンポーネント
 */

export default function MenuLoading() {
  return (
    <div className="container mx-auto p-3 md:p-6 space-y-3 md:space-y-6">
      {/* メニュー項目スケルトン */}
      <div className="space-y-3 md:space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border rounded-lg p-3 md:p-4 shadow-sm animate-pulse">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ログアウトボタンスケルトン */}
      <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
    </div>
  );
}
