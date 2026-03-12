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

function scrapeSidebar(html) {
	const $ = load(html);
	const sections = [];

	$('nav').each((_, nav) => {
		const groups = [];
		$(nav)
			.find('h2,h3,h4,h5')
			.each((__, heading) => {
				const title = $(heading).text().trim();
				const list = $(heading).nextAll('ul').first();
				if (!title || !list.length) return;
				const items = list
					.find('a[href^="/docs/en/"]')
					.map((___, anchor) => ({
						title: $(anchor).text().trim(),
						path: $(anchor).attr('href')?.replace(/\/$/, '')
					}))
					.get();
				if (items.length) groups.push({ title, items: uniqueByPath(items) });
			});

		if (groups.length > sections.length) {
			sections.splice(0, sections.length, ...groups);
		}
	});

	return sections;
}

function extractArticle(html) {
	const $ = load(html);
	const article = $('main article').first().length ? $('main article').first() : $('main').first();
	const title = article.find('h1').first().text().trim() || $('h1').first().text().trim();
	const headings = article
		.find('h2,h3')
		.map((_, node) => $(node).text().trim())
		.get()
		.filter(Boolean)
		.slice(0, 10);
	const paragraphs = article
		.find('p,li,code')
		.map((_, node) => $(node).text().replace(/\s+/g, ' ').trim())
		.get()
		.filter(Boolean)
		.slice(0, 80);

	return { title, headings, paragraphs };
}

async function main() {
	const overviewHtml = await fetchHtml(docsRoot);
	const sections = scrapeSidebar(overviewHtml);
	const pages = [];

	for (const section of sections) {
		for (const item of section.items) {
			const url = `${baseUrl}${item.path}`;
			try {
				const html = await fetchHtml(url);
				pages.push({
					section: section.title,
					path: item.path,
					url,
					...extractArticle(html)
				});
			} catch (error) {
				pages.push({
					section: section.title,
					path: item.path,
					url,
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}
	}

	await fs.mkdir(outputDir, { recursive: true });
	await fs.writeFile(
		outputFile,
		JSON.stringify(
			{
				generatedAt: new Date().toISOString(),
				source: docsRoot,
				sections,
				pages
			},
			null,
			2
		)
	);

	console.log(`Synced ${pages.length} docs pages to ${outputFile}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
