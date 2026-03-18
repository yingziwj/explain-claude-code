import fs from 'node:fs/promises';
import path from 'node:path';

const sourceFile = path.resolve('src/data/generated/source-docs.json');
const outputFile = path.resolve('src/data/generated/generated-doc-content.json');

function normalizeText(value) {
	return String(value ?? '')
		.replace(/[\u200B-\u200D\uFEFF]/g, '')
		.replace(/\s+/g, ' ')
		.replace(/`/g, '')
		.trim();
}

function isUsefulSentence(text) {
	if (!text) return false;
	if (text.length < 18) return false;
	if (/^(copy|edit|run|open|click|learn more)/i.test(text)) return false;
	return true;
}

function pickParagraphs(page, count) {
	return (page.paragraphs ?? []).map(normalizeText).filter(isUsefulSentence).slice(0, count);
}

function pickHeadings(page, count) {
	return (page.headings ?? []).map(normalizeText).filter(Boolean).slice(0, count);
}

function pickToc(page, count) {
	return (page.toc ?? []).map(normalizeText).filter(Boolean).slice(0, count);
}

function pickCodeBlocks(page, count) {
	const blocks = (page.codeBlocks ?? [])
		.map((block) => String(block).trim())
		.filter((block) => block && block.length <= 600)
		.filter((block, index, all) => all.findIndex((candidate) => candidate === block) === index);

	if (blocks.length <= count) return blocks;

	const picks = [];
	for (let i = 0; i < count; i += 1) {
		const ratio = count === 1 ? 0 : i / (count - 1);
		const index = Math.round(ratio * (blocks.length - 1));
		picks.push(blocks[index]);
	}

	return picks.filter((block, index, all) => all.findIndex((candidate) => candidate === block) === index);
}

function inferStepKind(code) {
	const text = String(code ?? '').trim();
	if (!text) return 'code';
	if (/[├└│]/.test(text)) return 'structure';
	if (/^\s*[{[]/.test(text) || /^---\n/.test(text) || /"name"\s*:|"env"\s*:|\.json|settings\.json|plugin\.json|SKILL\.md/i.test(text)) return 'config';
	if (
		text.split('\n').length === 1 &&
		!/[[\]{}();=]/.test(text) &&
		!/^(Model:|Tools:|Purpose:|Team config:|Task list:)/i.test(text) &&
		/^[A-Z][A-Za-z0-9,'". -]{4,120}$/.test(text)
	) {
		return 'prompt';
	}
	if (/^[\w./~-]+\s+.*$/m.test(text) && /(?:claude|curl|npm|npx|mkdir|cp|mv|rm|brew|winget|apk|irm|bash|cmd)\b/m.test(text)) return 'command';
	if (/^(\/|> )/m.test(text) || /how does this code work\?/i.test(text) || /\?\s*$/.test(text)) return 'prompt';
	return 'code';
}

function kindLabel(kind) {
	switch (kind) {
		case 'command':
			return '命令';
		case 'config':
			return '配置';
		case 'prompt':
			return '提问示例';
		case 'structure':
			return '目录结构';
		default:
			return '代码片段';
	}
}

function kindAction(kind) {
	switch (kind) {
		case 'command':
			return '这一步是让你在终端里敲命令';
		case 'config':
			return '这一步是让你改配置或新建配置文件';
		case 'prompt':
			return '这一步是你直接跟 Claude 说的话';
		case 'structure':
			return '这一步是让你看目录和文件该怎么摆';
		default:
			return '这一步是原页里的关键代码或示例';
	}
}

function buildStepBody({ kind, pageTitle, sectionTitle }) {
	const sectionLabel = sectionTitle || '这一段';
	const sectionHeading = sectionLabel.toLowerCase();

	switch (kind) {
		case 'prompt':
			if (/shut down teammates/.test(sectionHeading)) {
				return '这里不是敲命令，而是把下面这句话交给带队的那个 Claude，让它把那位队友稳稳当当地收下来。';
			}
			if (/clean up the team/.test(sectionHeading)) {
				return '等队友都停稳了，再把下面这句话交给带队的那个 Claude，让它把整支队伍的摊子收干净。';
			}
			if (/wait for teammates to finish/.test(sectionHeading)) {
				return '这句话是拿来踩刹车的，提醒带队的那个先别急着往前冲，等队友把手头活交回来再说。';
			}
			return `这里不用敲命令，直接把下面这句话发给 Claude 就行，让它按“${sectionLabel}”这一段的意思去办。`;
		case 'command':
			return '说到这一步就别只停在理解上了。下面这条命令照着敲，跑完再回头看结果是不是对上这一节要的东西。';
		case 'config':
			return `这一段要真正落到配置里。下面这块照着填，关键字和字段名别随手改。`;
		case 'structure':
			return '这一段主要是认目录和文件摆放位置。先把地方放对，后面才不容易串。';
		default:
			return `下面这块是“${sectionLabel}”里最要紧的原始片段。先看懂它在这一段里是干什么的，再决定要不要照着搬。`;
	}
}

function chooseVariant(key, variants) {
	const source = String(key || '');
	const hash = Array.from(source).reduce((sum, char) => sum + char.charCodeAt(0), 0);
	return variants[hash % variants.length];
}

function pickSectionSteps(page, count) {
	const steps = [];

	for (const block of page.sectionBlocks ?? []) {
		if (!block || !block.title || !Array.isArray(block.codeBlocks) || !block.codeBlocks.length) continue;

		const title = normalizeText(block.title);
		const codes = block.codeBlocks
			.map((code) => String(code).trim())
			.filter(Boolean)
			.slice(0, title.includes('Quickstart') || title.includes('Install') || title.includes('Create') ? 6 : 3);

		codes.forEach((code, index) => {
			const kind = inferStepKind(code);
			steps.push({
				title: codes.length > 1 ? `原页关键片段：${title} ${index + 1}` : `原页关键片段：${title}`,
				body: buildStepBody({ kind, pageTitle: page.title, sectionTitle: title }),
				code,
				kind
			});
		});

		if (steps.length >= count) break;
	}

	return steps.slice(0, count);
}

function pickSectionCodeBlocks(block, count) {
	return (block.codeBlocks ?? [])
		.map((code) => String(code).trim())
		.filter(Boolean)
		.filter((code) => {
			const kind = inferStepKind(code);
			if (kind === 'code') {
				return /[\n{}[\]();=#/\\]|^\s*#!/.test(code) || /`/.test(code);
			}
			return true;
		})
		.filter((code, index, all) => all.findIndex((candidate) => candidate === code) === index)
		.slice(0, count);
}

