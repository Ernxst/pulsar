import { defineConfig } from 'vitest/config';

export default defineConfig({
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
