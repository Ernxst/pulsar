import type { Path, QuerySchema } from 'src';
import type { MiddlewareContext } from 'src/router/Context/MiddlewareContext';
import type { Middleware } from './types';

export function compile<
	TPath extends Path,
	TQuery extends QuerySchema,
	TBody extends Record<string, any>,
	TContext extends Record<string, any>,
>(
	middleware: Middleware<any>[]
): (
	context: MiddlewareContext<TPath, TQuery, TBody, {}>
) => Promise<MiddlewareContext<TPath, TQuery, TBody, TContext>> {
	return async function runMiddleware(context) {
		let finalContext = context as MiddlewareContext<
			TPath,
			TQuery,
			TBody,
			TContext
		>;

		for (const middlewareFn of middleware) {
			const result = await middlewareFn(context);
			if (result) finalContext = Object.assign(finalContext, result);
		}

		return finalContext;
	};
}
