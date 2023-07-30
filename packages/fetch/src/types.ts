import type { HasOptionalKeys, HasRequiredKeys } from 'type-fest';
import type {
	AnyRouter,
	HttpMethod,
	Route,
	inferPathParams,
	inferRouteInput,
	inferRouteOutput,
	inferRouteQuery,
	inferRoutes,
} from 'pulsar';

export type GlobalFetchParams = NonNullable<Parameters<typeof fetch>[1]>;

export type FetchOptions<
	TMethod extends HttpMethod,
	TRoute extends Route<any, TMethod, any, any, any>,
> = AddParam<'body', inferRouteInput<TRoute>, false> &
	AddParam<'query', inferRouteQuery<TRoute>, false> &
	AddParam<'params', inferPathParams<TRoute['path']>, true> &
	Omit<GlobalFetchParams, 'body' | 'method' | 'query' | 'params'> & {
		method: TMethod;
	};

type AddParam<
	TKey extends string,
	TParams extends object,
	IsOptional extends boolean,
> = HasRequiredKeys<TParams> extends true
	? { [K in TKey]: TParams }
	: HasOptionalKeys<TParams> extends true
	? { [K in TKey]?: TParams }
	: IsOptional extends true
	? {}
	: { [K in TKey]?: TParams };

export interface Fetch<
	TRouter extends AnyRouter,
	TAllRoutes extends inferRoutes<TRouter> = inferRoutes<TRouter>,
> {
	/**
	 * Make a type-safe request to the given API endpoint.
	 *
	 * Path parameters will be inlined, and query parameters will be appended to the
	 * URL.
	 *
	 * The request body will be serialized automatically based on the `Content-Type`
	 * header according to the following rules:
	 * - `application/json` will be serialized as JSON
	 * - anything else will be sent as-is.
	 *
	 * The response body will be parsed automatically based on the `Content-Type`
	 * header according to the following rules:
	 * - `application/json` will be parsed as JSON
	 * - `application/x-www-form-urlencoded` will be parsed as a URL-encoded
	 * - `application/multipart-form-data` will be parsed as a multipart form
	 * - anything else will be returned as text.
	 *
	 * Note that this will not affect the return type of the function, which will
	 * always be inferred from the route definition.
	 */
	<TPath extends keyof TAllRoutes, TMethod extends keyof TAllRoutes[TPath]>(
		path: TPath,
		// @ts-expect-error it's fine
		init: FetchOptions<TMethod, TAllRoutes[TPath][TMethod]>
		// @ts-expect-error it's fine
	): inferRouteOutput<TAllRoutes[TPath][TMethod]>;
}
