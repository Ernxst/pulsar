import { appRouter } from './router';

export default {
	fetch(request: Request) {
		return appRouter.fetch(request);
	},
};
