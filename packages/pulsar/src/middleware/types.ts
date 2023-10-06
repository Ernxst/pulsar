import type { Promisable } from 'type-fest';
import type { QueryParams, RouteContext } from '../route/types';
import type { Path } from '../types/util';

export type inferMiddlewareInput<TMiddleware extends Middleware<any, any>> =
	TMiddleware extends Middleware<infer TContext, any> ? TContext : never;

export type inferMiddlewareOutput<TMiddleware extends Middleware<any, any>> =
	TMiddleware extends (...args: infer _) => Promisable<infer TContext>
		? TContext
		: TMiddleware extends Middleware<any, infer TContext>
		? TContext
		: never;

export interface NextFunction {
	(): Promise<void>;
}

/**
 * The context object passed to middleware handlers.
 */
export interface MiddlewareContext<TLocals extends object = {}>
	extends RouteContext<Path, QueryParams, object, TLocals> {
	/**
	 * Call the request's handler and obtain the result.
	 */
	next: NextFunction;
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
	| ((context: MiddlewareContext<TLocals>) => Promisable<TNewContext>)
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
