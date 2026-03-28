# 模块说明文档

本文档说明 `generate-doc-content.mjs` 重构后的模块结构和职责划分。

## 重构概述

原脚本 `generate-doc-content.mjs` 是一个 123KB/3000 行的超大脚本，包含所有文档内容生成逻辑。重构后拆分为多个职责单一的小模块，提高可维护性和可读性。

## 目录结构

```
scripts/
├── generate-doc-content.mjs    # 主入口（重构后约 4KB）
├── modules/                     # 功能模块目录
│   ├── README.md               # 本说明文档
│   ├── text-utils.mjs          # 文本处理工具
│   ├── step-kind-utils.mjs     # 步骤类型推断
│   ├── section-translator.mjs  # 章节翻译逻辑
│   ├── metaphor-matcher.mjs    # 比喻匹配器
│   ├── step-generator.mjs      # 步骤内容生成
│   └── content-builder.mjs     # 内容组装器
└── templates/                   # 模板配置目录
    └── auto-overrides.mjs      # 自动覆盖配置
```

## 模块职责

### 1. text-utils.mjs - 文本处理工具

**职责：** 提供基础文本清洗、过滤和标准化功能

**导出函数：**
- `normalizeText(value)` - 标准化文本（移除不可见字符、多余空格和反引号）
- `isUsefulSentence(text)` - 判断句子是否有用
- `pickParagraphs(page, count)` - 从页面中挑选段落
- `pickHeadings(page, count)` - 从页面中挑选标题
- `pickToc(page, count)` - 从页面中挑选目录
- `pickCodeBlocks(page, count)` - 从页面中挑选代码块

**使用示例：**
```javascript
import { normalizeText, pickParagraphs } from './modules/text-utils.mjs';

const cleanText = normalizeText(rawText);
const paragraphs = pickParagraphs(page, 3);
```

---

### 2. step-kind-utils.mjs - 步骤类型推断工具

**职责：** 识别代码块的类型（命令、配置、提示词等）

**导出函数：**
- `inferStepKind(code)` - 推断步骤类型（返回 'code'|'structure'|'config'|'prompt'|'command'）
- `kindLabel(kind)` - 获取步骤类型的中文标签
- `kindAction(kind)` - 获取步骤类型的行为描述

**使用示例：**
```javascript
import { inferStepKind, kindLabel } from './modules/step-kind-utils.mjs';

const kind = inferStepKind(codeBlock);
const label = kindLabel(kind); // "命令" | "配置" | "提问示例" | "目录结构" | "代码片段"
```

---

### 3. section-translator.mjs - 章节翻译逻辑

**职责：** 将英文章节标题和内容翻译成中文解释，包含章节风格选择和比喻映射

**导出函数：**
- `chooseVariant(key, variants)` - 选择变体（基于哈希的确定性选择）
- `sectionStyle(title, variants)` - 章节风格选择器
- `stepStyle(title, kind, variants)` - 步骤风格选择器
- `buildStepBody(options)` - 构建步骤内容体
- `chineseName(doc)` - 获取中文名称
- `getDescription(page)` - 获取页面描述

**导出常量：**
- `sectionMetaphors` - 章节比喻映射表
- `slugNicknames` - 章节中文昵称映射表

**使用示例：**
```javascript
import { buildStepBody, sectionMetaphors } from './modules/section-translator.mjs';

const body = buildStepBody({ kind: 'command', pageTitle: 'Setup', sectionTitle: 'Install' });
const metaphor = sectionMetaphors['Getting started']; // "先把农具领进门，认门认路"
```

---

### 4. metaphor-matcher.mjs - 比喻匹配器

**职责：** 根据章节标题和内容匹配相应的中文解释模板，包含大量章节特定的翻译规则

**导出函数：**
- `summarizeSectionHints(block, pageTitle)` - 总结章节提示

**特点：**
- 包含大量章节特定规则匹配（如 subagents、plugins、hooks、MCP 等）
- 支持通用模式匹配（如 install、configure、verify 等）
- 支持内容特征匹配（如 token costs、teammates、permissions 等）

**使用示例：**
```javascript
import { summarizeSectionHints } from './modules/metaphor-matcher.mjs';

const hints = summarizeSectionHints(sectionBlock, 'Subagents');
```

---

### 5. step-generator.mjs - 步骤内容生成器

**职责：** 生成步骤内容，包括章节步骤和代码块步骤