function summarizeSectionHints(block, pageTitle = '') {
	const title = normalizeText(block.title);
	const heading = title.toLowerCase();
	const hints = (block.paragraphs ?? [])
		.map(normalizeText)
		.filter(Boolean)
		.filter((text) => text !== title)
		.slice(0, 10);
	const joined = hints.join(' ').toLowerCase();
	const paragraphs = [];
	const firstHint = hints[0] ?? '';

	function pushHintDrivenFallback() {
		if (/^use (.+) to (.+)/i.test(firstHint)) {
			const [, subject, action] = firstHint.match(/^use (.+) to (.+)/i) ?? [];
			paragraphs.push(`这一段是在说怎么用 ${subject} 去做 ${action}。看这种内容，光知道名字没用，还是得落到手上。`);
			return;
		}
		if (/^create (.+)/i.test(firstHint)) {
			const [, subject] = firstHint.match(/^create (.+)/i) ?? [];
			paragraphs.push(`这一段是在教你把 ${subject} 真正建出来。文件放哪儿、字段怎么写、建完怎么验，都得跟着看。`);
			return;
		}
		if (/^install (.+)/i.test(firstHint)) {
			const [, subject] = firstHint.match(/^install (.+)/i) ?? [];
			paragraphs.push(`这一段就是安装 ${subject}。这种地方最怕跳步骤，最好老老实实按顺序来。`);
			return;
		}
		if (/^configure (.+)|^set up (.+)/i.test(firstHint)) {
			const match = firstHint.match(/^configure (.+)|^set up (.+)/i);
			const subject = match?.[1] || match?.[2] || title;
			paragraphs.push(`这一段是在把 ${subject} 配起来、配稳当。你主要盯住在哪儿改、怎么写、改完怎么看它真生效。`);
			return;
		}
		if (/^run (.+)/i.test(firstHint)) {
			const [, subject] = firstHint.match(/^run (.+)/i) ?? [];
			paragraphs.push(`这一段是在把 ${subject} 真跑起来。别只看命令长什么样，还得看跑完该出现什么。`);
			return;
		}
		if (/^view (.+)|^see (.+)/i.test(firstHint)) {
			const match = firstHint.match(/^view (.+)|^see (.+)/i);
			const subject = match?.[1] || match?.[2] || title;
			paragraphs.push(`这一段是在说怎么看 ${subject}。将来真出问题时，你就知道该去哪儿翻、翻到什么算正常。`);
			return;
		}
		if (/^choose (.+)/i.test(firstHint)) {
			const [, subject] = firstHint.match(/^choose (.+)/i) ?? [];
			paragraphs.push(`这一段是在帮你从几个选项里挑 ${subject}。重点不只是知道有哪些，更是看代价和场景。`);
			return;
		}
		if (/^when /i.test(firstHint) || /^if /i.test(firstHint)) {
			paragraphs.push('这一段更像在讲判断条件，什么时候该上，什么时候先别急。把触发条件看清，比背标题更重要。');
			return;
		}
		if (/^the |^this /i.test(firstHint)) {
			paragraphs.push(`这一段不是单纯报个标题名，而是在交代“${title}”到底管哪一摊、会影响到哪一摊。`);
			return;
		}

		paragraphs.push(
			chooseVariant(title, [
				`这一块主要是在讲“${title}”到了手上该怎么使，哪里最容易踩坑。`,
				`说白了，这里不是让你背“${title}”这个名词，而是讲它真干活时怎么用。`,
				`读到这里，就把“${title}”当成一件要上手的活看：先搞清怎么用，再留心别踩坑。`,
				`这一段主要是在掰开讲“${title}”怎么落地，不是挂个标题给你看看就完。`
			])
		);
	}

	if (/built-in subagents/.test(heading)) {
		return [
			'这一节先把系统自带的子代理认清楚：它们各自擅长什么活、会继承什么权限、什么时候会被 Claude 自动叫出来。',
			'看这段时别只盯名字，重点是分清哪类代理偏查资料、哪类能动手改、哪类只适合在计划阶段帮你摸底。'
		];
	}
	if (/quickstart/.test(heading) && /subagent/.test(heading)) {
		return [
			'这一节是手把手做第一个子代理，核心不是炫配置，而是先把入口、存放位置、权限和模型这几步走通。',
			'最稳的顺序就是先进 `/agents`，先做一个最简单、边界很清楚的子代理，跑通以后再往里加复杂能力。'
		];
	}
	if (/use the \/agents command/.test(heading)) {
		return [
			'这一节讲 `/agents` 这个总入口。以后你想看现有代理、建新代理、改权限、删旧代理，基本都从这里进。',
			'如果不是为了批量自动化，优先用这个交互入口，比你自己手搓文件稳得多。'
		];
	}
	if (/choose the subagent scope/.test(heading)) {
		return [
			'这一节讲子代理到底放哪儿。项目级放仓库里，适合团队共用；个人级放 `~/.claude/agents/`，适合你自己到处带着走。',
			'如果只是临时试一下，也可以用 `--agents` 这种会话级方式；但临时的东西不会长期留着，别把正式规则全压在这上面。'
		];
	}
	if (/write subagent files/.test(heading)) {
		return [
			'这一节讲子代理文件怎么写，重点是 frontmatter 放什么、正文提示词怎么写、改完以后怎么让 Claude 重新认到它。',
			'别把子代理文件写成散文，名字、描述、工具、模型和正文职责要分得清清楚楚。'
		];
	}
	if (/choose a model/.test(heading)) {
		return [
			'这一节讲子代理用什么模型。说白了，就是这类活到底该让快一点的工种来，还是让更能深想的工种来。',
			'如果这类子代理主要是查资料、扫目录、跑轻活，通常不用一上来就上最重的模型。'
		];
	}
	if (/control subagent capabilities/.test(heading)) {
		return [
			'这一节讲怎么收放子代理的手脚，比如它能用哪些工具、能不能再叫别的代理、能不能挂 MCP、skills、memory 这些外接能力。',
			'这里的核心原则就是只给它完成这类活必须的能力，不要为了省事一口气全放开。'
		];
	}
	if (/define hooks for subagents/.test(heading)) {
		return [
			'这一节讲怎么给子代理挂 hooks，也就是让它在某些动作前后自动做检查、校验或收尾。',
			'如果你想让子代理改文件后自动跑检查，或者在执行危险命令前先过一遍门禁，这一节就是干这个的。'
		];
	}
	if (/configure subagents/.test(heading)) {
		return [
			'这里讲的是子代理那些开关该怎么拧。你主要看它放哪儿、认不认得出来、权限有没有给对。',
			'别一下子把所有花样都加上，先让最小那版跑通。'
		];
	}
	if (/work with subagents/.test(heading)) {
		return [
			'这里是在讲平时怎么把子代理真正用起来，不是光把文件写完就算。',
			'要点就两件事：什么时候该叫它上，叫上来以后它负责哪一块。'
		];
	}
	if (/understand automatic delegation/.test(heading)) {
		return [
			'这一节讲 Claude 什么时候会主动把活派给某个子代理。关键不只在你的提问，还在子代理描述写得够不够清楚。',
			'如果你希望某类子代理“该出手时就出手”，描述里就得把触发场景写明白，别只写一串空话。'
		];
	}
	if (/invoke subagents explicitly/.test(heading)) {
		return [
			'这里讲的是你手动点名叫某个子代理干活。这样做最适合你心里已经清楚“这活就该它来”。',
			'手动点名的好处是稳，不会让 Claude 自己猜错工种。'
		];
	}
	if (/run subagents in foreground or background/.test(heading)) {
		return [
			'这一节讲子代理是在前台拦着你干，还是放到后台并行跑。前台适合需要你随时确认的活，后台适合你想边等边做别的。',
			'后台模式要特别注意提前把权限准备好，不然它中途卡住了，你还得回来补票。'
		];
	}
	if (/common patterns/.test(heading)) {
		return [
			'这一节给的是日常最值钱的套路，不是新概念。像把大输出隔离出去、并行调研、串起来分步干，都是子代理最常见的用法。',
			'你看这段时，重点不是全背，而是挑一个最像你当前活路的套路先照着学。'
		];
	}
	if (/manage subagent context/.test(heading)) {
		return [
			'这里讲的是上次干到一半的子代理，要不要接着用。要是它已经把情况摸熟了，继续用通常更省事。',
			'别刚把现场讲明白，就又换一个新子代理从头听一遍。'
		];
	}
	if (/choose between subagents and main conversation/.test(heading)) {
		return [
			'这里是在说，这件事到底该交给专门小帮工，还是就留在当前对话里慢慢做。',
			'如果这活老是重复、边界又很清楚，就更适合单独拎个子代理。'
		];
	}
	if (/example subagents/.test(heading)) {
		return [
			'这一节开始给你看现成样板，不是让你照抄所有细节，而是让你学会怎样把“职责、工具、提示词”三件事写得清楚。',
			'后面每个示例都可以当模板，但真正落你自己项目时，还是要按你们的活路改。'
		];
	}
	if (/code reviewer/.test(heading)) {
		return [
			'这一节是代码审查型子代理的样板。重点在于只给它看和查的能力，不让它顺手就改，先把“找问题”这件事做好。',
			'如果你想让审查更稳定，就把输出格式、重点风险和禁止事项写进提示词里。'
		];
	}
	if (/debugger/.test(heading)) {
		return [
			'这一节是排错型子代理的样板，适合专门盯报错、失败测试和根因定位这类活。',
			'排错代理最怕信息不全，所以描述里最好写明它该先看什么、怎么判断根因、最后要回给你什么。'
		];
	}
	if (/data scientist/.test(heading)) {
		return [
			'这一节是数据分析类子代理的样板，适合把查数、做图、解释结果这种活拆给专门角色。',
			'这类代理通常要更强调数据来源、分析边界和输出格式，不然很容易只给你一堆空结论。'
		];
	}
	if (/database query validator/.test(heading)) {
		return [
			'这一节讲一个很实用的样板：数据库查询代理可以放开 Bash，但要先挂校验，只允许读，不允许改。',
			'重点不是“会查库”本身，而是先把危险动作挡在门外，确保它问库时只读不写。'
		];
	}
	if (/next steps/.test(heading) && /subagent/.test(pageTitle.toLowerCase())) {
		return [
			'看到这里，别急着再学新花样，先做一个最简单的子代理把路走通。',
			'能叫得出来、能按边界干活，再慢慢往里加本事。'
		];
	}
	if (/when to use plugins vs standalone configuration/.test(heading)) {
		return [
			'这里是在帮你判断，到底该做成插件，还是在当前项目里单独配一下就够。',
			'要是这套东西很多项目都要反复用，才更像插件；只是一时一地要用，就别急着打包。'
		];
	}
	if (/quickstart/.test(heading) && /plugin/.test(pageTitle.toLowerCase())) {
		return [
			'这里就是插件起步那几步，先把壳子搭起来，再让它能被 Claude 看见。',
			'第一次别贪大，先做一个最小插件，能装上、能叫出来就算赢。'
		];
	}
	if (/prerequisites/.test(heading) && /plugin/.test(pageTitle.toLowerCase())) {
		return [
			'这里是在说开工前你得先备好什么，不然做到一半容易卡壳。',
			'先把目录、工具和最基本的文件准备好，后面会顺很多。'
		];
	}
	if (/create your first plugin/.test(heading)) {
		return [
			'这里是手把手做第一个插件。先建目录，再写最小那几个文件，让它先活过来。',
			'别想着第一回就做成大工具箱，能跑起来最重要。'
		];
	}
	if (/plugin structure overview/.test(heading)) {
		return [
			'这里是在认插件的骨架，哪个文件像门牌，哪个文件装规矩，哪个目录放附加能力。',
			'先把地方认清，后面才不会把东西塞错位置。'
		];
	}
	if (/develop more complex plugins/.test(heading)) {
		return [
			'这里开始讲插件做大以后怎么收拾，不然越塞越乱。',
			'思路很简单：先分层，再分目录，别把所有能力糊成一坨。'
		];
	}
	if (/add skills to your plugin/.test(heading)) {
		return [
			'这里讲怎么把 skill 装进插件里。说白了，就是把一套固定说法、固定做法打包进去。',
			'适合那种反复要用、而且每次都想按同一路子干的活。'
		];
	}
	if (/add lsp servers to your plugin/.test(heading)) {
		return [
			'这里讲怎么把语言服务也塞进插件。这样 Claude 看某种语言的代码时，会更懂门道。',
			'你只要记住一件事：先配好服务怎么启动，再让文件后缀对上它。'
		];
	}
	if (/ship default settings with your plugin/.test(heading)) {
		return [
			'这里讲怎么把默认设置一块打包带走。这样别人装上插件后，不用再手搓同一套设置。',
			'默认值要给得稳，不要一上来就给太猛的权限。'
		];
	}
	if (/organize complex plugins/.test(heading)) {
		return [
			'插件一大，就得开始收拾屋子。谁放哪儿、谁管哪摊，要提前分清。',
			'不然后面加一个能力，就像往杂物堆里再扔一把铁锹。'
		];
	}
	if (/test your plugins locally/.test(heading)) {
		return [
			'这里讲怎么先在自己机器上试插件。先本地跑通，再给别人用，最稳。',
			'这一步就是先在自家院里试水，别一上来就往正式环境扔。'
		];
	}
	if (/share your plugins/.test(heading)) {
		return [
			'这里讲的是插件做好以后怎么给别人用。',
			'先想清楚你是给自己团队发，还是打算公开给更多人装，这两种路子不一样。'
		];
	}
	if (/submit your plugin to the official marketplace/.test(heading)) {
		return [
			'这里讲怎么把插件送去官方市场。说白了，就是让别人以后能像逛摊子一样找到它。',
			'这一步通常要把说明写清、结构收好，别把半成品端上去。'
		];
	}
	if (/convert existing configurations to plugins/.test(heading)) {
		return [
			'这里讲怎么把你手头零散的配置，收拢成一个正式插件。',
			'先别急着全搬，先看哪些东西真值得打包进去。'
		];
	}
	if (/migration steps/.test(heading) && /plugin/.test(pageTitle.toLowerCase())) {
		return [
			'这里就是迁过去的顺序。照着一小步一小步搬，最不容易漏。',
			'先搭骨架，再往里塞原来的东西，别一下全倒进去。'
		];
	}
	if (/what changes when migrating/.test(heading)) {
		return [
			'这里讲迁过去以后到底变了什么。你最该看的是：以后东西放哪儿、谁来读、谁来管。',
			'这些边界弄清了，迁过去才不会手忙脚乱。'
		];
	}
	if (/for plugin users/.test(heading)) {
		return [
			'这一段是写给装插件的人看的，重点是怎么装、怎么用、怎么确认真生效。',
			'如果你不是开发插件的人，就主要看这段。'
		];
	}
	if (/for plugin developers/.test(heading)) {
		return [
			'这一段是写给做插件的人看的，重点是怎么打包、怎么发、怎么让别人装得顺。',
			'如果你准备长期维护插件，这段要多看两遍。'
		];
	}
	if (/what you can do with mcp/.test(heading)) {
		return [
			'这里先讲 MCP 能帮你碰到什么外面的东西。接上以后，Claude 不只会看本地文件，还能去看外面的账本和工具。',
			'你可以把它当成给帮工开了院门，让它能去外面拿材料。'
		];
	}
	if (/popular mcp servers/.test(heading)) {
		return [
			'这里是在给你看常见现成货，别人已经接好的那些 MCP 服务都有哪些。',
			'第一次上手，优先挑现成成熟的，不要一上来就自己造。'
		];
	}
	if (/installing mcp servers/.test(heading)) {
		return [
			'这里讲怎么把 MCP 服务接进来。先连上，再看得到，再试着用，顺序别乱。',
			'第一次别贪多，接一个最刚需的就够。'
		];
	}
	if (/option 1: add a remote http server/.test(heading)) {
		return [
			'这一种是走普通网页那条路，适合对方本来就给了一个远程地址。',
			'你把地址填对，认证做好，基本就能连。'
		];
	}
	if (/option 2: add a remote sse server/.test(heading)) {
		return [
			'这一种也是远程接法，只是对方用的是 SSE 这种推送路子。',
			'如果服务端写明让你用 SSE，就别拿 HTTP 那套硬套。'
		];
	}
	if (/option 3: add a local stdio server/.test(heading)) {
		return [
			'这一种是把服务直接放在你自己机器上跑，再从本地接过去。',
			'适合那些本来就得靠本机命令启动的工具。'
		];
	}
	if (/managing your servers/.test(heading)) {
		return [
			'这里讲已经接上的那些服务平时怎么管。能列出来、能改、能删，才算真接稳。',
			'别连上一次就不管了，后面出问题还得回来这里查。'
		];
	}
	if (/dynamic tool updates/.test(heading)) {
		return [
			'这里讲的是外面那套工具变了以后，Claude 这边怎么跟着知道。',
			'说白了，就是别让它一直拿旧工具说明干活。'
		];
	}
	if (/plugin-provided mcp servers/.test(heading)) {
		return [
			'这里讲插件也能顺手带一个 MCP 服务进来，不用你每次再单独接一遍。',
			'适合把一整套能力打成包一起发。'
		];
	}
	if (/mcp installation scopes/.test(heading)) {
		return [
			'这里讲 MCP 装在哪一层。是只给当前项目用，还是你所有项目都能用，要先分清。',
			'这一步分清了，后面就不容易出现“怎么这边改了那边也跟着变”。'
		];
	}
	if (/local scope/.test(heading) && /mcp/.test(pageTitle.toLowerCase())) {
		return [
			'本地这一层的意思是：只管眼前这个地方，不往外带。',
			'适合临时试验，试完不满意也好收。'
		];
	}
	if (/project scope/.test(heading)) {
		return [
			'项目这一层的意思是：这个仓库里的人都按同一套来。',
			'适合团队共用的连接方式。'
		];
	}
	if (/user scope/.test(heading)) {
		return [
			'用户这一层的意思是：你这个人以后到别的项目也能接着用。',
			'适合你自己常用、但不一定要全团队共享的东西。'
		];
	}
	if (/choosing the right scope/.test(heading)) {
		return [
			'这里就是帮你选装在哪一层最合适。先想清楚“只这次用”还是“以后都要用”，答案就出来了。',
			'别图省事全装到最大那层，后面不好收。'
		];
	}
	if (/scope hierarchy and precedence/.test(heading)) {
		return [
			'这里讲的是几层规则撞到一起时，最后到底听谁的。',
			'你可以把它理解成：村规、队规、今天临时交代，谁更大，谁压谁。'
		];
	}
	if (/environment variable expansion in \.mcp\.json/.test(heading)) {
		return [
			'这里讲怎么在 `.mcp.json` 里借用环境变量，不把敏感东西硬写死在文件里。',
			'像密钥、地址这类经常变的东西，这样放更稳。'
		];
	}
	if (/practical examples/.test(heading) && /mcp/.test(pageTitle.toLowerCase())) {
		return [
			'这里开始上真例子了，就是拿几种常见活路告诉你，MCP 真接上以后能怎么用。',
			'先挑一个和你手头最像的例子去照。'
		];
	}
	if (/example: monitor errors with sentry/.test(heading)) {
		return [
			'这个例子是在说怎么把报错系统接进来，让 Claude 直接看线上出什么事。',
			'适合那种你老要来回翻报错平台的场景。'
		];
	}
	if (/example: connect to github for code reviews/.test(heading)) {
		return [
			'这个例子是在说把 GitHub 接进来，让 Claude 直接看代码审查那一摊。',
			'这样它看变更、看评论、看 PR 会顺手很多。'
		];
	}
	if (/example: query your postgresql database/.test(heading)) {
		return [
			'这个例子是在说怎么让 Claude 去问数据库，但前提还是先把读和写分清。',
			'第一次最好先只读，别急着让它改库。'
		];
	}
	if (/authenticate with remote mcp servers/.test(heading)) {
		return [
			'这里讲远程服务怎么认主。没认上，再多命令也白搭。',
			'先把登录和授权走通，后面再谈干活。'
		];
	}
	if (/use a fixed oauth callback port/.test(heading)) {
		return [
			'这里讲回调端口固定下来这件事。这样网络和系统规则更容易放行，不容易每次变来变去。',
			'适合对网络规矩比较严的环境。'
		];
	}
	if (/use pre-configured oauth credentials/.test(heading)) {
		return [
			'这里讲提前把 OAuth 那套证件准备好，不用临时一边接一边找。',
			'提前备好，接起来会顺很多。'
		];
	}
	if (/override oauth metadata discovery/.test(heading)) {
		return [
			'这里讲的是默认那套自动认路不灵时，你要手工告诉它该往哪儿认。',
			'通常是环境比较特殊时才会用到。'
		];
	}
	if (/add mcp servers from json configuration/.test(heading)) {
		return [
			'这里讲怎么直接从 JSON 配置里把一组 MCP 服务一起加进去。',
			'适合团队想统一发一套现成配置，不想每个人手敲一遍。'
		];
	}
	if (/when to use agent teams/.test(heading)) {
		return [
			'只有一摊活能拆成几路同时干时，才值得把队伍拉起来。要是本来就得一步接一步做，一个 Claude 慢慢做反而更省事。',
			'队伍的好处是几路人一起查、一起试；坏处也很实在，就是人一多就更费钱，也更费嘴。'
		];
	}
	if (/compare with subagents/.test(heading)) {
		return [
			'子代理更像你临时叫来几个帮手，各人干完就回来报一声；团队更像几个人一起干同一摊活，干着干着还要彼此通气。',
			'如果几个人之间需要互相商量、互相挑错，最后再凑出一个结论，那就更像团队。'
		];
	}
	if (/enable agent teams/.test(heading)) {
		return [
			'这一节讲团队模式默认是关着的，要先把实验开关打开，Claude 才能真的拉起一个队伍来干活。',
			'最常见的做法就是在环境变量或 `settings.json` 里把对应开关设成 `1`，先开起来再试。'
		];
	}
	if (/start your first agent team/.test(heading)) {
		return [
			'第一次拉团队开工，不用先记一堆按钮。你就像给包工头派活一样，直接说这件事要分几路、每一路干什么。',
			'关键不是话术花不花，而是这几路活别互相绊脚，最好能各干各的。'
		];
	}
	if (/control your agent team/.test(heading)) {
		return [
			'队伍拉起来以后，你平时主要还是跟带队的那个说话。它再往下拆活、派活、收活。',
			'别一着急就自己去指挥每个队友，不然全队消息会很乱。先让带队的那个当总管，队伍才稳。'
		];
	}
	if (/choose a display mode/.test(heading)) {
		return [
			'这里讲的是你怎么看这支队伍干活。一个办法是轮流切着看，另一个办法是分成几格同时看。',
			'如果你想一眼盯住好几个人，就用分屏；如果你只求先跑起来，那就先用简单那种。'
		];
	}
	if (/specify teammates and models/.test(heading)) {
		return [
			'这里是在说，你最好提前把人数和分工讲明白：要几个人，谁查，谁改，谁验。',
			'要是这活比较重，你连“用哪种脑子干”都先说清，通常会更稳。'
		];
	}
	if (/require plan approval for teammates/.test(heading)) {
		return [
			'这里讲的是先别急着让队友开工，先叫他们把打算怎么做交上来。',
			'你或带队的那个先看计划，觉得靠谱再放行；不靠谱就让它回去重想。'
		];
	}
	if (/assign and claim tasks/.test(heading)) {
		return [
			'这里讲任务单怎么分。可以由带队的那个直接点名，也可以让队友干完手头活后自己去认下一个。',
			'你最要防的是撞车，别让两个人同时扑向同一块地方。'
		];
	}
	if (/shut down teammates/.test(heading)) {
		return [
			'这一节讲怎么优雅地让某个队友收工。别直接粗暴掐掉，最好通过 lead 发关机请求，让对方把正在做的活收好。',
			'这样收尾更干净，也不容易把共享任务单和上下文搞坏。'
		];
	}
	if (/clean up the team/.test(heading)) {
		return [
			'这一节讲团队收尾，不是随便喊一句完事，而是要让 lead 负责做 cleanup，把共享资源收干净。',
			'最关键的规矩是：先把还在跑的队友停掉，再让 lead 做 cleanup；不要让普通 teammate 自己去收尾。'
		];
	}
	if (/enforce quality gates with hooks/.test(heading)) {
		return [
			'这一节讲怎么在团队流程里加质检门。队友快空闲时、任务准备标完成时，都可以用 hooks 再拦一道。',
			'如果检查没过，可以用退出码把任务打回去，让队友继续干，而不是稀里糊涂就算完成。'
		];
	}
	if (/how agent teams work/.test(heading)) {
		return [
			'这一节先把队伍怎么转起来讲明白。Claude 会先安排一个带队的，再由它去找下面几个干活的，把结果一份份收回来。',
			'你平时不用追着每个队友跑，先盯住带队的那个怎么派活、怎么收尾就够了。'
		];
	}
	if (/how claude starts agent teams/.test(heading)) {
		return [
			'这里讲的是 Claude 真要拉起一支队伍时，前后顺序怎么走。先定一个带队的，再往下派人，再把结果一份份收回来。',
			'这段看懂以后，你就知道它为什么有时跑得快，有时又会卡在前面的安排上。'
		];
	}
	if (/talk to teammates directly/.test(heading)) {
		return [
			'这里是在讲，你能不能跳过带队的那个，直接去跟某个队友说话。一般能，但别乱来，不然全队容易听岔。',
			'普通派活还是先走带队的那个更稳；真要直接插一句，也要把前因后果说清。'
		];
	}
	if (/architecture/.test(heading)) {
		return [
			'这里讲的是这支队伍的架子怎么搭。通常是你跟带队的那个说，带队的再去找下面的人干活。',
			'把这个顺序看明白，后面看到谁给谁回话、谁来收尾，就不容易绕晕。'
		];
	}
	if (/permissions/.test(heading) && /agent team/.test(pageTitle.toLowerCase())) {
		return [
			'这里讲的是每个队友手里能拿多大的权。谁只能看，谁能改，谁能用工具，都别图省事一把全开。',
			'人一多，最怕有人手太大乱碰东西，所以这段一定要看细。'
		];
	}
	if (/context and communication/.test(heading)) {
		return [
			'这里讲的是队友之间怎么传话、怎么交结果。人一多，最怕的不是没人干，而是话没说清、东西没接住。',
			'这时候就更需要带队的那个把前面发生了什么记牢，别让每个人各说各的。'
		];
	}
	if (/token usage/.test(heading)) {
		return [
			'这里是在算账。队友一多，花费就会一起往上走，不会像一个人干活那样省。',
			'意思不是不让你用团队，而是小活别摆大阵仗。'
		];
	}
	if (/use case examples/.test(heading)) {
		return [
			'这里开始举例子了，就是拿几种常见活路告诉你，什么事值得拉一支队伍来干。',
			'不用全背，挑一个跟你手头最像的去套就行。'
		];
	}
	if (/run a parallel code review/.test(heading)) {
		return [
			'这一段是在说，代码审查怎么分给几个人一起看。这样是快，但谁看哪块得先分清，不然有人重复看，有人没人看。',
			'最稳的做法就是先划地盘，再让带队的那个收总账。'
		];
	}
	if (/investigate with competing hypotheses/.test(heading)) {
		return [
			'这一段是在说，遇到难查的问题时，可以让几个人各自猜一种原因，再互相找对方的毛病。',
			'这样做的好处是，不容易一开始就认死一个答案。'
		];
	}
	if (/give teammates enough context/.test(heading)) {
		return [
			'派活前别只甩一句短话就让人去干。事情背景、范围、你最担心哪一点，最好先讲明白。',
			'不然队友跑半天带回来的，很可能根本不是你要的东西。'
		];
	}
	if (/choose an appropriate team size/.test(heading)) {
		return [
			'队伍不是越大越威风。人一多，商量、同步、花费都会一起往上走。',
			'能三五个人拆开的活，就别硬拉十来个；够用就行。'
		];
	}
	if (/size tasks appropriately/.test(heading)) {
		return [
			'活分出去也得分得像样。太碎了，沟通成本比干活还大；太大了，一个人抱着走太久，别人也接不上。',
			'最好切成能独立交付的小块，交回来时带队的那个一眼就能接住。'
		];
	}
	if (/wait for teammates to finish/.test(heading)) {
		return [
			'队友已经在跑的时候，带队的那个最好别半路突然改主意。先等结果回来，再看下一步怎么办。',
			'人家还没把活说完，你这边就急着改主意，最容易把队伍带乱。'
		];
	}
	if (/start with research and review/.test(heading)) {
		return [
			'这一段是在提醒你，别一上来就让大家闷头改。先让人去查、去看、去挑毛病，后面动手会稳很多。',
			'先把情况摸清，再下手，返工通常会少。'
		];
	}
	if (/avoid file conflicts/.test(heading)) {
		return [
			'这一段是在防大家改到一块去。两个人同时碰同一个文件，最容易互相顶掉。',
			'最稳的办法就是提前把地盘划开，谁改哪块先说清。'
		];
	}
	if (/monitor and steer/.test(heading)) {
		return [
			'队伍拉起来以后，不是就撒手不管了。你还得时不时看看谁跑偏了，谁卡住了。',
			'发现方向不对，早点拨一下，比最后全推倒重来强得多。'
		];
	}

	if (/^when to use /.test(heading)) {
		paragraphs.push(`这里是在回答一个很实际的问题：${title} 到底什么时候值得上。重点不是会不会开，而是值不值。`);
	} else if (/^compare /.test(heading)) {
		paragraphs.push(`这里是在帮你做对比。像 ${title} 这种标题，通常就是怕你把两个看着差不多的东西混着用。`);
	} else if (/^choose /.test(heading)) {
		paragraphs.push(`这里是在帮你做选择题，不是只告诉你“有这个选项”。先看取舍，再决定怎么选。`);
	} else if (/^size /.test(heading)) {
		paragraphs.push('这里讲的是“别切得太碎，也别一坨太大”。大小卡准了，分工和收尾才顺。');
	} else if (/^wait /.test(heading)) {
		paragraphs.push('这里是在提醒你先别急着往前冲。该等人的时候就等，别自己抢活。');
	} else if (/^set up |^setup /.test(heading)) {
		paragraphs.push('这里是上手准备活，通常会告诉你前提条件、落地点和最稳的起步顺序。');
	} else if (/^install |^update |^uninstall /.test(heading)) {
		paragraphs.push('这里属于实操步骤，重点是照着顺序做，不要自己脑补省略中间步骤。');
	} else if (/^verify |^authenticate /.test(heading)) {
		paragraphs.push('这里讲的是“别只装完就算了”，而是要确认它真能用、真认主、真跑通。');
	} else if (/^configure |^enable |^disable /.test(heading)) {
		paragraphs.push('这里讲怎么把某个开关拧对。重点不是概念，而是你该在哪儿改、改完怎么确认生效。');
	} else if (/^how .* works$|^how .* start/.test(heading)) {
		paragraphs.push('这里讲底层是怎么运转的。你把它看明白，后面遇到异常时就知道该往哪儿查。');
	} else if (/^manage |^control /.test(heading)) {
		paragraphs.push('这里讲的是收放和管理，不只是“能不能用”，而是“怎么管住、怎么不乱”。');
	} else if (/^example |^examples /.test(heading)) {
		paragraphs.push('这里是样板段。重点不是全文照抄，而是学它怎么把职责、步骤和边界写清楚。');
	} else if (/reference|schema|fields|actions|syntax/.test(heading)) {
		paragraphs.push('这里更像查表说明书，字段、格式和规则都要照准，不适合靠猜。');
	} else if (/troubleshoot|debug|issue/.test(heading)) {
		paragraphs.push('这里偏排错，最好按它给的顺序一项项排，不要一上来大拆大改。');
	} else if (/best practices|common patterns/.test(heading)) {
		paragraphs.push('这里给的是老手常用套路。不是硬规矩，但照着做通常会少走很多弯路。');
	} else {
		pushHintDrivenFallback();
	}

	if (/token costs scale linearly|coordination overhead increases|diminishing returns/.test(joined)) {
		paragraphs.push('这里明显在提醒你：人数不是越多越好。队友一多，花费、沟通和互相绊脚的成本会一起往上走。');
	}
	if (/3-5 teammates|5-6 tasks per teammate/.test(joined)) {
		paragraphs.push('原文这种数字建议要当成经验值来用。像 3 到 5 个队友、每人 5 到 6 个任务，意思就是先按这个舒服区间起步，不要一上来拉满。');
	}
	if (/too small|too large|self-contained units/.test(joined)) {
		paragraphs.push('它强调的是任务切块要刚刚好：太小了不值当分工，太大了又容易一个人闷头干太久，最后返工更重。');
	}
	if (/lead|teammate/.test(joined) && /wait|finish|complete/.test(joined)) {
		paragraphs.push('如果这里反复提 lead 和 teammate，通常是在提醒主代理别抢队友还没做完的活，先等人把结果交回来再继续统筹。');
	}
	if (/project|user|scope|session/i.test(joined)) {
		paragraphs.push('这里还牵扯作用域，意思就是这条规则到底管当前项目、你个人，还是只管这一趟会话。');
	}
	if (/tool|permission|allow|deny|read|write|edit/i.test(joined)) {
		paragraphs.push('看这段时要特别盯工具和权限边界，别为了省事一把全开。');
	}
	if (/hook|mcp|skill|memory/i.test(joined)) {
		paragraphs.push('如果你打算把外接能力往里挂，这里提到的 hooks、MCP、skills、memory 都要分清各自负责哪一摊。');
	}
	if (/tmux|iterm|split pane|in-process/i.test(joined)) {
		paragraphs.push('这一段还会谈显示方式和终端环境，重点是先选一个你当前最稳能用的模式，不必一上来追求花哨。');
	}
	if (/environment variable|settings\.json|claude_code_/i.test(joined)) {
		paragraphs.push('如果你看到环境变量或 settings.json，意思通常都是：这不是会话里临时喊一声就行，而是要把开关真正写进环境或配置。');
	}

	return paragraphs.slice(0, 2);
}

