/**
 * step-generator.mjs - 步骤内容生成器
 * 
 * 负责生成步骤内容，包括章节步骤和代码块步骤
 */

import { normalizeText, pickCodeBlocks, pickToc, pickHeadings } from './text-utils.mjs';
import { inferStepKind } from './step-kind-utils.mjs';
import { buildStepBody } from './section-translator.mjs';
import { pickSectionCodeBlocks } from './content-builder.mjs';

/**
 * 挑选章节步骤
 * @param {Object} page - 页面对象
 * @param {number} count - 最大数量
 * @returns {Array} 步骤数组
 */
export function pickSectionSteps(page, count) {
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

/**
 * 生成步骤列表
 * @param {Object} page - 页面对象
 * @param {Object} doc - 文档对象
 * @returns {Array|undefined} 步骤数组
 */
export function makeSteps(page, doc) {
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
