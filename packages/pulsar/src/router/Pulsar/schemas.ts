import type { Path, QuerySchema } from 'src';

interface Validators {
	query?: QuerySchema;
	body?: QuerySchema;
}

type Handler = (...args: any) => any;

type Args =
	| [Handler]
	| [Path, Handler]
	| [Validators, Handler]
	| [Path, Validators, Handler];

export function extractArgs(...args: any[]) {
	const [first, second, third] = args as Args;

	if (typeof first === 'string') {
		if (typeof second === 'function') {
			return { path: first, schemas: {}, handler: second };
		}

		if (typeof second === 'object' && typeof third === 'function') {
			return { path: first, schemas: second, handler: third };
		}

		throw new Error('Invalid args');
	}

	if (typeof first === 'function') {
		return { path: '' as const, schemas: {}, handler: first };
	}

	if (typeof first === 'object') {
		if (typeof second === 'function') {
			return { path: '' as const, schemas: first, handler: second };
		}

		throw new Error('Invalid args');
	}

	throw new Error('Invalid args');
}
