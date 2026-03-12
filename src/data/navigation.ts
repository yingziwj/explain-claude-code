import generatedSource from './generated/source-docs.json';

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

type GeneratedSourceFile = {
	sections?: Array<{
		title: string;
		items: Array<{
			title: string;
			path: string;
		}>;
	}>;
};

const titleTranslations: Record<string, string> = {
	'Getting started': '入门指南',
	'Build with Claude Code': '用 Claude Code 搞构建',
	'Core concepts': '核心概念',
	'Platforms and integrations': '平台和集成',
	Deployment: '部署',
	Administration: '管理',
	Configuration: '配置',
	Reference: '参考',
	Overview: 'Claude Code 是个啥',
	Quickstart: '快速上手',
	'How Claude Code works': '它咋个干活',
	'Extend Claude Code': '给它加本事',
	'Store instructions and memories': '让它记规矩',
	'Common workflows': '常见干活套路',
	'Best practices': '使唤它的窍门',
	'Create custom subagents': '创建自定义子代理',
	'Run agent teams': '运行代理团队',
	'Create plugins': '创建插件',
	'Discover and install prebuilt plugins': '发现和安装现成插件',
	'Extend Claude with skills': '用技能扩展 Claude',
	'Run prompts on a schedule': '定时运行提示',
	'Output styles': '输出风格',
	'Automate with hooks': '用钩子自动化',
	'Programmatic usage': '编程方式调用',
	'Model Context Protocol (MCP)': '模型上下文协议 (MCP)',
	Troubleshooting: '故障排查',
	'Remote Control': '远程控制',
	'Claude Code on the web': '网页版',
	'Chrome extension (beta)': 'Chrome 扩展',
	'Visual Studio Code': 'VS Code',
	'JetBrains IDEs': 'JetBrains 工具',
	'Claude Code in Slack': 'Slack',
	'Amazon Bedrock': 'Amazon Bedrock',
	'Google Vertex AI': 'Google Vertex AI',
	'Microsoft Foundry': 'Microsoft Foundry',
	'Network configuration': '网络配置',
	'LLM gateway': 'LLM 网关',
	'Development containers': '开发容器',
	'Advanced setup': '管理员设置',
	Settings: '各种配置',
	Permissions: '权限控制',
	Sandboxing: '沙箱机制',
	'Terminal configuration': '终端配置',
	'Model configuration': '模型配置',
	'Speed up responses with fast mode': '快速模式',
	'Customize status line': '状态栏定制',
	'Customize keyboard shortcuts': '快捷键定制',
	'CLI reference': '命令行指令',
	'Interactive mode': '交互模式',
	Checkpointing: '检查点',
	'Hooks reference': 'Hooks 参考',
	'Plugins reference': '插件参考',
	Authentication: '身份认证',
	Security: '安全',
	'Server-managed settings (beta)': '服务器托管设置',
	'Data usage': '数据使用',
	'Zero data retention': '零数据保留',
	Monitoring: '监控使用',
	Costs: '成本',
	'Track team usage with analytics': '团队分析',
	'Create and distribute a plugin marketplace': '插件市场'
};

const summaryOverrides: Record<string, string> = {
	permissions: '讲 Claude Code 的权限怎么收、怎么放，哪些该先锁紧。',
	sandboxing: '解释沙箱怎么保护环境，哪些命令会被拦，哪些能放行。',
	'terminal-config': '终端外观和行为怎么调，叫它更顺手。',
	'model-config': '模型相关设置怎么选，速度、成本和效果怎么拿捏。',
	'fast-mode': '讲快速模式是什么，什么时候图快值得开。',
	statusline: '状态栏上显示什么信息，怎么更清楚地盯进度。',
	keybindings: '快捷键怎么配，让常用动作少绕手。',
	authentication: '账号怎么接、怎么认主，避免登录和权限卡壳。',
	security: '安全边界怎么立，避免帮工越权。',
	'server-managed-settings': '管理员统一下发配置，减少各自乱配。',
	'data-usage': '数据怎么用、用到哪一步，心里要有数。',
	'zero-data-retention': '哪些场景要求不留数据，这页讲清楚。',
	'monitoring-usage': '看团队都怎么用，哪儿最耗、哪儿最常用。',
	costs: '费用从哪来，怎么估、怎么控。',
	analytics: '用分析看团队使用情况，不再全靠拍脑袋。',
	'plugin-marketplaces': '自己做团队插件市场，把常用插件统一管起来。',
	'interactive-mode': '交互模式里有哪些口令和习惯用法。',
	checkpointing: '检查点怎么留，方便回头或分段试活。',
	hooks: 'Hooks 的参考表，查配置和字段用。',
	'plugins-reference': '插件字段和结构的参考表。'
};

