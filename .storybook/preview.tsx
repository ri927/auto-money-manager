import type { Preview } from '@storybook/nextjs-vite'
import React, { createContext, useContext } from 'react'
import '../app/globals.css'

// AuthContextの型定義（実際のAuthContextと同じ型）
interface AuthContextType {
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

// モック用のAuthContext
const MockAuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signOut: async () => {},
  refreshAuth: async () => {},
});

// Storybook用のAuthProvider
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockAuthContext.Provider
      value={{
        user: null,
        loading: false,
        signOut: async () => {
          console.log('Mock signOut called');
        },
        refreshAuth: async () => {
          console.log('Mock refreshAuth called');
        },
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },

    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
        query: {},
      },
    },
  },

  decorators: [
    (Story) => (
      <MockAuthProvider>
        <Story />
      </MockAuthProvider>
    ),
  ],
};

export default preview;