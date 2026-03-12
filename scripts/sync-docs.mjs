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
	const contentRoot =
		$('#content-container').first().length
			? $('#content-container').first()
			: $('#content-area').first().length
				? $('#content-area').first()
				: $('main article').first().length
					? $('main article').first()
					: $('main').first().length
						? $('main').first()
						: $('body').first();

	const unique = (items) => [...new Set(items.filter(Boolean))];
	function buildSectionBlocks(root) {
		const blocks = [];
		let current = null;

		const pushCurrent = () => {
			if (!current) return;
			current.paragraphs = unique(current.paragraphs).slice(0, 12);
			current.codeBlocks = unique(current.codeBlocks).slice(0, 6);
			if (current.title || current.paragraphs.length || current.codeBlocks.length) {
				blocks.push(current);
			}
		};

		for (const node of root.find('h2, h3, span[data-as="p"], p, li, pre').toArray()) {
			const tag = node.tagName?.toLowerCase();
			if (tag === 'h2' || tag === 'h3') {
				pushCurrent();
				current = {
					title: $(node).text().trim(),
					paragraphs: [],
					codeBlocks: []
				};
				continue;
			}

			if (!current) {
				current = {
					title: '',
					paragraphs: [],
					codeBlocks: []
				};
			}

			if (tag === 'pre') {
				const code = $(node).text().trim();
				if (code) current.codeBlocks.push(code);
				continue;
			}

			const text = $(node).text().replace(/\s+/g, ' ').trim();
			if (text && text.length >= 8 && text !== current.title) {
				current.paragraphs.push(text);
			}
		}

		pushCurrent();
		return blocks.filter((block) => block.title || block.paragraphs.length || block.codeBlocks.length).slice(0, 32);
	}

	const title = contentRoot.find('h1').first().text().trim() || $('h1').first().text().trim();
	const metaDescription = $('meta[name="description"]').attr('content')?.trim() ?? '';
	const headings = unique(
		contentRoot
			.find('h2,h3')
			.map((_, node) => $(node).text().trim())
			.get()
	).slice(0, 20);
	const toc = unique(
		$('#table-of-contents-content a')
			.map((_, node) => $(node).text().trim())
			.get()
	).slice(0, 20);
	const paragraphs = unique(
		contentRoot
			.find('span[data-as="p"], p, li')
			.map((_, node) => $(node).text().replace(/\s+/g, ' ').trim())
			.get()
	)
		.filter((text) => text.length >= 8)
		.slice(0, 180);
	const codeBlocks = unique(
		contentRoot
			.find('pre code, pre')
			.map((_, node) => $(node).text())
			.get()
			.map((text) => text.trim())
	)
		.filter(Boolean)
		.slice(0, 32);
	const sectionBlocks = buildSectionBlocks(contentRoot);

	return { title, metaDescription, headings, toc, paragraphs, codeBlocks, sectionBlocks };
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
