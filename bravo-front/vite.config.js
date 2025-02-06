import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 백엔드 서버 URL
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: [
      'ecd6-175-113-108-17.ngrok-free.app'
    ]
  },
});
