import { RegExpRouter } from 'hono/router/reg-exp-router';
import { SmartRouter } from 'hono/router/smart-router';
import { TrieRouter } from 'hono/router/trie-router';
import {
	InternalServerError,
	NotFoundError,
	PulsarError,
	ValidationError,
} from 'src/errors';
import { compile } from 'src/middleware/utils';
import type { HttpMethod, Path, Promisable, Runtime } from 'src/types/util';
import { asyncify } from 'src/utils/asyncify';
import { parseBody } from 'src/utils/parseBody';
import { type AnyZodObject, z } from 'zod';
import type { Middleware, MiddlewareResult } from 'src';
import { middlewareUtils } from 'src/middleware';
import type { AnyContext, RouteResult } from '../Context';
import {
	InternalServerErrorContext,
	NotFoundErrorContext,
	ValidationErrorContext,
} from '../Context/ErrorContext';
import {
	type AnyMiddlewareContext,
	MiddlewareContext,
} from '../Context/MiddlewareContext';
import type { EmptyRoutes, QuerySchema, Router } from '../types';
import type { Options, RouteHandler, RouteTree } from './types';
import { extractArgs } from './utils';

const MIDDLEWARE_METHOD = 'ALL';

export class $Pulsar<
	TPath extends Path = '',
	TRoutes extends RouteTree = EmptyRoutes,
	TCtx extends object = {},
	TErr = {},
	TRouter extends Router<TPath, TRoutes, TCtx, TErr> = Router<
		TPath,
		TRoutes,
		TCtx,
		TErr
	>,
