import { compile } from 'src/middleware/utils';
import { parseBody } from 'src/utils/parseBody';
import { type AnyZodObject, z } from 'zod';
import { asyncify } from 'src/utils/asyncify';
import type { HttpMethod, Path, Promisable, Runtime } from 'src/types/util';
import {
	InternalServerError,
	NotFoundError,
	PulsarError,
	ValidationError,
} from 'src/errors';
import { SmartRouter } from 'hono/router/smart-router';
import { RegExpRouter } from 'hono/router/reg-exp-router';
import { TrieRouter } from 'hono/router/trie-router';
import type { EmptyRoutes, Router } from '../types';
import { MiddlewareContext } from '../Context/MiddlewareContext';
import {
	InternalServerErrorContext,
	NotFoundErrorContext,
	ValidationErrorContext,
} from '../Context/ErrorContext';
import type { AnyContext, RouteResult } from '../Context';
import { extractArgs } from './schemas';
import type { Options, RouteHandler, RouteTree } from './types';

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

	async #applyMiddleware<TPath extends Path>(
		ctx: MiddlewareContext<TPath>,
		options: { path: TPath; parseInput: boolean; bodySchema?: AnyZodObject }
	) {
		const { path, bodySchema, parseInput } = options;

		// Parse request body
		const rawBody = await parseBody(ctx.request);
		const parsedReqBody = parseInput
			? this.#validateInput(rawBody, bodySchema)
			: (rawBody as any);

		ctx.setRequestBody(parsedReqBody);

		// Compile middleware into single function
		const allMiddleware = this.#config.middleware['*'] || [];
		allMiddleware.push(...(this.#config.middleware[path] || []));
		const middleware = compile(allMiddleware);

		// Run middleware and retrieve updated context
		const customUserContext = await middleware(ctx);
		ctx.addLocals(customUserContext);

		return ctx;
	}

	async #runHandler<Ctx extends AnyContext, const TReturn>(
		rawContext: Ctx,
		transformContextPromise: Promise<Ctx>,
		callback: (ctx: Ctx) => Promisable<TReturn>
	) {
		const [error, handlerContext] = await asyncify(transformContextPromise);
		if (error) return this.#handleError(error, rawContext);

		const handleRequest = async () => await callback(handlerContext);
		const [routeError, routeResponse] = await asyncify(handleRequest());

		// TODO: What about post-middleware?
		if (routeError) return this.#handleError(routeError, handlerContext);

		handlerContext.setResponseBody(routeResponse);
		return handlerContext.getResponse();
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
		const pulsarError =
			error instanceof PulsarError ? error : new InternalServerError(error);
		const errorContext = this.#getErrorContextFromError(pulsarError, context);

		if (this.#config.errorHandler) {
			const response = await this.#config.errorHandler(errorContext);
			errorContext.setResponseBody(response);
			return errorContext.getResponse();
		}

		const routeResult = errorContext.getResponse();
		const status = routeResult.status >= 400 ? routeResult.status : 500;
		const headers = routeResult.headers;
		const payload =
			routeResult.payload ??
			JSON.stringify({
				detail: 'Internal server error',
				error: pulsarError,
				statusCode: status,
			});

		// If there is no user payload, it means we're using our default error
		// And we know it's JSON (see above), so we can set the content type
		if (!routeResult.payload) {
			headers.set('Content-Type', 'application/json; charset=utf-8');
		}

		return { status, statusText: routeResult.statusText, headers, payload };
	}

	async #handleNotFound(request: Request): Promise<RouteResult> {
		const rawContext = new MiddlewareContext({
			runtime: this.#runtime,
			request,
			path: '',
			params: {},
		});

		const contextPromise = this.#applyMiddleware(rawContext, {
			path: '',
			parseInput: false,
		});

		return this.#runHandler(rawContext, contextPromise, () => {
			const pathname = new URL(request.url).pathname;
			throw new NotFoundError(pathname);
		});
	}

	#createRouteBuilder<TMethod extends HttpMethod>(method: TMethod) {
		return (...args: any) => {
			const { path, schemas, handler } = extractArgs(...args);

			const fullPath = `${this.#config.baseUrl}${path}` as Path;
			this.#config.middleware[fullPath] ??= [];

			const { body, query } = schemas;
			const bodySchema = body ? z.object(body) : undefined;

			this.#router.add(method, fullPath, async (request, params) => {
				const rawContext = new MiddlewareContext({
					runtime: this.#runtime,
					request,
					params,
					path: fullPath,
					query,
				});

				const contextPromise = this.#applyMiddleware(rawContext, {
					bodySchema,
					path: fullPath,
					parseInput: true,
				});

				return this.#runHandler(rawContext, contextPromise, handler);
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
			result = await this.#handleNotFound(request);
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
