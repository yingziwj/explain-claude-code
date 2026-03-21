import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pagesDir = path.join(root, 'src/pages');
const reportDir = path.join(root, 'reports');
const reportPath = path.join(reportDir, 'seo-audit.md');

const requiredRoutes = ['/about', '/privacy', '/terms', '/advertising', '/contact', '/guides'];
const issues = [];
const pageRows = [];

function walk(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full);
		else if (entry.isFile() && entry.name.endsWith('.astro')) inspect(full);
	}
}

function routeFromFile(fullPath) {
	const rel = path.relative(pagesDir, fullPath).replace(/\\/g, '/');
	if (rel === 'index.astro') return '/';
	if (rel.endsWith('/index.astro')) return `/${rel.slice(0, -'/index.astro'.length)}`;
	return `/${rel.replace(/\.astro$/, '')}`;
}

function inspect(fullPath) {
	const source = fs.readFileSync(fullPath, 'utf8');
	const titleMatch = source.match(/title=\"([^\"]+)\"/);
	const descMatch = source.match(/description=\"([^\"]+)\"/);
	const route = routeFromFile(fullPath);
	const title = titleMatch?.[1] ?? '';
	const description = descMatch?.[1] ?? '';
	pageRows.push({ route, titleLen: title.length, descLen: description.length });
	if (!title) issues.push(`- ${route}: 缺少 title`);
	if (!description) issues.push(`- ${route}: 缺少 description`);
	if (title && title.length < 10) issues.push(`- ${route}: title 太短（${title.length}）`);
	if (description && description.length < 20) issues.push(`- ${route}: description 太短（${description.length}）`);
}

walk(pagesDir);

for (const route of requiredRoutes) {
	if (!pageRows.find((row) => row.route === route)) {
		issues.push(`- 缺少必备路由 ${route}`);
	}
}

pageRows.sort((a, b) => a.route.localeCompare(b.route));

const lines = [
	'# SEO Audit',
	'',
	`Generated at: ${new Date().toISOString()}`,
	'',
	'## Required routes',
	''
];

for (const route of requiredRoutes) {
	lines.push(`- ${route}`);
}

lines.push('', '## Title / Description lengths', '', '| route | title length | description length |', '| --- | ---: | ---: |');

for (const row of pageRows) {
	lines.push(`| ${row.route} | ${row.titleLen} | ${row.descLen} |`);
}

lines.push('', '## Issues', '');

if (issues.length) {
	lines.push(...issues);
} else {
	lines.push('- 无明显缺项');
}

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(reportPath, `${lines.join('\n')}\n`);
console.log(`Wrote SEO audit to ${path.relative(root, reportPath)}`);
