import { type Mock, beforeEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { ValidationError } from 'src/errors';
import { Pulsar } from '..';

describe('Custom error handling', () => {
	let errorHandler: Mock;

	beforeEach(() => {
		errorHandler = vi.fn(() => ({ error: true }));
	});

	describe('when handling a 404 error', () => {
		let response: Response;

		beforeEach(async () => {
			const router = new Pulsar().onError(errorHandler);
			response = await router.fetch(new Request('https://example.com/'));
		});

		test('should use response from error handler', async () => {
			const data = await response.text();
			expect(data).toEqual(JSON.stringify({ error: true }));
		});

		test('should call custom error handler', () => {
			expect(errorHandler).toHaveBeenCalled();
			expect(errorHandler).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'NOT_FOUND', path: '/' })
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

	describe('when handling a route error', () => {
		let routeHandler: Mock;
		let response: Response;

		beforeEach(async () => {
			routeHandler = vi.fn().mockRejectedValue(new Error('test'));

			const router = new Pulsar()
				.onError(errorHandler)
				.get('/test', routeHandler);

			const request = new Request('https://example.com/test');
			response = await router.fetch(request);
		});

		test('should call route handler', () => {
			expect(routeHandler).toHaveBeenCalled();
		});

		test('should call custom error handler', () => {
			expect(errorHandler).toHaveBeenCalled();
			expect(errorHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					code: 'INTERNAL_SERVER_ERROR',
					error: expect.any(Error),
				})
			);
		});

		test('should use response from error handler', async () => {
			const data = await response.text();
			expect(data).toEqual(JSON.stringify({ error: true }));
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

	describe('when handling a validation error', () => {
		let response: Response;
		let routeHandler: Mock;

		beforeEach(async () => {
			routeHandler = vi.fn();

			const router = new Pulsar()
				.onError(errorHandler)
				.post('/test', { body: { id: z.string() } }, routeHandler);

			const req = new Request('https://example.com/test', { method: 'POST' });
			response = await router.fetch(req);
		});

		test('should not call route handler', () => {
			expect(routeHandler).not.toHaveBeenCalled();
		});

		test('should call custom error handler', () => {
			expect(errorHandler).toHaveBeenCalled();
			expect(errorHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					code: 'VALIDATION',
					error: expect.any(ValidationError),
				})
			);
		});

		test('should use response from error handler', async () => {
			const data = await response.text();
			expect(data).toEqual(JSON.stringify({ error: true }));
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