function makeDetailedSections(page, doc) {
	return (page.sectionBlocks ?? [])
		.filter((block) => block && normalizeText(block.title))
		.map((block) => {
			const title = normalizeText(block.title);
			const codeBlocks = pickSectionCodeBlocks(
				block,
				/quickstart|create|install|setup|example/i.test(title) ? 6 : 4
			);

			return {
				title,
				paragraphs: summarizeSectionHints(block, doc.title),
				steps: codeBlocks.length
					? codeBlocks.map((code, index) => {
							const kind = inferStepKind(code);
							return {
								title: codeBlocks.length > 1 ? `${title} ${index + 1}` : title,
								body: buildStepBody({ kind, pageTitle: doc.title, sectionTitle: title }),
								code,
								kind
							};
						})
					: undefined
			};
		})
		.filter((section) => section.paragraphs.length || section.steps?.length);
}

function makeIllustration(title, sectionLabel) {
	return {
		title: '一眼看懂这一页',
		lines: [title, '   |', '   v', `这是 ${sectionLabel} 里的一摊要紧活`, '   |', '   v', '先弄懂，再下手'],
		caption: '先把这页到底在讲什么看明白，再去碰具体命令和配置，最不容易绕晕。'
	};
}

const sectionMetaphors = {
	'Getting started': '先把农具领进门，认门认路',
	'Core concepts': '先把干活门道摸清楚',
	'Platforms and integrations': '看看这帮工能在哪些工棚里接活',
	'Build with Claude Code': '给帮工添家伙、分工、自动化',
	Deployment: '把这套工具搬到不同云上去用',
	Administration: '立规矩、管权限、管成本',
	Configuration: '拧旋钮、定挡位、收权限',
	Reference: '查表、查口令、查细节'
};

