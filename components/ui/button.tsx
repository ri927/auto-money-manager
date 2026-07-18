/**
 * ボタンコンポーネント
 *
 * shadcn/ui のボタンコンポーネント。
 * 様々なスタイル（variant）とサイズ（size）をサポートします。
 *
 * 使用例:
 * <Button variant="default" size="lg">クリック</Button>
 * <Button variant="outline">キャンセル</Button>
 */

// @base-ui/react: BaseUIのプリミティブコンポーネント
import { Button as ButtonPrimitive } from "@base-ui/react/button"

// class-variance-authority (cva): バリアント（スタイルの種類）を管理するライブラリ
import { cva, type VariantProps } from "class-variance-authority"

// ユーティリティ関数（クラス名を結合）
import { cn } from "@/lib/utils"

/**
 * ボタンのバリアント（スタイル定義）
 *
 * cva: Class Variance Authority - スタイルのバリエーションを定義
 * 第1引数: 基本スタイル（すべてのボタンに共通）
 * 第2引数: バリアント定義（variant と size）
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    /**
     * バリアント定義
     *
     * variants: スタイルのバリエーション
     * - variant: ボタンの種類（default, outline, ghost, など）
     * - size: ボタンのサイズ（default, sm, lg, など）
     */
    variants: {
      /**
       * variant: ボタンの見た目のスタイル
       *
       * - default: プライマリボタン（青色背景）
       * - outline: アウトラインボタン（枠線のみ）
       * - secondary: セカンダリボタン
       * - ghost: ゴーストボタン（背景透明、ホバー時に表示）
       * - destructive: 危険なアクション用（赤系）
       * - link: リンク風ボタン（下線付き）
       */
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      /**
       * size: ボタンのサイズ
       *
       * - default: 標準サイズ
       * - xs, sm, lg: 小、中、大サイズ
       * - icon, icon-xs, icon-sm, icon-lg: アイコン専用ボタン（正方形）
       */
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    /**
     * デフォルトバリアント
     *
     * variant や size が指定されない場合に使用される値
     */
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Buttonコンポーネント
 *
 * @param className - 追加のCSSクラス
 * @param variant - ボタンのスタイル（"default" | "outline" | "ghost" など）
 * @param size - ボタンのサイズ（"default" | "sm" | "lg" など）
 * @param props - その他のボタン属性（onClick, disabled など）
 */
function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    /**
     * ButtonPrimitive: BaseUIの基本ボタンコンポーネント
     *
     * data-slot: コンポーネント識別用の属性
     * className: バリアントに基づいたスタイルを適用
     * ...props: その他のプロパティを展開
     */
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

// ボタンコンポーネントとバリアント定義をエクスポート
export { Button, buttonVariants }
