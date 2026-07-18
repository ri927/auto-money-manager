import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from './input';
import { Label } from './label';

const meta = {
  component: Input,
  tags: ['autodocs'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 基本的な入力フィールド
 */
export const Default: Story = {
  args: {
    placeholder: 'テキストを入力...',
  }
};

/**
 * メールアドレス入力
 */
export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'example@email.com',
  },
};

/**
 * パスワード入力
 */
export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'パスワードを入力',
  },
};

/**
 * ラベル付き入力フィールド
 */
export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="email">メールアドレス</Label>
      <Input id="email" type="email" placeholder="example@email.com" />
    </div>
  )
};

/**
 * 無効状態の入力フィールド
 */
export const Disabled: Story = {
  args: {
    placeholder: '無効な入力フィールド',
    disabled: true,
  }
};

/**
 * エラー状態の入力フィールド
 */
export const Invalid: Story = {
  args: {
    placeholder: 'エラー状態',
    'aria-invalid': true,
  },
};

/**
 * 数値入力フィールド
 */
export const Number: Story = {
  args: {
    type: 'number',
    placeholder: '金額を入力',
  },
};
