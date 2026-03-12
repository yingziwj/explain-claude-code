import type { DocItem } from './navigation';

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

const commandPresets: Record<string, DocStep[]> = {
	quickstart: [
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
	'cli-reference': [
		{
			title: '最常见的几个口令',
			body: '这些命令够你先把活干起来，后面再慢慢扩。',
			code: `claude\nclaude "fix the build error"\nclaude -p "explain this function"\nclaude -c\nclaude -r`
		}
	]
};

function getDefaultSections(doc: DocItem & { slug: string }): DocSectionContent[] {
	const steps = commandPresets[doc.slug];
	return [
		{
			title: '简要总结',
			paragraphs: [doc.summary, doc.description]
		},
		{
			title: '农民伯伯版解释',
			paragraphs: [
				`这页讲的是“${doc.title}”这摊活在 Claude Code 里到底干什么。你可以把它理解成 ${doc.section} 这块地上的一个专门工具。`,
				'原文如果有点拗口，这里就把它拆成“什么时候用、怎么开始、哪里最容易出错”三件事来讲。',
				'如果你只记一条，就记住：目标要讲清，步骤要一小步一小步验，关键命令和配置名不要乱改。'
			]
		},
		{
			title: '上手时重点盯住什么',
			paragraphs: [
				'第一，先分清这一页是在讲安装配置、扩展能力，还是接到别的工具里。分不清，就容易东一榔头西一棒子。',
				'第二，重要命令、配置名和代码片段必须保留原样。人话解释可以通俗，真正复制运行的东西不能瞎翻。',
				'第三，做完一步就验一步。像修水管，拧完一个接口先通水试试，别等全装完才发现前面就漏了。'
			],
			steps
		}
	];
}

const customContent: Record<string, DocContent> = {
	overview: {
		sourceLabel: 'Overview',
		sections: [
			{
				title: '简要总结',
				paragraphs: [
					'Claude Code 不是只会聊天的机器人，它更像能下地干活的电子帮工。',
					'它能进项目里看代码、改文件、跑命令、验结果，而且终端、编辑器、网页这些地方都能接着用。'
				]
			},
			{
				title: '农民伯伯版解释',
				paragraphs: [
					'你可以把 Claude Code 当成一个识字快、腿脚也快的帮工。你交代“去看看这屋哪漏雨”，它真会去翻梁、看瓦、找裂缝，不是只站在旁边空出主意。',
					'更关键的是，它改完还能自己试。比如修了代码，会顺手跑构建、跑测试、看报错，像师傅补完水管自己先开阀门试一遍。',
					'所以这一页最想告诉你的就一句话：别把它当问答机，要把它当能看现场、能动手、能验活的帮手。'
				]
			},
			{
				title: '第一次认识它时要记住的三件事',
				paragraphs: [
					'第一，它擅长在真实项目里干活，不只是答题。',
					'第二，你越把目标、范围、限制讲清楚，它越不容易干偏。',
					'第三，同一个帮手能在很多入口继续干，不是换到网页或 VS Code 就换了个人。'
				]
			}
		],
		illustration: {
			title: '一眼看懂它怎么干活',
			lines: ['你开口派活', '   |', '   v', '[Claude Code]', '/   |   \\', '看代码 改文件 跑命令', '   |', '   v', '把结果回给你'],
			caption: '你负责把活说明白，它负责看现场、动手修、再回来汇报。'
		}
	},
	quickstart: {
		sourceLabel: 'Quickstart',
		sections: [
			{
				title: '简要总结',
				paragraphs: [
					'这一页就是带你把 Claude Code 领进门，从安装、登录到交第一件活。',
					'重点不是把所有概念一口气背熟，而是尽快在自己项目里跑通第一次完整操作。'
				]
			},
			{
				title: '农民伯伯版解释',
				paragraphs: [
					'像新买一台农机，你别先研究发动机原理，先学会怎么打火、怎么挂挡、怎么下地试一小垄。',
					'Quickstart 也是这个思路：装好工具，进到项目目录，让它先认门，再给一个不大的活，看它会不会按规矩干。',
					'只要第一次跑通了，后面修 bug、补测试、整理文档，都是同一路数往上加。'
				]
			},
			{
				title: '关键步骤和原样要保留的命令',
				paragraphs: [
					'下面这些命令和提问句，都是能直接拿来试的。说法我们讲人话，但关键命令不要乱改。',
					'如果你是第一次用，最稳的路就是先安装，再 \`cd\` 进项目，再敲 \`claude\`，然后先问项目结构。'
				],
				steps: commandPresets.quickstart
			}
		],
		illustration: {
			title: '上手路线图',
			lines: ['装工具 -> 登录 -> 进项目', '        |', '        v', '先问路 -> 交小活 -> 看结果', '        |', '        v', '再让它修真问题'],
			caption: '别一上来就扔大工程，先让它认门、认地、认工具。'
		}
	}
};

export function getDocContent(doc: DocItem & { slug: string }): DocContent {
	return (
		customContent[doc.slug] ?? {
			sourceLabel: doc.title,
			sections: getDefaultSections(doc),
			illustration: {
				title: '一眼看懂这一页',
				lines: [doc.title, '   |', '   v', doc.summary, '   |', '   v', '照着步骤去做'],
				caption: '这页的作用，就是把一个原本偏专业的话题，拆成能直接照着走的明白话。'
			}
		}
	);
}
