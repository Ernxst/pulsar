// Taken from https://github.com/honojs/hono/blob/e851e9bd82428819c9e0344fb1a2d9cde6cb01b9/src/utils/cookie.ts
import type { Cookie, CookieOptions } from './types';

export function parse(cookie: string): Cookie {
	const pairs = cookie.split(/;\s*/g);
	const parsedCookie: Cookie = {};

	for (let i = 0, len = pairs.length; i < len; i++) {
		const pair = pairs[i].split(/\s*=\s*([^\s]+)/);
		parsedCookie[pair[0]] = decodeURIComponent(pair[1]);
	}

	return parsedCookie;
}

export function serialise(
	name: string,
	value: string,
	opt: CookieOptions = {}
): string {
	value = encodeURIComponent(value);
	let cookie = `${name}=${value}`;

	if (opt && typeof opt.maxAge === 'number' && opt.maxAge >= 0) {
		cookie += `; Max-Age=${Math.floor(opt.maxAge)}`;
	}

	if (opt.domain) {
		cookie += `; Domain=${opt.domain}`;
	}

	if (opt.path) {
		cookie += `; Path=${opt.path}`;
	}

	if (opt.expires) {
		cookie += `; Expires=${opt.expires.toUTCString()}`;
	}

	if (opt.httpOnly) {
		cookie += '; HttpOnly';
	}

	if (opt.secure) {
		cookie += '; Secure';
	}

	if (opt.sameSite) {
		cookie += `; SameSite=${opt.sameSite}`;
	}

	return cookie;
}
