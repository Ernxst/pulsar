import type { Pulsar } from 'pulsar';
import { requiresAuth } from 'src/middleware';
import type { User } from 'src/types';
import { z } from 'zod';

export default function users(app: Pulsar) {
	return app.group('/users', (users) =>
		users
			// Notice no path is specified here, this is because the path is inherited
			// from the parent group (/users)
			.get(
				{
					query: {
						limit: z.coerce.number().int().positive().default(10),
						offset: z.coerce.number().int().positive().default(0),
					},
				},
				({ query: _, cache }) => {
					cache({ maxAge: '1min' });

					// Get all users
					return { users: [] as User[] };
				}
			)
			.post(
				{
					body: {
						username: z.string(),
						email: z.string().email(),
					},
				},
				({ body }) => {
					// Create user
					return { user: body as User };
				}
			)
			// Define a group of routes for a single user, helps to keep things organised
			.group('/:id', (user) =>
				user
					// Common middleware for all routes in this group
					.use(requiresAuth)
					.get(({ locals, cache }) => {
						// Cache the response for 1 minute
						cache({ maxAge: '1min' });

						// User should already be stored in locals
						return { user: locals.session.user };
					})
					.patch(
						{
							body: {
								username: z.string().optional(),
								email: z.string().optional(),
							},
						},
						({ body, params }) => {
							// Update user
							return { user: { ...body, id: params.id } };
						}
					)
					.delete(({ params, locals }) => {
						// Only allow deleting the current user
						if (params.id !== locals.session.user.id) {
							throw new Error('You are not authorised to delete this user');
						}

						// Delete user
						return { user: { id: params.id } };
					})
			)
	);
}
