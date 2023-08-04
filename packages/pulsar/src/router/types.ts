import type { ZodObject, ZodType, z } from 'zod';
import type { ErrorHandler } from '../errors/types';
import type { Middleware, inferMiddlewareOutput } from '../middleware/types';
import type { Route, RouteContext } from '../route/types';
import type { HttpMethod, Path, Promisable } from '../types/util';
import type { RouteTree } from './Pulsar/types';
import type { Pulsar } from '.';

export type QuerySchema = Record<string, ZodType>;
export type BodySchema = Record<string, ZodType>;
export type inferQuery<TQuery extends QuerySchema> = z.infer<ZodObject<TQuery>>;
export type inferBody<TBody extends BodySchema> = z.infer<ZodObject<TBody>>;
export type EmptyRoutes = Record<Path, never>;

export type ExtractRoutes<TRouter extends AnyRouter> =
	// This conditional may be a performance bottleneck ...
	TRouter['_']['routes'] extends EmptyRoutes & infer Routes ? Routes : never;

export type Router<
	TGroup extends Path = '',
	TRoutes extends RouteTree = EmptyRoutes,
	TContext extends object = {},
	TErrShape = {},
> = {
	[TMethod in HttpMethod as Lowercase<TMethod>]: {
		/**
		 * Define a route handler without a path. This uses the
		 * group path as the route path. The query and body parameters
		 * will be parsed, but not validated.
		 */
		<const TOut>(
			handler: (
				context: RouteContext<TGroup, {}, {}, TContext>
			) => Promisable<TOut>
		): Pulsar<
			TGroup,
			TRoutes & {
				[K in TGroup]: {
					[M in TMethod]: Route<K, TMethod, {}, {}, TOut>;
				};
			},
			TContext,
			TErrShape
		>;

		/**
		 * Define a route handler without a path. This uses the
		 * group path as the route path. The query and body parameters
		 * are validated using the provided schemas.
		 */
		<
			const TOut,
			const TQuery extends QuerySchema = {},
			const TBody extends BodySchema = {},
		>(
			schemas: {
				/**
				 * Schema to validate query parameters
				 */
				query?: TQuery;
				/**
				 * Schema to validate request body
				 */
				body?: TBody;
			},
			handler: (
				context: RouteContext<
					TGroup,
					z.infer<ZodObject<TQuery>>,
					z.infer<ZodObject<TBody>>,
					TContext
				>
			) => Promisable<TOut>
		): Pulsar<
			TGroup,
			TRoutes & {
				[TFullPath in TGroup]: {
					[K in TMethod]: Route<
						TFullPath,
						TMethod,
						z.infer<ZodObject<TQuery>>,
						z.infer<ZodObject<TBody>>,
						TOut
					>;
				};
			},
			TContext,
			TErrShape
		>;

		/**
		 * Define a route handler with a path. The request body and query parameters
		 * will be parsed, but not validated.
		 */
		<const TPath extends Path, const TOut>(
			path: TPath,
			handler: (
				context: RouteContext<`${TGroup}${TPath}`, {}, {}, TContext>
			) => Promisable<TOut>
		): Pulsar<
			TGroup,
			TRoutes & {
				[K in `${TGroup}${TPath}`]: {
					[M in TMethod]: Route<K, TMethod, {}, {}, TOut>;
				};
			},
			TContext,
			TErrShape
		>;

		/**
		 * Define a route handler with a path and schemas to validate
		 * query parameters and request body.
		 */
		<
			const TPath extends Path,
			const TOut,
			const TQuery extends QuerySchema = {},
			const TBody extends BodySchema = {},
		>(
			path: TPath,
			schemas: {
				/**
				 * Schema to validate query parameters
				 */
				query?: TQuery;
				/**
				 * Schema to validate request body
				 */
				body?: TBody;
			},
			handler: (
				context: RouteContext<
					`${TGroup}${TPath}`,
					z.infer<ZodObject<TQuery>>,
					z.infer<ZodObject<TBody>>,
					TContext
				>
			) => Promisable<TOut>
		): Pulsar<
			TGroup,
			TRoutes & {
				[TFullPath in `${TGroup}${TPath}`]: {
					[K in TMethod]: Route<
						TFullPath,
						TMethod,
						z.infer<ZodObject<TQuery>>,
						z.infer<ZodObject<TBody>>,
						TOut
					>;
				};
			},
			TContext,
			TErrShape
		>;
	};
} & {
	/**
	 * The internal state of the router. Do not use. These values will not exist
	 * at runtime.
	 *
	 * @internal
	 */
	readonly _: {
		routes: TRoutes;
		context: TContext;
		errorShape: TErrShape;
	};

	/**
	 * Specify a handler for errors thrown in routes within this router group.
	 * This handler will be called with the error and the route context.
	 * This is useful for standardising error responses to make them easier to
	 * unwrap in the client.
	 */
	onError<const TError>(
		errorHandler: ErrorHandler<TContext, TError>
	): Pulsar<TGroup, TRoutes, TContext, TError>;

	use: {
		/**
		 * Use middleware that returns a value. This value is
		 * added to the {@linkcode RouteContext["locals"]} object
		 * available to all routes within the router group.
		 */
		<TMiddleware extends Middleware<TContext, any>>(
			middleware: TMiddleware
		): Pulsar<
			TGroup,
			TRoutes,
			TContext & inferMiddlewareOutput<TMiddleware>,
			TErrShape
		>;

		/**
		 * Specify middleware to run on all routes that match the given path.
		 */
		<TMiddleware extends Middleware<TContext, any>>(
			path: Path,
			middleware: TMiddleware
		): Pulsar<
			TGroup,
			TRoutes,
			TContext & inferMiddlewareOutput<TMiddleware>,
			TErrShape
		>;
	};

	route: {
		/**
		 * Add the routes from the given router to this router group.
		 */
		<TNewRoutes extends RouteTree>(
			builder: (router: AnyRouter) => Pulsar<Path, TNewRoutes, any>
		): Pulsar<TGroup, TRoutes & TNewRoutes, TContext, TErrShape>;
	};

	group: {
		/**
		 * Create a new router group with the given path prefix.
		 */
		<
			TSubgroup extends Path,
			TSubRoutes extends RouteTree,
			TSubContext extends object,
			TRouter extends Pulsar<
				`${TGroup}${TSubgroup}`,
				TSubRoutes,
				TSubContext,
				TErrShape
			>,
		>(
			path: TSubgroup,
			builder: (
				router: Pulsar<
					`${TGroup}${TSubgroup}`,
					EmptyRoutes,
					TContext,
					TErrShape
				>
			) => TRouter
		): Pulsar<TGroup, TRoutes & ExtractRoutes<TRouter>, TContext, TErrShape>;
	};

	/**
	 * Handle a request using this router, returning a response.
	 */
	fetch(request: Request): Promise<Response>;
};

export type AnyRouter = Pulsar<any, any, any, any>;
