import Benchmark from 'benchmark';
import { makeEdgeEnv } from 'edge-mock';
import { Router as IttyRouter } from 'itty-router';
import { Sunder, Router as SunderRouter } from 'sunder';
import { Router as WorktopRouter } from 'worktop';
import { Hono } from 'hono';
import { Pulsar } from 'pulsar';

globalThis.Request = Request;
globalThis.Response = Response;

const pulsar = new Pulsar();

pulsar.get('/user', () => 'User');
pulsar.get('/user/comments', () => 'User Comments');
pulsar.get('/user/avatar', () => new Response('User Avatar'));
pulsar.get('/user/lookup/email/:address', () => 'User Lookup Email Address');
pulsar.get('/event/:id', () => 'Event');
pulsar.get('/event/:id/comments', () => 'Event Comments');
pulsar.post('/event/:id/comments', () => 'POST Event Comments');
pulsar.post('/status', () => 'Status');
pulsar.get(
	'/very/deeply/nested/route/hello/there',
	() => 'Very Deeply Nested Route'
);
pulsar.get(
	'/user/lookup/username/:username',
	(c) => `Hello ${c.params.username}`
);

const hono = new Hono();
hono.get('/user', () => new Response('User'));
hono.get('/user/comments', () => new Response('User Comments'));
hono.get('/user/avatar', () => new Response('User Avatar'));
hono.get(
	'/user/lookup/email/:address',
	() => new Response('User Lookup Email Address')
);
hono.get('/event/:id', () => new Response('Event'));
hono.get('/event/:id/comments', () => new Response('Event Comments'));
hono.post('/event/:id/comments', () => new Response('POST Event Comments'));
hono.post('/status', () => new Response('Status'));
hono.get(
	'/very/deeply/nested/route/hello/there',
	() => new Response('Very Deeply Nested Route')
);
hono.get('/user/lookup/username/:username', (c) => {
	return new Response(`Hello ${c.req.param('username')}`);
});

// itty-router
const ittyRouter = IttyRouter();
ittyRouter.get('/user', () => new Response('User'));
ittyRouter.get('/user/comments', () => new Response('User Comments'));
ittyRouter.get('/user/avatar', () => new Response('User Avatar'));
ittyRouter.get(
	'/user/lookup/email/:address',
	() => new Response('User Lookup Email Address')
);
ittyRouter.get('/event/:id', () => new Response('Event'));
ittyRouter.get('/event/:id/comments', () => new Response('Event Comments'));
ittyRouter.post(
	'/event/:id/comments',
	() => new Response('POST Event Comments')
);
ittyRouter.post('/status', () => new Response('Status'));
ittyRouter.get(
	'/very/deeply/nested/route/hello/there',
	() => new Response('Very Deeply Nested Route')
);
ittyRouter.get('/user/lookup/username/:username', ({ params }) => {
	return new Response(`Hello ${params.username}`, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain;charset=UTF-8',
		},
	});
});

// Sunder
const sunderRouter = new SunderRouter();
sunderRouter.get('/user', (ctx) => {
	ctx.response.body = 'User';
});
sunderRouter.get('/user/comments', (ctx) => {
	ctx.response.body = 'User Comments';
});
sunderRouter.get('/user/avatar', (ctx) => {
	ctx.response.body = 'User Avatar';
});
sunderRouter.get('/user/lookup/email/:address', (ctx) => {
	ctx.response.body = 'User Lookup Email Address';
});
sunderRouter.get('/event/:id', (ctx) => {
	ctx.response.body = 'Event';
});
sunderRouter.get('/event/:id/comments', (ctx) => {
	ctx.response.body = 'Event Comments';
});
sunderRouter.post('/event/:id/comments', (ctx) => {
	ctx.response.body = 'POST Event Comments';
});
sunderRouter.post('/status', (ctx) => {
	ctx.response.body = 'Status';
});
sunderRouter.get('/very/deeply/nested/route/hello/there', (ctx) => {
	ctx.response.body = 'Very Deeply Nested Route';
});
// sunderRouter.get('/static/*', () => {})
sunderRouter.get('/user/lookup/username/:username', (ctx) => {
	ctx.response.body = `Hello ${ctx.params.username}`;
});
const sunderApp = new Sunder();
sunderApp.use(sunderRouter.middleware);

// worktop
const worktopRouter = new WorktopRouter();
worktopRouter.add('GET', '/user', async (req, res) => res.send(200, 'User'));
worktopRouter.add('GET', '/user/comments', (req, res) =>
	res.send(200, 'User Comments')
);
worktopRouter.add('GET', '/user/avatar', (req, res) =>
	res.send(200, 'User Avatar')
);
worktopRouter.add('GET', '/user/lookup/email/:address', (req, res) =>
	res.send(200, 'User Lookup Email Address')
);
worktopRouter.add('GET', '/event/:id', (req, res) => res.send(200, 'Event'));
worktopRouter.add('POST', '/event/:id/comments', (req, res) =>
	res.send(200, 'POST Event Comments')
);
worktopRouter.add('POST', '/status', (req, res) => res.send(200, 'Status'));
worktopRouter.add('GET', '/very/deeply/nested/route/hello/there', (req, res) =>
	res.send(200, 'Very Deeply Nested Route')
);
worktopRouter.add('GET', '/user/lookup/username/:username', (req, res) =>
	res.send(200, `Hello ${req.params.username}`)
);

// Request Object
const request = new Request('http://localhost/user/lookup/username/hey', {
	method: 'GET',
});

makeEdgeEnv();

// FetchEvent Object
// eslint-disable-next-line no-undef
const event = new FetchEvent('fetch', { request });

async function fn() {
	let res = await hono.handleEvent(event);
	console.log(await res.text());
	res = await ittyRouter.handle(event.request);
	console.log(await res.text());
	res = await sunderApp.handle(event);
	console.log(await res.text());
	res = await worktopRouter.run(event);
	console.log(await res.text());
}
fn();

const suite = new Benchmark.Suite();

suite
	.add('Pulsar', async () => {
		await pulsar.fetch(event.request);
	})
	.add('Hono', async () => {
		await hono.handleEvent(event);
	})
	.add('itty-router', async () => {
		await ittyRouter.handle(event.request);
	})
	.add('sunder', async () => {
		await sunderApp.handle(event);
	})
	.add('worktop', async () => {
		await worktopRouter.run(event);
	})
	.on('cycle', (event) => {
		console.log(String(event.target));
	})
	.on('complete', function () {
		// eslint-disable-next-line @typescript-eslint/no-invalid-this
		console.log(`Fastest is ${this.filter('fastest').map('name')}`);
	})
	.run({ async: true });
