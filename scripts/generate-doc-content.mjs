/**
 * generate-doc-content.mjs - 文档内容生成器（重构版）
 * 
 * 主入口脚本，负责协调各模块生成中文文档内容
 * 原脚本 123KB/3000 行，已拆分为多个职责单一的模块
 * 
 * @module generate-doc-content
 */

import fs from 'node:fs/promises';
import path from 'node:path';

// 导入模块
import { normalizeText, pickParagraphs, pickHeadings, pickToc, pickCodeBlocks } from './modules/text-utils.mjs';
import { inferStepKind, kindLabel, kindAction } from './modules/step-kind-utils.mjs';
import { 
	buildStepBody, 
	sectionStyle, 
	stepStyle, 
	sectionMetaphors, 
	slugNicknames, 
	getDescription, 
	chineseName 
} from './modules/section-translator.mjs';
import { summarizeSectionHints } from './modules/metaphor-matcher.mjs';
import { pickSectionSteps, makeSteps } from './modules/step-generator.mjs';
import { 
	pickSectionCodeBlocks, 
	makeDetailedSections, 
	makeIllustration, 
	makeSummary, 
	makeExplain, 
	makePractice 
} from './modules/content-builder.mjs';
import { autoOverrides } from './templates/auto-overrides.mjs';

// 文件路径配置
const sourceFile = path.resolve('src/data/generated/source-docs.json');
const outputFile = path.resolve('src/data/generated/generated-doc-content.json');

/**
 * 构建生成内容
 * @param {Object} sourceData - 源数据
 * @param {Object} navigationData - 导航数据
 * @returns {Object} 生成的内容对象
 */
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

/**
 * 从源数据构建文档列表
 * @param {Object} sourceData - 源数据
 * @returns {Array} 文档数组
 */
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

/**
 * 主函数
 */
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

// 执行主函数
main().catch((error) => {
	console.error(error);
	process.exit(1);
});
