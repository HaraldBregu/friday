import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	base: './',
	plugins: [react()],
	publicDir: false,
	resolve: {
		alias: {
			'@kucedr/sdk': path.resolve(import.meta.dirname, '../../packages/sdk/index.ts'),
		},
	},
});
