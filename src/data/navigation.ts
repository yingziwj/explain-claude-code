export type DocItem = {
	title: string;
	path: string;
	summary: string;
	description: string;
};

export type NavSection = {
	title: string;
	items: DocItem[];
};

export const navSections: NavSection[] = [
	{
		title: 'Getting started',
		items: [
			{
				title: 'Overview',
				path: '/docs/en/overview',
				summary: '先认清这个电子帮工到底能帮你干哪些活，在哪儿都能叫它上手。',
				description: 'Claude Code 就像请来一个识字快、手脚麻利的帮工。你把活路讲明白，它能进仓库看材料（读代码）、拿工具修东西（改文件）、还会自己跑腿试一遍（运行命令）。'
			},
			{
				title: 'Quickstart',
				path: '/docs/en/quickstart',
				summary: '手把手带你把电子帮工领进门，从装工具到交第一件活，像新农具下地先试一垄。',
				description: '这一页主要讲最短路径：安装、登录、进项目、下第一道命令。'
			}
		]
	},
	{
		title: 'Core concepts',
		items: [
			{
				title: 'How Claude Code works',
				path: '/docs/en/how-claude-code-works',
				summary: '讲清楚它咋一边看现场、一边动手、一边验活，不是瞎忙，是有套路地转圈干活。',
				description: '这一页把 Claude Code 的干活路数讲透：先摸情况，再出手，再回头检查，像靠谱师傅修屋先看漏点、再补缝、再泼水验。'
			},
			{
				title: 'Extend Claude Code',
				path: '/docs/en/features-overview',
				summary: '告诉你怎么给这个帮手加家伙事，把规矩、外援、自动化都接上，不只会干基础活。',
				description: '像给拖拉机挂犁、挂播种机、挂收割机，Claude Code 也能靠 skills、MCP、hooks、subagents 长出不同本事。'
			},
			{
				title: 'Store instructions and memories',
				path: '/docs/en/memory',
				summary: '让它把家规和干活经验都记住，省得每回开工都从头念一遍。',
				description: '这一页讲清楚 `CLAUDE.md` 和 auto memory 的分工：一个像墙上家规，一个像老帮工随手记的小本子。'
			},
			{
				title: 'Common workflows',
				path: '/docs/en/common-workflows',
				summary: '把常见活路拆成顺手套路，像看新地、查毛病、翻旧屋、补测试，都有固定走法。',
				description: '这一页不讲空话，专讲日常怎么派活给 Claude Code，照着这些套路走，比临时瞎比画稳得多。'
			},
			{
				title: 'Best practices',
				path: '/docs/en/best-practices',
				summary: '教你怎么把这个好帮手使唤顺，少跑偏、少返工、少把上下文搅成一锅粥。',
				description: '这一页全是实战窍门：目标说清、尺子给够、规矩写短、会话别搅浑，这样 Claude Code 才越干越顺手。'
			}
		]
	},
	{
		title: 'Platforms and integrations',
		items: [
			{ title: 'Remote Control', path: '/docs/en/remote-control', summary: '远程使唤这个帮手。', description: '人不在跟前，也能安排它干活。' },
			{ title: 'Claude Code on the web', path: '/docs/en/claude-code-on-the-web', summary: '在网页上用。', description: '不用本地折腾太多，也能直接开工。' },
			{ title: 'Claude Code on desktop', path: '/docs/en/desktop', summary: '在桌面端用。', description: '像平时开软件一样使用 Claude Code。' },
			{ title: 'Chrome extension (beta)', path: '/docs/en/chrome', summary: '浏览器扩展怎么配合。', description: '把它带进浏览器里帮你看页面和做事。' },
			{ title: 'Visual Studio Code', path: '/docs/en/vs-code', summary: '和 VS Code 一起干活。', description: '在写代码的地方直接叫它帮忙。' },
			{ title: 'JetBrains IDEs', path: '/docs/en/jetbrains', summary: '和 JetBrains 系列工具配合。', description: '让它进你的主力编辑器里，少来回切换。' },
			{ title: 'GitHub Actions', path: '/docs/en/github-actions', summary: '放进 GitHub 自动流程。', description: '像定时雇工，代码一动就自动安排事。' },
			{ title: 'GitLab CI/CD', path: '/docs/en/gitlab-ci-cd', summary: '放进 GitLab 流水线。', description: '把重复活交给机器按流程跑。' },
			{ title: 'GitHub Code Review', path: '/docs/en/code-review', summary: '让它帮你看代码改得对不对。', description: '像找个懂行师傅先给你把把关。' },
			{ title: 'Claude Code in Slack', path: '/docs/en/slack', summary: '在 Slack 里招呼它。', description: '在群里喊一声，也能让它来帮忙。' }
		]
	},
	{
		title: 'Deployment',
		items: [
			{ title: 'Deployment', path: '/docs/en/third-party-integrations', summary: '讲第三方集成和部署出门。', description: '把 Claude Code 接到别的地方去用。' }
		]
	},
	{
		title: 'Administration',
		items: [
			{ title: 'Administration', path: '/docs/en/setup', summary: '管理员怎么立规矩、管权限。', description: '像村里管仓库钥匙的人，得先把权限和规则说清。' }
		]
	},
	{
		title: 'Configuration',
		items: [
			{ title: 'Configuration', path: '/docs/en/settings', summary: '各种设置项怎么调。', description: '把旋钮拧到合适位置，工具才顺手。' }
		]
	},
	{
		title: 'Reference',
		items: [
			{ title: 'Reference', path: '/docs/en/cli-reference', summary: '命令行指令对照表。', description: '像农具说明书最后那页，查命令该怎么写。' }
		]
	}
];

export const allDocs = navSections.flatMap((section) =>
	section.items.map((item) => ({
		...item,
		section: section.title,
		slug: item.path.replace(/^\/docs\/en\//, '')
	}))
);

export function getDocBySlug(slug: string) {
	return allDocs.find((item) => item.slug === slug);
}
