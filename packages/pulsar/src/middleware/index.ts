import type { Middleware, MiddlewareBuilder } from './types';

/**
 * Define a new middleware handler.
 */
export function middleware() {
	return createMiddleware([]);
}

const ID_KEY = Symbol('pulsar:id');
const MIDDLEWARE_KEY = Symbol('pulsar:middleware');

export const middlewareUtils = {
	/**
	 * Register a middleware to run before the current middleware.
	 * @param middleware The current middleware
	 * @param middlewares The middlewares to run before the current middleware
	 */
	add<TMiddleware extends Middleware<any>>(
		middleware: TMiddleware,
		middlewares: Middleware<any>[]
	): TMiddleware {
		(middleware as any)[MIDDLEWARE_KEY] = middlewares;
		return middleware;
	},

	/**
	 * Add an ID to a middleware. This is needed so we can dedupe middlewares
	 * when they are added to the router.
	 */
	setId<TMiddleware extends Middleware<any>>(
		middleware: TMiddleware
	): TMiddleware {
		(middleware as any)[ID_KEY] = Symbol('pulsar:middleware:id');
		return middleware;
	},

	getId(middleware: Middleware<any>): symbol | undefined {
		return (middleware as any)[ID_KEY];
	},

	/**
	 * Extract the parent middlewares from a middleware handler.
	 *
	 * @param middleware The middleware handler
	 * @returns The middlewares
	 */
	extract(middleware: Middleware<any>): Middleware<any>[] {
		return (middleware as any)[MIDDLEWARE_KEY] ?? [];
	},
};

function createMiddleware<TIn extends object = {}>(
	middlewares: Middleware<any>[]
): MiddlewareBuilder<TIn> {
	return {
		use(middleware) {
			return createMiddleware([...middlewares, middleware]);
		},
		define(middleware) {
			middlewareUtils.add(middleware, middlewares);
			return middleware;
		},
	};
}
