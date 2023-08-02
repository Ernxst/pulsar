import type { Path, QuerySchema, ValidationError } from 'src';
import type {
	InternalServerErrorContext as IInternalServerErrorContext,
	NotFoundContext as INotFoundErrorContext,
	ValidationErrorContext as IValidationErrorContext,
} from 'src/errors/types';
import { Context } from '.';

export class InternalServerErrorContext<
		TPath extends Path = '',
		TQuery extends QuerySchema = {},
		TBody extends object = {},
		TContext extends object = {},
	>
	extends Context<TPath, TQuery, TBody, TContext>
	implements IInternalServerErrorContext<TContext>
{
	public readonly code = 'INTERNAL_SERVER_ERROR';

	constructor(
		public readonly error: Error,
		ctx: Context<TPath, TQuery, TBody, TContext>
	) {
		super(ctx.config);
		this.fromContext(ctx);
	}
}

export class NotFoundErrorContext<
		TPath extends Path = '',
		TQuery extends QuerySchema = {},
		TBody extends object = {},
		TContext extends object = {},
	>
	extends Context<TPath, TQuery, TBody, TContext>
	implements INotFoundErrorContext<TContext>
{
	public readonly code = 'NOT_FOUND';

	public get path() {
		return new URL(this.request.url) as any;
	}

	constructor(ctx: Context<TPath, TQuery, TBody, TContext>) {
		super(ctx.config);
		this.fromContext(ctx);
	}
}

export class ValidationErrorContext<
		TPath extends Path = '',
		TQuery extends QuerySchema = {},
		TBody extends object = {},
		TContext extends object = {},
	>
	extends Context<TPath, TQuery, TBody, TContext>
	implements IValidationErrorContext<TContext>
{
	public readonly code = 'VALIDATION';

	constructor(
		public readonly error: ValidationError,
		public readonly input: unknown,
		ctx: Context<TPath, TQuery, TBody, TContext>
	) {
		super(ctx.config);
		this.fromContext(ctx);
	}
}
