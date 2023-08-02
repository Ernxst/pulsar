export function inferContentType(input: any) {
	if (typeof input === 'string') {
		const lower = input.toLowerCase();

		if (lower.startsWith('<!doctype html>') || lower.startsWith('<html')) {
			return 'text/html; charset=utf-8';
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

	return 'application/octet-stream';
}
