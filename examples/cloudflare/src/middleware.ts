import { middleware } from 'pulsar';
import type { Session } from './types';

/**
 * Middleware to inject a {@linkcode Session} into the route context
 */
export const session = middleware().define(async ({ next }) => {
	// Get session from request
	return next({ session: null as Session | null });
});

/**
 * Middleware to require a valid, non-expired session for a route.
 * This also narrows the type of the route context so the
 * {@linkcode Session} is guaranteed to be present.
 */
export const requiresAuth = middleware()
	.use(session)
	.define(async ({ locals, next }) => {
		const { session } = locals;

		if (!session) {
			throw new Error('Not authenticated');
		}

		if (session.expiration < new Date()) {
			throw new Error('Session expired');
		}

		// Only return what's changed - this will be merged into the existing locals
		return next({ session });
	});
