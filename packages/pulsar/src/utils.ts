/**
 * Extract data from a request or response based on the content type.
 */
export async function parseBody(item: Request | Response) {
	const contentType = item.headers.get('Content-Type');
	if (!contentType) return {};

	if (
		contentType.startsWith('multipart/form-data') ||
		contentType.startsWith('application/x-www-form-urlencoded')
	) {
		const form: Record<string, string | File> = {};
		const formData = await item.formData();
		formData.forEach((value, key) => {
			form[key] = value;
		});

		return form;
	} else if (contentType.startsWith('application/json')) {
		return await item.json();
	}

	return await item.text();
}
