import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const baseUrl = 'https://code.claude.com';
const docsRoot = `${baseUrl}/docs/en/overview`;
const outputDir = path.resolve('src/data/generated');
const outputFile = path.join(outputDir, 'source-docs.json');

async function fetchHtml(url) {
	const response = await fetch(url, {
		headers: {
			'user-agent': 'explain-claude-code-sync/1.0'
		}
	});

	if (!response.ok) {
		throw new Error(`Fetch failed for ${url}: ${response.status} ${response.statusText}`);
	}

	return response.text();
}

function uniqueByPath(items) {
	const seen = new Set();
	return items.filter((item) => {
		if (!item.path || seen.has(item.path)) return false;
		seen.add(item.path);
		return true;
	});
}

function scrapeTopTabs(html) {
	const $ = load(html);
	return $('a.nav-tabs-item[href^="/docs/en/"]')
		.map((_, anchor) => ({
			title: $(anchor).text().trim(),
			path: $(anchor).attr('href')?.replace(/\/$/, '')
		}))
		.get()
		.filter((item) => item.path && item.title && item.title !== 'Resources')
		.filter((item) => item.path !== '/docs/en/legal-and-compliance');
}

function scrapeSidebarGroups(html) {
	const $ = load(html);
	return $('[id=sidebar-title]')
		.map((_, heading) => {
			const title = $(heading).text().trim();
			const items = $(heading)
				.parent()
				.nextAll('ul')
				.first()
				.find('a[href^="/docs/en/"]')
				.map((__, anchor) => ({
					title: $(anchor).text().trim(),
					path: $(anchor).attr('href')?.replace(/\/$/, '')
				}))
				.get();

			return {
				title,
				items: uniqueByPath(items)
			};
		})
		.get()
		.filter((group) => group.title && group.items.length);
}

function extractArticle(html) {
	const $ = load(html);
	const article = $('main article').first().length ? $('main article').first() : $('main').first();
	const title = article.find('h1').first().text().trim() || $('h1').first().text().trim();
	const metaDescription = $('meta[name="description"]').attr('content')?.trim() ?? '';
	const headings = article
		.find('h2,h3')
		.map((_, node) => $(node).text().trim())
		.get()
		.filter(Boolean)
		.slice(0, 16);
	const toc = $('#table-of-contents-content a')
		.map((_, node) => $(node).text().trim())
		.get()
		.filter(Boolean)
		.slice(0, 16);
	const paragraphs = article
		.find('p,li,code')
		.map((_, node) => $(node).text().replace(/\s+/g, ' ').trim())
		.get()
		.filter(Boolean)
		.slice(0, 120);
	const codeBlocks = article
		.find('pre code, pre')
		.map((_, node) => $(node).text())
		.get()
		.map((text) => text.trim())
		.filter(Boolean)
		.slice(0, 16);

	return { title, metaDescription, headings, toc, paragraphs, codeBlocks };
}

async function main() {
	const overviewHtml = await fetchHtml(docsRoot);
	const topTabs = scrapeTopTabs(overviewHtml);
	const sections = [];
	const discoveredPages = [];
	const pageMap = new Map();

	for (const tab of topTabs) {
		const tabUrl = `${baseUrl}${tab.path}`;
		const html = tab.path === '/docs/en/overview' ? overviewHtml : await fetchHtml(tabUrl);
		const groups = scrapeSidebarGroups(html);

		for (const group of groups) {
			sections.push(group);
			for (const item of group.items) {
				if (!pageMap.has(item.path)) {
					pageMap.set(item.path, {
						section: group.title,
						path: item.path,
						url: `${baseUrl}${item.path}`
					});
				}
			}
		}
	}

	for (const page of pageMap.values()) {
		try {
			const html = page.path === '/docs/en/overview' ? overviewHtml : await fetchHtml(page.url);
			discoveredPages.push({
				...page,
				...extractArticle(html)
			});
		} catch (error) {
			discoveredPages.push({
				...page,
				error: error instanceof Error ? error.message : String(error)
			});
		}
	}

	await fs.mkdir(outputDir, { recursive: true });
	await fs.writeFile(
		outputFile,
		JSON.stringify(
			{
				generatedAt: new Date().toISOString(),
				source: docsRoot,
				topTabs,
				sections,
				pages: discoveredPages
			},
			null,
			2
		)
	);

	console.log(`Synced ${discoveredPages.length} docs pages to ${outputFile}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