const descriptionOverrides: Record<string, string> = {
	permissions: '这页适合先把“谁能读、谁能改、谁能执行”这三层分清楚。',
	sandboxing: '像给帮工划活动范围，别让它一步跨出院墙。',
	'terminal-config': '界面和交互手感往往就差这些小配置。',
	'model-config': '不同模型像不同工种，得按活路来选。',
	'fast-mode': '图快不等于乱来，要知道什么时候值当开。',
	statusline: '把最关键的信息挂在眼前，少反复追问。',
	keybindings: '高频动作省一步，长久看很值。',
	authentication: '账号、组织、权限链路先打通，后面才不容易卡死。',
	security: '安全不是可选项，越早立规矩越省心。',
	'server-managed-settings': '适合团队统一控规矩，不靠口头约定。',
	'data-usage': '尤其适合对数据合规敏感的团队。',
	'zero-data-retention': '对高要求环境，这页往往是必看项。',
	'monitoring-usage': '看清楚用量，才能谈优化。',
	costs: '别等账单出来才回头补锅。',
	analytics: '数据能帮你看清团队到底怎么在用工具。',
	'plugin-marketplaces': '统一分发插件，比各自找插件稳得多。',
	'interactive-mode': '把常用口令和会话节奏摸熟，效率会高不少。',
	checkpointing: '适合怕改坏、需要反复试验的大活。',
	hooks: '查表型页面，关键是准确，不是花哨。',
	'plugins-reference': '做插件或查插件字段时很实用。'
};

