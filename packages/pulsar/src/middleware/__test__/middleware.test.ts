import { type AnyRoute, type Middleware, Pulsar } from 'src';
import { type Mock, beforeEach, describe, expect, test, vi } from 'vitest';

type MiddlewareArgs = Parameters<Middleware<any>>;
type MiddlewareReturn = ReturnType<Middleware<any>>;
type HandlerArgs = Parameters<AnyRoute['handler']>;
type HandlerReturn = ReturnType<AnyRoute['handler']>;

describe('middleware', () => {
	describe('when using the `next` function', () => {
		let router: Pulsar;
		let middleware1: Mock<MiddlewareArgs, MiddlewareReturn>;
		let middleware2: Mock<MiddlewareArgs, MiddlewareReturn>;
		let middleware3: Mock<MiddlewareArgs, MiddlewareReturn>;
		let middleware4: Mock<MiddlewareArgs, MiddlewareReturn>;
		let handler: Mock<HandlerArgs, HandlerReturn>;

		beforeEach(async () => {
			middleware1 = vi
				.fn<MiddlewareArgs, MiddlewareReturn>()
				.mockName('middleware1')
				.mockImplementation(async ({ next, locals }) => {
					console.log('middleware1 locals', locals);
					await next();
					return { version: 1 };
				});

			middleware2 = vi
				.fn<MiddlewareArgs, MiddlewareReturn>()
				.mockName('middleware2')
				.mockImplementation(async ({ next, locals }) => {
					console.log('middleware2 locals', locals);
					await next();
				});

			middleware3 = vi
				.fn<MiddlewareArgs, MiddlewareReturn>()
				.mockName('middleware3')
				.mockImplementation(async ({ next, locals }) => {
					console.log('middleware3 locals', locals);
					await next();
					return { platform: 'web' };
				});

			middleware4 = vi
				.fn<MiddlewareArgs, MiddlewareReturn>()
				.mockName('middleware4')
				.mockImplementation(async ({ next, locals }) => {
					console.log('middleware4 locals', locals);
					await next();
				});

			handler = vi
				.fn<HandlerArgs, HandlerReturn>()
				.mockName('handler')
				.mockImplementation(() => ({ message: 'OK' }));

			router = new Pulsar()
				.use(middleware1)
				.use(middleware2)
				.use(middleware3)
				.use(middleware4)
				.get('/test' as any, handler);

			await router.fetch(new Request('http://localhost:3000/test'));
		});

		test('should resolve next() after all other middleware handlers', () => {
			console.log(middleware1.mock.calls[0][0].locals);
			console.log(middleware2.mock.calls[0][0].locals);
			console.log(middleware3.mock.calls[0][0].locals);
			console.log(middleware4.mock.calls[0][0].locals);
			expect(middleware1).toHaveBeenCalledOnce();
			expect(middleware1).toHaveBeenCalledWith(
				expect.objectContaining({ locals: {}, next: expect.any(Function) })
			);

			expect(middleware2).toHaveBeenCalledOnce();
			expect(middleware2).toHaveBeenCalledWith(
				expect.objectContaining({
					locals: { version: 1 },
					next: expect.any(Function),
				})
			);

			expect(middleware3).toHaveBeenCalledOnce();
			expect(middleware3).toHaveBeenCalledWith(
				expect.objectContaining({
					locals: { version: 1 },
					next: expect.any(Function),
				})
			);

			expect(middleware4).toHaveBeenCalledOnce();
			expect(middleware4).toHaveBeenCalledWith(
				expect.objectContaining({
					locals: { version: 1, platform: 'web' },
					next: expect.any(Function),
				})
			);

			expect(handler).toHaveBeenCalledOnce();
			expect(handler).toHaveBeenCalledWith(
				expect.objectContaining({
					locals: { version: 1, platform: 'web' },
				})
			);
		});
	});
});
