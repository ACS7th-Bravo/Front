import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),

	},
	vitePlugin: {
		experimental: {
			useVitePreprocess: true
		}
	},
	csrf: {
		checkOrigin: false // CORS 문제 방지
	  }
};

export default config;
