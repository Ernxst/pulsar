import type { Path } from 'src';
import { z } from 'zod';

const endpoint = z
	.string()
	.min(1)
	.startsWith('/', { message: 'must start with /' });

const pathDefn = z.union([z.literal(''), endpoint]);

const schemaDefn = z.object({
	query: z.record(z.string(), z.any()).optional(),
	body: z.record(z.string(), z.any()).optional(),
});

const handlerDefn = z.function();

const PATH_SCHEMA_AND_HANDLER = z.tuple([pathDefn, schemaDefn, handlerDefn]);
const PATH_AND_HANDLER = z.tuple([pathDefn, handlerDefn]);
const SCHEMA_AND_HANDLER = z.tuple([schemaDefn, handlerDefn]);
const HANDLER_ONLY = z.tuple([handlerDefn]);

// TODO: Using zod may be slow
export function extractArgs(...args: any) {
	const isPathSchemaAndHandler = PATH_SCHEMA_AND_HANDLER.safeParse(args);
	if (isPathSchemaAndHandler.success) {
		const [path, schemas, handler] = isPathSchemaAndHandler.data;
		return { path: path as Path, schemas, handler };
	}

	const isPathAndHandler = PATH_AND_HANDLER.safeParse(args);
	if (isPathAndHandler.success) {
		const [path, handler] = isPathAndHandler.data;
		return { path: path as Path, schemas: {}, handler };
	}

	const isSchemaAndHandler = SCHEMA_AND_HANDLER.safeParse(args);
	if (isSchemaAndHandler.success) {
		const [schemas, handler] = isSchemaAndHandler.data;
		return { path: '' as Path, schemas, handler };
	}

	const isHandlerOnly = HANDLER_ONLY.safeParse(args);
	if (isHandlerOnly.success) {
		const [handler] = isHandlerOnly.data;
		return { path: '' as Path, schemas: {}, handler };
	}

	throw new Error('Invalid args');
}
