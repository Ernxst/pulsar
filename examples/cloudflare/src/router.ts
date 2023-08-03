import type { inferErrorShape, inferRouterContext } from 'pulsar';
import { Pulsar } from 'pulsar';
import { sentry } from '@pulsar/sentry';
import { helmet } from '@pulsar/helmet';
import users from './routes/users';

export const appRouter = new Pulsar()
	// Built-in middleware
	.use(sentry({ dsn: '<SENTRY_DSN>' }))
	.use(helmet())
	// Custom middleware, injects a version into the route context
	.use(({ next }) => next({ version: 'v1' }))
	// Merge routes into the router
	.route(users)
	// Error handler, including 404
	.onError(({ status, cache, locals, ...ctx }) => {
		if (ctx.code === 'NOT_FOUND') {
			cache({ maxAge: '1h' });
			status(404);
			return { detail: `Not found: ${ctx.path.pathname}`, code: ctx.code };
		}

		if (ctx.code === 'VALIDATION') {
			status(400);
			return { detail: ctx.error.message, errors: [ctx.error], code: ctx.code };
		}

		console.error(ctx.error.cause);
		status(500);
		locals.sentry.captureException(ctx.error);

		return {
			detail: 'Something went wrong',
			error: ctx.error,
			code: ctx.code,
		};
	});

export type AppRouter = typeof appRouter;
export type Context = inferRouterContext<AppRouter>;
export type ErrorShape = inferErrorShape<AppRouter>;
