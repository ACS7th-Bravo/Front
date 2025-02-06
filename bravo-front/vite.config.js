import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    // ngrok에서 허용할 도메인
    allowedHosts: ['e778-118-218-200-33.ngrok-free.app'],

    // API 프록시 설정 (프론트엔드에서 백엔드로 자동 전달)
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 백엔드 서버
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
