import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from './button';

const meta = {
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * デフォルトボタン - プライマリアクション用
 */
export const Default: Story = {
  args: { children: 'デフォルトボタン' },
};

export const Primary: Story = {
  args: { children: 'プライマリボタン' },
};

export const Outline: Story = {
  args: { children: 'アウトライン', variant: 'outline' },
};

export const Secondary: Story = {
  args: { children: 'セカンダリ', variant: 'secondary' },
};

export const Ghost: Story = {
  args: { children: 'ゴースト', variant: 'ghost' },
};

export const Destructive: Story = {
  args: { children: '削除', variant: 'destructive' },
};

export const Link: Story = {
  args: { children: 'リンク風', variant: 'link' },
};

export const Small: Story = {
  args: { children: '小さいボタン', size: 'sm' },
};

export const Large: Story = {
  args: { children: '大きいボタン', size: 'lg' },
};

export const Disabled: Story = {
  args: { children: '無効ボタン', disabled: true },
};

/**
 * すべてのバリアントを表示
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button>Default</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
      </div>
      <div className="flex gap-2">
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
      </div>
      <div className="flex gap-2">
        <Button disabled>Disabled</Button>
      </div>
    </div>
  ),
};
