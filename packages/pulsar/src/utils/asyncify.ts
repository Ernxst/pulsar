export type Asyncify<TReturn, TError = Error> = Promise<
	[TError, undefined] | [null, TReturn]
>;

export function asyncify<const TReturn, TError = Error>(
	promise: Promise<TReturn>
): Asyncify<TReturn, TError> {
	return promise
		.then<[null, TReturn]>((data: TReturn) => [null, data])
		.catch<[TError, undefined]>((err: TError) => {
			return [err, undefined];
		});
}
