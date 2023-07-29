import type { cacheHeader } from 'pretty-cache-header';
import type {
	HttpMethod,
	Path,
	Platform,
	Promisable,
	inferPathParams,
} from '../types/util';

export type RedirectStatus = 301 | 302 | 303 | 307 | 308;

export type CacheOptions = Parameters<typeof cacheHeader>[0];

export interface RouteContext<
	TPath extends Path,
	TQuery extends Record<string, string> | Record<string, string | undefined>,
	TBody extends object,
	TContext extends object,
> {
	/**
	 * The platform the request is running on. This is set by the adapter used.
	 */
	platform: Platform;
	/**
	 * The (relative) path of the request (i.e., {@linkcode URL.pathname})
	 */
	path: TPath;
	/**
	 * The query parameters, parsed from the URL, as an object. To access the
	 * query string as a string, use {@linkcode Request.url.search}
	 */
	query: TQuery;
	/**
	 * The request parameters, parsed from the path.
	 */
	params: inferPathParams<TPath>;
	/**
	 * The request body, parsed as JSON (from `req.body` depending on the content
	 * type).
	 */
	body: TBody;
	/**
	 * The original request object.
	 */
	request: Request;
	/**
	 * Your custom context object, as returned from the middleware.
	 */
	locals: TContext;
	/**
	 * Redirect to a new path. You can either throw or return this.
	 */
	redirect(path: string, status?: RedirectStatus): void;
	/**
	 * Set the response status code.
	 */
	status(status: number): void;
	/**
	 * Apply a cache header to the response. This will append to any existing
	 * cache headers.
	 */
	cache(options: CacheOptions): void;
	headers: {
		/**
		 * Get all request headers.
		 */
		(): Headers;
		/**
		 * Merge headers into the response.
		 */
		(headers: HeadersInit): void;
		/**
		 * Get a request header value.
		 */
		(name: string): string | undefined;
		/**
		 * Set a response header, appending to any existing values.
		 */
		(name: string, value: string): void;
	};

	/**
	 * Sets the response body and content type to `application/json`
	 */
	json<const TBody extends object>(body: TBody): TBody;
	/**
	 * Sets the response body and content type to `text/html`
	 */
	html<THtml extends string>(body: THtml): THtml;
	/**
	 * Sets the response body and content type to `text/plain`
	 */
	text<const TString extends string>(body: TString): TString;
	/**
	 * Sets the response body and content type to `application/xml`
	 */
	xml<TString extends string>(body: TString): TString;
	/**
	 * Sets the response body and content type to `application/octet-stream`
	 */
	binary<TData extends ArrayBuffer | SharedArrayBuffer | Blob | FormData>(
		body: TData
	): TData;
}

export interface Route<
	TPath extends Path,
	TMethod extends HttpMethod,
	TQuery extends Record<string, string>,
	TBody extends object,
	TOut,
> {
	path: TPath;
	method: TMethod;
	handler(context: RouteContext<TPath, TQuery, TBody, any>): Promisable<TOut>;
}

export type AnyRoute = Route<any, any, any, object, unknown>;
export type AnyRouteContext = RouteContext<any, any, any, any>;

export type inferRouteInput<TRoute extends AnyRoute> =
	inferRouteContext<TRoute>['body'];

export type inferRouteOutput<TRoute extends AnyRoute> = ReturnType<
	TRoute['handler']
>;

export type inferRouteContext<TRoute extends AnyRoute> = Parameters<
	TRoute['handler']
>[0];

export type inferRouteQuery<TRoute extends AnyRoute> =
	inferRouteContext<TRoute>['query'];
