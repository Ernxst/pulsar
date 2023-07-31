import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkSmartypants from 'remark-smartypants';
import links from 'starlight-links-validator';
import { autolinkConfig } from './plugins/rehype-autolink-config';

// https://astro.build/config
export default defineConfig({
	site: 'https://pulsarjs.dev',
	markdown: {
		remarkPlugins: [[remarkSmartypants, { dashes: false }]],
		rehypePlugins: [
			rehypeSlug,
			// This adds links to headings
			[rehypeAutolinkHeadings, autolinkConfig],
		],
	},
	integrations: [
		links(),
		sitemap(),
		starlight({
			title: 'Pulsar',
			description:
				'A dead-simple, type-safe web framework built on Web standards for the edge.',
			customCss: [
				// Relative path to your custom CSS file
				'./src/styles/app.postcss',
				'@fontsource/inter/400.css',
				'@fontsource/inter/600.css',
			],
			defaultLocale: 'root', // optional
			locales: {
				root: {
					label: 'English',
					lang: 'en', // lang is required for root locales
				},
				// Simplified Chinese docs in `src/content/docs/zh/`
				zh: {
					label: '简体中文',
					lang: 'zh-CN',
				},
				// Arabic docs in `src/content/docs/ar/`
				ar: {
					label: 'العربية',
					dir: 'rtl',
				},
			},
			editLink: {
				baseUrl: 'https://github.com/Ernxst/pulsar/edit/main/docs',
			},
			social: {
				github: 'https://github.com/Ernxst/pulsar',
				discord: 'https://discord.gg/',
			},
			tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
			lastUpdated: true,
			sidebar: [
				{
					label: 'Start Here',
					items: [
						{ label: 'Getting Started', link: '/start-here/getting-started' },
						{ label: 'Installation', link: '/start-here/installation' },
					],
				},
				{
					label: 'Core Concepts',
					items: [{ label: 'Why Pulsar', link: '/core-concepts/why-pulsar' }],
				},
				{
					label: 'Basics',
					items: [
						{ label: 'Routing', link: '/basics/routing' },
						{ label: 'Context', link: '/basics/context' },
						{ label: 'Error Handling', link: '/basics/error-handling' },
						{ label: 'Validation', link: '/basics/validation' },
						{ label: 'Middleware', link: '/basics/middleware' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Organise Files', link: '/guides/organise-files' },
						{
							label: 'Express Middleware',
							link: '/guides/using-express-middleware',
						},
						{ label: 'Examples', link: '/guides/examples' },
					],
				},
				{
					label: 'Plugins',
					items: [
						{ label: 'Pulsar Fetch', link: '/plugins/pulsar-fetch' },
						{ label: 'Helmet', link: '/plugins/helmet' },
						{ label: 'Sentry', link: '/plugins/sentry' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
	],

	// Process images with sharp: https://docs.astro.build/en/guides/assets/#using-sharp
	image: { service: { entrypoint: 'astro/assets/services/sharp' } },
});
