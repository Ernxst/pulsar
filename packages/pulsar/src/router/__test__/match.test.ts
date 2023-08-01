import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Pulsar } from '..';

function request(method: string, url: string) {
	const baseUrl = 'https://example.com';
	const requestUrl = new URL(url, baseUrl);
	return new Request(requestUrl.toString(), { method });
}

describe('When matching routes', () => {
	describe.each([{ method: 'GET' }] as const)(
		'given a $method route',
		({ method }) => {
			let router: Pulsar;

			beforeEach(() => {
				router = new Pulsar();
			});

			describe.each([{ path: '/healthcheck' }] as const)(
				'given a $path path',
				({ path }) => {
					const handler = vi.fn().mockResolvedValue({ message: 'hello' });

					beforeEach(() => {
						const fn = method.toLowerCase() as Lowercase<typeof method>;
						router[fn](path, handler);
					});

					describe('when the path matches', () => {
						describe('when the method matches', () => {
							let response: Response;

							beforeEach(async () => {
								const req = request(method, path);
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
								response = await router.fetch(request('UNKNOWN', path));
							});

							test('should not call route handler', () => {
								expect(handler).not.toHaveBeenCalled();
							});

							test('should return 405', () => {
								expect(response.ok).toBe(false);
								expect(response.status).toBe(405);
								expect(response.statusText).toBe('Method not allowed');
							});
						});
					});

					describe('when the path does not match', () => {
						let response: Response;

						beforeEach(async () => {
							response = await router.fetch(request(method, '/unknown'));
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
				}
			);
		}
	);
});
