export interface Session {
	token: string;
	expiration: Date;
	user: User;
}

export interface User {
	id: string;
	username: string;
	email: string;
}
