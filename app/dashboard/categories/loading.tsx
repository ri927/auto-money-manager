/**
 * カテゴリ管理ページローディングコンポーネント
 */

export default function CategoriesLoading() {
  return (
    <div className="space-y-3 md:space-y-4">
      {/* ボタンスケルトン */}
      <div className="flex justify-end">
        <div className="h-9 md:h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* グリッドスケルトン */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white border rounded-lg p-4 shadow-sm animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 bg-gray-200 rounded flex-1"></div>
              <div className="h-8 bg-gray-200 rounded flex-1"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
