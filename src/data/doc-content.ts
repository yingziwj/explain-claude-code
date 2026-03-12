import type { DocItem } from './navigation';
import generatedContentFile from './generated/generated-doc-content.json';

export type DocStep = {
	title: string;
	body: string;
	code?: string;
};

export type DocSectionContent = {
	title: string;
	paragraphs: string[];
	steps?: DocStep[];
};

export type DocContent = {
	sourceLabel: string;
	sections: DocSectionContent[];
	illustration: {
		title: string;
		lines: string[];
		caption: string;
	};
};

type ContentSeed = {
	sourceLabel?: string;
	summary: string[];
	explain: string[];
	practice: string[];
	steps?: DocStep[];
	illustration?: DocContent['illustration'];
};

type GeneratedContentFile = {
	generatedAt: string | null;
	sourceGeneratedAt: string | null;
	items: Record<string, DocContent>;
};

const generatedContent = (generatedContentFile as GeneratedContentFile).items ?? {};

const pageSeeds: Record<string, ContentSeed> = {
	overview: {
		sourceLabel: 'Overview',
		summary: [
			'Claude Code 不是只会聊天的机器人，它更像能下地干活的电子帮工。',
			'它能进项目里看代码、改文件、跑命令、验结果，而且终端、编辑器、网页这些地方都能接着用。'
		],
		explain: [
			'你可以把 Claude Code 当成一个识字快、腿脚也快的帮工。你交代“去看看这屋哪漏雨”，它真会去翻梁、看瓦、找裂缝，不是只站在旁边空出主意。',
			'更关键的是，它改完还能自己试。比如修了代码，会顺手跑构建、跑测试、看报错，像师傅补完水管自己先开阀门试一遍。',
			'这一页最想告诉你的就一句话：别把它当问答机，要把它当能看现场、能动手、能验活的帮手。'
		],
		practice: [
			'第一次接触它，先知道它能在哪些地方用，再挑一个你最顺手的入口开工，通常是终端或编辑器。',
			'交代任务时尽量像报修一样说清楚：哪儿坏了、你想修成什么样、改完怎么验收。',
			'如果你后面准备继续深用，下一步就该去看 Quickstart、Memory、Best practices 这些更实操的页。'
		],
		illustration: {
			title: '一眼看懂它怎么干活',
			lines: ['你开口派活', '   |', '   v', '[Claude Code]', '/   |   \\', '看代码 改文件 跑命令', '   |', '   v', '把结果回给你'],
			caption: '你负责把活说明白，它负责看现场、动手修、再回来汇报。'
		}
	},
	quickstart: {
		sourceLabel: 'Quickstart',
		summary: [
			'这一页就是带你把 Claude Code 领进门，从安装、登录到交第一件活。',
			'重点不是把所有概念一口气背熟，而是尽快在自己项目里跑通第一次完整操作。'
		],
		explain: [
			'像新买一台农机，你别先研究发动机原理，先学会怎么打火、怎么挂挡、怎么下地试一小垄。',
			'Quickstart 也是这个思路：装好工具，进到项目目录，让它先认门，再给一个不大的活，看它会不会按规矩干。',
			'只要第一次跑通了，后面修 bug、补测试、整理文档，都是同一路数往上加。'
		],
		practice: [
			'最稳的路线就是：安装 Claude Code，进入项目目录，敲 `claude`，先问项目结构，再交一个小任务。',
			'第一次不要直接让它大改。先让它解释目录、指出入口文件、描述技术栈，确认它没有认错门。',
			'等它能把小活做对，再逐步让它修 bug、写测试、整理 Git 提交。'
		],
		steps: [
			{
				title: '装上 Claude Code',
				body: '官方最推荐直接跑安装脚本。系统不同，命令也不同，照着你自己的机器选一条就行。',
				code: `# macOS / Linux / WSL\ncurl -fsSL https://claude.ai/install.sh | bash\n\n# Windows PowerShell\nirm https://claude.ai/install.ps1 | iex\n\n# Windows CMD\ncurl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd`
			},
			{
				title: '第一次开工',
				body: '进到你的项目目录后，直接敲 \`claude\`。第一次它会带你登录，认完主就能开始问和改。',
				code: `cd your-project\nclaude`
			},
			{
				title: '先让它看明白现场',
				body: '不要一上来就扔大活，先让它介绍项目、入口文件和目录结构。',
				code: `what does this project do?\nwhere is the main entry point?\nexplain the folder structure`
			}
		],
		illustration: {
			title: '上手路线图',
			lines: ['装工具 -> 登录 -> 进项目', '        |', '        v', '先问路 -> 交小活 -> 看结果', '        |', '        v', '再让它修真问题'],
			caption: '别一上来就扔大工程，先让它认门、认地、认工具。'
		}
	},
	'sub-agents': {
		summary: ['子代理就是把一个大帮工拆成几个专门干单项活的小帮工。', '每个子代理有自己的职责、口气和工具权限，遇到合适的活就能自动接手。'],
		explain: ['这东西像村里分工：一个人专门查毛病，一个人专门写测试，一个人专门改文档。别让所有活都挤到同一个脑袋里。', '好处是上下文更干净，干活边界更清楚，不容易今天修 bug 修着修着又跑去改文案。'],
		practice: ['先从最容易分工的活开始，比如 `reviewer`、`test-writer`、`docs-helper`。', '给每个子代理写清楚“负责什么、不负责什么、能用哪些工具”，不然它们容易抢活。'],
		steps: [{ title: '常见分工', body: '先从固定套路开始，最容易见效。', code: `bug-hunter\nreviewer\ntest-writer\ndocs-helper` }]
	},
	'agent-teams': {
		summary: ['代理团队是多名 Claude 同时开工，不再是一个人轮流换帽子。', '适合大项目、多任务并行、需要一边勘察一边施工一边验收的场景。'],
		explain: ['你可以把它想成包工头带施工队。主代理负责分派任务，其他代理各干各的，最后再把结果汇总。', '这比子代理更像真团队，因为它们是多个独立会话，不是同一会话里轮流发言。'],
		practice: ['只有任务确实能拆开时才用团队。小活硬拉团队，只会增加协调成本。', '最稳的拆法通常是“调查一组、实现一组、验收一组”，别让多人同时改同一块地方。'],
		steps: [{ title: '适合团队的活', body: '这些事情并行做，通常更值。', code: `1. 多模块排查\n2. 一边实现一边补测试\n3. 并行写代码、文档和验收报告` }]
	},
	plugins: {
		summary: ['插件就是把常用本事打包好，别的项目一装就能用。', '它可以带上子代理、技能、MCP 配置这些“成套工具”。'],
		explain: ['像把常用农具装成一套工具箱。下次去另一块地，不用再一把锄头一把铲子重新找。', '如果你们团队有固定工作流，插件最适合拿来做复用。'],
		practice: ['先想清楚这个插件解决的是哪类重复问题，再决定里面放技能、子代理还是外部连接。', '插件不要贪多。一个插件最好解决一类明确场景，而不是把所有东西都塞进去。'],
		steps: [{ title: '打包前先问三句', body: '想明白这三句，插件就不容易做成一坨。', code: `1. 这个插件帮谁省时间？\n2. 安装后最常用的动作是什么？\n3. 团队里哪些项目都能复用？` }]
	},
	'discover-plugins': {
		summary: ['这一页讲去哪找现成插件、怎么装、怎么判断值不值得装。', '重点不是装得多，而是挑对。'],
		explain: ['别人已经做好的插件，能省你重复造轮子。但轮子也有好有坏，先看它解决的场景是不是你的刚需。', '安装前最好先看清插件带了哪些能力，别把自己不需要的权限也一起带进来。'],
		practice: ['先找最贴近你工作流的插件，比如审查代码、连外部系统、补测试。', '装完先在小项目试，确认没副作用，再推广到主项目。']
	},
	skills: {
		summary: ['技能就是预先写好的绝活说明书，Claude 遇到对应场景就能直接拿来用。', '它很适合把团队里的固定套路固化下来。'],
		explain: ['你可以把技能当成“遇到这种活就照这个打法来”的小抄。比如审查 PR、写单测、写接口文档，都能做成技能。', '这样做的好处是口径统一，不靠每次临场发挥。'],
		practice: ['技能描述要短、准、能执行，最好明确输入、输出和边界。', '别把技能写成长篇空话。能用几条清楚规则说完，就不要写成一大篇作文。']
	},
	'scheduled-tasks': {
		summary: ['定时任务就是让 Claude 到点自动干活。', '适合日报、巡检、依赖检查、固定提醒这类重复劳动。'],
		explain: ['这就像你定好“每天早上看一遍水泵，每周一查一遍仓库”，到点自动做，不用人每次都记着喊。', '它最适合规则明确、周期固定、结果可查的活。'],
		practice: ['先从最稳定的重复活开始，比如整理变更、检查依赖、生成项目健康报告。', '定时任务要写清楚产出放哪儿、失败怎么办、什么情况下跳过。'],
		steps: [{ title: '适合定时的事情', body: '下面这些最容易先跑起来。', code: `每天早上：总结昨日变更\n每天中午：检查依赖更新\n每周一：生成项目健康报告` }]
	},
	'output-styles': {
		summary: ['输出风格决定 Claude 最后把话说成什么样。', '你是要看 Markdown、纯文本、结构化 JSON，提前说清楚。'],
		explain: ['同样一件事，给领导看、给机器看、给自己看，写法都不一样。输出风格就是在提前定规矩。', '如果你后面还要把结果喂给别的程序，结构化格式尤其重要。'],
		practice: ['给人看就优先选清楚易读的格式，给机器接就选 JSON/XML 这类结构化输出。', '别一会儿要自由发挥，一会儿又要固定字段，先定好主目标。']
	},
	'hooks-guide': {
		summary: ['钩子是在特定时刻自动触发的动作。', '你可以理解成“门口安个检查员”，进门前看一眼，出门后再看一眼。'],
		explain: ['钩子很适合做守门工作，比如改文件后自动格式化、提交前自动跑检查、会话开始时先提醒规则。', '它不是替代 Claude，而是在关键关口补一道自动规则。'],
		practice: ['先把最稳的钩子加上，比如格式化、lint、提醒说明。', '钩子别写太重，不然每次都卡很久，用户很快就不想用了。']
	},
	headless: {
		summary: ['无头模式就是不进聊天界面，直接在脚本或 CI 里调用 Claude Code。', '适合自动流程、批处理和流水线集成。'],
		explain: ['你可以把它当成“把帮工嵌进机器流程里”。人不一定站在旁边，但机器会按你定好的话把活派出去。', '这种模式特别适合重复审查、批量解释、自动生成报告。'],
		practice: ['先挑一个低风险场景试，比如解释报错、生成摘要、审查改动。', '自动流程里要特别注意输入范围和权限，别让它拿到超出预期的东西。']
	},
	mcp: {
		summary: ['MCP 是 Claude Code 接外部工具和数据源的标准接口。', '有了它，Claude 不只看本地代码，还能摸到数据库、文档、工单、聊天记录这些外部材料。'],
		explain: ['这东西像给帮工接上外接设备。原来它只在你院里转，现在能去仓库看账本、去办公室翻工单。', '重点不是“连得多”，而是“连得准”。先接最能帮你做决策的外部信息。'],
		practice: ['先决定你最缺哪种外部信息，再去接对应的 MCP 服务。', '接好后先试只读类场景，确认数据能看懂，再慢慢放到写入类操作。'],
		steps: [{ title: '最常见的接法', body: '先从读取外部信息开始，风险最小。', code: `1. 连接设计文档\n2. 读取工单系统\n3. 查看团队聊天记录\n4. 调用自定义内部工具` }]
	},
	troubleshooting: {
		summary: ['这一页是遇到问题时的急救箱。', '当安装失败、登录不通、命令跑不动、结果不对时，先来这里排查。'],
		explain: ['排错最怕瞎撞墙。官方这页的价值就是帮你先分门别类：到底是环境问题、权限问题、网络问题，还是命令本身没写清。', '先分清类别，修起来才快。'],
		practice: ['每次排错都先记下报错原文、运行环境和你刚刚做了什么。', '不要一上来全盘重装。先查最小可验证项，比如版本、登录状态、网络连通、目录是否正确。']
	},
	'how-claude-code-works': {
		summary: ['这页解释 Claude Code 干活的基本套路。', '它不是瞎猜，而是先看现场、再计划、再动手、再回头验。'],
		explain: ['像一个靠谱师傅，先围着屋子转一圈，问清问题，再决定从哪块砖下手。', '你越理解这个工作节奏，就越知道该什么时候让它先分析，什么时候再让它改。'],
		practice: ['大活先让它分析和列计划，小活可以直接让它上手。', '如果它开始跑偏，通常是任务边界不清，或者上下文里混了太多互不相关的信息。']
	},
	'features-overview': {
		summary: ['这一页像能力总表，告诉你 Claude Code 不只是会聊天改文件。', '它还能接技能、接 MCP、接 hooks、接子代理，慢慢长成一整套工作平台。'],
		explain: ['你可以把它当成拖拉机的挂载清单。原机能开，挂上不同工具后，能耕地、播种、收割。', '先知道有哪些挂件，后面你才知道自己要补哪块能力。'],
		practice: ['不要一口气全装。先挑最能解决当下痛点的一项，比如记规矩、接外部工具或自动检查。', '每加一项能力，都先确认收益是不是大于复杂度。']
	},
	memory: {
		summary: ['这一页讲 Claude Code 的“记性”从哪儿来。', '一个是你写的 `CLAUDE.md`，一个是它逐步积累的 auto memory。'],
		explain: ['`CLAUDE.md` 像贴在墙上的家规，适合写团队都要遵守的规则。auto memory 像老帮工的小本子，适合记干活过程中学到的经验。', '两者都很有用，但职责不同，别混着写。'],
		practice: ['长期规则写进 `CLAUDE.md`，临场经验让 auto memory 慢慢积累。', '规则文件要短而硬，写真正影响结果的东西，不要把大段废话也塞进去。'],
		steps: [{ title: 'CLAUDE.md 最适合写什么', body: '写团队共识和硬规则最值。', code: `- 常用构建命令\n- 测试命令\n- 代码风格要求\n- 架构边界\n- 审查清单` }]
	},
	'common-workflows': {
		summary: ['这一页讲的是常见活路该怎么派给 Claude Code。', '不是空谈能力，而是把常见任务拆成顺手套路。'],
		explain: ['新项目摸底、修 bug、补测试、整理说明、做代码审查，这些都是日常高频活。', '按套路派活，比临场乱说更稳，也更容易复用。'],
		practice: ['先从“让它先看，再让它改，再让它验”这个固定节奏开始。', '如果是复杂活，就把活拆成几段，一段一段验，不要一口吞整头牛。']
	},
	'best-practices': {
		summary: ['这一页讲怎么把 Claude Code 用顺手，而不是用成一锅粥。', '核心就是目标清楚、范围清楚、验收清楚。'],
		explain: ['好帮手也怕遇到糊涂指令。你话说得越具体，它越少返工。', '这页不是新功能，而是把前面那些能力用得更稳的经验。'],
		practice: ['任务要具体，最好带上范围、限制、验收标准。', '上下文别太杂。不同活别硬塞同一会话，不然它会把东家的锄头拿去修西家的墙。']
	},
	'remote-control': {
		summary: ['远程控制让你离开本机时，也能接着盯 Claude Code 会话。', '活还在原来的机器上跑，你只是换了个地方发号施令。'],
		explain: ['这像人出了门，但院里的帮工还在干活。你在手机或浏览器里照样能看进度、接着安排。', '最适合长任务、后台任务、出门在外还想续上工作的情况。'],
		practice: ['远程前先确认本机环境、权限和项目目录都已经准备好。', '适合看进度、补一句指令、接着验收，不适合高风险的大改。']
	},
	'claude-code-on-the-web': {
		summary: ['网页版适合不想在本地装一堆东西，或者想直接在浏览器开工的人。', '它也适合跑长任务、并行开多个任务。'],
		explain: ['你可以把它当成“借个现成工棚”。不用先自己搭环境，也能先把活交出去。', '对临时看仓库、开长任务、跨设备接续很方便。'],
		practice: ['如果你本地环境还没配好，先用网页版起手是很现实的。', '但要分清：哪些任务适合云端跑，哪些任务仍然更适合在你本机项目里处理。']
	},
	desktop: {
		summary: ['桌面端适合喜欢图形界面的人。', '它把 Claude Code 变成一个更像日常应用的软件，而不是只待在终端里。'],
		explain: ['这就像把帮工请进带窗户的工作间。看 diff、排多个会话、做可视化检查，都更舒服。', '如果你平时不爱黑窗口，桌面端会顺手很多。'],
		practice: ['适合做视觉审查、并排看多个任务、管理定时任务。', '需要更精细的命令行控制时，还是终端最直接。']
	},
	chrome: {
		summary: ['Chrome 扩展适合调试和理解网页相关问题。', '它能让 Claude 更直接地接触浏览器页面现场。'],
		explain: ['很多网页问题，不在代码文件里一眼能看见，而在“页面跑起来后到底长成啥样”。', '扩展的作用，就是让帮工能去现场看，不只靠你口述。'],
		practice: ['前端页面异常、交互不对、页面状态问题，这类场景最适合先接浏览器能力。', '要注意只在必要时开这条路，避免带来不必要的复杂度。']
	},
	'vs-code': {
		summary: ['VS Code 集成让你在编辑器里直接用 Claude Code。', '好处是写代码、看 diff、继续对话都在一个地方完成。'],
		explain: ['这就像把帮工请到你常坐的工位边上，不用总在终端和编辑器之间来回跑。', '尤其适合边看文件边讨论改动。'],
		practice: ['如果你平时主力就是 VS Code，这通常是最顺手的入口。', '先用它做局部修改、解释代码、审查差异，熟了再处理更大的任务。']
	},
	jetbrains: {
		summary: ['JetBrains 集成和 VS Code 的目标一样，都是把 Claude Code 放进你的主力 IDE。', '适合 IntelliJ、PyCharm、WebStorm 这类用户。'],
		explain: ['对 JetBrains 用户来说，最重要的不是换工具，而是别离开原来的工作台。', '这样上下文、工程结构和改动视图都更顺。'],
		practice: ['先确认插件装好、IDE 重启后正常出现入口，再从解释代码和小改动开始用。', '越是复杂工程，越能感受到 IDE 内联工作比来回切换省事。']
	},
	'github-actions': {
		summary: ['GitHub Actions 集成适合把 Claude Code 放进自动流程。', '比如自动审查、自动修简单问题、自动整理说明。'],
		explain: ['代码一推上去，机器自己把活派出去，这就是它的价值。', '它最适合流程固定、输入明确、结果可回看的一类事情。'],
		practice: ['先从低风险自动化开始，比如总结 PR、标注风险、草拟建议。', '涉及自动改代码时，一定把权限和触发条件收紧。']
	},
	'gitlab-ci-cd': {
		summary: ['GitLab CI/CD 版本的思路和 GitHub Actions 一样，只是落在 GitLab 流水线上。', '适合已经以 GitLab 为主阵地的团队。'],
		explain: ['目标还是把重复检查和固定流程交给机器。', '差别只在平台，不在核心想法。'],
		practice: ['先接审查、总结、问题分拣这类轻量环节。', '真正涉及自动改动的任务，先在受控分支试，再慢慢扩大。']
	},
	'code-review': {
		summary: ['这页讲如何让 Claude 帮你看代码改得靠不靠谱。', '它特别适合查疏漏、提风险、补审查角度。'],
		explain: ['人眼审代码容易漏，特别是改动多、时间赶的时候。Claude 可以先帮你打一遍样。', '但它不是替代人，而是先帮你把明显坑挖出来。'],
		practice: ['让它重点看 bug 风险、行为回归、测试缺口、安全边界，不要只问“写得好不好看”。', '把审查范围说清，比如只看本次 diff、只看某个模块，会更准。']
	},
	slack: {
		summary: ['Slack 集成适合把团队聊天里的需求直接送到 Claude 手里。', '比如群里有人报 bug，它可以顺着去开工。'],
		explain: ['这像在群里喊一声，帮工就从聊天记录里接单。', '对团队协作特别省来回转述的功夫。'],
		practice: ['最适合报障、转需求、催调查这类协作场景。', '群里说的话最好也尽量清楚，不然 Claude 只会把糊涂单接过去。']
	},
	'third-party-integrations': {
		summary: ['这一页讲 Claude Code 怎么接第三方平台和外部环境。', '重点在“接得稳、接得清楚、接得可管”。'],
		explain: ['很多团队不是只用 Anthropic 自家入口，还会接自己的云、代理、供应商。', '这页就是讲“如果不走最默认那条路，该怎么接”。'],
		practice: ['先确认你接第三方是为账号、计费、合规还是网络环境，再选对应方案。', '不要为了“看起来高级”就多套一层，能简单走通的先简单。']
	},
	'amazon-bedrock': {
		summary: ['这页讲如何通过 AWS Bedrock 使用 Claude Code。', '适合本来就扎在 AWS 体系里的团队。'],
		explain: ['如果你们账号、权限、网络、审计都已经建在 AWS 上，走 Bedrock 通常更顺。', '这样运维和合规都更容易接进现有体系。'],
		practice: ['先把 AWS 账号、区域、权限角色这些基础打通，再看 Claude Code 这层。', '企业环境里，云平台接入通常不难，难的是权限边界要事先讲清。']
	},
	'google-vertex-ai': {
		summary: ['这页讲通过 Google Vertex AI 接 Claude Code。', '适合 GCP 体系团队。'],
		explain: ['如果你们家本来所有机器、权限和账单都在 Google 云上，那直接走 Vertex 会省很多折腾。', '本质上还是“借现有大路走”，而不是另修一条小路。'],
		practice: ['重点先看项目、区域、权限和计费配置。', '和其他云接法一样，先把基础设施层打通，再往上跑 Claude Code。']
	},
	'microsoft-foundry': {
		summary: ['这页讲通过微软生态里的 Foundry/Azure 路子接 Claude Code。', '适合 Azure 体系团队。'],
		explain: ['对微软云用户来说，关键不是功能多新，而是能不能顺着现有账户体系和管控体系走。', '企业最怕另起炉灶，这页解决的就是这个问题。'],
		practice: ['优先确认订阅、租户、权限、网络策略这些前提。', '别等 Claude Code 配到一半，才发现根本没有目标资源的访问权。']
	},
	'network-config': {
		summary: ['网络配置页主要给公司内网、代理、防火墙这类环境看。', '如果你在普通家用网络里很顺，一进公司就卡，多半要看这页。'],
		explain: ['很多问题不是 Claude Code 本身坏了，而是它想出门，结果被门卫拦住了。', '代理、证书、白名单、出网策略，这些都属于“门卫规则”。'],
		practice: ['先找清楚你们环境是走代理、走直连，还是只能白名单出网。', '网络问题别只盯客户端，很多时候要和 IT 或平台同事一起查。']
	},
	'llm-gateway': {
		summary: ['LLM 网关适合需要统一认证、审计、限流、计费的团队。', '不是人人都需要，但大团队很常见。'],
		explain: ['你可以把网关理解成总闸口。所有请求都先过它，再统一分发、记账、限速。', '对多团队共用和合规管控特别有用。'],
		practice: ['如果只有一两个人自己用，先别急着上网关。', '一旦多团队共用、需要统一审计，网关价值就会很明显。']
	},
	devcontainer: {
		summary: ['开发容器页讲的是怎样在容器化开发环境里跑 Claude Code。', '目标是让每个人的环境更一致。'],
		explain: ['“在我机器上能跑”最烦人。容器化就是把环境也打包，谁来都尽量一个样。', 'Claude Code 跑在这种环境里，排错会少很多。'],
		practice: ['适合多人协作、环境依赖复杂、上手门槛高的项目。', '要先把容器里需要的命令、工具链和权限准备好，不然 Claude 进去也施展不开。']
	},
	setup: {
		summary: ['管理员设置页主要给团队管理员看，不是普通个人用户的第一站。', '它讲的是怎么立规则、配权限、管入口。'],
		explain: ['像村里管仓库钥匙的人，先得定清楚谁能进、谁能改、谁只能看。', '管理员层面的配置决定团队用起来是乱还是稳。'],
		practice: ['先把账户、权限、默认规则和安全边界定下来，再让团队大规模开用。', '越早把管理员规则讲清楚，后面越少补锅。']
	},
	settings: {
		summary: ['设置页讲的是 Claude Code 身上那些旋钮和挡位到底怎么拧。', '重点不是都去改，而是知道哪些配置会真正影响你的手感和安全边界。'],
		explain: ['像一台拖拉机，不只是会不会点火，还要知道档位、限速器、油门和刹车分别在哪儿。', '配置页就是让你分清“个人习惯”“项目规则”“临时试验”三类设置。'],
		practice: ['个人口味放全局，项目规则放仓库，临时试验用命令行参数覆盖。', '权限类设置宁可先收紧，再按需要慢慢放开。']
	},
	'cli-reference': {
		summary: ['命令行参考页是查表用的，不是给你讲故事的。', '当你忘了某个参数、某个开关、某个命令该怎么写，就来翻这页。'],
		explain: ['它像农具说明书最后那几页，不一定天天从头看，但用时特别救命。', '熟练以后，很多活快不快，差的就是这几个命令写得顺不顺。'],
		practice: ['先记最常用的几条，剩下的有需要再查。', '别死背所有参数，知道去哪翻比全背下来更实际。'],
		steps: [{ title: '最常用的一组', body: '这几条够大多数人先开工。', code: `claude\nclaude "fix the build error"\nclaude -p "explain this function"\nclaude -c\nclaude -r` }]
	}
};

