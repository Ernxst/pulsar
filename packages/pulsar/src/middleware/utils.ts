import { type AnyMiddlewareContext } from 'src/router/Context/MiddlewareContext';
import type { Promisable } from 'type-fest';
import type { Middleware, MiddlewareResult } from './types';

// Based on https://github.com/koajs/compose/blob/bff06e965caa71f3a1f4f6f6811290f7863c77ba/index.js

/**
 * Compile a list of middleware into a single function that
 * applies each middleware and modifies the context in place.
 */
export function compile<
	TContext extends AnyMiddlewareContext,
	TReturn extends object,
>(
	middleware: Middleware<any>[],
	callback?: (context: TContext) => Promisable<TReturn>
): (context: TContext) => Promise<MiddlewareResult<TReturn>> {
	const len = middleware.length;

	return (context: TContext) => {
		let index = -1;
		return dispatch(0);

		async function dispatch(i: number) {
			if (i <= index) throw new Error('next() called multiple times');
			index = i;

			if (i === len) {
				const result = await callback?.(context);
				return { data: result, ok: true as const };
			}

			function next(update?: any) {
				if (update) context.addLocals(update);
				return dispatch(i + 1);
			}

			const handler = middleware[i];
			context.next = next.bind(context);

			const result = await handler(context);
			if (!result) throw new Error('Middleware did not return next() result');
			return result;
		}
	};
}
