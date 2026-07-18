import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';
import { Button } from './button';

const meta = {
  component: Card,
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 基本的なカード
 * タイトル、説明、コンテンツ、フッターを含む完全な例
 */
export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>カードタイトル</CardTitle>
        <CardDescription>カードの説明文がここに入ります</CardDescription>
      </CardHeader>
      <CardContent>
        <p>カードのメインコンテンツです。重要な情報を表示します。</p>
      </CardContent>
      <CardFooter>
        <Button>アクション</Button>
      </CardFooter>
    </Card>
  )
};

/**
 * シンプルなカード
 * タイトルとコンテンツのみ
 */
export const Simple: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>シンプルカード</CardTitle>
      </CardHeader>
      <CardContent>
        <p>必要最小限の構成のカードです。</p>
      </CardContent>
    </Card>
  ),
};

/**
 * フッター付きカード
 * 複数のアクションボタンを含む
 */
export const WithFooter: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>アクション付きカード</CardTitle>
        <CardDescription>複数のアクションを選択できます</CardDescription>
      </CardHeader>
      <CardContent>
        <p>カードの内容がここに表示されます。</p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button>保存</Button>
        <Button variant="outline">キャンセル</Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * 小サイズのカード
 */
export const Small: Story = {
  render: () => (
    <Card size="sm">
      <CardHeader>
        <CardTitle>小さいカード</CardTitle>
      </CardHeader>
      <CardContent>
        <p>コンパクトなカードです。</p>
      </CardContent>
    </Card>
  ),
};
