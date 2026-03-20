import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const generatedPath = path.join(root, 'src/data/generated/generated-doc-content.json');
const guidesDir = path.join(root, 'src/pages/guides');
const reportDir = path.join(root, 'reports');
const reportPath = path.join(reportDir, 'content-audit.md');

const generated = JSON.parse(fs.readFileSync(generatedPath, 'utf8'));
const docRows = Object.entries(generated.pages || {}).map(([slug, page]) => {
	const sections = page.sectionBlocks || [];
	const paragraphCount = sections.reduce((sum, section) => sum + (section.paragraphs || []).length, 0);
	const stepCount = sections.reduce((sum, section) => sum + (section.steps || []).length, 0);
	const text = sections.flatMap((section) => section.paragraphs || []).join('\n');
	const chars = text.replace(/\s+/g, '').length;
	return { slug, type: 'docs', paragraphCount, stepCount, chars, score: paragraphCount * 2 + stepCount * 3 + Math.floor(chars / 120) };
});

const guideRows = fs.readdirSync(guidesDir)
	.filter((name) => name.endsWith('.astro') && name !== 'index.astro')
	.map((name) => {
		const fullPath = path.join(guidesDir, name);
		const source = fs.readFileSync(fullPath, 'utf8');
		const body = source.replace(/---[\s\S]*?---/, '');
		const paragraphCount = (body.match(/<p>/g) || []).length;
		const chars = body.replace(/<[^>]+>/g, '').replace(/\s+/g, '').length;
		const slug = name.replace(/\.astro$/, '');
		return { slug, type: 'guide', paragraphCount, stepCount: 0, chars, score: paragraphCount * 3 + Math.floor(chars / 140) };
	});

const thinDocs = docRows
	.filter((row) => row.score < 24)
	.sort((a, b) => a.score - b.score)
	.slice(0, 20);

const thinGuides = guideRows
	.filter((row) => row.score < 18)
	.sort((a, b) => a.score - b.score)
	.slice(0, 20);

const lines = [
	'# Content Audit',
	'',
	`Generated at: ${new Date().toISOString()}`,
	'',
	'## Docs pages that still look thin',
	'',
	'| slug | paragraphs | steps | chars | score |',
	'| --- | ---: | ---: | ---: | ---: |'
];

for (const row of thinDocs) {
	lines.push(`| ${row.slug} | ${row.paragraphCount} | ${row.stepCount} | ${row.chars} | ${row.score} |`);
}

lines.push('', '## Original guide pages that still look thin', '', '| slug | paragraphs | chars | score |', '| --- | ---: | ---: | ---: |');

for (const row of thinGuides) {
	lines.push(`| ${row.slug} | ${row.paragraphCount} | ${row.chars} | ${row.score} |`);
}

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(reportPath, `${lines.join('\n')}\n`);

console.log(`Wrote content audit to ${path.relative(root, reportPath)}`);
