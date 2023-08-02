import type { ZodError } from 'zod';
import type { ErrorCode } from './types';

export const ErrorCodeToStatus = {
	NOT_FOUND: 404,
	VALIDATION: 400,
	INTERNAL_SERVER_ERROR: 500,
} as const satisfies Record<ErrorCode, number>;

export class PulsarError<TCode extends ErrorCode = ErrorCode> extends Error {
	public readonly code: TCode;
	public readonly status: (typeof ErrorCodeToStatus)[TCode];

	constructor(code: TCode, ...args: ConstructorParameters<typeof Error>) {
		super(...args);

		this.code = code;
		this.status = ErrorCodeToStatus[code];
		this.name = 'PulsarError';
	}
}

export class NotFoundError extends PulsarError<'NOT_FOUND'> {
	constructor(path: string) {
		super('NOT_FOUND', `Could not find resource at ${path}`);

		this.name = 'NotFoundError';
	}
}

export class ValidationError extends PulsarError<'VALIDATION'> {
	constructor(error: ZodError) {
		super('VALIDATION', 'Validation error', { cause: error });

		this.name = 'ValidationError';
	}
}

export class InternalServerError extends PulsarError<'INTERNAL_SERVER_ERROR'> {
	constructor(error: unknown) {
		super('INTERNAL_SERVER_ERROR', 'An error occurred', { cause: error });

		this.name = 'InternalServerError';
	}
}
