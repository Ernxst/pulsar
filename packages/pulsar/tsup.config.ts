import { defineConfig } from 'tsup';
import { dependencies } from './package.json';

export default defineConfig({
	format: ['esm', 'cjs'],
	entry: {
		index: 'src/index.ts',
	},
	splitting: false,
	sourcemap: true,
	dts: true,
	noExternal: Object.keys(dependencies),
});