function toContent(doc: DocItem & { slug: string }, seed: ContentSeed): DocContent {
	return {
		sourceLabel: seed.sourceLabel ?? doc.title,
		sections: [
			{
				title: '简要总结',
				paragraphs: seed.summary
			},
			{
				title: '农民伯伯版解释',
				paragraphs: seed.explain
			},
			{
				title: '上手时重点盯住什么',
				paragraphs: seed.practice,
				steps: seed.steps
			}
		],
		illustration:
			seed.illustration ?? {
				title: '一眼看懂这一页',
				lines: [doc.title, '   |', '   v', doc.summary, '   |', '   v', '照着步骤去做'],
				caption: '这页的作用，就是把原本偏专业的话题，拆成能直接照着走的明白话。'
			}
	};
}

function getFallbackSeed(doc: DocItem & { slug: string }): ContentSeed {
	return {
		summary: [doc.summary, doc.description],
		explain: [
			`这页讲的是“${doc.title}”这摊活在 Claude Code 里到底干什么。你可以把它理解成 ${doc.section} 这块地上的一个专门工具。`,
			'原文如果有点拗口，这里就把它拆成“什么时候用、怎么开始、哪里最容易出错”三件事来讲。',
			'如果你只记一条，就记住：目标要讲清，步骤要一小步一小步验，关键命令和配置名不要乱改。'
		],
		practice: [
			'第一，先分清这一页是在讲安装配置、扩展能力，还是接到别的工具里。分不清，就容易东一榔头西一棒子。',
			'第二，重要命令、配置名和代码片段必须保留原样。人话解释可以通俗，真正复制运行的东西不能瞎翻。',
			'第三，做完一步就验一步。像修水管，拧完一个接口先通水试试，别等全装完才发现前面就漏了。'
		]
	};
}

export function getDocContent(doc: DocItem & { slug: string }): DocContent {
	return pageSeeds[doc.slug] ? toContent(doc, pageSeeds[doc.slug]) : generatedContent[doc.slug] ?? toContent(doc, getFallbackSeed(doc));
}
