import { defineConfig } from 'tsup';
import { dependencies } from './package.json';

export default defineConfig({
	format: ['esm', 'cjs'],
	entry: {
		index: 'src/index.ts',
		'middleware/cookies/index': 'src/middleware/cookies/index.ts',
		'middleware/sentry/index': 'src/middleware/sentry/index.ts',
		'middleware/helmet/index': 'src/middleware/helmet/index.ts',
	},
	splitting: false,
	sourcemap: true,
	dts: true,
	noExternal: Object.keys(dependencies),
});
