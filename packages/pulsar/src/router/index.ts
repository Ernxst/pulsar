// @ts-nocheck
import type { Router } from './types';

export class Pulsar implements Router {
	_;
	get: Router['get'] = () => {};
	post: Router['post'] = () => {};
	put: Router['put'] = () => {};
	patch: Router['patch'] = () => {};
	delete: Router['delete'] = () => {};
	head: Router['head'] = () => {};
	options: Router['options'] = () => {};
	trace: Router['trace'] = () => {};
	onError: Router['onError'] = () => {};
	use: Router['use'] = () => {};
	group: Router['group'] = () => {};
	route: Router['route'] = () => {};

	// TODO: Type-safe fetch + fetch with just a regular request/url object
	// Adapter should be constructor arg
	// The fetch method should be implemented by adapters
	// e.g., the cloudflare worker adapter would have signature
	// (request: Request, context: ExecutionContext, env: Env) => Response
}
