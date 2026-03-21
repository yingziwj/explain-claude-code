import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pagesDir = path.join(root, 'src/pages');
const guidesDir = path.join(pagesDir, 'guides');
const reportDir = path.join(root, 'reports');
const reportPath = path.join(reportDir, 'adsense-readiness.md');

const requiredPages = ['/about', '/privacy', '/terms', '/advertising', '/contact', '/guides'];
const originalSignals = [
	'/guides/editorial-methodology',
	'/guides/editorial-principles',
	'/guides/how-this-site-is-made',
	'/guides/adsense-readiness-checklist'
];

function routeFromFile(fullPath) {
	const rel = path.relative(pagesDir, fullPath).replace(/\\/g, '/');
	if (rel === 'index.astro') return '/';
	if (rel.endsWith('/index.astro')) return `/${rel.slice(0, -'/index.astro'.length)}`;
	return `/${rel.replace(/\.astro$/, '')}`;
}

function walk(dir, visit) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(fullPath, visit);
		else if (entry.isFile() && entry.name.endsWith('.astro')) visit(fullPath);
	}
}

const pageRoutes = new Set();
const guideRows = [];

walk(pagesDir, (fullPath) => {
	const route = routeFromFile(fullPath);
	pageRoutes.add(route);
	if (!route.startsWith('/guides/') || route === '/guides/index') return;

	const source = fs.readFileSync(fullPath, 'utf8');
	const body = source.replace(/---[\s\S]*?---/, '');
	const paragraphCount = (body.match(/<p>/g) || []).length;
	const hasGuideMeta = source.includes('GuideMeta');
	const hasUpdatedAt = source.includes('updatedAt');
	const hasSeries = source.includes('series=');
	guideRows.push({
		route,
		paragraphCount,
		hasGuideMeta,
		hasUpdatedAt,
		hasSeries
	});
});

guideRows.sort((a, b) => a.route.localeCompare(b.route));

const missingRequired = requiredPages.filter((route) => !pageRoutes.has(route));
const missingOriginalSignals = originalSignals.filter((route) => !pageRoutes.has(route));
const guidesWithoutMeta = guideRows.filter((row) => !row.hasGuideMeta);
const guidesWithoutUpdated = guideRows.filter((row) => !row.hasUpdatedAt);
const guidesWithoutSeries = guideRows.filter((row) => !row.hasSeries);
const thinGuides = guideRows.filter((row) => row.paragraphCount < 8);

const lines = [
	'# AdSense Readiness Audit',
	'',
	`Generated at: ${new Date().toISOString()}`,
	'',
	'## Required trust pages',
	''
];

for (const route of requiredPages) {
	lines.push(`- ${route}`);
}

lines.push('', '## Original-value signal pages', '');
for (const route of originalSignals) {
	lines.push(`- ${route}`);
}

lines.push('', '## Guide metadata coverage', '', '| route | paragraphs | GuideMeta | updatedAt | series |', '| --- | ---: | --- | --- | --- |');
for (const row of guideRows) {
	lines.push(`| ${row.route} | ${row.paragraphCount} | ${row.hasGuideMeta ? 'yes' : 'no'} | ${row.hasUpdatedAt ? 'yes' : 'no'} | ${row.hasSeries ? 'yes' : 'no'} |`);
}

lines.push('', '## Issues', '');

if (!missingRequired.length && !missingOriginalSignals.length && !guidesWithoutMeta.length && !guidesWithoutUpdated.length && !guidesWithoutSeries.length && !thinGuides.length) {
	lines.push('- 无明显缺项');
} else {
	for (const route of missingRequired) lines.push(`- 缺少必备信任页 ${route}`);
	for (const route of missingOriginalSignals) lines.push(`- 缺少原创价值信号页 ${route}`);
	for (const row of guidesWithoutMeta) lines.push(`- ${row.route}: 原创页还没挂 GuideMeta`);
	for (const row of guidesWithoutUpdated) lines.push(`- ${row.route}: 原创页缺少 updatedAt`);
	for (const row of guidesWithoutSeries) lines.push(`- ${row.route}: 原创页缺少 series`);
	for (const row of thinGuides) lines.push(`- ${row.route}: 原创页段落偏少（${row.paragraphCount}）`);
}

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(reportPath, `${lines.join('\n')}\n`);
console.log(`Wrote AdSense readiness audit to ${path.relative(root, reportPath)}`);
