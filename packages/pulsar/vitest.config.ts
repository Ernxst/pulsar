import { defineConfig } from 'vitest/config';
import paths from 'vite-tsconfig-paths';

export default defineConfig({
	plugins: [paths()],
	// https://github.com/vitest-dev/vitest
	test: {
		watch: false,
		typecheck: {
			ignoreSourceErrors: true,
		},
		mockReset: true,
		coverage: {
			provider: 'istanbul',
			enabled: true,
			all: true,
			reporter: ['html', 'text-summary', 'json'],
			include: ['src/**/*'],
			exclude: ['src/**/__test__/**', 'src/**/dump.ts', 'src/**/dump/**'],
		},
	},
});
