import { Pulsar, type inferErrorShape, type inferRouterContext } from 'pulsar';

// Nested route
function book(pulsar: Pulsar) {
	return pulsar.group('/book', (book) =>
		book
			.get('/', () => 'List Books')
			.get('/:id', ({ params }) => `Get Book: ${params.id}`)
			.post('/', () => 'create book')
	);
}

const appRouter = new Pulsar()
	// Add X-message header
	.use('/hello/*', async ({ headers, next }) => {
		headers('X-message', 'This is addHeader middleware!');
		return next();
	})
	// Add X-Response-Time header
	.use(async ({ next, headers }) => {
		const start = Date.now();
		const result = await next();
		const ms = Date.now() - start;

		headers('X-Response-Time', `${ms}ms`);

		return result;
	})
	// Custom error handler
	.onError(({ status, ...ctx }) => {
		if (ctx.code === 'NOT_FOUND') {
			status(404);
			return 'Custom 404 Not Found';
		}

		if (ctx.code === 'VALIDATION') {
			status(400);
			return 'Custom Validation Error Message';
		}

		console.error(`${ctx.error}`);
		status(500);
		return 'Custom 500 Internal Server Error';
	})
	// Routing
	.get('/', () => 'Hono!!')
	// Use Response object directly
	.get('/hello', () => 'This is /hello')
	// Named parameter
	.get('/entry/:id', ({ params }) => `Entry ID: ${params.id}`)
	// Nested route
	.route(book)
	// Redirect
	.get('/redirect', ({ redirect }) => redirect('/'))
	// Authentication required
	.get('/auth/*', () => 'You are authorized')
	// ETag
	.get('/etag/cached', () => 'Is this cached?')
	// Async
	.get('/fetch-url', async () => {
		const response = await fetch('https://example.com/');
		return `https://example.com/ is ${response.status}`;
	})
	// Request headers
	.get('/user-agent', ({ headers }) => {
		const userAgent = headers('User-Agent');
		return `Your UserAgent is ${userAgent}`;
	})
	// JSON
	.get('/api/posts', () => [
		{ id: 1, title: 'Good Morning' },
		{ id: 2, title: 'Good Aternoon' },
		{ id: 3, title: 'Good Evening' },
		{ id: 4, title: 'Good Night' },
	])
	// status code
	.post('/api/posts', ({ status }) => {
		status(201);
		return { message: 'Created' };
	})
	// default route
	.get('/api/*', ({ status }) => {
		status(404);
		return 'API endpoint is not found';
	})
	// Throw Error
	.get('/error', () => {
		throw new Error('Error has occurred');
	})
	.get('/type-error', () => 'return not Response instance');

export type AppRouter = typeof appRouter;
export type Context = inferRouterContext<AppRouter>;
export type ErrorShape = inferErrorShape<AppRouter>;

export default {
	fetch(request: Request) {
		return appRouter.fetch(request);
	},
};
