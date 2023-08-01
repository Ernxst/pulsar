export const ContentTypes = {
	JSON: 'application/json',
	HTML: 'text/html; charset=utf-8',
	TEXT: 'text/plain',
	FORM_DATA: 'multipart/form-data',
	OCTET_STREAM: 'application/octet-stream',
	XML: 'application/xml',
} as const;

export function inferContentType(data: any) {
	if (typeof data === 'string') {
		const lower = data.toLowerCase();

		if (lower.startsWith('<!doctype html>') || lower.startsWith('<html')) {
			return ContentTypes.HTML;
		}

		return ContentTypes.TEXT;
	} else if (data instanceof ArrayBuffer) {
		return ContentTypes.OCTET_STREAM;
	} else if (data instanceof FormData) {
		return ContentTypes.FORM_DATA;
	} else if (typeof data === 'object') {
		return ContentTypes.JSON;
	}

	return ContentTypes.TEXT;
}
