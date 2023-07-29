import type { RouteContext } from '../route/types';
import type { Path, Promisable } from '../types/util';
import type { ValidationError } from '.';

export interface ErrorHandler<
	TContext extends object = {},
	TErrorResponse extends object = {},
> {
	/**
	 * Handle an error, returning a response. This is useful for standardising
	 * error responses to make them easier to unwrap in the client.
	 */
	(context: ErrorContext<TContext>): Promisable<TErrorResponse>;
}

export type ErrorCode =
	| 'NOT_FOUND'
	| 'VALIDATION'
	| 'INTERNAL_SERVER_ERROR'
	| 'UNKNOWN';

export type ErrorContext<TLocals extends object = {}> = (
	| NotFoundContext
	| ValidationErrorContext
	| InternalServerErrorContext
	| UnknownErrorContext
) &
	Omit<
		RouteContext<
			Path,
			Record<string, string | undefined>,
			Record<string, unknown>,
			TLocals
		>,
		'path'
	> & {
		request: Request;
	};

export interface NotFoundContext {
	code: 'NOT_FOUND';
	path: URL;
}

export interface ValidationErrorContext {
	code: 'VALIDATION';
	error: ValidationError;
	input: unknown;
}

export interface InternalServerErrorContext {
	code: 'INTERNAL_SERVER_ERROR';
	error: Error;
}

export interface UnknownErrorContext {
	code: 'UNKNOWN';
	error: Error;
}
