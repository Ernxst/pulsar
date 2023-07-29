import type { ErrorCode } from './types';

export const ErrorCodeToStatus = {
	NOT_FOUND: 404,
	VALIDATION: 400,
	INTERNAL_SERVER_ERROR: 500,
	UNKNOWN: 500,
} as const satisfies Record<ErrorCode, number>;

export class PulsarError<TCode extends ErrorCode> extends Error {
	public readonly code: TCode;
	public readonly status: (typeof ErrorCodeToStatus)[TCode];

	constructor(code: TCode, message: string) {
		super(message);

		this.code = code;
		this.status = ErrorCodeToStatus[code];
		this.name = 'PulsarError';
	}
}

export class NotFoundError extends PulsarError<'NOT_FOUND'> {
	constructor(message: string) {
		super('NOT_FOUND', message);

		this.name = 'NotFoundError';
	}
}

export class ValidationError extends PulsarError<'VALIDATION'> {
	constructor(message: string) {
		super('VALIDATION', message);

		this.name = 'ValidationError';
	}
}

export class InternalServerError extends PulsarError<'INTERNAL_SERVER_ERROR'> {
	constructor(message: string) {
		super('INTERNAL_SERVER_ERROR', message);

		this.name = 'InternalServerError';
	}
}

export class UnknownError extends PulsarError<'UNKNOWN'> {
	constructor(message: string) {
		super('UNKNOWN', message);

		this.name = 'UnknownError';
	}
}
