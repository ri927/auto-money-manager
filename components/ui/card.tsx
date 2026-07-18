/**
 * カードコンポーネント
 *
 * shadcn/ui のカードコンポーネント群。
 * 情報をまとめて表示するためのコンテナとして使用します。
 *
 * 構成コンポーネント:
 * - Card: カードのコンテナ
 * - CardHeader: ヘッダー部分（タイトルと説明）
 * - CardTitle: タイトル
 * - CardDescription: 説明文
 * - CardContent: メインコンテンツ
 * - CardFooter: フッター部分
 * - CardAction: アクション（ボタンなど）
 *
 * 使用例:
 * <Card>
 *   <CardHeader>
 *     <CardTitle>タイトル</CardTitle>
 *     <CardDescription>説明文</CardDescription>
 *   </CardHeader>
 *   <CardContent>コンテンツ</CardContent>
 *   <CardFooter>フッター</CardFooter>
 * </Card>
 */

import * as React from "react"

// ユーティリティ関数（クラス名を結合）
import { cn } from "@/lib/utils"

/**
 * Cardコンポーネント（親コンテナ）
 *
 * @param className - 追加のCSSクラス
 * @param size - カードのサイズ（"default" | "sm"）
 * @param props - その他のdiv属性
 */
function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className
      )}
      {...props}
    />
  )
}

/**
 * CardHeaderコンポーネント
 *
 * カードのヘッダー部分。タイトルと説明を含みます。
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

/**
 * CardTitleコンポーネント
 *
 * カードのタイトル。太字で目立つように表示されます。
 */
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * CardDescriptionコンポーネント
 *
 * カードの説明文。タイトルの下に小さめのテキストで表示されます。
 */
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

/**
 * CardActionコンポーネント
 *
 * カードのアクション部分（ボタンなど）。
 * ヘッダーの右側に配置されます。
 */
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * CardContentコンポーネント
 *
 * カードのメインコンテンツ部分。
 * 主要な情報を表示します。
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

/**
 * CardFooterコンポーネント
 *
 * カードのフッター部分。
 * アクションボタンや補足情報を配置します。
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

// すべてのカード関連コンポーネントをエクスポート
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
