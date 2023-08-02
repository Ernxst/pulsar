export function inferContentType(input: any) {
	if (typeof input === 'string') {
		const lower = input.toLowerCase().trim();

		if (lower.startsWith('<!doctype html>') || lower.startsWith('<html')) {
			return 'text/html; charset=utf-8';
		} else if (lower.startsWith('<?xml')) {
			return 'application/xml';
		} else if (lower.includes('<rss') || lower.includes('<feed')) {
			return 'application/rss+xml';
		} else if (lower.includes('<atom')) {
			return 'application/atom+xml';
		} else if (lower.includes('<svg')) {
			return 'image/svg+xml';
		}
		return 'text/plain';
	} else if (typeof input === 'number') {
		return 'application/json; charset=utf-8';
	} else if (typeof input === 'boolean') {
		return 'application/json; charset=utf-8';
	} else if (typeof input === 'object') {
		if (Array.isArray(input)) {
			return 'application/json';
		} else if (input instanceof FormData) {
			return 'multipart/form-data';
		} else if (input instanceof Blob) {
			return input.type || 'application/octet-stream';
		} else {
			return 'application/json';
		}
	}

	return undefined;
}
