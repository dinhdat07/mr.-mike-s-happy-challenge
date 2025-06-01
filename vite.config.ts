import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.OPENROUTER_API_URL': JSON.stringify(env.OPENROUTER_API_URL),
        'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY),
        'process.env.SITE_URL': JSON.stringify(env.SITE_URL)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
