import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	base: './',
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(import.meta.dirname, './src'),
			'@friday/sdk': path.resolve(import.meta.dirname, '../../packages/sdk/index.ts'),
		},
	},
});
