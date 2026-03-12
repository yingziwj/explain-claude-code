# explain-claude-code

把 Claude Code 官方 docs 做成通俗中文解释站，保留原导航结构和页面顺序，正文尽量写成普通人一眼能懂的话，同时保留关键命令、代码和步骤。

## 本地开发

```sh
npm install
npm run dev
```

构建生产版本：

```sh
npm run build
```

## 部署

推荐直接部署到 Cloudflare Pages：

1. 把这个仓库推到 GitHub。
2. 在 Cloudflare Pages 里新建项目并连接该仓库。
3. 构建命令填 `npm run build`。
4. 输出目录填 `dist`。
5. 默认即可拿到免费域名 `https://explain-claude-code.pages.dev`。

更完整的上线说明见：

- `CLOUDFLARE-PAGES.md`

## 自动同步官方 docs

仓库包含：

- `scripts/sync-docs.mjs`：抓取官方 docs 导航和正文快照，写入 `src/data/generated/source-docs.json`
- `scripts/generate-doc-content.mjs`：把抓到的官方正文快照自动转成本站使用的中文解释内容种子
- `.github/workflows/daily-sync.yml`：每天自动执行一次同步和内容再生成，并在有变化时提交回仓库

手动执行同步：

```sh
npm run refresh:docs
```

上线前检查：

```sh
npm run check:preflight
```

## 说明

- 当前站点已经有完整导航骨架、SEO 基础、Cloudflare Pages 站点配置和农民伯伯主题图标。
- `overview` 和 `quickstart` 目前是重点强化页，其它页面已统一接入“总结 + 通俗解释 + 关键步骤 + 插画”模板。
- 未来接入 Google AdSense 时，可直接把广告代码填进布局和页面里的预留位置。
