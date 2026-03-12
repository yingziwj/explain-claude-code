# Cloudflare Pages deployment

这个项目可以直接部署到 Cloudflare Pages，按官方 Pages Git 集成方式即可。

## 推荐配置

- Framework preset: `Astro`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`
- Production branch: 你的主分支，例如 `main`

## 建站步骤

1. 把仓库推到 GitHub。
2. 登录 Cloudflare Dashboard。
3. 进入 `Workers & Pages`。
4. 选择 `Create application` -> `Pages` -> `Connect to Git`。
5. 选中这个仓库。
6. 填入上面的构建配置并保存部署。
7. 首次部署完成后，默认域名会是：
   `https://explain-claude-code.pages.dev`

## 上线后建议立刻检查

1. 打开首页和 3 到 5 个文档页，确认 CSS、图标、社交图都正常。
2. 检查 `https://explain-claude-code.pages.dev/robots.txt` 和 `https://explain-claude-code.pages.dev/sitemap-index.xml`。
3. 检查 `/docs` 和 `/docs/en` 是否都自动跳到 `/docs/en/overview`。
4. 在 Cloudflare Pages 项目里确认 Git 自动部署已开启。
5. 如果要接自定义域名，在 Pages 的 `Custom domains` 里绑定域名，并等证书签发完成。

## 广告和 SEO

- 页面底部、首页和侧边栏已经接入可开关的 Google AdSense 组件。
- 如果还没拿到广告位 ID，页面只会显示“广告位预留”提示，不会实际请求广告。
- 要在 Cloudflare Pages 里启用广告，请添加这些环境变量：
  - `PUBLIC_ADSENSE_CLIENT`
  - `PUBLIC_ADSENSE_PUBLISHER_ID`
  - `PUBLIC_ADSENSE_SIDEBAR_SLOT`
  - `PUBLIC_ADSENSE_HOME_SLOT`
  - `PUBLIC_ADSENSE_HOME_ASIDE_SLOT`
  - `PUBLIC_ADSENSE_CONTENT_SLOT`
- 部署后可检查 `/ads.txt`、`/privacy`、`/advertising` 是否正常。
- `astro.config.mjs` 已配置站点地址，Astro 会生成 sitemap。
- `public/_headers` 已加基础安全头和静态资源缓存规则。

## 每日同步

如果要让官方 docs 更新后自动覆盖本站内容：

1. 确认 GitHub Actions 已启用。
2. 使用仓库里的 `.github/workflows/daily-sync.yml`。
3. 该任务会执行：
   - `npm run refresh:docs`
   - 自动提交新的 docs 快照和生成内容

## 本地上线前检查

上线前建议依次运行：

```sh
npm run refresh:docs
npm run build
npm run check:preflight
```

如果站点已经在线，部署完成后再跑一次：

```sh
npm run check:live
```

如果你用了自定义域名，也可以这样检查：

```sh
SITE_URL=https://你的域名 npm run check:live
```
