import { type Mock, beforeEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import type { Path } from 'src';
import { Pulsar } from '..';

describe('Custom error handling', () => {
	let router: Pulsar;
	let errorHandler: Mock;

	beforeEach(() => {
		errorHandler = vi.fn(() => ({ error: true }));
		router = new Pulsar().onError(errorHandler);
	});

	describe('when handling a 404 error', () => {
		let response: Response;

		beforeEach(async () => {
			response = await router.fetch(new Request('https://example.com/'));
		});

		test('should use response from error handler', async () => {
			const data = await response.text();
			expect(data).toEqual(JSON.stringify({ error: true }));
		});

		test('should call custom error handler', () => {
			expect(errorHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					code: 'NOT_FOUND',
					path: new URL('https://example.com/'),
				})
			);
		});

		// TODO: Need to set context using middleware for 404s
		test.todo('should maintain context from middleware', () => {
			expect(errorHandler).toHaveBeenCalled();
			expect(errorHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					path: new URL('https://example.com/'),
				})
			);
		});
	});

	describe('when handling route errors', () => {
		let path: Path = '/test';
		let request = new Request('https://example.com/test');
		let handler: Mock;

		beforeEach(() => {
			handler = vi.fn(() => {});
			router.get(path, handler);
		});

		describe('when handling a validation error', () => {
			path = '/users';
			request = new Request('https://example.com/users', { method: 'POST' });

			let response: Response;

			beforeEach(async () => {
				router.post(path, { body: { id: z.string() } }, handler);
				response = await router.fetch(request);
			});

			test('should call handler', () => {
				expect(handler).toHaveBeenCalled();
			});

			test('should use response from error handler', async () => {
				const data = await response.text();
				expect(data).toEqual(JSON.stringify({ error: true }));
			});

			test('should call custom error handler', () => {
				expect(errorHandler).toHaveBeenCalledWith(
					expect.objectContaining({
						code: 'VALIDATION',
					})
				);
			});

			// TODO: Need to set context using middleware for 404s
			test.todo('should maintain context from middleware', () => {
				expect(errorHandler).toHaveBeenCalled();
				expect(errorHandler).toHaveBeenCalledWith(
					expect.objectContaining({
						path: new URL('https://example.com/'),
					})
				);
			});
		});
	});
});
