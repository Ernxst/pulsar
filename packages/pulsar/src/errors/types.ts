import type { QueryParams, RouteContext } from '../route/types';
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

export type ErrorCode = 'NOT_FOUND' | 'VALIDATION' | 'INTERNAL_SERVER_ERROR';

export type ErrorContext<TContext extends object = {}> =
	| NotFoundContext<TContext>
	| ValidationErrorContext<TContext>
	| InternalServerErrorContext<TContext>;

type BaseErrorContext<
	TCode extends ErrorCode,
	TLocals extends object = {},
> = Omit<RouteContext<Path, QueryParams, object, TLocals>, 'path'> & {
	code: TCode;
};

export interface NotFoundContext<TLocals extends object = {}>
	extends BaseErrorContext<'NOT_FOUND', TLocals> {}

export interface ValidationErrorContext<TLocals extends object = {}>
	extends BaseErrorContext<'VALIDATION', TLocals> {
	error: ValidationError;
	input: unknown;
}

export interface InternalServerErrorContext<TLocals extends object = {}>
	extends BaseErrorContext<'INTERNAL_SERVER_ERROR', TLocals> {
	error: Error;
}