const slugNicknames = {
	permissions: '权限',
	sandboxing: '沙箱',
	authentication: '身份认证',
	'interactive-mode': '交互模式',
	'plugin-marketplaces': '插件市场',
	'fast-mode': '快速模式'
};

const autoOverrides = {
	permissions: {
		summary: ['这页讲的是 Claude Code 到底能碰什么、不能碰什么。', '说白了，就是先把帮工的活动范围画清楚，免得它手伸得太长。'],
		explain: ['你可以把权限想成院门钥匙和工具柜钥匙。哪把给它，哪把先别给，得提前说清。', '这一页重点不是炫技，而是教你怎么把“能读、能改、能执行”这些权限拆开管。', '如果你想既让它干活，又不想它乱跑，这页就是硬规矩。'],
		practice: ['先从最保守的权限开始，确认任务确实需要，再一点点放开。', 'Bash、读写文件、联网请求这些权限不要混着开，最好一类一类验。', '真要让它长期进项目干活，就把规则写细，别只靠临时口头交代。']
	},
	sandboxing: {
		summary: ['这页讲的是沙箱，也就是给 Claude Code 围一个安全活动圈。', '意思很简单：让它能干活，但别一脚踩出院墙。'],
		explain: ['沙箱就像给帮工划出来的工作区。它可以在圈里翻土、搬东西，但不能想去哪儿就去哪儿。', '这页重点会讲文件隔离、网络隔离，还有为什么这样做更安全。', '如果你想多开自动化能力，又怕它误伤环境，这页必须先看。'],
		practice: ['先弄清你最担心的是改坏文件，还是乱联网，再选对应限制。', '不要只图方便把沙箱全拆掉，特别是在自动运行和团队环境里。', '沙箱和权限是一起看的，不是只看其中一个就够。']
	},
	authentication: {
		summary: ['这页讲的是怎么让 Claude Code 认你、认团队、认组织。', '个人怎么登录，团队怎么统一接，这里都会讲。'],
		explain: ['这事就像进仓库前先认身份。你是谁、属于哪一队、能开哪道门，先对上号，后面干活才顺。', '这页不只是个人登录，还会讲团队认证和企业接法。', '如果登录这一步没理顺，后面很多功能都会卡在门口。'],
		practice: ['个人先把最基础的登录跑通，再去碰团队或企业认证。', '团队接入时，先确认账号体系和权限体系是谁说了算。', '认证相关问题一旦出错，先查登录方式、组织归属和令牌来源。']
	},
	security: {
		summary: ['这页讲安全，不是吓人，是教你怎么把风险挡在外面。', '越早把安全边界画清楚，后面越少返工。'],
		explain: ['安全就像修院墙、安门锁，不是等出事了才想起来补。', 'Claude Code 能干活，就意味着你更要提前定好它能接触什么、不能带走什么。', '这页适合管理员和团队负责人先看一遍，再决定默认规则。'],
		practice: ['先从最基本的权限、认证、数据边界看起。', '别把安全理解成只跟管理员有关，普通使用方式也会影响风险。', '越是多人共用环境，越要先立规矩，再大规模开用。']
	},
	'server-managed-settings': {
		summary: ['这页讲的是由服务器统一下发配置，不让每个人各配各的。', '适合团队想把规矩一次定好、大家一起照着走。'],
		explain: ['这像村里统一贴规矩，不是每家院门上各写一套。', '好处是团队口径一致，少了“我这台机器不是这么配的”这类麻烦。', '尤其适合企业或多人协作环境。'],
		practice: ['先分清哪些是团队硬规则，哪些还该留给个人调。', '统一下发前最好先小范围试，别一下把全队都锁死。', '写服务器托管设置时，宁可少而准，也别又长又乱。']
	},
	'data-usage': {
		summary: ['这页讲数据怎么被使用，适合对合规和隐私比较敏感的人看。', '看完这页，心里要清楚数据会经过哪几道手。'],
		explain: ['很多人最担心的不是它会不会干活，而是它碰过的数据到底怎么处理。', '这页就是把这类问题摊开讲：哪些数据会进流程，哪些边界要特别注意。', '如果团队对数据要求高，这页基本是必看项。'],
		practice: ['先看清楚“会收什么”“不会收什么”“保留多久”。', '不要凭感觉猜，数据问题最好按文档和团队要求逐项核对。', '真有高要求场景，就连零数据保留那页一起看。']
	},
	'zero-data-retention': {
		summary: ['这页讲零数据保留，适合对数据残留非常敏感的场景。', '说白了，就是尽量不让材料在系统里留下尾巴。'],
		explain: ['这像借工具干活，但干完不把你家的账本抄走。', '对金融、政企、合规要求很严的团队，这通常不是可选项。', '这页会帮助你判断自己是不是需要这套更严格的模式。'],
		practice: ['先确认你们团队是不是有明确的零保留要求。', '别只看名字就以为万事大吉，具体边界还是要一条条核对。', '通常要和认证、权限、数据使用几页一起看。']
	},
	'monitoring-usage': {
		summary: ['这页讲怎么盯团队使用情况，看看谁在用、怎么用、用得多不多。', '不是为了盯人，而是为了心里有账。'],
		explain: ['这像看仓库出入账。你不一定要天天盯，但总得知道粮食去哪了。', '对团队来说，监控使用情况能帮助你发现浪费、卡点和高频需求。', '没有这些数，后面谈优化和控成本都容易拍脑袋。'],
		practice: ['先看最关键的几项：活跃度、用量、异常峰值。', '别收一堆数据却不看，监控的价值在于拿来做决策。', '如果目标是控成本，就把这页和 Costs 一起看。']
	},
	costs: {
		summary: ['这页讲钱从哪花、怎么估、怎么控。', '越早把账算清，越不容易后面被账单追着跑。'],
		explain: ['Claude Code 干活不是白来的，尤其团队一起用时，成本会很快显出来。', '这页就像算农忙请工的账，要知道哪种活最费、哪种配置最烧钱。', '不怕花钱，怕的是不知道钱花到哪去了。'],
		practice: ['先盯住大头：模型选择、使用频率、自动化任务。', '成本异常时，不要只怪工具，先看是不是流程设计太重。', '监控和成本要配着看，单看一头容易判断失真。']
	},
	analytics: {
		summary: ['这页讲团队分析，帮你从数据上看大家到底怎么在用 Claude Code。', '不是凭感觉说“大家好像常用”，而是拿数说话。'],
		explain: ['这像看地里哪块出苗快、哪块总缺水。只有看清分布，后面才知道怎么调。', '分析数据能帮你发现哪些功能最常用，哪些培训还没跟上。', '对团队负责人来说，这页的价值在于“看清楚”而不是“看热闹”。'],
		practice: ['先选几个真能指导决策的指标，不要贪多。', '分析结果出来后，最好能转成具体动作，比如培训、收权限、调默认配置。', '别把分析当报表摆设，要让它反过来影响团队用法。']
	},
	'plugin-marketplaces': {
		summary: ['这页讲怎么做自己的插件市场，把常用插件统一发给团队。', '适合团队想把“好用的扩展包”集中管理起来。'],
		explain: ['这就像村里开个统一农具站，常用家伙都放这里，谁要用就按规矩领。', '好处是插件来源更清楚，版本更统一，不用每个人各自乱找。', '如果你们已经开始广泛用插件，这页很有价值。'],
		practice: ['先挑团队最常用、最稳定的几类插件收进市场。', '别一开始就铺太大，先把来源、版本和审核规则定稳。', '市场做起来后，重点不只是“能装”，还得“可控、可更新、可追踪”。']
	},
	'terminal-config': {
		summary: ['这页讲终端环境怎么调，才能让 Claude Code 用起来顺手。', '很多体验问题，不是 Claude 坏，是终端底子没打好。'],
		explain: ['这像修工作台。台子不稳，师傅手艺再好也难发挥。', '终端字体、颜色、复制粘贴、输入回显这些细节，都会影响日常手感。', '这页适合刚开始长期用终端版的人先补一遍。'],
		practice: ['先把最影响体验的地方调顺，比如显示、输入、编码和复制粘贴。', '如果你总觉得命令行用着别扭，多半这页有你要的答案。', '环境调好后，再去谈更高级的用法，事半功倍。']
	},
	'model-config': {
		summary: ['这页讲模型怎么配，不同模型该在什么活上出场。', '说白了，就是选对工种。'],
		explain: ['有的模型像慢工细活的老师傅，有的像跑得快的短工。', '这一页会帮助你分清速度、成本、效果之间怎么拿捏。', '选对了，干活更顺；选错了，不是慢就是贵，要么效果还一般。'],
		practice: ['先按活路来选模型，不要只盯最强或最便宜。', '团队统一使用时，最好先定几个默认挡位。', '模型配置最好和成本、快速模式一起看。']
	},
	'fast-mode': {
		summary: ['这页讲快速模式，也就是图更快回话时该怎么开。', '它不是白捡便宜，而是拿速度去换一些别的东西。'],
		explain: ['快速模式像赶集时走大路快车，能更快到，但账和取舍得提前想清。', '这一页最关键的不是“怎么开”，而是“什么时候值得开”。', '如果你只是图一时快，没看清代价，很容易后面又嫌不合适。'],
		practice: ['先看成本和效果取舍，再决定要不要默认开。', '适合短平快、对速度更敏感的活，不一定适合所有任务。', '团队环境里最好把开关规则说清，别每个人各用各的。']
	},
	statusline: {
		summary: ['这页讲怎么定制状态栏，把最想看的信息挂在眼前。', '看着顺手，盯进度就不累。'],
		explain: ['状态栏像拖拉机仪表盘。该看油量、挡位还是转速，得先想清楚。', '如果信息挂对地方，你少问很多次“现在到哪一步了”。', '这页更偏体验优化，但日常用久了很值。'],
		practice: ['先只放最常看的信息，别把状态栏堆成杂货铺。', '显示什么，取决于你最常盯的是进度、模型、权限还是目录。', '状态栏是辅助，不是越花越高级。']
	},
	keybindings: {
		summary: ['这页讲快捷键怎么改，帮你把高频动作变得更顺手。', '用得久的人，会很明显感到这页值钱。'],
		explain: ['快捷键像常用手势。顺手了，你干活不用总停下来想下一步。', '如果你平时已有一套习惯，这页就是拿来把 Claude Code 调到合手。', '别小看这点改动，天天用时能省很多碎功夫。'],
		practice: ['先改最常按的那几个，不要一口气全改。', '尽量避免和你终端或系统原有快捷键打架。', '改完以后自己实际干两天活，确认是不是真顺手。']
	},
	'interactive-mode': {
		summary: ['这页讲交互模式，也就是你和 Claude Code 在会话里怎么配合最顺手。', '快捷键、输入方式、命令节奏，基本都在这页。'],
		explain: ['这像教你怎么跟熟练帮工搭话。什么时候直接开口，什么时候用快捷动作，什么时候翻历史记录，都有门道。', '如果你天天待在交互式会话里，这页能帮你少绕很多手。', '它不一定华丽，但非常实用。'],
		practice: ['先记最常用的快捷键和内置命令，别想着一口气全背。', '输入、编辑、历史搜索这些动作，练熟之后效率会明显上来。', '如果你习惯 Vim 或固定键位，这页尤其值得细看。']
	},
	checkpointing: {
		summary: ['这页讲检查点，适合干大活时给自己留后手。', '说白了，就是干到一半先打个桩，出问题能回头。'],
		explain: ['这像修房时先拍照留档、分段验收，不是一口气拆到底。', 'Claude Code 干复杂任务时，检查点能帮你减少“改远了回不来”的风险。', '对多步试验、重构和大改特别有用。'],
		practice: ['任务一长，就别舍不得留检查点。', '关键节点前后都留一下，回头定位问题会轻松很多。', '检查点不是拖慢你，而是给大改买保险。']
	},
	hooks: {
		summary: ['这页是 Hooks 的查表页，重点是你要知道有哪些字段和规则可用。', '适合真正要写 hooks 配置时翻着用。'],
		explain: ['它像门禁规则说明书，不一定天天读，但到真要配的时候特别关键。', '这一页更偏参考手册，不是闲聊型内容。', '你需要的是准确，不是花哨。'],
		practice: ['写 hooks 前先把触发时机和输入输出想清楚。', '先从最简单、最稳的钩子开始，不要一上来写一大串复杂逻辑。', '查字段和例子时，这页最好和 hooks-guide 一起看。']
	},
	'plugins-reference': {
		summary: ['这页是插件参考表，适合做插件或查插件结构时用。', '字段怎么写、结构怎么摆，这里最关键。'],
		explain: ['它像装配图，不是给你讲故事，而是给你照着拼。', '如果前面“创建插件”那页讲的是思路，这页讲的就是细节和格式。', '要真正落文件时，这页比空谈更有用。'],
		practice: ['先按最小插件结构做通，再往里加复杂字段。', '字段名和格式别自己想象，照参考表来。', '创建插件和插件参考最好配着看，一个讲方向，一个讲落地。']
	},
	'mcp': {
		summary: ['这页讲 MCP，也就是怎么把 Claude Code 接到外部工具和数据源上。', '说白了，就是给帮工装外接设备，让它别只盯着眼前这堆文件。'],
		explain: ['你可以把 MCP 想成拖拉机后面的挂载口。接上去以后，Claude 才能碰到数据库、接口、知识库、内部工具这些外面的家伙事。', '这页最值钱的地方，不是名词本身，而是它会告诉你有哪些接法、哪些现成服务器、该怎么装。', '如果你想让 Claude 真正懂你们团队外面的系统，这页几乎绕不过去。'],
		practice: ['第一次上 MCP，先挑一个最刚需的外部工具接，不要一口气连十几个。', '远程 HTTP、SSE、本地 stdio 这些接法分清楚，再决定走哪条。', '接好后先做只读类试验，确认它看得懂、用得稳，再考虑更重的操作。']
	},
	'headless': {
		summary: ['这页讲怎么把 Claude Code 编程化调用，不用每次都手工进对话界面。', '适合脚本、命令行流程、Python、TypeScript 这些自动化场景。'],
		explain: ['这像把帮工从院子里请到流水线上。你不是站在旁边一句句吩咐，而是把活写进程序，让它照着跑。', '这页会讲基本调用、结构化输出、流式返回、自动批准工具这些能力。', '如果你想把 Claude 接进你自己的程序或 CI，这页非常关键。'],
		practice: ['先从最小示例跑通，别一上来就接整条生产流水。', '如果后面还要给别的程序继续吃结果，优先研究结构化输出。', '自动批准工具和自动提交这类能力要特别慎重，最好先小范围试。']
	},
	'output-styles': {
		summary: ['这页讲输出风格，意思是 Claude 最后把结果说成什么样。', '不只是写代码时能用，做摘要、报告、清单、结构化输出时也很有用。'],
		explain: ['你可以把它想成给帮工提前定口径。是让它写成清单、写成报告、写成像客服话术，还是写成结构化格式，先说好，后面省很多返工。', '这一页特别实用，因为很多时候问题不在 Claude 不会，而在它说出来的样子不合用。', '如果你想把 Claude 从“程序员帮手”扩到更多工作场景，这页很值。'],
		practice: ['先用内置输出风格试手，确认哪种最适合你的活。', '真要自定义时，先把格式目标讲清楚，不要又想自由发挥又想字段固定。', '这页最好和 `CLAUDE.md`、agents、append-system-prompt 一起分清楚谁管什么。']
	},
	'discover-plugins': {
		summary: ['这页讲去哪找现成插件、怎么装、装完能多出哪些本事。', '重点不是装得多，而是装得准。'],
		explain: ['这像去农具市场挑现成家伙。别人已经打磨好的，拿来就能省你很多重复造轮子的劲。', '这一页还会讲市场怎么运作、官方市场里有什么、代码智能插件和外部集成插件能带来什么。', '如果你懒得自己从零做插件，这页就是最省力的入口。'],
		practice: ['先装最贴近你当前活路的插件，别为了新鲜一口气装一堆。', '看插件时，除了功能，也要看它到底会给 Claude 多开哪些能力。', '装完先在小项目试，再决定要不要推广到主项目和团队里。']
	},
	'third-party-integrations': {
		summary: ['这页讲企业部署总览，也就是 Claude Code 怎么接不同云、代理和企业基础设施。', '它不是单一配置页，更像给你先画一张大地图。'],
		explain: ['这像你准备把一套设备搬去不同村口、不同仓库、不同电路环境里用，先得看哪条路最适合自己。', '这一页会先比较几种部署路子，再讲代理、网关，以及 AWS、Azure、GCP 这些不同云的接法。', '如果你不是个人随手用，而是团队或企业要上，这页最好先看。'],
		practice: ['先搞清你们更在意的是账号体系、网络环境、合规，还是现有云平台绑定。', '不要一上来就钻某一朵云的细节，先用总览页判断大方向。', '看完这页后，再去对应的 Bedrock、Vertex、Foundry、网关和网络配置分页面。']
	},
	'amazon-bedrock': {
		summary: ['这页讲怎么通过 Amazon Bedrock 接 Claude Code。', '适合本来就扎在 AWS 体系里的团队。'],
		explain: ['这像你本来就住在 AWS 这条大路边上，那最省事的办法就是顺着现成道路走。', '这一页会讲前提条件、实际配置步骤、IAM 凭证这些硬东西。', '如果你们公司的账号、网络、审计都在 AWS 上，这页很可能是主路。'],
		practice: ['先把先决条件看清，再去配凭证和权限。', 'IAM 这块不要想当然，角色和权限边界最好提前捋顺。', '卡住时先查账户、区域、凭证，再去看工具本身。']
	},
	'google-vertex-ai': {
		summary: ['这页讲怎么通过 Google Vertex AI 接 Claude Code。', '适合本来就把很多事放在 GCP 上的团队。'],
		explain: ['如果你们家底子本来就在 Google 云上，那走 Vertex 就像走熟路，不用临时再修旁门。', '这一页会讲区域、API、凭证和整体接入步骤。', '对 GCP 团队来说，这比另起一套体系更自然。'],
		practice: ['先确认区域和服务开关，再去配身份和调用。', 'Google 云里很多前提条件都要先开服务，不要跳步。', '卡住时先查项目配置和 IAM，再查 Claude Code 这层。']
	},
	'microsoft-foundry': {
		summary: ['这页讲怎么通过 Microsoft Foundry 或 Azure 那条路接 Claude Code。', '适合本来就在微软云体系里做事的团队。'],
		explain: ['这像你本来就用 Azure 这套仓库和账本，那顺着原来的门禁和钥匙走最省事。', '这页会讲前提条件、资源准备和 Azure 凭证配置。', '企业里最常见的问题不一定是步骤复杂，而是权限没对齐。'],
		practice: ['先把订阅、资源、凭证这些前提打通，再去跑 Claude Code。', 'Foundry 资源先准备好，别边配边找目标资源。', '真卡住时，优先查 Azure 身份和访问权。']
	},
	'network-config': {
		summary: ['这页讲网络配置，适合公司内网、代理、防火墙比较严格的环境。', '很多“明明家里能跑，公司跑不动”的问题，都在这页。'],
		explain: ['这像门口有门卫、有通行证、有出门路线，不是你想出去就能直接出去。', '这一页最关键的是把代理、证书、白名单、出网限制这些门道讲清。', '如果 Claude Code 一直连不上、超时、拉不到服务，这页往往就是答案。'],
		practice: ['先弄清你们是走代理、白名单，还是干脆有出网限制。', '网络问题别只盯客户端，很多时候得和 IT 或平台同事一起看。', '先查最基础的通路，再去怀疑更高层的配置。']
	},
	'llm-gateway': {
		summary: ['这页讲 LLM 网关，适合多团队共用、要统一认证审计限流的场景。', '它不是人人都要，但团队一大往往就绕不开。'],
		explain: ['你可以把网关想成总闸口。所有请求都先从这儿过，再统一分发、记账、限流、审计。', '这页会讲网关要满足什么条件、怎么配置认证、怎么选模型、不同提供方怎么接。', '如果你们想把 Claude Code 纳入统一管控，这页很重要。'],
		practice: ['先确认你们是不是真的需要集中闸口，不是为了看起来高级才上。', '认证、模型选择和 provider 端点要一层层对齐，不要混着猜。', '真有多团队共用场景，就把这页和成本、监控一起看。']
	},
	devcontainer: {
		summary: ['这页讲开发容器，也就是给团队准备一套更一致、更安全的 Claude Code 环境。', '适合环境复杂、成员多、总碰到“在我机器上能跑”的团队。'],
		explain: ['这像给大家统一发同一套工具箱和工作台，谁来都别差太多。', '这一页会讲容器方案的特点、四步上手、配置拆解和安全设计。', '如果你们团队环境老是各不相同，这页很值。'],
		practice: ['先按最小 devcontainer 方案跑通，再逐步加团队自己的东西。', '重点不只是能启动，还要看权限、挂载和工具链是不是都准备对了。', '容器这条路适合想把环境差异压到最低的团队。']
	},
	'how-claude-code-works': {
		summary: ['这页讲 Claude Code 到底是按什么路数干活的。', '不是瞎猜瞎改，而是先看、再想、再动手、再回头验。'],
		explain: ['你可以把它想成一个肯先绕地一圈的老把式。它不是看见一处泥巴就乱铲，而是先把地形、水路、工具和活路摸清。', '这一页最值钱的是把“代理循环”“模型”“工具”“能碰到什么材料”这些底层门道讲明白。', '你越懂这页，后面就越知道什么时候让它先分析，什么时候再让它真改。'],
		practice: ['遇到大活，先让它摸底和列计划，不要一上来就吩咐大改。', '知道它能看什么、能动什么、能跑什么命令，后面提要求才不容易超边界。', '如果它跑偏，多半不是它突然变笨，而是你交代得太散、太大、太混。']
	},
	'features-overview': {
		summary: ['这页讲 Claude Code 身上都能再挂哪些家伙事。', '不是只会一个人单打独斗，它还能接规矩、接技能、接外部工具、接自动化。'],
		explain: ['这像给拖拉机看挂载清单。原机能开，但挂上不同设备以后，能耕地、能播种、能拉货。', '这一页最重要的是帮你分清：什么时候该用 `CLAUDE.md`，什么时候该上 skills、subagents、hooks、MCP、plugins。', '它不是叫你全装，而是叫你别装错。'],
		practice: ['先从眼前最缺的一项能力补，不要为了“功能全”一口气全挂上。', '几个功能名字看着像，实际负责的事情不一样，这页就是拿来分清边界的。', '加功能之前先想收益，再想复杂度，别把帮工越改越笨重。']
	},
	'common-workflows': {
		summary: ['这页讲日常最常见的派活套路。', '像看新项目、找相关代码、修 bug、重构、补测试，这些都给了顺手走法。'],
		explain: ['这像老农教你干活的顺序：先看地，再找水，再下种，不是抡起锄头就全翻。', '这一页特别适合新手，因为它不是讲抽象能力，而是把常见活拆成一步一步。', '你照着这些套路派活，比自己临场乱说稳得多。'],
		practice: ['新项目先看全貌，再找相关文件，不要一开始就陷进一个函数里。', '修 bug 前先定位范围，再动手，再验结果，这个节奏别乱。', '如果活很大，就拆成几段：摸底、实现、验证，各段分开看。']
	},
	'best-practices': {
		summary: ['这页讲怎么把 Claude Code 使唤得更顺，不是讲新功能，是讲怎么少返工。', '核心就一句话：话说清、边界画清、验收讲清。'],
		explain: ['再好的帮工，也怕遇到一句“你帮我弄一下”的糊涂单。', '这一页会教你怎么给它验证办法、怎么先探索再规划、怎么提供更具体的上下文和更有用的材料。', '它不是花招，而是你以后少踩坑的基本功。'],
		practice: ['别只说目标，也要说约束和验收方式。', '给它丰富上下文时，宁可给关键材料，也别一股脑塞一车废话。', '能让它自己验证的事，尽量给它验证条件，这比让它蒙着干靠谱得多。']
	},
	'sub-agents': {
		summary: ['这页讲怎么养专门干单项活的小帮工。', '一个查问题，一个写测试，一个整理文档，各干各的，脑子不打架。'],
		explain: ['子代理就像把一个大工棚拆成几个小工位。不同活放到不同工位上干，现场更清爽。', '这一页会讲内置子代理、怎么快速做第一个子代理、怎么配置、怎么用 `/agents` 管。', '如果你发现一个会话里什么活都塞，越干越乱，这页就该上了。'],
		practice: ['先从最容易切分的活开始，比如 reviewer、test-writer、docs-helper。', '子代理描述一定要写清它负责什么，不负责什么。', '作用域别乱放，项目级和个人级要分明，不然迟早互相打架。']
	},
	'agent-teams': {
		summary: ['这页讲代理团队，也就是让多名 Claude 同时协作。', '适合任务大、分工明确、需要并行推进的场景。'],
		explain: ['这比子代理更像真施工队，不是一个人换帽子，而是几个人同时上工。', '这一页会讲什么时候该用团队、它和子代理有啥区别、怎么开团队、怎么控制队员。', '如果你的任务已经大到“一个人来回切角色很累”，团队模式就有价值。'],
		practice: ['先确认任务真能拆开，再拉团队，不然只会多出协调成本。', '最稳的分法一般是勘察、实现、验收三类人分开。', '一开始团队别拉太大，先两三名角色试顺，再扩大。']
	},
	plugins: {
		summary: ['这页讲怎么做自己的插件，把技能、代理、hooks、MCP 这些打成包。', '做出来以后，别的项目和别人装上就能直接用。'],
		explain: ['插件像打包好的工具箱，不用每换一块地就重新配一遍。', '这一页会讲什么时候该做插件、什么时候只做独立配置就够、以及第一个插件怎么起步。', '如果你们团队总在重复配同一套东西，这页很值。'],
		practice: ['先确定你打包的是一类稳定能力，而不是一堆临时想法。', '从最小插件结构做起，先让它能装、能跑，再慢慢加复杂内容。', '技能、hooks、代理、MCP 往里放时，先想好谁是核心，不要把插件做成杂货铺。']
	},
	skills: {
		summary: ['这页讲技能，也就是把常用绝活做成随叫随到的小抄。', '适合把团队里重复用的套路固化下来。'],
		explain: ['技能像写在墙上的拿手活说明：遇到这种事，就按这个打法来。', '这一页会讲内置技能、怎么做第一个技能、技能放哪儿、怎么自动发现。', '如果你老是在反复教 Claude 同一种套路，这页就是答案。'],
		practice: ['技能要短、准、能执行，不要写成一篇空洞演讲稿。', '先从一个高频场景试，比如写测试、审查代码、生成文档。', '目录结构和发现规则先弄清，不然写了半天找不着。']
	},
	'scheduled-tasks': {
		summary: ['这页讲定时任务，让 Claude 到点自动跑提示。', '适合循环提醒、轮询状态、固定时间做一遍检查。'],
		explain: ['这像你让帮工每天早上先去看一眼水泵，每周一再盘一次仓库。', '这一页会讲 `/loop` 怎么用、间隔语法、一次性提醒、任务怎么管理。', '如果你总有重复催一次的事，这页特别省心。'],
		practice: ['先从最简单的重复活开始，不要一开始就排一大串复杂任务。', '循环间隔和到期逻辑要看清，别设完就不管。', '任务真跑起来后，要定期回头看有没有空转或误报。']
	},
	'hooks-guide': {
		summary: ['这页讲 hooks，也就是在特定时刻自动插动作。', '改完文件自动格式化、任务结束发提醒、碰到危险命令先拦一下，都属于这类。'],
		explain: ['Hooks 像门口的检查员和工地边上的规矩牌。事情发生到某一步，就自动触发。', '这一页会讲第一个 hook 怎么配、能自动化什么、怎么提醒输入、怎么改完就自动格式化。', '如果你想把规矩落地，不想每次靠人记，这页很好用。'],
		practice: ['先从最稳的 hook 开始，比如格式化、通知、阻止改受保护文件。', '触发时机一定要分清，不然 hook 一多就容易互相绊。', '写 hook 时别贪重，越复杂越难维护。']
	},
	troubleshooting: {
		summary: ['这页讲常见故障怎么排。', '装不上、连不通、命令不认、路径不对，这里基本都有思路。'],
		explain: ['排错最怕瞎试，这页就是给你一张“先查哪儿、后查哪儿”的路线图。', '它会带你先查安装本身、再查网络、再查 PATH、再查有没有冲突安装或权限问题。', '真卡住时，这页往往比四处乱搜省时间。'],
		practice: ['先把报错原文、系统环境、你刚做的操作记下来。', '从最基础的通路开始查，比如 PATH、网络、目录权限。', '别一上来全盘重装，能小步验证就小步验证。']
	},
	'remote-control': {
		summary: ['这页讲远程控制，也就是人离开电脑了，还能继续盯着本机里的 Claude Code 干活。', '手机、平板、浏览器都能接上来看。'],
		explain: ['这像你人去镇上了，但院子里的帮工还在干活，你拿手机就能继续喊两句。', '这一页会讲要满足哪些前提、怎么在本机开远程会话、怎么从别的设备接进来，以及安全边界。', '如果你常常任务做到一半要离开电脑，这页很有用。'],
		practice: ['先在自己最熟的机器上开一次远程会话，确认接入链路跑通。', '远程适合续命和盯进度，不适合第一次就在外面做高风险大改。', '安全和连接限制要先看清，别只顾方便。']
	},
	'claude-code-on-the-web': {
		summary: ['这页讲网页版 Claude Code，也就是把任务放到云上跑，不必全靠你本地机器撑着。', '适合异步长任务、跨设备续上工作。'],
		explain: ['这像把活送去一个安全工棚里慢慢做，你人不一定守在旁边。', '这一页会讲谁能用、怎么开始、网页版到底怎么运作、怎么在网页和终端之间来回接力。', '如果你想把长任务丢出去跑，或者在外头也能接着看结果，这页特别值。'],
		practice: ['先拿一个不太重但也不是太小的任务试试网页版节奏。', '网页版和终端不是二选一，很多时候是配合着用。', '如果任务和本地环境强绑定，还是先想清楚该不该搬到网页上。']
	},
	chrome: {
		summary: ['这页讲 Chrome 扩展，让 Claude Code 能直接碰浏览器现场。', '调网页、看控制台、自动点表单、抓页面数据，这类活都更顺。'],
		explain: ['这像你不再只让帮工看图纸，而是直接带它去现场看墙有没有裂、门能不能开。', '这一页会讲扩展能干什么、要准备什么、怎么从 CLI 启起来、怎么给站点权限。', '如果你做前端、做网页排错，这页很实用。'],
		practice: ['先从一个简单页面试，比如本地开发页或测试环境。', '浏览器权限别图省事全开，按站点和需要一点点给。', '适合网页现场问题，不适合拿来替代所有普通代码分析。']
	},
	'vs-code': {
		summary: ['这页讲 VS Code 集成，把 Claude Code 直接请进你平时写代码的工位。', '看 diff、提问、@ 文件、续上会话，都能在编辑器里干。'],
		explain: ['这像把帮工请到你手边，不用你在编辑器和终端之间来回跑。', '这一页会讲扩展怎么装、怎么开始、提示框怎么用、怎么引用文件和目录、怎么接回以前的会话。', '如果你本来就长期待在 VS Code，这页大概率是你的主入口。'],
		practice: ['先把扩展装好，再拿一个小改动试从编辑器里直接派活。', '善用文件引用和历史会话续接，不然它还是容易认路慢。', '编辑器里适合边看边改，复杂脚本化操作还是终端更直接。']
	},
	jetbrains: {
		summary: ['这页讲 JetBrains 系列 IDE 集成，适合 IntelliJ、PyCharm、WebStorm 这些用户。', '目的和 VS Code 一样，就是别离开主力工位。'],
		explain: ['这像把帮工请进你自己那套熟手工作台，不用你临时换桌子。', '这一页会讲支持哪些 IDE、有哪些功能、怎么装、从 IDE 里怎么用、从外部终端怎么配合。', '如果你本来就是 JetBrains 老用户，这页最能帮你少折腾。'],
		practice: ['先确认插件装好了、IDE 识别正常，再开始真派活。', '越是大工程，越能体会在 IDE 里直接协作比来回切换省劲。', '从 IDE 和从外部终端接入的差别最好先试一遍。']
	},
	slack: {
		summary: ['这页讲 Slack 集成，也就是在团队聊天里直接把活交给 Claude Code。', '有人在群里报 bug、提需求、催调查时，不必再来回复制粘贴。'],
		explain: ['这像在大队群里喊一声，帮工就顺着聊天内容去接单。', '这一页会讲适合哪些用例、要准备什么、Slack 里怎么接起来、接进去后它怎么流转。', '如果你们团队很多协作都在 Slack 里发生，这页很值。'],
		practice: ['先拿一类固定场景试，比如报障或代码审查请求。', '群里说的话也要尽量清楚，不然它接到的还是糊涂单。', '适合把群消息变成任务，不代表群里每句话都该让它接。']
	},
	setup: {
		summary: ['这页讲高级安装和管理员起步，不是普通新手第一分钟就得看的页。', '它主要管机器要求、不同系统怎么装、怎么升级、怎么卸、怎么认主。'],
		explain: ['这像在正式开工前先把机器、燃料、工具箱和钥匙都备齐。', '这一页会讲系统要求、额外依赖、Windows 怎么配、装完怎么验证、怎么认证、怎么更新版本。', '如果你装到一半卡住，或者团队要统一装机，这页就很重要。'],
		practice: ['先看自己机器够不够条件，再选对应系统的安装路子。', '装完一定要做验证和认证，不要看到命令装上就以为万事大吉。', '如果团队多人装机，最好统一版本和发布通道，别每个人一套。']
	},
	settings: {
		summary: ['这页讲 Claude Code 的总设置盘，也就是各种旋钮和挡位到底怎么分层去拧。', '全局配置、项目配置、环境变量，这一页会把层级关系讲清。'],
		explain: ['这像家里、院里、眼前这次活，三层规矩一起管人。离现场越近的规矩，通常越顶用。', '这一页最关键的不是某一个设置项，而是让你搞懂配置作用域、作用顺序、哪些东西会吃这些作用域。', '如果你老觉得“明明改了怎么不生效”，多半就是这页没看明白。'],
		practice: ['个人习惯放全局，项目规矩放仓库，临时试验再用环境变量或临时参数。', '先分清作用域，再去改具体设置，不然很容易改错地方。', '权限和沙箱相关设置尤其要谨慎，别为了省事一把全放开。']
	},
	'cli-reference': {
		summary: ['这页是命令行总对照表，适合忘了命令和参数时回来查。', '它不是聊天页，更像说明书最后那张查表。'],
		explain: ['这像农具说明书后面的命令清单。平时不一定从头背，但真用时特别救命。', '这一页会讲常用命令、参数开关、agents 标志格式、system prompt 相关参数。', '你不需要把它全背下来，但最好知道来这儿能查什么。'],
		practice: ['先记最常用的那几条，剩下的有需要再翻。', '查 flag 时看清是不是只在特定模式下生效，别生搬硬套。', '命令行参考最好和 interactive mode、settings 配着看，一个讲口令，一个讲环境。']
	}
};

