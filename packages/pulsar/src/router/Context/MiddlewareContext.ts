import type { MiddlewareContext as IMiddlewareContext } from 'src/middleware/types';
import type { Path } from 'src/types/util';
import type { QuerySchema, inferQuery } from '../types';
import { Context } from '.';

export type AnyMiddlewareContext = MiddlewareContext<any>;

export class MiddlewareContext<
		TPath extends Path = '',
		TQuery extends QuerySchema = {},
		TBody extends object = {},
		TContext extends object = {},
	>
	extends Context<TPath, inferQuery<TQuery>, TBody, TContext>
	implements IMiddlewareContext<TContext>
{
	// This will be assigned in src/middleware/utils.ts
	public next!: IMiddlewareContext<TContext>['next'];
}
