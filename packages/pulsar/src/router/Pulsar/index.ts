import type { Handler, MiddlewareHandler } from 'hono';
import {
	InternalServerError,
	NotFoundError,
	PulsarError,
	ValidationError,
} from 'src/errors';
import type { HttpMethod, Path } from 'src/types/util';
import { type AnyZodObject, z } from 'zod';
import type { Middleware } from 'src';
import { middlewareUtils } from 'src/middleware';
import { type AnyContext, PulsarContext } from '../Context';
import {
	InternalServerErrorContext,
	NotFoundErrorContext,
	ValidationErrorContext,
} from '../Context/ErrorContext';
import type { MiddlewareContext } from '../Context/MiddlewareContext';
import type { EmptyRoutes, Router } from '../types';
import type { Options, RouteTree } from './types';
import { extractArgs } from './utils';

const CONTEXT_KEY = 'context';

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

	constructor(config: Options<TPath, TRoutes, TCtx, TErr>) {
		this.#config = config;
		this.#config.hono
			.notFound(({ req }) => {
				throw new NotFoundError(req.path);
			})
			.onError(async (error, { req, runtime, get }) => {
				const context: AnyContext =
					get(CONTEXT_KEY) ??
					// TODO: This should really just extend Hono's context
					new PulsarContext({
						request: req.raw,
						path: req.path as Path,
						query: req.query(),
						params: req.param(),
						runtime,
						body: await req.parseBody(),
					});

				return this.#handleError(error, context);
			});
	}

	// istanbul ignore next
	public get routes(): {
		path: string;
		method: string;
		handler: Handler<any, any, any, any> | MiddlewareHandler<any, any, any>;
	}[] {
		return this.#config.hono.routes;
	}

	public readonly _: TRouter['_'] = undefined as any;

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

	#validateInput(rawBody: unknown, options: { schema?: AnyZodObject }) {
		if (options.schema) {
			const parseResult = options.schema.safeParse(rawBody);
			if (!parseResult.success) {
				throw new ValidationError(parseResult.error);
			}

			return parseResult.data;
		}

		return rawBody as any;
	}

	// TODO: Use object assignment instead of new instance
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

	async #handleError(error: unknown, context: AnyContext): Promise<Response> {
		if (this.#errorHandler) {
			const pulsarError =
				error instanceof PulsarError ? error : new InternalServerError(error);
			const errorContext = this.#getErrorContextFromError(pulsarError, context);

			const errorResponse = await this.#errorHandler(errorContext);
			errorContext.setResponseBody(errorResponse);

			const { payload, ...res } = errorContext.processResponse();
			return new Response(payload, res);
		}

		throw error;
	}

	#createRouteBuilder(method: HttpMethod) {
		return (...args: any) => {
			const { path, schemas, handler } = extractArgs(...args);

			const fullPath = `${this.#config.baseUrl}${path}` as Path;
			const bodySchema = schemas.body ? z.object(schemas.body) : undefined;
			const querySchema = schemas.query ? z.object(schemas.query) : undefined;

			const lower = method.toLowerCase() as 'get';
			const fn = this.#config.hono[lower].bind(this.#config.hono);

			fn(fullPath, async ({ runtime, req, get, set }) => {
				const request = req.raw;

				const query = req.query();
				const parsedQuery = this.#validateInput(query, { schema: querySchema });

				const rawBody = await req.parseBody();
				const input = this.#validateInput(rawBody, { schema: bodySchema });

				const context: AnyContext =
					get(CONTEXT_KEY) ??
					// get(CONTEXT_KEY) returns nothing if no middleware was used
					new PulsarContext({
						runtime,
						request,
						query: parsedQuery,
						path: req.path as any,
						params: req.param(),
						body: input,
					});

				context.query = parsedQuery;
				context.body = input;
				set(CONTEXT_KEY, context);

				const response = await handler(context);
				context.setResponseBody(response);

				const { payload, ...res } = context.processResponse();
				return new Response(payload, res);
			});

			return this as any;
		};
	}

	public async fetch(request: Request) {
		return this.#config.hono.fetch(request);
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

		const fullPath = `${this.#config.baseUrl}${path}` as Path;

		[...parentMiddleware, middleware].forEach((handler) => {
			this.#config.hono.use(
				fullPath,
				async ({ req, runtime, get, set }, next) => {
					const context: MiddlewareContext<any, any, any, TCtx> =
						get(CONTEXT_KEY) ??
						// get(CONTEXT_KEY) returns nothing if this is the first middleware
						// TODO: This should really just extend Hono's context
						new PulsarContext({
							runtime,
							query: req.query(),
							path: req.path as any,
							request: req.raw,
							params: req.param() as any,
							body: await req.parseBody(),
						});

					context.next = next;
					set(CONTEXT_KEY, context);

					const result = await handler(context);
					console.log({ result });
					if (result) context.addLocals(result);

					await next();
				}
			);
		});

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
			parentConfig: this.#config,
			hono: this.#config.hono,
		});

		const builtRouter = builder(pulsar);

		builtRouter.routes.forEach(({ method, path, handler }) => {
			const lower = method.toLowerCase() as 'get';
			const fn = this.#config.hono[lower].bind(this.#config.hono);
			fn(path, handler);
		});

		return this as any;
	};

	public onError: TRouter['onError'] = (errorHandler) => {
		this.#config.errorHandler = errorHandler;
		return this as any;
	};
}
