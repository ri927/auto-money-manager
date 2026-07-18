import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import DashboardPage from './page';

const meta = {
  component: DashboardPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof DashboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ダッシュボードのデフォルト表示
 * 収入・支出・収支のサマリー、最近の取引、カテゴリ別支出を表示
 */
export const Default: Story = {
};
