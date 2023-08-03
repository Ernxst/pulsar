import { getQueryParams } from 'hono/utils/url';
import { cacheHeader } from 'pretty-cache-header';
import type {
	Path,
	QuerySchema,
	RouteContext,
	Runtime,
	inferPathParams,
} from 'src';
import { inferContentType } from 'src/utils/contentType';
import { z } from 'zod';
import type { inferQuery } from '../types';

export interface RouteResult<TPayload extends object = any> {
	status: number;
	statusText: string;
	headers: Headers;
	payload: TPayload;
}

interface ContextOptions<TPath extends Path, TQuery extends QuerySchema> {
	request: Request;
	path: TPath;
	params: inferPathParams<TPath>;
	runtime: Runtime;
	query?: TQuery;
}

export type AnyContext = Context<any, any, any, any>;

export class Context<
	TPath extends Path = '',
	TQuery extends QuerySchema = {},
	TBody extends object = {},
	TContext extends object = {},
	TRouteCtx extends RouteContext<
		TPath,
		inferQuery<TQuery>,
		TBody,
		TContext
	> = RouteContext<TPath, inferQuery<TQuery>, TBody, TContext>,
> implements RouteContext<TPath, inferQuery<TQuery>, TBody, TContext>
{
	readonly #response: RouteResult;

	public readonly locals: TContext;
	public readonly request: Request;
	public readonly path: TPath;
	public readonly params: inferPathParams<TPath>;
	public readonly runtime: Runtime;
	public readonly query: inferQuery<TQuery>;
	public body: TBody;

	constructor(public readonly config: ContextOptions<TPath, TQuery>) {
		this.body = {} as TBody;
		this.locals = {} as TContext;

		this.#response = {
			status: 200,
			statusText: 'OK',
			headers: new Headers(),
			payload: undefined,
		};

		this.request = config.request;
		this.path = config.path;
		this.params = config.params;
		this.runtime = config.runtime;

		const queryParams = getQueryParams(this.request.url);
		const schema = config.query ? z.object(config.query) : undefined;
		this.query = schema ? schema.parse(queryParams) : (queryParams as any);
	}

	/**
	 * Apply the given context to this instance.
	 *
	 * This assumes you have already set the config on the current context
	 * instance.
	 * @internal
	 */
	protected fromContext(from: AnyContext) {
		const { status, statusText, payload, headers } = from.getResponse();

		this.headers(headers);
		this.status(status, statusText);
		this.setRequestBody(from.body);
		this.addLocals(from.locals);
		if (payload) this.setResponseBody(payload);
	}

	protected getResponse(): RouteResult {
		return this.#response;
	}

	public processResponse(): RouteResult {
		const data = { ...this.#response };

		const contentType = this.#response.headers.get('Content-Type');
		if (
			contentType &&
			contentType.includes('application/json') &&
			typeof data.payload !== 'string'
		) {
			data.payload = JSON.stringify(data.payload) as any;
		}

		return data;
	}

	public addLocals<TNewLocals extends object>(locals: TNewLocals) {
		Object.assign(this.locals, locals);
	}

	public setRequestBody(body: TBody) {
		this.body = body;
	}

	public setResponseBody<TNewBody>(body: TNewBody) {
		if (!this.#response.headers.has('Content-Type')) {
			const contentType = inferContentType(body);
			this.headers('Content-Type', contentType);
		}

		this.#response.payload = body;
	}

	// Methods
	public status: TRouteCtx['status'] = (status, statusText) => {
		this.#response.status = status;
		if (statusText) {
			this.#response.statusText = statusText;
		}
		// TODO: Add status text lookup
	};

	public cache: TRouteCtx['cache'] = (options) => {
		const headers = cacheHeader(options);
		this.#response.headers.append('Cache-Control', headers);
	};

	public redirect: TRouteCtx['redirect'] = (url, status = 302) => {
		this.#response.status = status;
		this.#response.headers.set('Location', url.toString());
	};

	public headers: TRouteCtx['headers'] = ((...args: any[]) => {
		if (args.length === 0) {
			return this.#response.headers;
		} else if (args.length === 1) {
			const [arg] = args;

			if (typeof arg === 'string') {
				return this.#response.headers.get(arg) ?? undefined;
			}

			if (arg instanceof Headers) {
				for (const [key, value] of arg.entries()) {
					this.#response.headers.set(key, value);
				}
			} else if (typeof arg === 'object') {
				for (const [key, value] of Object.entries(arg)) {
					this.#response.headers.set(key, String(value));
				}
			} else if (Array.isArray(arg)) {
				for (const [key, value] of arg) {
					this.#response.headers.set(key, String(value));
				}
			} else {
				throw new TypeError('Invalid headers init');
			}
		} else if (args.length === 2) {
			const [name, value] = args;
			if (!value) {
				this.#response.headers.delete(name);
			} else {
				this.#response.headers.set(name, String(value));
			}
		} else {
			throw new TypeError('Invalid arguments');
		}
	}) as any;

	// Response shortcuts
	public json: TRouteCtx['json'] = (body) => {
		this.#response.headers.set(
			'Content-Type',
			'application/json; charset=utf-8'
		);
		this.#response.payload = JSON.stringify(body);
		return body;
	};

	public html: TRouteCtx['html'] = (body) => {
		this.#response.headers.set('Content-Type', 'text/html; charset=utf-8');
		this.#response.payload = body;
		return body;
	};

	public text: TRouteCtx['text'] = (body) => {
		this.#response.headers.set('Content-Type', 'text/plain');
		this.#response.payload = body;
		return body;
	};

	public xml: TRouteCtx['xml'] = (body) => {
		this.#response.headers.set('Content-Type', 'application/xml');
		this.#response.payload = body;
		return body;
	};

	public binary: TRouteCtx['binary'] = (body) => {
		this.#response.headers.set('Content-Type', 'application/octet-stream');
		this.#response.payload = body;
		return body;
	};
}
