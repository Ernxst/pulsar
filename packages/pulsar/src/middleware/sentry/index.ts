import { type Options, Toucan } from 'toucan-js';
import { middleware } from '..';

class MockContext implements ExecutionContext {
	passThroughOnException(): void {
		throw new Error('Method not implemented.');
	}

	async waitUntil(promise: Promise<any>): Promise<void> {
		await promise;
	}
}

export type { Toucan, Options } from 'toucan-js';

/**
 * Middleware to interact with Sentry in a request. It also logs any
 * internal server errors to Sentry.
 */
export function sentry(opts: Options, callback?: (sentry: Toucan) => void) {
	return middleware().define(({ request }) => {
		const sentry = new Toucan({ request, context: new MockContext(), ...opts });

		if (callback) callback(sentry);
		return { sentry };
	});
}
