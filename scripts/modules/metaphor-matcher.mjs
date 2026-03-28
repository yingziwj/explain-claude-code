/**
 * metaphor-matcher.mjs - 比喻匹配器
 * 
 * 负责根据章节标题和内容匹配相应的中文解释模板
 * 包含大量章节特定的翻译规则
 */

import { normalizeText, pickParagraphs } from './text-utils.mjs';
import { sectionStyle } from './section-translator.mjs';

/**
 * 章节规则列表（按顺序匹配）
 */
const SECTION_RULES = [
	{ pattern: /built-in subagents/, handler: () => [
		'这一节先把系统自带的子代理认清楚：它们各自擅长什么活、会继承什么权限、什么时候会被 Claude 自动叫出来。',
		'看这段时别只盯名字，重点是分清哪类代理偏查资料、哪类能动手改、哪类只适合在计划阶段帮你摸底。'
	]},
	{ pattern: /quickstart.*subagent|subagent.*quickstart/, handler: () => [
		'这一节是手把手做第一个子代理，核心不是炫配置，而是先把入口、存放位置、权限和模型这几步走通。',
		'最稳的顺序就是先进 `/agents`，先做一个最简单、边界很清楚的子代理，跑通以后再往里加复杂能力。'
	]},
	{ pattern: /use the \/agents command/, handler: () => [
		'这一节讲 `/agents` 这个总入口。以后你想看现有代理、建新代理、改权限、删旧代理，基本都从这里进。',
		'如果不是为了批量自动化，优先用这个交互入口，比你自己手搓文件稳得多。'
	]},
	{ pattern: /choose the subagent scope/, handler: () => [
		'这一节讲子代理到底放哪儿。项目级放仓库里，适合团队共用；个人级放 `~/.claude/agents/`，适合你自己到处带着走。',
		'如果只是临时试一下，也可以用 `--agents` 这种会话级方式；但临时的东西不会长期留着，别把正式规则全压在这上面。'
	]},
	{ pattern: /write subagent files/, handler: () => [
		'这一节讲子代理文件怎么写，重点是 frontmatter 放什么、正文提示词怎么写、改完以后怎么让 Claude 重新认到它。',
		'别把子代理文件写成散文，名字、描述、工具、模型和正文职责要分得清清楚楚。'
	]},
	{ pattern: /choose a model/, handler: () => [
		'这一节讲子代理用什么模型。说白了，就是这类活到底该让快一点的工种来，还是让更能深想的工种来。',
		'如果这类子代理主要是查资料、扫目录、跑轻活，通常不用一上来就上最重的模型。'
	]},
	{ pattern: /control subagent capabilities/, handler: () => [
		'这一节讲怎么收放子代理的手脚，比如它能用哪些工具、能不能再叫别的代理、能不能挂 MCP、skills、memory 这些外接能力。',
		'这里的核心原则就是只给它完成这类活必须的能力，不要为了省事一口气全放开。'
	]},
	{ pattern: /define hooks for subagents/, handler: () => [
		'这一节讲怎么给子代理挂 hooks，也就是让它在某些动作前后自动做检查、校验或收尾。',
		'如果你想让子代理改文件后自动跑检查，或者在执行危险命令前先过一遍门禁，这一节就是干这个的。'
	]},
	{ pattern: /configure subagents/, handler: () => [
		'这里讲的是子代理那些开关该怎么拧。你主要看它放哪儿、认不认得出来、权限有没有给对。',
		'别一下子把所有花样都加上，先让最小那版跑通。'
	]},
	{ pattern: /work with subagents/, handler: () => [
		'这里是在讲平时怎么把子代理真正用起来，不是光把文件写完就算。',
		'要点就两件事：什么时候该叫它上，叫上来以后它负责哪一块。'
	]},
	{ pattern: /understand automatic delegation/, handler: () => [
		'这一节讲 Claude 什么时候会主动把活派给某个子代理。关键不只在你的提问，还在子代理描述写得够不够清楚。',
		'如果你希望某类子代理"该出手时就出手"，描述里就得把触发场景写明白，别只写一串空话。'
	]},
	{ pattern: /invoke subagents explicitly/, handler: () => [
		'这里讲的是你手动点名叫某个子代理干活。这样做最适合你心里已经清楚"这活就该它来"。',
		'手动点名的好处是稳，不会让 Claude 自己猜错工种。'
	]}
];

/**
 * 总结章节提示
 * @param {Object} block - 章节块
 * @param {string} pageTitle - 页面标题
 * @returns {string[]} 提示数组
 */
