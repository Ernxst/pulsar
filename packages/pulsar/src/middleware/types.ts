import type { QueryParams, RouteContext } from '../route/types';
import type { Path, Promisable } from '../types/util';

/**
 * The context object passed to middleware handlers.
 */
export interface MiddlewareContext<TLocals extends object = {}>
	extends RouteContext<Path, QueryParams, object, TLocals> {
	/**
	 * Call next middleware, or route handler if there is no more middleware.
	 *
	 * This is useful for middleware that needs to do something after the
	 * route handler has finished.
	 *
	 * @returns A promise resolving to the response payload.
	 */
	next(): Promise<unknown>;
}

/**
 * Middleware is a function that can modify the context object before it is
 * passed to the route handler as well as performing other tasks, before
 * and after the route handler.
 */
export type Middleware<
	TLocals extends object = {},
	TNewContext extends object = TLocals,
> =
	/**
	 * Run middleware, returning a new context object. This allows middleware to
	 * modify the context.
	 *
	 * @param context A clone of the context object. Modifying this object has
	 * no effect.
	 * @returns A new context object.
	 */
	| ((context: MiddlewareContext<TLocals>) => Promisable<TNewContext>)
	/**
	 * Run middleware, without returning a value, meaning the context will not
	 * be modified.
	 *
	 * @param context A clone of the context object. Modifying this object has no
	 * effect.
	 */
	| ((context: MiddlewareContext<TLocals>) => Promisable<void>);

/**
 * Middleware builder is used to build middleware pipelines.
 */
export interface MiddlewareBuilder<
	TIn extends object = {},
	TOut extends object = {},
> {
	/**
	 * Apply middleware before this one. This is useful for building middleware
	 * pipelines.
	 */
	use<TMiddlewareIn extends object, TMiddlewareOut extends object>(
		middleware: Middleware<TMiddlewareIn, TMiddlewareOut>
	): MiddlewareBuilder<TIn & TMiddlewareIn, TOut & TMiddlewareOut>;

	/**
	 * Define the middleware handler.
	 */
	define<TNewContext extends object>(
		middleware: Middleware<TIn & TOut, TNewContext>
	): Middleware<TIn, TNewContext>;
}