function chineseName(doc) {
	return slugNicknames[doc.slug] ?? doc.title;
}

function getDescription(page) {
	return normalizeText(page.metaDescription ?? '');
}

function makeSummary(doc, page) {
	const meta = getDescription(page);
	const intro = pickParagraphs(page, 2);
	if (meta) {
		return [
			`这页主要讲 ${chineseName(doc)}：${meta}`,
			`你可以把它当成“${doc.section}”这块里专门管这一摊事的说明书。`
		];
	}
	if (intro.length >= 2) {
		return [
			`这页主要在讲 ${chineseName(doc)}：${intro[0]}`,
			`你真正要抓住的是：${intro[1]}`
		];
	}

	return [doc.summary, doc.description];
}

function makeExplain(doc, page) {
	const headings = pickHeadings(page, 3);
	const toc = pickToc(page, 4);
	const meta = getDescription(page);
	const paragraph = pickParagraphs(page, 1)[0];
	const structure = toc.length ? toc.join('、') : headings.join('、');
	const headingText = structure ? `原文这页大多会按 ${structure} 这些环节往下讲。` : '';
	const metaphor = sectionMetaphors[doc.section] ?? '把这摊活讲明白';

	return [
		`你可以把“${chineseName(doc)}”理解成 ${doc.section} 这一栏里的一把专门工具。这页不是让你背书，而是教你什么时候该把这把工具拿出来。`,
		headingText || `这页的重点不是空讲概念，而是让你先明白它到底替你省哪种事。放在这整个文档站里，它更像是在教你怎么 ${metaphor}。`,
		paragraph
			? `翻成人话，大概就是：${paragraph}`
			: meta
				? `翻成人话，大概就是：${meta}`
				: '看这类页面时，最稳的办法就是先弄清楚它解决什么问题，再决定要不要现在就接进你的项目。'
	].filter(Boolean);
}

