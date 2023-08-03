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
				.mockImplementation(({ locals, next }) => {
					expect(locals).toEqual({});
					return next({ version: 1 });
				});

			middleware2 = vi
				.fn<MiddlewareArgs, MiddlewareReturn>()
				.mockName('middleware2')
				.mockImplementation(async ({ locals, next }) => {
					expect(locals).toEqual({ version: 1 });
					const result = await next();
					expect(result).toEqual(
						expect.objectContaining({ data: { message: 'OK' }, ok: true })
					);
					return result;
				});

			middleware3 = vi
				.fn<MiddlewareArgs, MiddlewareReturn>()
				.mockName('middleware3')
				.mockImplementation(async ({ locals, next }) => {
					expect(locals).toEqual({ version: 1 });
					return next({ platform: 'web' });
				});

			middleware4 = vi
				.fn<MiddlewareArgs, MiddlewareReturn>()
				.mockName('middleware4')
				.mockImplementation(async ({ locals, next }) => {
					expect(locals).toEqual({ version: 1, platform: 'web' });
					const result = await next();
					expect(result).toEqual(
						expect.objectContaining({ data: { message: 'OK' }, ok: true })
					);
					return result;
				});

			handler = vi
				.fn<HandlerArgs, HandlerReturn>()
				.mockName('handler')
				.mockImplementation(({ locals }) => {
					expect(locals).toEqual({ version: 1, platform: 'web' });
					return { message: 'OK' };
				});

			router = new Pulsar()
				.use(middleware1)
				.use(middleware2)
				.use(middleware3)
				.use(middleware4)
				.get('/test' as any, handler);

			await router.fetch(new Request('http://localhost:3000/test'));
		});

		test('should resolve next() after all other middleware handlers', () => {
			expect(middleware1).toHaveBeenCalledOnce();
			expect(middleware2).toHaveBeenCalledOnce();
			expect(middleware3).toHaveBeenCalledOnce();
			expect(middleware4).toHaveBeenCalledOnce();
			expect(handler).toHaveBeenCalledOnce();
		});
	});
});
