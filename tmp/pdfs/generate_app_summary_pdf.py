from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.pdfmetrics import registerFont
from reportlab.pdfgen import canvas


OUTPUT = Path("/Volumes/Extreme SSD/openclaw/webBot/explain-claude-code/output/pdf/explain-claude-code-app-summary-zh-cn.pdf")


def wrap_text(c, text, font_name, font_size, max_width):
    words = list(text)
    lines = []
    current = ""
    for ch in words:
        trial = current + ch
        if c.stringWidth(trial, font_name, font_size) <= max_width:
            current = trial
            continue
        if current:
            lines.append(current)
        current = ch
    if current:
        lines.append(current)
    return lines


def draw_paragraph(c, text, x, y, width, font_name="STSong-Light", font_size=10.2, leading=14, color=HexColor("#334155")):
    c.setFillColor(color)
    c.setFont(font_name, font_size)
    lines = wrap_text(c, text, font_name, font_size, width)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def draw_bullets(c, items, x, y, width, bullet_indent=10, font_name="STSong-Light", font_size=10, leading=13):
    c.setFillColor(HexColor("#334155"))
    c.setFont(font_name, font_size)
    text_width = width - bullet_indent - 4
    for item in items:
        lines = wrap_text(c, item, font_name, font_size, text_width)
        if not lines:
            continue
        c.drawString(x, y, u"\u2022")
        c.drawString(x + bullet_indent, y, lines[0])
        y -= leading
        for line in lines[1:]:
            c.drawString(x + bullet_indent, y, line)
            y -= leading
        y -= 1
    return y


def section_title(c, title, x, y):
    c.setFillColor(HexColor("#0f172a"))
    c.setFont("STSong-Light", 12.5)
    c.drawString(x, y, title)
    c.setStrokeColor(HexColor("#cbd5e1"))
    c.setLineWidth(0.8)
    c.line(x, y - 4, x + 248, y - 4)
    return y - 16


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    registerFont(UnicodeCIDFont("STSong-Light"))

    c = canvas.Canvas(str(OUTPUT), pagesize=A4)
    width, height = A4

    left = 42
    right = 42
    top = height - 40
    col_gap = 28
    col_width = (width - left - right - col_gap) / 2

    c.setTitle("explain-claude-code 应用摘要")
    c.setAuthor("OpenAI Codex")

    c.setFillColor(HexColor("#0f172a"))
    c.setFont("STSong-Light", 20)
    c.drawString(left, top, "explain-claude-code 应用摘要")

    c.setFillColor(HexColor("#475569"))
    c.setFont("STSong-Light", 9)
    c.drawString(left, top - 16, "基于仓库证据生成 | 语言：简体中文 | 版式：单页摘要")

    y_left = top - 42
    y_right = top - 42

    y_left = section_title(c, "是什么", left, y_left)
    y_left = draw_paragraph(
        c,
        "这是一个用 Astro 构建的第三方中文解释站，目标是把 Claude Code 官方 docs 按原导航结构改写成更容易照着做的人话版。",
        left,
        y_left,
        col_width,
    )
    y_left -= 4
    y_left = draw_paragraph(
        c,
        "仓库同时包含官方文档抓取、内容重生成、站点构建、Cloudflare Pages 部署和广告位预留相关代码。",
        left,
        y_left,
        col_width,
    )

    y_left -= 10
    y_left = section_title(c, "给谁用", left, y_left)
    y_left = draw_paragraph(
        c,
        "主要面向想使用 Claude Code、但不想直接啃英文官方文档的中文开发者与小团队；首页和指南页也明显照顾新手上手、排错和团队试点场景。",
        left,
        y_left,
        col_width,
    )

    y_left -= 10
    y_left = section_title(c, "做什么", left, y_left)
    features = [
        "保留官方 docs 的栏目、导航结构和页面顺序，中文化页面标题与摘要。",
        "把官方页面映射成中文解释内容，并为页面补充总结、步骤、插图和实操提示。",
        "提供原创指南页，覆盖新手路线、常见报错、权限边界、团队落地等主题。",
        "支持同步官方文档快照并生成站内数据文件，用于后续页面渲染。",
        "内置基础 SEO 配置：canonical、OG、Twitter 卡片、站点地图和 robots。",
        "预留可开关的 AdSense 广告位；未配置环境变量时显示占位说明。",
    ]
    y_left = draw_bullets(c, features, left, y_left, col_width)

    y_right = section_title(c, "怎么工作", left + col_width + col_gap, y_right)
    arch = [
        "数据源：`scripts/sync-docs.mjs` 抓取 `code.claude.com/docs/en/*`，解析导航和正文，写入 `src/data/generated/source-docs.json`。",
        "内容生成：`scripts/generate-doc-content.mjs` 读取抓取结果，输出 `src/data/generated/generated-doc-content.json`。",
        "站内数据层：`src/data/navigation.ts`、`src/data/doc-content.ts` 和 `src/data/site-data.ts` 组合导航、文档元数据和中文内容。",
        "页面渲染：`src/pages/docs/en/[...slug].astro` 通过 `DocShell` 与 `BaseLayout` 生成静态文档页；首页与 guides 页面单独维护。",
        "展示与发布：Astro + Tailwind 构建静态站点，`astro.config.mjs` 配置站点地址与 sitemap；README 和 Cloudflare 文档说明部署到 Cloudflare Pages。",
    ]
    y_right = draw_bullets(c, arch, left + col_width + col_gap, y_right, col_width)

    y_right -= 8
    y_right = section_title(c, "如何运行", left + col_width + col_gap, y_right)
    run_steps = [
        "安装依赖：`npm install`",
        "本地开发：`npm run dev`",
        "生产构建：`npm run build`",
        "如需重抓官方文档：`npm run refresh:docs`",
        "部署前检查：`npm run check:preflight`；线上检查：`npm run check:live`",
    ]
    y_right = draw_bullets(c, run_steps, left + col_width + col_gap, y_right, col_width)

    y_right -= 8
    y_right = section_title(c, "未找到的信息", left + col_width + col_gap, y_right)
    not_found = [
        "仓库中未找到明确的商业模式、付费方案或用户规模说明。",
        "仓库中未找到后端数据库、自建 API 服务或持久化存储实现证据。",
        "README 提到 GitHub Actions 每日同步，但当前工作区未见 `.github/workflows/daily-sync.yml` 文件。",
    ]
    y_right = draw_bullets(c, not_found, left + col_width + col_gap, y_right, col_width)

    footer_y = 38
    c.setStrokeColor(HexColor("#e2e8f0"))
    c.line(left, footer_y + 10, width - right, footer_y + 10)
    c.setFillColor(HexColor("#64748b"))
    c.setFont("STSong-Light", 8.6)
    c.drawString(left, footer_y, "证据来源：README、package.json、astro.config.mjs、src/data/*、src/components/*、src/pages/docs/en/*、scripts/*。")

    c.showPage()
    c.save()


if __name__ == "__main__":
    main()
