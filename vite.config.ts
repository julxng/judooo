import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
          '@app': path.resolve(__dirname, 'src/app'),
          '@assets': path.resolve(__dirname, 'src/assets'),
          '@components': path.resolve(__dirname, 'src/components'),
          '@design-system': path.resolve(__dirname, 'src/design-system'),
          '@features': path.resolve(__dirname, 'src/features'),
          '@hooks': path.resolve(__dirname, 'src/hooks'),
          '@lib': path.resolve(__dirname, 'src/lib'),
          '@services': path.resolve(__dirname, 'src/services'),
          '@styles': path.resolve(__dirname, 'src/styles'),
          '@types': path.resolve(__dirname, 'src/types'),
          '@ui': path.resolve(__dirname, 'src/components/ui'),
          '@utils': path.resolve(__dirname, 'src/utils'),
        }
      }
    };
});