const baseNavSections: NavSection[] = [
	{
		title: '入门指南',
		items: [
			{
				title: 'Claude Code 是个啥',
				path: '/docs/en/overview',
				summary: '先认清这个电子帮工到底能帮你干哪些活，在哪儿都能叫它上手。',
				description: 'Claude Code 就像请来一个识字快、手脚麻利的帮工。你把活路讲明白，它能进仓库看材料（读代码）、拿工具修东西（改文件）、还会自己跑腿试一遍（运行命令）。'
			},
			{
				title: '快速上手',
				path: '/docs/en/quickstart',
				summary: '手把手带你把电子帮工领进门，从装工具到交第一件活，像新农具下地先试一垄。',
				description: '这一页主要讲最短路径：安装、登录、进项目、下第一道命令。'
			}
		]
	},
	{
		title: '用 Claude Code 搞构建',
		items: [
			{ title: '创建自定义子代理', path: '/docs/en/sub-agents', summary: '教怎么养一堆专门干特定活的小帮工，各管一摊，互不搅和。', description: '子代理就是专门干特定活的 AI 小帮工。每个子代理有自己的系统提示、工具权限和独立上下文。遇到匹配的活，Claude 会自动派给它。' },
			{ title: '运行代理团队', path: '/docs/en/agent-teams', summary: '让多个代理并行干活、互相配合，像包工头带施工队。', description: '代理团队让多个 Claude 实例在独立会话里并行工作，还能互相通信。适合大规模探索、多任务并发。' },
			{ title: '创建插件', path: '/docs/en/plugins', summary: '把子代理、技能、配置打包成插件，分享给别人或跨项目用。', description: '插件是打包好的扩展包，可以包含子代理、技能、MCP 服务器配置。一次打包，到处安装。' },
			{ title: '发现和安装现成插件', path: '/docs/en/discover-plugins', summary: '别人打包好的插件去哪找、怎么装、怎么管。', description: '不用重复造轮子。去插件市场找现成的，装上就能用。也能把自己写的分享出去。' },
			{ title: '用技能扩展 Claude', path: '/docs/en/skills', summary: '技能就是预先写好的绝活，遇到特定活路直接喊它使出来。', description: '技能是预先写好的指令模板，遇到特定场景就能调用。比如"写单元测试"、"审查代码"、"写 API 文档"。' },
			{ title: '定时运行提示', path: '/docs/en/scheduled-tasks', summary: '让 Claude 按时自动干活，比如每天早上拉取日报、每周检查依赖。', description: '定时任务让你可以设置 cron 表达式，到点自动执行指定提示。适合周期性检查、报告生成。' },
			{ title: '输出风格', path: '/docs/en/output-styles', summary: '控制 Claude 输出成什么样：纯文本、Markdown、JSON、XML 随便选。', description: '不同场景需要不同输出格式。可以指定 Claude 用纯文本、Markdown、JSON、XML 等格式回答。' },
			{ title: '用钩子自动化', path: '/docs/en/hooks-guide', summary: '钩子就是在特定时刻自动触发的脚本，像门禁规则。', description: '钩子让你在工具使用前、会话开始前、任务完成后等时刻插入自定义逻辑。适合做权限检查、自动备份、通知等。' },
			{ title: '编程方式调用', path: '/docs/en/headless', summary: '在脚本或程序里调用 Claude Code，把它当命令行工具或库来用。', description: '无头模式让你在 CI/CD、自动化脚本、其他程序里调用 Claude Code。可以传参数、捕获输出、集成到现有流程。' },
			{ title: '模型上下文协议 (MCP)', path: '/docs/en/mcp', summary: 'MCP 是标准接口，让 Claude 能连外部数据源和工具，像给帮工配外接设备。', description: 'MCP 让 Claude 能连数据库、API、文件系统、第三方服务。有现成连接器，也能自己写。' },
			{ title: '故障排查', path: '/docs/en/troubleshooting', summary: '常见问题和解决办法，卡壳了先来这里看看。', description: '收集了常见报错、性能问题、连接问题的诊断步骤和解决方案。' }
		]
	},
	{
		title: '核心概念',
		items: [
			{ title: '它咋个干活', path: '/docs/en/how-claude-code-works', summary: '讲清楚它咋一边看现场、一边动手、一边验活，不是瞎忙，是有套路地转圈干活。', description: '这一页把 Claude Code 的干活路数讲透：先摸情况，再出手，再回头检查，像靠谱师傅修屋先看漏点、再补缝、再泼水验。' },
			{ title: '给它加本事', path: '/docs/en/features-overview', summary: '告诉你怎么给这个帮手加家伙事，把规矩、外援、自动化都接上，不只会干基础活。', description: '像给拖拉机挂犁、挂播种机、挂收割机，Claude Code 也能靠 skills、MCP、hooks、subagents 长出不同本事。' },
			{ title: '让它记规矩', path: '/docs/en/memory', summary: '让它把家规和干活经验都记住，省得每回开工都从头念一遍。', description: '这一页讲清楚 `CLAUDE.md` 和 auto memory 的分工：一个像墙上家规，一个像老帮工随手记的小本子。' },
			{ title: '常见干活套路', path: '/docs/en/common-workflows', summary: '把常见活路拆成顺手套路，像看新地、查毛病、翻旧屋、补测试，都有固定走法。', description: '这一页不讲空话，专讲日常怎么派活给 Claude Code，照着这些套路走，比临时瞎比画稳得多。' },
			{ title: '使唤它的窍门', path: '/docs/en/best-practices', summary: '教你怎么把这个好帮手使唤顺，少跑偏、少返工、少把上下文搅成一锅粥。', description: '这一页全是实战窍门：目标说清、尺子给够、规矩写短、会话别搅浑，这样 Claude Code 才越干越顺手。' }
		]
	},
	{
		title: '平台和集成',
		items: [
			{ title: '远程控制', path: '/docs/en/remote-control', summary: '人离开电脑了，也能用手机或浏览器接着使唤本机里的 Claude Code。', description: '活还是在你自己机器上跑，只是多开了个远程窗户，方便你边走边盯。' },
			{ title: '网页版', path: '/docs/en/claude-code-on-the-web', summary: '在网页上用，不用本地折腾。', description: '不用本地折腾太多，也能直接开工。' },
			{ title: 'Chrome 扩展', path: '/docs/en/chrome', summary: '浏览器扩展怎么配合。', description: '把它带进浏览器里帮你看页面和做事。' },
			{ title: 'VS Code', path: '/docs/en/vs-code', summary: '和 VS Code 一起干活。', description: '在写代码的地方直接叫它帮忙。' },
			{ title: 'JetBrains 工具', path: '/docs/en/jetbrains', summary: '和 JetBrains 系列工具配合。', description: '让它进你的主力编辑器里，少来回切换。' },
			{ title: 'Slack', path: '/docs/en/slack', summary: '在 Slack 里招呼它。', description: '在群里喊一声，也能让它来帮忙。' }
		]
	},
	{
		title: '部署',
		items: [
			{ title: '第三方集成', path: '/docs/en/third-party-integrations', summary: '讲第三方集成和部署出门。', description: '把 Claude Code 接到别的地方去用。' },
			{ title: 'Amazon Bedrock', path: '/docs/en/amazon-bedrock', summary: '在 AWS Bedrock 上部署，适合 AWS 原生团队。', description: '用 AWS 的账号和计费，跑在 AWS 基础设施上。适合已经在用 AWS 生态的团队。' },
			{ title: 'Google Vertex AI', path: '/docs/en/google-vertex-ai', summary: '在 GCP Vertex AI 上部署，适合 GCP 原生团队。', description: '用 GCP 的账号和计费，跑在 Google 云上。适合已经在用 GCP 生态的团队。' },
			{ title: 'Microsoft Foundry', path: '/docs/en/microsoft-foundry', summary: '在 Azure Foundry 上部署，适合 Azure 原生团队。', description: '用 Azure 的账号和计费，跑在微软云上。适合已经在用 Azure 生态的团队。' },
			{ title: '网络配置', path: '/docs/en/network-config', summary: '企业网络环境下的配置，比如代理、防火墙、出网限制。', description: '大公司通常有代理服务器、防火墙规则、出网限制。这一页讲怎么在这些环境下配置 Claude Code。' },
			{ title: 'LLM 网关', path: '/docs/en/llm-gateway', summary: '用网关统一管理多个 LLM 请求，适合集中管控。', description: 'LLM 网关帮你集中管理认证、限流、计费、审计。适合多团队共用、需要统一管控的场景。' },
			{ title: '开发容器', path: '/docs/en/devcontainer', summary: '在容器化开发环境里部署，保证环境一致。', description: '用 devcontainer 把开发环境打包成容器，团队成员环境一致，减少"在我机器上能跑"的问题。' }
		]
	},
	{
		title: '管理',
		items: [{ title: '管理员设置', path: '/docs/en/setup', summary: '管理员怎么立规矩、管权限。', description: '像村里管仓库钥匙的人，得先把权限和规则说清。' }]
	},
	{
		title: '配置',
		items: [{ title: '各种配置', path: '/docs/en/settings', summary: '各种设置项怎么调。', description: '把旋钮拧到合适位置，工具才顺手。' }]
	},
	{
		title: '参考',
		items: [{ title: '命令行指令', path: '/docs/en/cli-reference', summary: '命令行指令对照表。', description: '像农具说明书最后那页，查命令该怎么写。' }]
	}
];

