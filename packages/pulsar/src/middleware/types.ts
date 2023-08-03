import type { QueryParams, RouteContext } from '../route/types';
import type { Path } from '../types/util';

export type inferMiddlewareInput<TMiddleware extends Middleware<any, any>> =
	TMiddleware extends Middleware<infer TContext, any> ? TContext : never;

export type inferMiddlewareOutput<TMiddleware extends Middleware<any, any>> =
	TMiddleware extends (
		...args: infer _
	) => Promise<MiddlewareResult<infer TContext>>
		? TContext
		: TMiddleware extends Middleware<any, infer TContext>
		? TContext
		: never;

export interface NextFunction<TNewContext extends object = {}> {
	/**
	 * Call the request's handler and obtain the result
	 *
	 * You must return the result of this function from your middleware handler.
	 */
	(): Promise<MiddlewareResult<{}>>;
	/**
	 * Call the request's handler and obtain the result.
	 *
	 * As the parameter to `context`, it is possible to only pass in new parameters
	 * and properties that have changed, instead of repeating the entire
	 * context object.
	 *
	 * You must return the result of this function from your middleware handler.
	 */
	<const TCtx extends TNewContext>(
		context: TCtx
	): Promise<MiddlewareResult<TCtx>>;
}

export type MiddlewareResult<
	_PlaceholderForUpdatedContext extends object = {},
> = { ok: true; data: unknown } | { ok: false; error: unknown };

/**
 * The context object passed to middleware handlers.
 */
export interface MiddlewareContext<
	TLocals extends object = {},
	TNewContext extends object = {},
> extends RouteContext<Path, QueryParams, object, TLocals> {
	/**
	 * Call the request's handler and obtain the result.
	 * You must return the result of this function from your middleware handler.
	 */
	next: NextFunction<TNewContext>;
}

/**
 * Middleware is a function that can modify the context object before it is
 * passed to the route handler as well as performing other tasks, before
 * and after the route handler.
 */
export type Middleware<
	TLocals extends object = {},
	TNewContext extends object = {},
> =
	/**
	 * Run middleware, returning a new context object. This allows middleware to
	 * modify the context.
	 *
	 * @param context A clone of the context object. Modifying this object has
	 * no effect.
	 */
	(
		context: MiddlewareContext<TLocals>
	) => Promise<MiddlewareResult<TNewContext>>;

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
	use<TMiddleware extends Middleware<any, any>>(
		middleware: TMiddleware
	): MiddlewareBuilder<
		TIn & inferMiddlewareInput<TMiddleware>,
		TOut & inferMiddlewareOutput<TMiddleware>
	>;

	/**
	 * Define the middleware handler.
	 */
	define<TMiddleware extends Middleware<TIn & TOut, any>>(
		middleware: TMiddleware
	): Middleware<TIn, inferMiddlewareOutput<TMiddleware>>;
}
