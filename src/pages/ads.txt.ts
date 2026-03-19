export const prerender = true;

export function GET() {
	// Hardcoded publisher ID for AdSense verification
	const publisherId = 'pub-3833673520933536';
	const body = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8'
		}
	});
}