function slugFromPath(path: string) {
	return path.replace(/^\/docs\/en\//, '').replace(/\/$/, '');
}

function humanizeEnglishTitle(title: string) {
	return titleTranslations[title] ?? title;
}

function buildGeneratedNav(): NavSection[] {
	const data = generatedSource as GeneratedSourceFile;
	const sections = data.sections ?? [];
	if (!sections.length) return [];

	return sections.map((section) => ({
		title: humanizeEnglishTitle(section.title),
		items: section.items.map((item) => {
			const slug = slugFromPath(item.path);
			return {
				title: humanizeEnglishTitle(item.title),
				path: item.path,
				summary: summaryOverrides[slug] ?? `${humanizeEnglishTitle(item.title)} 这一页讲的，就是 ${humanizeEnglishTitle(item.title)} 这件事在 Claude Code 里到底怎么用。`,
				description: descriptionOverrides[slug] ?? '这页会保留重要命令、配置和步骤，同时用更直白的话解释清楚。'
			};
		})
	}));
}

export const navSections: NavSection[] = buildGeneratedNav().length ? buildGeneratedNav() : baseNavSections;

export const allDocs = navSections.flatMap((section) =>
	section.items.map((item) => ({
		...item,
		section: section.title,
		slug: slugFromPath(item.path)
	}))
);

export function getDocBySlug(slug: string) {
	return allDocs.find((item) => item.slug === slug);
}
