import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportsDir = path.join(root, 'reports');
const reportPath = path.join(reportsDir, 'site-readiness.md');

function readIfExists(file) {
	return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

const adsenseAudit = readIfExists(path.join(reportsDir, 'adsense-readiness.md'));
const seoAudit = readIfExists(path.join(reportsDir, 'seo-audit.md'));
const contentAudit = readIfExists(path.join(reportsDir, 'content-audit.md'));

const checks = [
	{
		label: 'AdSense readiness audit clean',
		ok: adsenseAudit.includes('- 无明显缺项')
	},
	{
		label: 'SEO audit clean',
		ok: seoAudit.includes('- 无明显缺项')
	},
	{
		label: 'Content audit has no thin docs',
		ok: !/\|\s*[\w-]+\s*\|\s*\d+\s*\|\s*\d+\s*\|\s*\d+\s*\|\s*\d+\s*\|/.test(
			(contentAudit.split('## Original guide pages that still look thin')[0] || '').split('## Docs pages that still look thin')[1] || ''
		)
	},
	{
		label: 'Content audit has no thin guides',
		ok: !/\|\s*[\w-]+\s*\|\s*\d+\s*\|\s*\d+\s*\|\s*\d+\s*\|/.test(
			(contentAudit.split('## Original guide pages that still look thin')[1] || '')
		)
	}
];

const lines = [
	'# Site Readiness Audit',
	'',
	`Generated at: ${new Date().toISOString()}`,
	'',
	'## Summary',
	''
];

for (const check of checks) {
	lines.push(`- ${check.ok ? 'PASS' : 'FAIL'}: ${check.label}`);
}

lines.push('', '## Follow before applying', '');
lines.push('- 先看 `reports/adsense-readiness.md`，确认信任页、原创信号页和元信息覆盖还是干净的。');
lines.push('- 再看 `reports/seo-audit.md`，确认入口页 title/description 没掉链子。');
lines.push('- 再看 `reports/content-audit.md`，确保没有新冒出来的薄页。');
lines.push('- 最后抽查首页、about、privacy、guides、adsense-readiness-checklist 这些关键入口的实际页面观感。');

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(reportPath, `${lines.join('\n')}\n`);
console.log(`Wrote site readiness audit to ${path.relative(root, reportPath)}`);
