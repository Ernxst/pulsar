import type { AnyRouter, ExtractRoutes, Router } from '../router/types';

/**
 * The platform the router is running on
 */
export type Platform = 'workerd' | 'vercel' | 'node' | 'lambda';

export type HttpMethod =
	| 'GET'
	| 'POST'
	| 'PUT'
	| 'PATCH'
	| 'DELETE'
	| 'HEAD'
	| 'OPTIONS'
	| 'TRACE';

export type Promisable<T> = T | Promise<T>;

/**
 * A path, starting with a slash, or the empty string.
 */
export type Path = `/${string}` | '';

export type inferRoutes<TRouter extends AnyRouter> = {
	[K in keyof ExtractRoutes<TRouter>]: ExtractRoutes<TRouter>[K] extends Router<
		infer _,
		infer __,
		infer ___,
		infer ____
	>
		? inferRoutes<ExtractRoutes<TRouter>[K]>
		: ExtractRoutes<TRouter>[K];
};

export type inferRouterContext<TRouter extends AnyRouter> =
	TRouter['_']['context'];

export type inferErrorShape<TRouter extends AnyRouter> =
	TRouter['_']['errorShape'];

export type inferPathParams<TPath extends Path> = {
	[K in ParamKeys<TPath>]: string;
} & {};

// Taken from Hono
type ParamKeyName<NameWithPattern> =
	NameWithPattern extends `${infer Name}{${infer _Pattern}`
		? Name
		: NameWithPattern;

type ParamKey<Component> = Component extends `:${infer NameWithPattern}`
	? ParamKeyName<NameWithPattern>
	: never;

type ParamKeys<Path> = Path extends `${infer Component}/${infer Rest}`
	? ParamKey<Component> | ParamKeys<Rest>
	: ParamKey<Path>;
