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
			{
				title: '创建自定义子代理',
				path: '/docs/en/sub-agents',
				summary: '教怎么养一堆专门干特定活的小帮工，各管一摊，互不搅和。',
				description: '子代理就是专门干特定活的 AI 小帮工。每个子代理有自己的系统提示、工具权限和独立上下文。遇到匹配的活，Claude 会自动派给它。'
			},
			{
				title: '运行代理团队',
				path: '/docs/en/agent-teams',
				summary: '让多个代理并行干活、互相配合，像包工头带施工队。',
				description: '代理团队让多个 Claude 实例在独立会话里并行工作，还能互相通信。适合大规模探索、多任务并发。'
			},
			{
				title: '创建插件',
				path: '/docs/en/plugins',
				summary: '把子代理、技能、配置打包成插件，分享给别人或跨项目用。',
				description: '插件是打包好的扩展包，可以包含子代理、技能、MCP 服务器配置。一次打包，到处安装。'
			},
			{
				title: '发现和安装现成插件',
				path: '/docs/en/discover-plugins',
				summary: '别人打包好的插件去哪找、怎么装、怎么管。',
				description: '不用重复造轮子。去插件市场找现成的，装上就能用。也能把自己写的分享出去。'
			},
			{
				title: '用技能扩展 Claude',
				path: '/docs/en/skills',
				summary: '技能就是预先写好的绝活，遇到特定活路直接喊它使出来。',
				description: '技能是预先写好的指令模板，遇到特定场景就能调用。比如"写单元测试"、"审查代码"、"写 API 文档"。'
			},
			{
				title: '定时运行提示',
				path: '/docs/en/scheduled-tasks',
				summary: '让 Claude 按时自动干活，比如每天早上拉取日报、每周检查依赖。',
				description: '定时任务让你可以设置 cron 表达式，到点自动执行指定提示。适合周期性检查、报告生成。'
			},
			{
				title: '输出风格',
				path: '/docs/en/output-styles',
				summary: '控制 Claude 输出成什么样：纯文本、Markdown、JSON、XML 随便选。',
				description: '不同场景需要不同输出格式。可以指定 Claude 用纯文本、Markdown、JSON、XML 等格式回答。'
			},
			{
				title: '用钩子自动化',
				path: '/docs/en/hooks-guide',
				summary: '钩子就是在特定时刻自动触发的脚本，像门禁规则。',
				description: '钩子让你在工具使用前、会话开始前、任务完成后等时刻插入自定义逻辑。适合做权限检查、自动备份、通知等。'
			},
			{
				title: '编程方式调用',
				path: '/docs/en/headless',
				summary: '在脚本或程序里调用 Claude Code，把它当命令行工具或库来用。',
				description: '无头模式让你在 CI/CD、自动化脚本、其他程序里调用 Claude Code。可以传参数、捕获输出、集成到现有流程。'
			},
			{
				title: '模型上下文协议 (MCP)',
				path: '/docs/en/mcp',
				summary: 'MCP 是标准接口，让 Claude 能连外部数据源和工具，像给帮工配外接设备。',
				description: 'MCP 让 Claude 能连数据库、API、文件系统、第三方服务。有现成连接器，也能自己写。'
			},
			{
				title: '故障排查',
				path: '/docs/en/troubleshooting',
				summary: '常见问题和解决办法，卡壳了先来这里看看。',
				description: '收集了常见报错、性能问题、连接问题的诊断步骤和解决方案。'
			}
		]
	},
	{
		title: '核心概念',
		items: [
			{
				title: '它咋个干活',
				path: '/docs/en/how-claude-code-works',
				summary: '讲清楚它咋一边看现场、一边动手、一边验活，不是瞎忙，是有套路地转圈干活。',
				description: '这一页把 Claude Code 的干活路数讲透：先摸情况，再出手，再回头检查，像靠谱师傅修屋先看漏点、再补缝、再泼水验。'
			},
			{
				title: '给它加本事',
				path: '/docs/en/features-overview',
				summary: '告诉你怎么给这个帮手加家伙事，把规矩、外援、自动化都接上，不只会干基础活。',
				description: '像给拖拉机挂犁、挂播种机、挂收割机，Claude Code 也能靠 skills、MCP、hooks、subagents 长出不同本事。'
			},
			{
				title: '让它记规矩',
				path: '/docs/en/memory',
				summary: '让它把家规和干活经验都记住，省得每回开工都从头念一遍。',
				description: '这一页讲清楚 `CLAUDE.md` 和 auto memory 的分工：一个像墙上家规，一个像老帮工随手记的小本子。'
			},
			{
				title: '常见干活套路',
				path: '/docs/en/common-workflows',
				summary: '把常见活路拆成顺手套路，像看新地、查毛病、翻旧屋、补测试，都有固定走法。',
				description: '这一页不讲空话，专讲日常怎么派活给 Claude Code，照着这些套路走，比临时瞎比画稳得多。'
			},
			{
				title: '使唤它的窍门',
				path: '/docs/en/best-practices',
				summary: '教你怎么把这个好帮手使唤顺，少跑偏、少返工、少把上下文搅成一锅粥。',
				description: '这一页全是实战窍门：目标说清、尺子给够、规矩写短、会话别搅浑，这样 Claude Code 才越干越顺手。'
			}
		]
	},
	{
		title: '平台和集成',
		items: [
			{ title: '远程控制', path: '/docs/en/remote-control', summary: '人离开电脑了，也能用手机或浏览器接着使唤本机里的 Claude Code。', description: '活还是在你自己机器上跑，只是多开了个远程窗户，方便你边走边盯。' },
			{ title: '网页版', path: '/docs/en/claude-code-on-the-web', summary: '在网页上用，不用本地折腾。', description: '不用本地折腾太多，也能直接开工。' },
			{ title: '桌面端', path: '/docs/en/desktop', summary: '在桌面端用，像平时开软件。', description: '像平时开软件一样使用 Claude Code。' },
			{ title: 'Chrome 扩展', path: '/docs/en/chrome', summary: '浏览器扩展怎么配合。', description: '把它带进浏览器里帮你看页面和做事。' },
			{ title: 'VS Code', path: '/docs/en/vs-code', summary: '和 VS Code 一起干活。', description: '在写代码的地方直接叫它帮忙。' },
			{ title: 'JetBrains 工具', path: '/docs/en/jetbrains', summary: '和 JetBrains 系列工具配合。', description: '让它进你的主力编辑器里，少来回切换。' },
			{ title: 'GitHub Actions', path: '/docs/en/github-actions', summary: '放进 GitHub 自动流程。', description: '像定时雇工，代码一动就自动安排事。' },
			{ title: 'GitLab CI/CD', path: '/docs/en/gitlab-ci-cd', summary: '放进 GitLab 流水线。', description: '把重复活交给机器按流程跑。' },
			{ title: 'GitHub 代码审查', path: '/docs/en/code-review', summary: '让它帮你看代码改得对不对。', description: '像找个懂行师傅先给你把把关。' },
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
		items: [
			{ title: '管理员设置', path: '/docs/en/setup', summary: '管理员怎么立规矩、管权限。', description: '像村里管仓库钥匙的人，得先把权限和规则说清。' }
		]
	},
	{
		title: '配置',
		items: [
			{ title: '各种配置', path: '/docs/en/settings', summary: '各种设置项怎么调。', description: '把旋钮拧到合适位置，工具才顺手。' }
		]
	},
	{
		title: '参考',
		items: [
			{ title: '命令行指令', path: '/docs/en/cli-reference', summary: '命令行指令对照表。', description: '像农具说明书最后那页，查命令该怎么写。' }
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
