import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { HttpMethod } from 'src';
import { Pulsar } from '..';

function request(method: string, url: string) {
	const baseUrl = 'https://example.com';
	const requestUrl = new URL(url, baseUrl);
	return new Request(requestUrl.toString(), { method });
}

describe('When matching routes', () => {
	describe.each([
		{ method: 'GET' },
		{ method: 'POST' },
		{ method: 'PUT' },
		{ method: 'PATCH' },
		{ method: 'DELETE' },
		{ method: 'OPTIONS' },
	] satisfies { method: HttpMethod }[])(
		'given a $method route',
		({ method }) => {
			let router: Pulsar;

			beforeEach(() => {
				router = new Pulsar();
			});

			describe.each([
				{ path: '/healthcheck', match: '/healthcheck' },
				{ path: '/oauth/callback', match: '/oauth/callback' },
				{ path: '/:id', match: '/123' },
				{ path: '/:id/:name', match: '/123/abc' },
				{ path: '/:id/:name?', match: '/123' },
				{ path: '/:id/:name?', match: '/123/abc' },
				{ path: '/users/:id', match: '/users/123' },
				{ path: '/users/:id/:name', match: '/users/123/abc' },
				{ path: '/users/:id/:name?', match: '/users/123' },
				{ path: '/users/:id/:name?', match: '/users/123/abc' },
				{ path: '/wild/*/card', match: '/wild/123/card' },
			] as const)('given a $path path', ({ path, match }) => {
				const handler = vi.fn().mockResolvedValue({ message: 'hello' });

				beforeEach(() => {
					const fn = method.toLowerCase() as Lowercase<typeof method>;
					router[fn](path, handler);
				});

				describe(`when ${match} matches`, () => {
					describe('when the method matches', () => {
						let response: Response;

						beforeEach(async () => {
							const req = request(method, match);
							response = await router.fetch(req);
						});

						test('should call route handler', () => {
							expect(handler).toHaveBeenCalled();
						});

						test('should return 200', () => {
							expect(response.ok).toBe(true);
							expect(response.status).toBe(200);
							expect(response.statusText).toBe('OK');
						});
					});

					describe('when the method does not match', () => {
						let response: Response;

						beforeEach(async () => {
							const unknown = method === 'GET' ? 'POST' : 'GET';
							response = await router.fetch(request(unknown, match));
						});

						test('should not call route handler', () => {
							expect(handler).not.toHaveBeenCalled();
						});

						test('should return 404', () => {
							expect(response.ok).toBe(false);
							expect(response.status).toBe(404);
							expect(response.statusText).toBe('Not found');
						});
					});
				});

				describe('when the path does not match', () => {
					let response: Response;

					beforeEach(async () => {
						response = await router.fetch(request(method, ''));
					});

					test('should not call route handler', () => {
						expect(handler).not.toHaveBeenCalled();
					});

					test('should return 404', () => {
						expect(response.ok).toBe(false);
						expect(response.status).toBe(404);
						expect(response.statusText).toBe('Not found');
					});
				});
			});
		}
	);
});
