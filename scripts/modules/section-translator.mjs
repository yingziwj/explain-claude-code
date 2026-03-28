/**
 * section-translator.mjs - 章节翻译逻辑
 * 
 * 负责将英文章节标题和内容翻译成中文解释
 * 包含章节风格选择、提示总结等功能
 */

import { normalizeText } from './text-utils.mjs';

/**
 * 选择变体（基于哈希的确定性选择）
 * @param {string} key - 键值
 * @param {string[]} variants - 变体数组
 * @returns {string} 选中的变体
 */
export function chooseVariant(key, variants) {
	const source = String(key || '');
	const hash = Array.from(source).reduce((sum, char) => sum + char.charCodeAt(0), 0);
	return variants[hash % variants.length];
}

/**
 * 章节风格选择器
 * @param {string} title - 章节标题
 * @param {string[]} variants - 变体数组
 * @returns {string} 选中的风格
 */
export function sectionStyle(title, variants) {
	return chooseVariant(`section:${title}`, variants);
}

/**
 * 步骤风格选择器
 * @param {string} title - 步骤标题
 * @param {string} kind - 步骤类型
 * @param {string[]} variants - 变体数组
 * @returns {string} 选中的风格
 */
export function stepStyle(title, kind, variants) {
	return chooseVariant(`step:${kind}:${title}`, variants);
}

/**
 * 构建步骤内容体
 * @param {Object} options - 选项
 * @param {string} options.kind - 步骤类型
 * @param {string} options.pageTitle - 页面标题
 * @param {string} options.sectionTitle - 章节标题
 * @returns {string} 步骤内容体
 */
export function buildStepBody({ kind, pageTitle, sectionTitle }) {
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
			return stepStyle(sectionLabel, kind, [
				`这里不用敲命令，直接把下面这句话发给 Claude 就行，让它按"${sectionLabel}"这一段的意思去办。`,
				'这一步不用你自己动手配什么，把下面这句话交出去就行。',
				'最省事的做法，就是把下面这句原样说给 Claude。',
				'到这里其实就剩一句话，把下面这句发出去就行。'
			]);
		case 'command':
			return stepStyle(sectionLabel, kind, [
				'看到这里，别光点头，下面这条命令先跑起来再说。',
				'真到动手的时候了，下面这条直接敲一遍，看它回什么。',
				'这一段不是只让你理解意思，下面这条命令就是现在要跑的。',
				'先别急着往下翻，下面这条命令跑完，心里才有底。'
			]);
		case 'config':
			return stepStyle(sectionLabel, kind, [
				'光知道意思还不够，这里得把规矩落进配置里，下面这块照着填。',
				'这一段说完，最后还得写到配置里才算真的生效。',
				'这会儿轮到改配置了，字段名和关键字别自己乱换。',
				'想把这条规矩固定住，就把下面这块老老实实写进去。'
			]);
		case 'structure':
			return '这一段主要是认目录和文件摆放位置。先把地方放对，后面才不容易串。';
		default:
			return stepStyle(sectionLabel, kind, [
				`"${sectionLabel}"这一段里最要紧的原始写法在下面，先看它怎么落地。`,
				'下面这块是这一段最值钱的原文样板，先对着看一眼。',
				'先看下面这块原始片段，等会儿再回头看解释会顺得多。',
				'这一段要真抓重点，通常就抓下面这块原文。'
			]);
	}
}

/**
 * 章节比喻映射表
 */
export const sectionMetaphors = {
	'Getting started': '先把农具领进门，认门认路',
	'Core concepts': '先把干活门道摸清楚',
	'Platforms and integrations': '看看这帮工能在哪些工棚里接活',
	'Build with Claude Code': '给帮工添家伙、分工、自动化',
	Deployment: '把这套工具搬到不同云上去用',
	Administration: '立规矩、管权限、管成本',
	Configuration: '拧旋钮、定挡位、收权限',
	Reference: '查表、查口令、查细节'
};

/**
 * 章节中文昵称映射表
 */
export const slugNicknames = {
	permissions: '权限',
	sandboxing: '沙箱',
	authentication: '身份认证',
	'interactive-mode': '交互模式',
	'plugin-marketplaces': '插件市场',
	'fast-mode': '快速模式'
};

/**
 * 获取中文名称
 * @param {Object} doc - 文档对象
 * @returns {string} 中文名称
 */
export function chineseName(doc) {
	return slugNicknames[doc.slug] ?? doc.title;
}

/**
 * 获取页面描述
 * @param {Object} page - 页面对象
 * @returns {string} 描述文本
 */
export function getDescription(page) {
	return normalizeText(page.metaDescription ?? '');
}
