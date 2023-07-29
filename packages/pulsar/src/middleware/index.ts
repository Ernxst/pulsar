import type { MiddlewareBuilder } from './types';

/**
 * Define a new middleware handler.
 */
export function middleware<TIn extends object = {}>() {
	// TODO: Add id to middleware fn so it is not possible to add the same middleware twice
	return {} as MiddlewareBuilder<TIn>;
}
