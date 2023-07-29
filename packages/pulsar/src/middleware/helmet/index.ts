import helmetLib, { type HelmetOptions } from 'helmet';
import type { AnyRouteContext } from 'src/route/types';
import { middleware } from '..';

type Context = Pick<AnyRouteContext, 'headers'>;

function makeResponse(context: Context) {
	const res = context;

	return Object.assign(res, {
		setHeader(name: string, value: string) {
			context.headers(name, value);
		},

		removeHeader(name: string) {
			context.headers().delete(name);
		},

		end() {},
	});
}

function promisify(context: Context, options: HelmetOptions) {
	const middleware = helmetLib(options);

	return new Promise<Context>((resolve, reject) => {
		const ctx = makeResponse(context);

		// @ts-expect-error it is not an IncomingMessage
		middleware(context.request, ctx, (error: Error) => {
			if (error) {
				reject(error);
			} else {
				resolve(ctx);
			}
		});
	});
}

/**
 * Middleware to add {@linkcode helmet} headers to the response
 */
export function helmet(options: HelmetOptions) {
	return middleware().define((ctx) => {
		promisify(ctx, options);
	});
}
