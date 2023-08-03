import { type AnyMiddlewareContext } from 'src/router/Context/MiddlewareContext';
import type { RouteResult } from 'src/router/Context';
import type { Middleware } from './types';

const RESULT_BRAND = Symbol('MiddlewareResult');

// Based on https://github.com/koajs/compose/blob/bff06e965caa71f3a1f4f6f6811290f7863c77ba/index.js

/**
 * Compile a list of middleware into a single function that
 * applies each middleware and modifies the context in place.
 */
export function compile<
	TContext extends AnyMiddlewareContext,
	TReturn extends RouteResult,
>(
	middleware: Middleware<any>[],
	callback?: (context: TContext) => Promise<TReturn>
) {
	const middlewareLength = middleware.length;
	const cb = callback ?? (() => Promise.resolve({}));

	return async (context: TContext) => {
		let index = -1;

		return dispatch(0) as Promise<TReturn>;

		async function dispatch(i: number) {
			if (i <= index) throw new Error('next() called multiple times');

			Object.assign(context, {
				// This method can only be called by middleware
				// If it's called by the route handler, it is a defect
				next(update: any) {
					if (update) context.addLocals(update);

					const promise = dispatch(i + 1);
					return promise.then((result) => {
						// If it has already been wrapped, don't wrap it again
						if ((result as any)[RESULT_BRAND]) return result;

						// Wrap the result in a brand so we can tell if it's a middleware result
						// This is faster than creating a new class and using instanceof
						return { [RESULT_BRAND]: true, data: result, ok: true };
					});
				},
			});

			index = i;
			const handler = middleware[i];

			const endOfChain = i >= middlewareLength;
			const promise = endOfChain ? cb(context) : handler(context);
			const output = await promise;

			if (output) {
				// Return middleware result as the result of the `next` function
				if (output && (output as any)[RESULT_BRAND]) return output;

				// Return route output back to the router
				return (output as RouteResult).payload;
			}

			// If we're not at the end of the chain (meaning we're calling the route
			// handler instead), and there is no output, it must mean the user
			// forgot to call `next()`
			if (!endOfChain)
				throw new Error('Middleware did not return next() result');

			return undefined;
		}
	};
}
