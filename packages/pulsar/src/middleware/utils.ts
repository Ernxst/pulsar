import { type AnyMiddlewareContext } from 'src/router/Context/MiddlewareContext';
import type { Promisable } from 'type-fest';
import type { Middleware, MiddlewareResult } from './types';
import { middlewareUtils } from '.';

function dedupeMiddleware(middleware: Middleware<any>[]) {
	const seenIds = new Set<Symbol>();

	return middleware.filter((handler) => {
		const id = middlewareUtils.getId(handler);

		/**
		 * Now, I don't expect this to ever happen, but if it does, it's a bug
		 *
		 * The middleware builder is supposed to set an ID on the middleware
		 * when calling middleware().define()
		 *
		 * If the user passes a function directly to Pulsar.use(), it will
		 * not have an ID, but we set one in the router itself
		 *
		 * Safest thing to do is to just not dedupe middleware that doesn't have an ID
		 */
		if (!id) return true;

		if (seenIds.has(id)) {
			console.warn('Duplicate middleware detected', handler);
			return false;
		}

		seenIds.add(id);
		return true;
	});
}

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
	const deduped = dedupeMiddleware(middleware);
	const len = deduped.length;

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

			const handler = deduped[i];
			context.next = next.bind(context);

			const result = await handler(context);
			if (!result) throw new Error('Middleware did not return next() result');
			return result;
		}
	};
}
