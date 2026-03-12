# 🛠️ explain-claude-code.pages.dev 技术栈

**最后更新:** 2026-03-12  
**项目地址:** https://github.com/yingziwj/explain-claude-code  
**网站地址:** https://explain-claude-code.pages.dev

---

## 📋 技术栈总览

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **前端框架** | Astro | 4.16.18 | 静态站点生成 |
| **CSS 框架** | Tailwind CSS | 3.4.17 | 样式工具类 |
| **集成** | @astrojs/tailwind | 5.1.3 | Astro + Tailwind 集成 |
| **SEO** | @astrojs/sitemap | 3.1.6 | 自动生成站点地图 |
| **HTML 解析** | Cheerio | 1.2.0 | 抓取和解析官方文档 |
| **托管平台** | Cloudflare Pages | - | 全球 CDN 部署 |
| **CI/CD** | GitHub Actions | - | 自动化同步和部署 |

---

## 🎨 前端技术栈

### 1. Astro (v4.16.18)
**官方文档:** https://astro.build

**为什么选择 Astro:**
- 🚀 **零 JavaScript 运行时** — 默认输出纯 HTML/CSS，极致性能
- 📦 **组件驱动** — 支持 React、Vue、Svelte 等多框架组件
- 🎯 **内容优先** — 内置 Markdown 支持，适合文档站点
- 🔧 **灵活部署** — 支持静态站点、SSR、边缘函数

**项目中的应用:**
```astro
---
// 示例：DocContentPage.astro
import Layout from '../layouts/Layout.astro';
import { docContent } from '../data/doc-content';
---

<Layout title={doc.title}>
  <article>
    {doc.sections.map((section) => (
      <Section title={section.title}>
        {section.paragraphs.map((p) => <p>{p}</p>)}
      </Section>
    ))}
  </article>
</Layout>
```

### 2. Tailwind CSS (v3.4.17)
**官方文档:** https://tailwindcss.com

**为什么选择 Tailwind:**
- ⚡ **快速开发** — 工具类优先，无需写自定义 CSS
- 📱 **响应式** — 内置断点系统
- 🎨 **可定制** — 通过配置文件自定义主题
- 🗜️ **小体积** — 生产环境自动 Purge 未使用样式

**项目中的应用:**
```html
<!-- 示例：卡片组件 -->
<article class="card rounded-[32px] p-8 shadow-card">
  <h2 class="font-display text-2xl font-semibold">标题</h2>
  <p class="mt-4 text-lg leading-8">内容...</p>
</article>
```

### 3. Astro + Tailwind 集成
**包:** `@astrojs/tailwind` (v5.1.3)

**配置:**
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
});
```

---

## 🔧 构建和部署工具

### 1. Cloudflare Pages
**官方文档:** https://pages.cloudflare.com

**为什么选择 Cloudflare Pages:**
- 🌍 **全球 CDN** — 275+ 数据中心，自动就近访问
- ⚡ **极速部署** — Git 推送后自动构建和部署
- 🔒 **免费 HTTPS** — 自动 SSL 证书
- 📊 **内置分析** — 流量、带宽、请求统计
- 💰 **免费额度高** — 每月 500 次构建，无限带宽

**部署配置:**
```yaml
# Cloudflare Pages 设置
构建命令：npm run build
输出目录：dist
环境变量：
  - NODE_VERSION: 20
