import type { HttpMethod, Middleware, Path, Pulsar, Route } from 'src';
import type { RouteResult } from '../Context';

export type MultiRoutes = Record<HttpMethod, Route<any, any, any, any, any>>;

export type RouteTree = Record<Path, MultiRoutes>;
type MiddlewareRegister = Record<string, Middleware<any>[]>;

export interface Options<
	TPath extends Path,
	TRoutes extends RouteTree,
	TCtx extends object,
	TErr extends object,
> {
	baseUrl: TPath;
	middleware: MiddlewareRegister;
	errorHandler?: Parameters<Pulsar<TPath, TRoutes, TCtx, TErr>['onError']>[0];
}

export type RouteHandler = (
	request: Request,
	params: Record<string, string>
) => Promise<RouteResult>;
