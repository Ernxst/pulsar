import type { AnyRouter } from 'src/router/types';
import { parseBody } from 'src/utils';
import type { Promisable } from 'type-fest';
import type { Fetch, GlobalFetchParams } from './types';
import { createHeaders, createURL } from './utils';

export interface CreateFetchOptions {
	/**
	 * The base URL of the API
	 */
	url: string;
	/**
	 * Add polyfill for fetch
	 *
	 * Defaults to the global fetch implementation
	 *
	 * Note, if you are on a Node version lower than v16.5.0, you **must**
	 * provide a fetch polyfill as the global fetch was added in Node 18.
	 *
	 * If you are on Node v16.5.0 or newer, if you use the `--experimental-fetch`
	 * flag, you will not need to add a polyfill. See
	 * https://nodejs.org/fa/blog/release/v16.15.0/
	 */
	fetch?: typeof fetch;
	/**
	 * Headers to be set on outgoing requests / callback
	 */
	headers?:
		| Record<string, string>
		| Headers
		| (() => Promisable<Record<string, string> | Headers>);
	/**
	 * Provide a custom {@linkcode AbortController} instance (e.g., use a global
	 * instance instead of a local one)
	 */
	abortController?: AbortController;
}

interface Options extends GlobalFetchParams {
	params?: Record<string, string>;
	query?: Record<string, string>;
}

/**
 * Create a type-safe fetch function based on your router definition.
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
export function createFetch<TRouter extends AnyRouter>(
	options: CreateFetchOptions
): Fetch<TRouter> {
	const {
		url: baseUrl,
		fetch: fetchImpl = fetch,
		headers: baseHeaders = {},
		abortController = new AbortController(),
	} = options;

	async function typeSafeFetch(path: string, init: Options) {
		const { body, method, params = {}, query = {}, headers, ...rest } = init;
		const reqUrl = createURL(baseUrl, path, params, query);
		const allHeaders = await createHeaders(baseHeaders, headers);

		const contentType = allHeaders['Content-Type'];
		const reqBody = contentType?.startsWith('application/json')
			? JSON.stringify(body)
			: body;

		const response = await fetchImpl(reqUrl, {
			signal: abortController.signal,
			...rest,
			body: reqBody,
			method,
			headers: allHeaders,
		});

		return await parseBody(response);
	}

	return typeSafeFetch as unknown as Fetch<TRouter>;
}