function makePractice(doc, page) {
	const headings = pickHeadings(page, 3);
	const toc = pickToc(page, 4);
	const route = toc.length ? toc : headings;
	const base = [
		'第一，先别一上来全开全配。先按最小一步试通，确认没跑偏，再继续往下加。',
		'第二，命令、配置名、参数名这些硬东西尽量保留原样。人话解释是帮你听懂，不是帮你改关键字。'
	];

	if (route.length) {
		base.push(`第三，照着原文这几个环节挨个过：${route.join(' -> ')}。像下地先看水路、再试机器、再正式开干，一步一步最稳。`);
	} else {
		base.push(`第三，这页属于“${doc.section}”这一类，最好边做边验，不要攒到最后才一起看结果。`);
	}

	return base;
}

function makeSteps(page, doc) {
	const sectionSteps = pickSectionSteps(page, 12);
	if (sectionSteps.length) return sectionSteps;

	const blocks = pickCodeBlocks(page, 6);
	if (!blocks.length) return undefined;

	const labels = pickToc(page, 8).concat(pickHeadings(page, 8));

	return blocks.map((code, index) => ({
		kind: inferStepKind(code),
		title: labels[index] ? `原页关键片段：${labels[index]}` : `原页里的关键命令/代码 ${index + 1}`,
		body: buildStepBody({
			kind: inferStepKind(code),
			pageTitle: doc.title,
			sectionTitle: labels[index] ?? `关键片段 ${index + 1}`
		}),
		code
	}));
}

