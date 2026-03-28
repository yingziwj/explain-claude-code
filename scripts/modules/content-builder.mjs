/**
 * content-builder.mjs - 内容组装器
 * 
 * 负责组装最终的内容结构，包括详细章节、插图等
 */

import { normalizeText, pickHeadings, pickToc, pickParagraphs } from './text-utils.mjs';
import { inferStepKind } from './step-kind-utils.mjs';
import { buildStepBody, sectionMetaphors, slugNicknames, getDescription, chineseName } from './section-translator.mjs';
import { summarizeSectionHints } from './metaphor-matcher.mjs';
import { pickSectionSteps } from './step-generator.mjs';

/**
 * 从章节块中挑选代码块
 * @param {Object} block - 章节块
 * @param {number} count - 最大数量
 * @returns {string[]} 代码块数组
 */
export function pickSectionCodeBlocks(block, count) {
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

/**
 * 制作详细章节
 * @param {Object} page - 页面对象
 * @param {Object} doc - 文档对象
 * @returns {Array} 章节数组
 */
export function makeDetailedSections(page, doc) {
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

/**
 * 制作插图说明
 * @param {string} title - 标题
 * @param {string} sectionLabel - 章节标签
 * @returns {Object} 插图对象
 */
export function makeIllustration(title, sectionLabel) {
	return {
		title: '一眼看懂这一页',
		lines: [title, '   |', '   v', `这是 ${sectionLabel} 里的一摊要紧活`, '   |', '   v', '先弄懂，再下手'],
		caption: '先把这页到底在讲什么看明白，再去碰具体命令和配置，最不容易绕晕。'
	};
}

/**
 * 制作总结
 * @param {Object} doc - 文档对象
 * @param {Object} page - 页面对象
 * @returns {string[]} 总结数组
 */
export function makeSummary(doc, page) {
	const meta = getDescription(page);
	const intro = pickParagraphs(page, 2);
	if (meta) {
		return [
			`这页主要讲 ${chineseName(doc)}：${meta}`,
			`你可以把它当成"${doc.section}"这块里专门管这一摊事的说明书。`
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

/**
 * 制作解释内容
 * @param {Object} doc - 文档对象
 * @param {Object} page - 页面对象
 * @returns {string[]} 解释数组
 */
export function makeExplain(doc, page) {
	const headings = pickHeadings(page, 3);
	const toc = pickToc(page, 4);
	const meta = getDescription(page);
	const paragraph = pickParagraphs(page, 1)[0];
	const structure = toc.length ? toc.join('、') : headings.join('、');
	const headingText = structure ? `原文这页大多会按 ${structure} 这些环节往下讲。` : '';
	const metaphor = sectionMetaphors[doc.section] ?? '把这摊活讲明白';

	return [
		`你可以把"${chineseName(doc)}"理解成 ${doc.section} 这一栏里的一把专门工具。这页不是让你背书，而是教你什么时候该把这把工具拿出来。`,
		headingText || `这页的重点不是空讲概念，而是让你先明白它到底替你省哪种事。放在这整个文档站里，它更像是在教你怎么 ${metaphor}。`,
		paragraph
			? `翻成人话，大概就是：${paragraph}`
			: meta
				? `翻成人话，大概就是：${meta}`
				: '看这类页面时，最稳的办法就是先弄清楚它解决什么问题，再决定要不要现在就接进你的项目。'
	].filter(Boolean);
}

/**
 * 制作实践建议
 * @param {Object} doc - 文档对象
 * @param {Object} page - 页面对象
 * @returns {string[]} 实践建议数组
 */
export function makePractice(doc, page) {
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
		base.push(`第三，这页属于"${doc.section}"这一类，最好边做边验，不要攒到最后才一起看结果。`);
	}

	return base;
}
