import type { CreateFetchOptions } from './fetch';

export function createURL(
	baseUrl: string,
	path: string,
	params: Record<string, string>,
	query: Record<string, string>
): URL {
	for (const [param, value] of Object.entries(params)) {
		path = path.replace(`:${param}`, value);
	}

	const match = path.match(/\/:([^/]+)/);
	if (match) {
		const param = match[1];
		throw new Error(`Missing dynamic URL parameter: ${param}`);
	}

	if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
	if (path.startsWith('/')) path = path.slice(1);

	const url = new URL(path, baseUrl);

	for (const [queryKey, value] of Object.entries(query)) {
		url.searchParams.append(queryKey, value);
	}

	return url;
}

function isIterator(obj: any): obj is Iterable<any> {
	return (
		obj !== null &&
		typeof obj === 'object' &&
		typeof obj[Symbol.iterator] === 'function'
	);
}

function iteratorToRecord(iterable: Iterable<Iterable<string>>) {
	const record: Record<string, string> = {};

	for (const innerIterable of iterable) {
		for (const [key, value] of innerIterable) {
			record[key] = value;
		}
	}

	return record;
}

export async function createHeaders(
	base: Required<CreateFetchOptions>['headers'],
	extra: HeadersInit = {}
) {
	const root = typeof base === 'function' ? await base() : base;
	const rootHeaders =
		root instanceof Headers ? Object.fromEntries(root.entries()) : root;

	const extras =
		extra instanceof Headers ? Object.fromEntries(extra.entries()) : extra;
	const extraHeaders = isIterator(extras) ? iteratorToRecord(extras) : extras;

	return { ...rootHeaders, ...extraHeaders };
}
