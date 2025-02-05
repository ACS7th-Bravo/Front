import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		// 여기에 ngrok 호스트를 추가합니다.
		allowedHosts: ['fair-readily-viper.ngrok-free.app']
	}
});
