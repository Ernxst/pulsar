import { middleware } from '..';
import type { Cookie, CookieOptions } from './types';

interface CookieContext {
	// TODO: Make sure this is all correct
	cookies: {
		get: {
			/**
			 * @returns All cookies
			 */
			(): Cookie;
			/**
			 * @returns The cookie with the given name
			 */
			(name: string): Cookie | undefined;
		};
		/**
		 * Set a cookie. This will also append to the `Set-Cookie` header.
		 */
		set: (name: string, value: string, options?: CookieOptions) => void;
		delete: {
			/**
			 * Delete all cookies. This will also clear the `Set-Cookie` header.
			 */
			(): void;
			/**
			 * Delete a cookie. This will also append to the `Set-Cookie` header.
			 */
			(name: string): void;
		};
	};
}

export type { Cookie, CookieOptions } from './types';
export { parse, serialise } from './utils';

/**
 *
 * @returns A middleware that adds cookie support to the context object.
 */
export function cookies() {
	return middleware().define(() => {
		return {} as CookieContext;
	});
}
