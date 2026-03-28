/**
 * step-kind-utils.mjs - 步骤类型推断工具
 * 
 * 负责识别代码块的类型（命令、配置、提示词等）
 */

/**
 * 推断步骤类型
 * @param {string} code - 代码内容
 * @returns {'code'|'structure'|'config'|'prompt'|'command'} 步骤类型
 */
export function inferStepKind(code) {
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

/**
 * 获取步骤类型的中文标签
 * @param {string} kind - 步骤类型
 * @returns {string} 中文标签
 */
export function kindLabel(kind) {
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

/**
 * 获取步骤类型的行为描述
 * @param {string} kind - 步骤类型
 * @returns {string} 行为描述
 */
export function kindAction(kind) {
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
