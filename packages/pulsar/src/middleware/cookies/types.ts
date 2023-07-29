export type Cookie = Record<string, string>;

export interface CookieOptions {
	domain?: string;
	expires?: Date;
	httpOnly?: boolean;
	maxAge?: number;
	path?: string;
	secure?: boolean;
	signed?: boolean;
	sameSite?: 'Strict' | 'Lax' | 'None';
}
