module.exports = {
	extends: ['@antfu', 'turbo', 'plugin:astro/recommended'],
	overrides: [
		{
			// Define the configuration for `.astro` file.
			files: ['*.astro'],
			// Allows Astro components to be parsed.
			parser: 'astro-eslint-parser',
			// Parse the script in `.astro` as TypeScript by adding the following configuration.
			// It's the setting you need when using TypeScript.
			parserOptions: {
				parser: '@typescript-eslint/parser',
				extraFileExtensions: ['.astro'],
			},
			rules: {
				// override/add rules settings here, such as:
				// "astro/no-set-html-directive": "error"
			},
		},
	],
	rules: {
		curly: 'off',
		'jsonc/indent': ['error', 'tab', {}],
		'n/prefer-global/process': ['error', 'always'],
		'n/handle-callback-err': 'off',
		'no-only-tests/no-only-tests': 'off',
		'unused-imports/no-unused-vars': 'off',
		'no-tabs': 'off',
		'antfu/if-newline': 'off',
		'unicorn/prefer-node-protocol': 'off',
		'no-console': 'off',
		'arrow-parens': 'off',
		'operator-linebreak': 'off',
		'quote-props': 'off',
		'@typescript-eslint/ban-types': 'off',
		'@typescript-eslint/brace-style': 'off',
		'@typescript-eslint/semi': 'off',
		'@typescript-eslint/quotes': 'off',
		'@typescript-eslint/indent': 'off',
		'@typescript-eslint/comma-dangle': 'off',
		'@typescript-eslint/member-delimiter-style': 'off',
		'@typescript-eslint/no-unused-vars': [
			'error',
			{
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				ignoreRestSiblings: true,
				caughtErrorsIgnorePattern: '^_',
			},
		],
	},
};
