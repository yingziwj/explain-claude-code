/**
 * text-utils.mjs - 文本处理工具函数
 * 
 * 提供基础文本清洗、过滤和标准化功能
 */

/**
 * 标准化文本：移除不可见字符、多余空格和反引号
 * @param {any} value - 输入值
 * @returns {string} 标准化后的文本
 */
export function normalizeText(value) {
	return String(value ?? '')
		.replace(/[\u200B-\u200D\uFEFF]/g, '')
		.replace(/\s+/g, ' ')
		.replace(/`/g, '')
		.trim();
}

/**
 * 判断句子是否有用（过滤掉无意义的短句）
 * @param {string} text - 待判断的文本
 * @returns {boolean} 是否有用
 */
export function isUsefulSentence(text) {
	if (!text) return false;
	if (text.length < 18) return false;
	if (/^(copy|edit|run|open|click|learn more)/i.test(text)) return false;
	return true;
}

/**
 * 从页面中挑选段落
 * @param {Object} page - 页面对象
 * @param {number} count - 最大数量
 * @returns {string[]} 挑选的段落数组
 */
export function pickParagraphs(page, count) {
	return (page.paragraphs ?? []).map(normalizeText).filter(isUsefulSentence).slice(0, count);
}

/**
 * 从页面中挑选标题
 * @param {Object} page - 页面对象
 * @param {number} count - 最大数量
 * @returns {string[]} 挑选的标题数组
 */
export function pickHeadings(page, count) {
	return (page.headings ?? []).map(normalizeText).filter(Boolean).slice(0, count);
}

/**
 * 从页面中挑选目录
 * @param {Object} page - 页面对象
 * @param {number} count - 最大数量
 * @returns {string[]} 挑选的目录数组
 */
export function pickToc(page, count) {
	return (page.toc ?? []).map(normalizeText).filter(Boolean).slice(0, count);
}

/**
 * 从页面中挑选代码块
 * @param {Object} page - 页面对象
 * @param {number} count - 最大数量
 * @returns {string[]} 挑选的代码块数组
 */
export function pickCodeBlocks(page, count) {
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
