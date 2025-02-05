import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    // 여기에 ngrok 호스트를 추가합니다.
    allowedHosts: ['0d7a-118-218-200-33.ngrok-free.app']
  }
});