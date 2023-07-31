import { defineConfig } from 'tsup';

export default defineConfig({
	format: ['esm', 'cjs'],
	entry: {
		index: 'src/index.ts',
		'internals/index': 'src/internals.ts',
	},
	sourcemap: true,
});