function buildGeneratedContent(sourceData, navigationData) {
	const pagesByPath = new Map((sourceData.pages ?? []).map((page) => [page.path, page]));

	return navigationData.allDocs.reduce((acc, doc) => {
		const pathKey = doc.path.replace(/\/$/, '');
		const page = pagesByPath.get(pathKey);
		if (!page || page.error) return acc;

		const override = autoOverrides[doc.slug];

		acc[doc.slug] = {
			sourceLabel: page.title || doc.title,
			sections: [
				{
					title: '简要总结',
					paragraphs: override?.summary ?? makeSummary(doc, page)
				},
				{
					title: '农民伯伯版解释',
					paragraphs: override?.explain ?? makeExplain(doc, page)
				},
				{
					title: '上手时重点盯住什么',
					paragraphs: override?.practice ?? makePractice(doc, page),
					steps: makeSteps(page, doc)
				},
				...makeDetailedSections(page, doc)
			],
			illustration: makeIllustration(doc.title, doc.section)
		};

		return acc;
	}, {});
}

function buildDocsFromSource(sourceData) {
	return (sourceData.sections ?? []).flatMap((section) =>
		(section.items ?? []).map((item) => {
			const slug = String(item.path ?? '').replace(/^\/docs\/en\//, '').replace(/\/$/, '');
			return {
				title: item.title,
				path: item.path,
				slug,
				section: section.title,
				summary: `${item.title} 这一页主要讲 ${item.title} 这件事在 Claude Code 里怎么上手、怎么避坑。`,
				description: '这里会把官方原文翻成更直白、更接地气的中文，并保留关键命令、配置和代码片段。'
			};
		})
	);
}

async function main() {
	let sourceData;

	try {
		sourceData = JSON.parse(await fs.readFile(sourceFile, 'utf8'));
	} catch (error) {
		if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
			await fs.mkdir(path.dirname(outputFile), { recursive: true });
			await fs.writeFile(
				outputFile,
				JSON.stringify(
					{
						generatedAt: new Date().toISOString(),
						sourceGeneratedAt: null,
						items: {}
					},
					null,
					2
				)
			);
			console.log(`No source snapshot found at ${sourceFile}; wrote empty generated content file`);
			return;
		}

		throw error;
	}
	const allDocs = buildDocsFromSource(sourceData);
	const generatedContent = buildGeneratedContent(sourceData, { allDocs });

	await fs.mkdir(path.dirname(outputFile), { recursive: true });
	await fs.writeFile(
		outputFile,
		JSON.stringify(
			{
				generatedAt: new Date().toISOString(),
				sourceGeneratedAt: sourceData.generatedAt,
				items: generatedContent
			},
			null,
			2
		)
	);

	console.log(`Generated content for ${Object.keys(generatedContent).length} docs pages`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
