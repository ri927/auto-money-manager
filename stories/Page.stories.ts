import type { Meta, StoryObj } from '@storybook/nextjs-vite';


import { Page } from './Page';

const meta = {
  title: 'Example/Page',
  component: Page,
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggedOut: Story = {};

/**
 * ログイン済み状態のページ表示
 */
export const LoggedIn: Story = {};