> implements Router<TPath, TRoutes, TCtx, TErr>
{
	readonly #config: Options<TPath, TRoutes, TCtx, TErr>;
	readonly #router: SmartRouter<RouteHandler>;
	readonly #middlewareRouter: SmartRouter<Middleware<TCtx>[]>;

	constructor(config: Options<TPath, TRoutes, TCtx, TErr>) {
		this.#config = config;
		this.#router = new SmartRouter({
			routers: [new RegExpRouter(), new TrieRouter()],
		});
		this.#middlewareRouter = new SmartRouter({
			routers: [new RegExpRouter(), new TrieRouter()],
		});
	}

	// istanbul ignore next
	public get routes() {
		return this.#router.routes ?? [];
	}

	public readonly _: TRouter['_'] = undefined as any;

	get #runtime(): Runtime {
		// TODO: runtime will come from adapter
		return 'node';
	}

	get #errorHandler() {
		const { errorHandler, parentConfig } = this.#config;
		if (errorHandler) return errorHandler;

		let config = parentConfig;
		while (config) {
			if (config.errorHandler) return config.errorHandler;
			config = config.parentConfig;
		}

		return undefined;
	}

	protected matchMiddleware(path: string): Middleware<any>[] {
		const matches = this.#middlewareRouter.match(MIDDLEWARE_METHOD, path);
		const middleware = matches?.handlers.flat() ?? [];

		let parent = this.#config.parent;

		while (parent) {
			const parentMiddleware = parent.matchMiddleware(path);
			// prepend so the parent middleware runs first
			middleware.unshift(...parentMiddleware);
			parent = parent.#config.parent;
		}

		return middleware;
	}

	async #applyMiddleware<Ctx extends AnyMiddlewareContext, TOut extends object>(
		context: Ctx,
		callback: (ctx: Ctx) => Promisable<TOut>
	): Promise<MiddlewareResult<TOut>> {
		const pathname = new URL(context.request.url).pathname;
		const middleware = this.matchMiddleware(pathname);

		// Compile middleware into single function
		const handler = compile(middleware, callback);
		return handler(context);
	}

	async #validateInput<TCtx extends AnyMiddlewareContext>(
		context: TCtx,
		options: {
			schemas: { query?: QuerySchema; body?: AnyZodObject };
			parseInput: boolean;
		}
	) {
		const { schemas, parseInput } = options;

		// Parse request body and validate if necessary
		const rawBody = await parseBody(context.request);
		if (parseInput && schemas.body) {
			const parseResult = schemas.body.safeParse(rawBody);
			if (!parseResult.success) {
				throw new ValidationError(parseResult.error);
			}

			return parseResult.data;
		}

		return rawBody as any;
	}

	async #runHandler<Ctx extends AnyMiddlewareContext, TReturn extends object>(
		callback: (ctx: Ctx) => Promisable<TReturn>,
		options: Pick<Ctx, 'request' | 'params' | 'path'> & {
			schemas: { query?: QuerySchema; body?: AnyZodObject };
			parseInput: boolean;
		}
	) {
		const { schemas, parseInput, ...opts } = options;

		// Build raw context to pass to middleware
		const context = new MiddlewareContext({
			runtime: this.#runtime,
			query: schemas.query,
			...opts,
		}) as Ctx;

		const handler = async (ctx: Ctx) => {
			const reqBody = await this.#validateInput(ctx, { schemas, parseInput });
			ctx.setRequestBody(reqBody);

			const result = await this.#applyMiddleware(ctx, callback);
			const body = result.ok ? result.data : result.error;
			ctx.setResponseBody(body);
			return ctx.processResponse();
		};

		const promise = handler(context);
		const [error, response] = await asyncify(promise);
		if (error) return this.#handleError(error, context);

		return response;
	}

	#getErrorContextFromError(error: PulsarError, context: AnyContext) {
		if (error instanceof NotFoundError) {
			context.status(404, 'Not found');
			return new NotFoundErrorContext(context);
		}

		if (error instanceof ValidationError) {
			context.status(400, 'Bad Request');
			return new ValidationErrorContext(error, context.body, context);
		}

		return new InternalServerErrorContext(error, context);
	}

	async #handleError(
		error: unknown,
		context: AnyContext
	): Promise<RouteResult> {
		if (this.#errorHandler) {
			const pulsarError =
				error instanceof PulsarError ? error : new InternalServerError(error);
			const errorContext = this.#getErrorContextFromError(pulsarError, context);
			const errorResponse = await this.#errorHandler(errorContext);
			errorContext.setResponseBody(errorResponse);
			return errorContext.processResponse();
		}

		throw error;
	}

	#createRouteBuilder<TMethod extends HttpMethod>(method: TMethod) {
		return (...args: any) => {
			const { path, schemas, handler } = extractArgs(...args);

			const fullPath = `${this.#config.baseUrl}${path}` as Path;
			const bodySchema = schemas.body ? z.object(schemas.body) : undefined;

			this.#router.add(method, fullPath, (request, params) => {
				return this.#runHandler(handler, {
					request,
					params,
					path,
					schemas: { query: schemas.query, body: bodySchema },
					parseInput: true,
				});
			});

			return this as any;
		};
	}

	public async fetch(request: Request): Promise<Response> {
		const pathname = new URL(request.url).pathname;
		const method = request.method.toUpperCase();
		const routeMatches = this.#router.match(method, pathname);

		let result: RouteResult;

		if (!routeMatches) {
			result = await this.#runHandler(
				() => {
					throw new NotFoundError(pathname);
				},
				{ request, params: {}, schemas: {}, path: pathname, parseInput: false }
			);
		} else if (routeMatches.handlers.length > 1) {
			throw new Error(`You have conflicts for path ${method} ${pathname}`);
		} else {
			const [handler] = routeMatches.handlers;
			result = await handler(request, routeMatches.params);
		}

		const { payload, ...responseInit } = result;
		return new Response(result.payload, responseInit);
	}

	public all: TRouter['all'] = this.#createRouteBuilder('ALL');
	public get: TRouter['get'] = this.#createRouteBuilder('GET');
	public post: TRouter['post'] = this.#createRouteBuilder('POST');
	public put: TRouter['put'] = this.#createRouteBuilder('PUT');
	public patch: TRouter['patch'] = this.#createRouteBuilder('PATCH');
	public delete: TRouter['delete'] = this.#createRouteBuilder('DELETE');
	public options: TRouter['options'] = this.#createRouteBuilder('OPTIONS');

	// @ts-expect-error TODO: Fix this
	public use: TRouter['use'] = (pathOrMiddleware, middlewareOrUndefined) => {
		let middleware: Middleware<TCtx>, path;

		if (typeof pathOrMiddleware === 'function') {
			[path, middleware] = ['*', pathOrMiddleware];
		} else {
			[path, middleware] = [pathOrMiddleware, middlewareOrUndefined];
		}

		const parentMiddleware = middlewareUtils.extract(middleware);
		const middlewareId = middlewareUtils.getId(middleware);
		// It may not have an id if it was a function
		if (!middlewareId) middlewareUtils.setId(middleware);

		this.#middlewareRouter.add(MIDDLEWARE_METHOD, path, [
			...parentMiddleware,
			middleware,
		]);

		return this as any;
	};

	public route: TRouter['route'] = (builder) => {
		return this.group<TPath, any, any, any>(this.#config.baseUrl, builder);
	};

	public group: TRouter['group'] = (basePath, builder) => {
		const baseUrl = `${this.#config.baseUrl}${basePath}` as const;
		const pulsar = new $Pulsar<typeof baseUrl, EmptyRoutes, TCtx, TErr>({
			...this.#config,
			baseUrl,
			parent: this,
			parentConfig: this.#config,
		});

		const builtRouter = builder(pulsar);

		builtRouter.routes.forEach(([method, path, handler]) =>
			this.#router.add(method, path, handler)
		);

		return this as any;
	};

	public onError: TRouter['onError'] = (errorHandler) => {
		this.#config.errorHandler = errorHandler;
		return this as any;
	};
}
