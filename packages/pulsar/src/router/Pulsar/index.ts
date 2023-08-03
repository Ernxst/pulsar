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

export class $Pulsar<
	TPath extends Path = '',
	TRoutes extends RouteTree = EmptyRoutes,
	TCtx extends object = {},
	TErr extends object = {},
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

	constructor(config: Options<TPath, TRoutes, TCtx, TErr>) {
		this.#config = config;
		this.#router = new SmartRouter({
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

	#validateInput(input: any, bodySchema?: AnyZodObject) {
		if (bodySchema) {
			const parseResult = bodySchema.safeParse(input);
			if (!parseResult.success) {
				throw new ValidationError(parseResult.error);
			}

			return parseResult.data;
		}

		return input;
	}

	async #applyMiddleware<
		Ctx extends AnyMiddlewareContext,
		TReturn extends RouteResult,
	>(context: Ctx, callback: (ctx: Ctx) => Promise<TReturn>) {
		const middleware = this.#config.middleware['*'] || [];
		middleware.push(...(this.#config.middleware[context.path] || []));

		// Compile middleware into single function
		const handler = compile(middleware, callback);
		const responsePromise = handler(context);

		// Apply middleware and handle middleware errors
		const [error, response] = await asyncify(responsePromise);
		if (error) return this.#handleError(error, context);

		context.setResponseBody(response);
		return context.getResponse();
	}

	async #runHandler<Ctx extends AnyMiddlewareContext, const TReturn>(
		callback: (ctx: Ctx) => Promisable<TReturn>,
		options: Pick<Ctx, 'request' | 'params' | 'path'> & {
			schemas: { query?: QuerySchema; body?: AnyZodObject };
			parseInput: boolean;
		}
	) {
		// Wrapper function around the handler to handle errors and return response
		const handler = async (handlerContext: Ctx) => {
			const handleRequest = async () => await callback(handlerContext);
			const [routeError, routeResponse] = await asyncify(handleRequest());
			if (routeError) return this.#handleError(routeError, handlerContext);

			handlerContext.setResponseBody(routeResponse);
			return handlerContext.getResponse();
		};

		const { schemas, parseInput, ...opts } = options;

		// Build raw context to pass to middleware
		const context = new MiddlewareContext({
			runtime: this.#runtime,
			query: schemas.query,
			...opts,
		}) as Ctx;

		// Parse request body and validate if necessary
		const validate = async () => {
			const rawBody = await parseBody(context.request);
			return parseInput
				? this.#validateInput(rawBody, schemas.body)
				: (rawBody as any);
		};

		const [parseError, parsedReqBody] = await asyncify(validate());
		if (parseError) return this.#handleError(parseError, context);
		context.setRequestBody(parsedReqBody);

		return await this.#applyMiddleware(context, handler);
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
		if (this.#config.errorHandler) {
			const pulsarError =
				error instanceof PulsarError ? error : new InternalServerError(error);
			const errorContext = this.#getErrorContextFromError(pulsarError, context);
			const response = await this.#config.errorHandler(errorContext);

			errorContext.setResponseBody(response);
			return errorContext.getProcessedResponse();
		}

		throw error;
	}

	#createRouteBuilder<TMethod extends HttpMethod>(method: TMethod) {
		return (...args: any) => {
			const { path, schemas, handler } = extractArgs(...args);

			const fullPath = `${this.#config.baseUrl}${path}` as Path;
			const bodySchema = schemas.body ? z.object(schemas.body) : undefined;

			this.#router.add(method, fullPath, async (request, params) => {
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
				{ request, params: {}, schemas: {}, path: '', parseInput: false }
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
		let middleware, path;

		if (typeof pathOrMiddleware === 'function') {
			[path, middleware] = ['*', pathOrMiddleware];
		} else {
			[path, middleware] = [pathOrMiddleware, middlewareOrUndefined];
		}

		this.#config.middleware[path] ??= [];
		this.#config.middleware[path].push(middleware);

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