export function summarizeSectionHints(block, pageTitle = '') {
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
			paragraphs.push(
				sectionStyle(title, [
					`这一段不只是挂个标题，它是在说明"${title}"这一块到底负责什么。`,
					`这里主要是在交代"${title}"这一块会碰到哪些事。`,
					`别把这段只当成标题看，它其实是在给"${title}"划边界。`,
					`这段看着像个标题，其实是在说"${title}"管到哪儿。`
				])
			);
			return;
		}

		paragraphs.push(
			sectionStyle(title, [
				`这一块主要是在说"${title}"真到手上该怎么用，哪里最容易踩坑。`,
				`这里不是让你背"${title}"这个词，而是让你看它真干活时怎么使。`,
				`看到这里，就把"${title}"当成一件真要上手的活来看。`,
				`这一段主要是在把"${title}"讲实，不是只摆个标题给你看。`
			])
		);
	}

	// 章节特定规则匹配
	for (const rule of SECTION_RULES) {
		if (rule.pattern.test(heading)) {
			const result = rule.handler();
			if (result) {
				paragraphs.push(...result);
				return paragraphs.slice(0, 2);
			}
		}
	}

	// 通用模式匹配
	if (/^when /.test(heading)) {
		paragraphs.push(sectionStyle(title, [
			`${title} 到底什么时候值得上，这一段就是在算这笔账。`,
			`这一段主要是在帮你判断：${title} 这种东西到底值不值得现在就上。`,
			`这里不是催你全用上，而是在说 ${title} 什么时候用才划算。`
		]));
	} else if (/^compare /.test(heading)) {
		paragraphs.push(sectionStyle(title, [
			`像 ${title} 这种标题，通常就是怕你把两个看着差不多的东西混着用。`,
			`这一段是在拆开比较，免得你把差不多的两样东西用混。`,
			`这里就是把两条像样的路摆一块，让你别走岔。`
		]));
	} else if (/^choose /.test(heading)) {
		paragraphs.push(sectionStyle(title, [
			'这里是在帮你做选择题，不是只告诉你"有这个选项"。先看取舍，再决定怎么选。',
			'这段主要是让你挑，不是让你全要。',
			'看这段时就盯一个事：到底该选哪条更合适。'
		]));
	} else if (/^size /.test(heading)) {
		paragraphs.push(sectionStyle(title, [
			'这里讲的是"别切得太碎，也别一坨太大"。大小卡准了，分工和收尾才顺。',
			'这一段主要是在拿捏大小，太大太小都不好使。',
			'这里讲怎么把活分得刚刚好，不多不少。'
		]));
	} else if (/^wait /.test(heading)) {
		paragraphs.push(sectionStyle(title, [
			'这里是在提醒你先别急着往前冲。该等人的时候就等，别自己抢活。',
			'这段就是踩刹车用的，不是让你硬往前顶。',
			'看见这种标题，先记住一句：该等就等。'
		]));
	} else if (/^set up |^setup /.test(heading)) {
		paragraphs.push(sectionStyle(title, [
			'这里是上手准备活，通常会告诉你前提条件、落地点和最稳的起步顺序。',
			'这段就是开工前的准备清单，先把地基打好。',
			'看到这里，就当是在做开工前那套准备。'
		]));
	} else if (/^install |^update |^uninstall /.test(heading)) {
		paragraphs.push(sectionStyle(title, [
			'这里属于实操步骤，重点是照着顺序做，不要自己脑补省略中间步骤。',
			'这段就是手把手操作，照顺序来最稳。',
			'看到这儿别跳步，按它给的顺序往下走。'
		]));
	} else if (/^verify |^authenticate /.test(heading)) {
		paragraphs.push(sectionStyle(title, [
			'这里讲的是"别只装完就算了"，而是要确认它真能用、真认主、真跑通。',
			'这一段就是验收，看它到底有没有真的通。',
			'这里不只是看看热闹，是要确认它真活了。'
		]));
	} else if (/^configure |^enable |^disable /.test(heading)) {
		paragraphs.push(sectionStyle(title, [
			'这里讲怎么把某个开关拧对。重点不是概念，而是你该在哪儿改、改完怎么确认生效。',
			'这一段主要是在拧开关，地方和顺序都别搞错。',
			'看到这类标题，就当是在调一个具体开关。'
		]));
	} else if (/^how .* works$|^how .* start/.test(heading)) {
		paragraphs.push(sectionStyle(title, [
			'这里讲底层是怎么运转的。你把它看明白，后面遇到异常时就知道该往哪儿查。',
			'这一段是在讲它背后怎么转，不是立刻让你去按按钮。',
			'看懂这里，后面出怪事时你心里会更有底。'
		]));
	} else if (/^manage |^control /.test(heading)) {
		paragraphs.push(sectionStyle(title, [
			'这里讲的是收放和管理，不只是"能不能用"，而是"怎么管住、怎么不乱"。',
			'这段主要是在说平时怎么管，不是光教你怎么开。',
			'看到这类标题，就把它当成日常管摊子的规矩。'
		]));
	} else if (/^example |^examples /.test(heading)) {
		paragraphs.push(sectionStyle(title, [
			'这里是样板段。重点不是全文照抄，而是学它怎么把职责、步骤和边界写清楚。',
			'这一段主要是拿例子给你看路数，不是让你一字不差照搬。',
			'看到例子时，先学它的架子，再决定怎么照你自己情况改。'
		]));
	} else if (/reference|schema|fields|actions|syntax/.test(heading)) {
		paragraphs.push(sectionStyle(title, [
			'看到这里，就别靠猜了，字段、格式和写法都得按说明来。',
			'这一段就是给你查规矩的，像看说明书那样一项项对着来。',
			'这种内容最怕想当然，老老实实照它列的格式走最稳。'
		]));
	} else if (/troubleshoot|debug|issue/.test(heading)) {
		paragraphs.push(sectionStyle(title, [
			'这段就是排错时拿来照着查的，先一项项看清楚，再动手改。',
			'遇到这种内容，别急着大拆大改，先按它给的路子把问题缩小。',
			'这里讲的是怎么找毛病，先查明白哪一步出错，再决定怎么修。'
		]));
	} else if (/best practices|common patterns/.test(heading)) {
		paragraphs.push(sectionStyle(title, [
			'这里给的是老手常用套路。不是硬规矩，但照着做通常会少走很多弯路。',
			'这段算经验活，听劝通常能省事。',
			'看到这里，就当是前人踩完坑留下来的顺手做法。'
		]));
	} else {
		pushHintDrivenFallback();
	}

	// 内容特征匹配
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
