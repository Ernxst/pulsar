import type { Path } from 'src';
import { $Pulsar } from './Pulsar';
import { type RouteTree } from './Pulsar/types';
import type { EmptyRoutes } from './types';

// Extend another class so we can hide the constructor

export class Pulsar<
	TPath extends Path = '',
	TRoutes extends RouteTree = EmptyRoutes,
	TCtx extends object = {},
	TErr = {},
> extends $Pulsar<TPath, TRoutes, TCtx, TErr> {
	constructor() {
		super({ baseUrl: '' as TPath });
	}
}