```

**自定义配置:**
```bash
# public/_headers - 自定义 HTTP 响应头
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
```

```bash
# public/_redirects - 重定向规则
/old-page /new-page 301
/blog/* /blog/index.html 200
```

### 2. Wrangler
**包:** `wrangler.jsonc`

**用途:** Cloudflare 本地开发和部署工具

**配置:**
```jsonc
{
  "name": "explain-claude-code",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist"
}
```

---

## 🤖 自动化工具

### 1. GitHub Actions
**工作流:** `.github/workflows/daily-sync.yml`

**功能:** 每日自动同步官方文档

**配置:**
```yaml
name: Daily Docs Sync
on:
  schedule:
    - cron: '0 3 * * *'  # 每天 UTC 3:00
  workflow_dispatch:  # 支持手动触发

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run sync:docs
      - run: npm run generate:docs
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: '🤖 Auto-sync official docs'
```

### 2. 自定义脚本

#### sync-docs.mjs
**功能:** 抓取官方文档导航和正文

**技术:**
- Node.js (ES Modules)
- Cheerio (HTML 解析)
- Fetch API (网络请求)

**流程:**
1. 抓取官方文档站点地图
2. 解析每个页面的导航结构
3. 提取正文内容
4. 保存到 `src/data/generated/source-docs.json`

#### generate-doc-content.mjs
**功能:** 生成结构化文档内容

**输出:**
- `generated-doc-content.json` — 结构化内容数据
- 包含：标题、段落、代码示例、插图

#### preflight-check.mjs
**功能:** 部署前检查

**检查项:**
- ✅ 所有页面都有 frontmatter
- ✅ 没有损坏的链接
- ✅ 图片资源存在
- ✅ SEO 元数据完整

#### live-check.mjs
**功能:** 实时检查

**用途:**
- 开发时自动检查内容错误
- 实时验证链接有效性

---

## 📦 依赖管理

### 核心依赖
```json
{
  "dependencies": {
    "@astrojs/sitemap": "3.1.6",
    "@astrojs/tailwind": "^5.1.3",
    "astro": "^4.16.18",
    "cheerio": "^1.2.0",
    "tailwindcss": "^3.4.17"
  }
}
```

### 开发依赖
- Node.js v20+
- npm / pnpm / yarn

---

## 🗂️ 项目结构

```
explain-claude-code/
├── .github/
│   └── workflows/
│       └── daily-sync.yml          # 每日自动同步工作流
├── public/
│   ├── _headers                    # 自定义 HTTP 头
│   ├── _redirects                  # 重定向规则
│   └── social-card.svg             # 社交分享卡片
├── scripts/
│   ├── sync-docs.mjs               # 文档同步脚本
│   ├── generate-doc-content.mjs    # 内容生成脚本
│   ├── preflight-check.mjs         # 部署前检查
│   └── live-check.mjs              # 实时检查
├── src/
│   ├── components/
│   │   ├── AdSlot.astro            # 广告位组件
│   │   ├── DocContentPage.astro    # 内容页面模板
│   │   ├── DocPage.astro           # 文档页面
│   │   ├── Sidebar.astro           # 导航侧边栏
│   │   └── ThemeToggle.astro       # 主题切换
│   ├── data/
│   │   ├── generated/
│   │   │   ├── generated-doc-content.json  # 生成的内容
│   │   │   └── source-docs.json            # 官方源数据
│   │   ├── doc-content.ts          # 内容数据结构
│   │   └── navigation.ts           # 导航配置
│   ├── layouts/
│   │   └── Layout.astro            # 主布局模板
│   ├── pages/
│   │   ├── docs/en/
│   │   │   ├── [...slug].astro     # 动态路由
│   │   │   ├── overview.astro      # 概览页
│   │   │   └── quickstart.astro    # 快速开始
│   │   ├── ads.txt.ts              # AdSense ads.txt
│   │   ├── advertising.astro       # 广告说明页
│   │   ├── index.astro             # 首页
│   │   └── privacy.astro           # 隐私政策
│   └── styles/
│       └── global.css              # 全局样式
├── .env.example                    # 环境变量示例
├── astro.config.mjs                # Astro 配置
├── package.json                    # 依赖管理
├── tailwind.config.mjs             # Tailwind 配置
├── tsconfig.json                   # TypeScript 配置
└── wrangler.jsonc                  # Cloudflare Wrangler 配置
```

---

## 🔐 安全和优化

### HTTP 安全头
```headers
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

### SEO 优化
- ✅ 自动生成站点地图 (`sitemap-index.xml`)
- ✅ 语义化 HTML 结构
- ✅ Meta 标签完整（title、description、OG）
- ✅ 结构化数据（JSON-LD）
- ✅ 响应式设计

### 性能优化
- ✅ 零 JavaScript 运行时（默认）
- ✅ 图片自动优化（Astro Image）
- ✅ CSS 自动 Purge（Tailwind）
- ✅ 全球 CDN 分发（Cloudflare）
- ✅ 自动 HTTPS/HTTP2

---

## 📊 性能指标

### Lighthouse 分数（目标）
- Performance: 95+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

### Core Web Vitals（目标）
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

---

## 🎯 技术选型理由

### 为什么用 Astro 而不是 Next.js/Nuxt?
1. **零 JS 运行时** — 文档站不需要复杂交互，Astro 输出纯 HTML
2. **内容优先** — Astro 内置 Markdown 支持，Next.js 需要额外配置
3. **更简单** — 学习曲线低，开发效率高
4. **更轻量** — 构建产物小，加载快

### 为什么用 Tailwind 而不是传统 CSS?
1. **开发速度快** — 工具类优先，无需想类名
2. **一致性好** — 设计系统内置在配置里
3. **文件更小** — 生产环境自动 Purge
4. **响应式简单** — 前缀搞定响应式（`md:`, `lg:`）

### 为什么用 Cloudflare Pages 而不是 Vercel/Netlify?
1. **免费额度高** — 无限带宽，500 次构建/月
2. **全球 CDN** — 275+ 数据中心
3. **速度快** — 构建和部署都很快
4. **集成好** — 和 Cloudflare 生态无缝集成

### 为什么自动化同步官方文档?
1. **保持更新** — 官方文档经常更新，手动同步容易遗漏
2. **减少错误** — 自动化减少人为错误
3. **节省时间** — 每天自动执行，无需手动操作
4. **版本追踪** — Git 记录每次同步，方便回滚

---

## 🚀 开发和部署命令

### 本地开发
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 预览生产构建
npm run preview
```

### 构建和部署
```bash
# 生产构建
npm run build

# 同步官方文档
npm run sync:docs

# 生成结构化内容
npm run generate:docs

# 刷新文档（同步 + 生成）
npm run refresh:docs

# 部署前检查
npm run check:preflight

# 实时检查
npm run check:live
```

### Git 工作流
```bash
# 提交更改
git add -A
git commit -m "📝 更新内容"
git push origin main

# Cloudflare Pages 自动检测并部署
```

---

## 📈 扩展能力

### 支持的集成
- ✅ Google AdSense（已准备）
- ✅ Google Analytics（可通过 Astro 集成）
- ✅ Discord/Slack 通知（GitHub Actions）
- ✅ 自定义域名（Cloudflare Pages）
- ✅ 边缘函数（Cloudflare Workers）

### 未来可能的技术升级
- 🔄 Astro 5.x（当稳定后升级）
- 🔄 React 组件（如需要复杂交互）
- 🔄 搜索功能（Algolia/Meilisearch）
- 🔄 多语言支持（i18n）
- 🔄 暗色模式（已预留）

---

## 🔗 相关资源

### 官方文档
- [Astro Docs](https://docs.astro.build)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)
- [GitHub Actions Docs](https://docs.github.com/actions)

### 学习资源
- [Astro Crash Course](https://www.freecodecamp.org/news/astro-crash-course)
- [Tailwind CSS in 100 Seconds](https://www.youtube.com/watch?v=mr15Xzb1Ook)
- [Cloudflare Pages Tutorial](https://www.youtube.com/watch?v=2sD2L4yK120)

---

**技术栈版本会随时间更新，请查看 `package.json` 获取最新版本信息。**
