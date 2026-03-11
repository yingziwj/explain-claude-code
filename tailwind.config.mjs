/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				soil: {
					50: '#faf6ef',
					100: '#f3ead8',
					200: '#e8d3ad',
					300: '#d5b37d',
					400: '#bb8b4d',
					500: '#9a6b31',
					600: '#7d5326',
					700: '#603f20',
					800: '#422b18',
					900: '#28180f'
				},
				leaf: {
					300: '#b7d48d',
					500: '#6b8f3e',
					700: '#3f5c27'
				}
			},
			fontFamily: {
				display: ['"Noto Serif SC"', '"Source Han Serif SC"', 'serif'],
				body: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif']
			},
			boxShadow: {
				card: '0 20px 50px rgba(36, 27, 16, 0.12)'
			}
		}
	},
	plugins: []
};
