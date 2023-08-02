import type { MiddlewareContext as IMiddlewareContext, Path } from 'src';
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
	async next() {
		// TODO: implement
		throw new Error('Not implemented');
	}
}