**导出函数：**
- `pickSectionSteps(page, count)` - 挑选章节步骤
- `makeSteps(page, doc)` - 生成步骤列表

**使用示例：**
```javascript
import { pickSectionSteps } from './modules/step-generator.mjs';

const steps = pickSectionSteps(page, 12);
```

---

### 6. content-builder.mjs - 内容组装器

**职责：** 组装最终的内容结构，包括详细章节、插图、总结、解释和实践建议

**导出函数：**
- `pickSectionCodeBlocks(block, count)` - 从章节块中挑选代码块
- `makeDetailedSections(page, doc)` - 制作详细章节
- `makeIllustration(title, sectionLabel)` - 制作插图说明
- `makeSummary(doc, page)` - 制作总结
- `makeExplain(doc, page)` - 制作解释内容
- `makePractice(doc, page)` - 制作实践建议

**使用示例：**
```javascript
import { makeDetailedSections, makeIllustration } from './modules/content-builder.mjs';

const sections = makeDetailedSections(page, doc);
const illustration = makeIllustration('Permissions', 'Core concepts');
```

---

### 7. templates/auto-overrides.mjs - 自动覆盖配置

**职责：** 存储特定文档的自定义总结、解释和实践建议，用于覆盖默认生成的内容

**导出常量：**
- `autoOverrides` - 文档 slug 到自定义内容的映射

**结构：**
```javascript
{
  slug: {
    summary: ['总结 1', '总结 2'],
    explain: ['解释 1', '解释 2', '解释 3'],
    practice: ['实践 1', '实践 2', '实践 3']
  }
}
```

**使用示例：**
```javascript
import { autoOverrides } from './templates/auto-overrides.mjs';

const override = autoOverrides['permissions'];
if (override) {
  content.summary = override.summary;
}
```

---

## 模块依赖关系

```
generate-doc-content.mjs (主入口)
├── text-utils.mjs
├── step-kind-utils.mjs
├── section-translator.mjs
│   └── text-utils.mjs
├── metaphor-matcher.mjs
│   ├── text-utils.mjs
│   └── section-translator.mjs
├── step-generator.mjs
│   ├── text-utils.mjs
│   ├── step-kind-utils.mjs
│   ├── section-translator.mjs
│   └── content-builder.mjs
├── content-builder.mjs
│   ├── text-utils.mjs
│   ├── step-kind-utils.mjs
│   ├── section-translator.mjs
│   └── metaphor-matcher.mjs
└── templates/auto-overrides.mjs
```

---

## 重构收益

| 指标 | 重构前 | 重构后 | 改善 |
|------|--------|--------|------|
| 主脚本大小 | 123KB | ~4KB | 96%↓ |
| 主脚本行数 | ~3000 行 | ~150 行 | 95%↓ |
| 模块数量 | 1 | 7 | - |
| 平均模块大小 | 123KB | ~6KB | 95%↓ |
| 职责分离 | 无 | 清晰 | - |
| 可测试性 | 低 | 高 | - |
| 可维护性 | 低 | 高 | - |

---

## 使用方式

运行脚本（与重构前相同）：

```bash
npm run generate:docs
```

或：

```bash
node scripts/generate-doc-content.mjs
```

---

## 添加新模块

如需添加新功能，请遵循以下原则：

1. **单一职责** - 每个模块只做一件事
2. **清晰命名** - 模块名应反映其职责
3. **显式导出** - 所有公共函数都应明确导出
4. **添加注释** - 每个导出函数都应有 JSDoc 注释
5. **更新文档** - 在 README.md 中添加新模块说明

---

## 变更清单

### 新增文件
- `scripts/modules/README.md` - 模块说明文档
- `scripts/modules/text-utils.mjs` - 文本处理工具
- `scripts/modules/step-kind-utils.mjs` - 步骤类型推断
- `scripts/modules/section-translator.mjs` - 章节翻译逻辑
- `scripts/modules/metaphor-matcher.mjs` - 比喻匹配器
- `scripts/modules/step-generator.mjs` - 步骤内容生成
- `scripts/modules/content-builder.mjs` - 内容组装器
- `scripts/templates/auto-overrides.mjs` - 自动覆盖配置

### 修改文件
- `scripts/generate-doc-content.mjs` - 重构为主入口脚本（从 123KB 减至 4KB）

### 功能保持不变
- 所有原有功能均保持不变
- 输出格式与重构前完全一致
- package.json 脚本无需修改
