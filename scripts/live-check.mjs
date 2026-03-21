const baseUrl = process.env.SITE_URL || 'https://explain-claude-code.pages.dev';

async function fetchText(url, options = {}) {
	const response = await fetch(url, {
		redirect: 'manual',
		...options
	});
	return {
		response,
		text: options.method === 'HEAD' ? '' : await response.text()
	};
}

async function fetchPage(url) {
	const first = await fetchText(url);
	const location = first.response.headers.get('location');
	if (first.response.status >= 300 && first.response.status < 400 && location) {
		const redirectedUrl = new URL(location, url).toString();
		const final = await fetchText(redirectedUrl);
		return {
			initial: first,
			final,
			redirectedUrl
		};
	}

	return {
		initial: first,
		final: first,
		redirectedUrl: url
	};
}

function check(name, ok, detail = '') {
	const status = ok ? 'PASS' : 'FAIL';
	console.log(`${status} ${name}${detail ? ` (${detail})` : ''}`);
	return ok;
}

async function main() {
	const failures = [];

	const home = await fetchText(baseUrl);
	if (!check('homepage returns 200', home.response.status === 200, `status=${home.response.status}`)) failures.push('home');
	if (!check('homepage has site title', home.text.includes('通俗版 Claude Code 文档'))) failures.push('home-title');

	const docs = await fetchText(`${baseUrl}/docs`);
	const docsLocation = docs.response.headers.get('location') || '';
	if (!check('docs redirects to overview', docs.response.status >= 300 && docs.response.status < 400 && docsLocation.includes('/docs/en/overview'), `status=${docs.response.status} location=${docsLocation || 'none'}`)) failures.push('docs-redirect');

	const permissions = await fetchPage(`${baseUrl}/docs/en/permissions`);
	const permissionsTitleOk = permissions.final.text.includes('权限') || permissions.final.text.includes('Configure permissions');
	const notHomepage = !permissions.final.text.includes('<title>通俗版 Claude Code 文档</title>');
	const permissionsStatusOk =
		permissions.final.response.status === 200 &&
		(
			permissions.initial.response.status === 200 ||
			(
				permissions.initial.response.status >= 300 &&
				permissions.initial.response.status < 400 &&
				permissions.redirectedUrl.endsWith('/docs/en/permissions/')
			)
		);
	if (!check('permissions page is not homepage fallback', permissionsStatusOk && notHomepage, `initial=${permissions.initial.response.status} final=${permissions.final.response.status}`)) failures.push('permissions-fallback');
	if (!check('permissions page contains permissions content', permissionsTitleOk)) failures.push('permissions-content');

	const about = await fetchPage(`${baseUrl}/about`);
	const aboutOk =
		about.final.response.status === 200 &&
		about.final.text.includes('关于通俗版 Claude Code 文档') &&
		!about.final.text.includes('<title>通俗版 Claude Code 文档</title>');
	if (!check('about page renders site info', aboutOk, `initial=${about.initial.response.status} final=${about.final.response.status}`)) failures.push('about');

	const guides = await fetchPage(`${baseUrl}/guides`);
	const guidesOk =
		guides.final.response.status === 200 &&
		guides.final.text.includes('原创实战指南') &&
		!guides.final.text.includes('<title>通俗版 Claude Code 文档</title>');
	if (!check('guides page renders guide index', guidesOk, `initial=${guides.initial.response.status} final=${guides.final.response.status}`)) failures.push('guides');

	const trustFaq = await fetchPage(`${baseUrl}/guides/site-trust-faq`);
	const trustFaqOk =
		trustFaq.final.response.status === 200 &&
		trustFaq.final.text.includes('关于本站最常被问的几个问题') &&
		trustFaq.final.text.includes('FAQPage');
	if (!check('site trust FAQ page renders and includes faq schema', trustFaqOk, `initial=${trustFaq.initial.response.status} final=${trustFaq.final.response.status}`)) failures.push('trust-faq');

	const finalReadiness = await fetchPage(`${baseUrl}/guides/final-site-readiness-check`);
	const finalReadinessOk =
		finalReadiness.final.response.status === 200 &&
		finalReadiness.final.text.includes('申请前最后怎么把整站过一遍');
	if (!check('final readiness page renders', finalReadinessOk, `initial=${finalReadiness.initial.response.status} final=${finalReadiness.final.response.status}`)) failures.push('final-readiness');

	const robots = await fetchText(`${baseUrl}/robots.txt`);
	if (!check('robots has sitemap', robots.text.includes(`${baseUrl}/sitemap-index.xml`))) failures.push('robots');

	const sitemap = await fetchText(`${baseUrl}/sitemap-index.xml`);
	if (!check('sitemap returns xml', sitemap.response.status === 200 && (sitemap.response.headers.get('content-type') || '').includes('xml'), `status=${sitemap.response.status}`)) failures.push('sitemap');

	const headers = home.response.headers;
	if (!check('header x-content-type-options', headers.get('x-content-type-options') === 'nosniff')) failures.push('header-nosniff');
	if (!check('header referrer-policy', (headers.get('referrer-policy') || '').includes('strict-origin-when-cross-origin'))) failures.push('header-referrer');
	if (!check('header x-frame-options', (headers.get('x-frame-options') || '').toUpperCase() === 'DENY', `value=${headers.get('x-frame-options') || 'missing'}`)) failures.push('header-frame');
	if (!check('header permissions-policy', headers.has('permissions-policy'), `value=${headers.get('permissions-policy') || 'missing'}`)) failures.push('header-permissions');

	if (failures.length) {
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
