export const prerender = true;

export function GET() {
	const publisherId = import.meta.env.PUBLIC_ADSENSE_PUBLISHER_ID?.trim() || '';
	const body = publisherId
		? `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`
		: '# Set PUBLIC_ADSENSE_PUBLISHER_ID in Cloudflare Pages to publish a valid ads.txt entry.\n';

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8'
		}
	});
}
