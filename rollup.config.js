import typescript from 'rollup-plugin-typescript2';
import autoExternal from 'rollup-plugin-auto-external';

export default {
	input: './src/index.ts',

	output: [
		{
			file: 'dist/esm/index.js',
			format: 'esm',
		},
		{
			file: 'dist/cjs/index.js',
			format: 'cjs',
		},
	],

	plugins: [
		typescript(),
		autoExternal(),
	],
};
