import type { HttpMethod, Path, Pulsar, Route } from 'src';
import type { Hono } from 'hono';
import type { RouteResult } from '../Context';

export type MultiRoutes = Record<HttpMethod, Route<any, any, any, any, any>>;

export type RouteTree = Record<Path, MultiRoutes>;

export interface Options<
	TPath extends Path,
	TRoutes extends RouteTree,
	TCtx extends object,
	TErr,
> {
	baseUrl: TPath;
	errorHandler?: Parameters<Pulsar<TPath, TRoutes, TCtx, TErr>['onError']>[0];
	parentConfig?: Options<any, any, any, any>;
	hono: Hono<any, any, any>;
}

export type RouteHandler = (
	request: Request,
	params: Record<string, string>
) => Promise<RouteResult>;
