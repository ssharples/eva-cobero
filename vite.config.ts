import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      external: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
      output: {
        globals: {
          '@stripe/stripe-js': 'Stripe',
          '@stripe/react-stripe-js': 'ReactStripe'
        }
      }
    }
  }
});
