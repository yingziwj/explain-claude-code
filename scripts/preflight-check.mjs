import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function fileExists(relPath) {
	try {
		await fs.access(path.join(root, relPath));
		return true;
	} catch {
		return false;
	}
}

async function readJson(relPath) {
	return JSON.parse(await fs.readFile(path.join(root, relPath), 'utf8'));
}

async function main() {
	const checks = [];

	const requiredFiles = [
		'public/robots.txt',
		'public/_headers',
		'public/_redirects',
		'public/favicon.svg',
		'public/social-card.svg',
		'.env.example',
		'astro.config.mjs',
		'wrangler.jsonc',
		'src/components/AdSlot.astro',
		'src/pages/privacy.astro',
		'src/pages/advertising.astro',
		'src/pages/ads.txt.ts',
		'src/data/generated/source-docs.json',
		'src/data/generated/generated-doc-content.json'
	];

	for (const relPath of requiredFiles) {
		checks.push({
			name: `required file: ${relPath}`,
			ok: await fileExists(relPath)
		});
	}

	const robotsTxt = await fs.readFile(path.join(root, 'public/robots.txt'), 'utf8');
	checks.push({
		name: 'robots has sitemap',
		ok: robotsTxt.includes('Sitemap: https://explain-claude-code.pages.dev/sitemap-index.xml')
	});

	const sourceDocs = await readJson('src/data/generated/source-docs.json');
	const generatedDocs = await readJson('src/data/generated/generated-doc-content.json');

	checks.push({
		name: 'official docs snapshot has pages',
		ok: Array.isArray(sourceDocs.pages) && sourceDocs.pages.length > 0,
		detail: `pages=${sourceDocs.pages?.length ?? 0}`
	});

	checks.push({
		name: 'generated content covers pages',
		ok: Object.keys(generatedDocs.items ?? {}).length > 0,
		detail: `items=${Object.keys(generatedDocs.items ?? {}).length}`
	});

	const headersTxt = await fs.readFile(path.join(root, 'public/_headers'), 'utf8');
	checks.push({
		name: 'headers include long cache for Astro assets',
		ok: headersTxt.includes('/_astro/*')
	});

	const redirectsTxt = await fs.readFile(path.join(root, 'public/_redirects'), 'utf8');
	checks.push({
		name: 'redirects include docs entrypoint',
		ok: redirectsTxt.includes('/docs /docs/en/overview 301')
	});

	const failed = checks.filter((check) => !check.ok);

	for (const check of checks) {
		const status = check.ok ? 'PASS' : 'FAIL';
		console.log(`${status} ${check.name}${check.detail ? ` (${check.detail})` : ''}`);
	}

	if (failed.length) {
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
