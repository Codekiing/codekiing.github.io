# Codekiing — 作品与文字

面向 GitHub Pages 的静态个人网站，包括首页、关于我、项目列表、自动生成的项目详情、博客列表和 Markdown 文章页面。项目文案来自公开的 JobPilot README；Fork 仓库有明确标注。没有虚构个人履历；博客包含三篇明确标记的布局示例。

## 本地预览

需要 Node.js 22 或更新版本、Python 3。

```sh
npm ci
npm run dev
```

打开 http://127.0.0.1:4173 。修改内容后执行 `npm run build`，刷新浏览器。

## 内容管理

日常编辑集中在 `content/`，修改后运行 `npm run build` 并刷新预览。`dist/` 是自动生成结果，请勿直接修改。

```text
content/
├── site.json                 # 全站资料与首页专属文案
├── about/
│   └── index.md              # 个人简介及完整介绍
├── projects/
│   ├── index.json            # 项目列表页的标题和介绍
│   ├── jobpilot.md           # 一个 Markdown 文件对应一个项目
│   └── explorations.json     # 开源探索 / Fork 列表
└── blogs/
    ├── index.json            # 博客列表页的标题和介绍
    └── *.md                  # 一篇 Markdown 对应一篇文章
```

### 首页和全站资料

编辑 `content/site.json`：`name` 是姓名，`github` 是个人 GitHub 链接，`url` 是网站正式地址。`home` 管理首页介绍短句、分区标题；字符串中的 `\n` 表示换行。

首页自动读取个人简介、所有 `featured: true` 的已发布项目和最新三篇博客，不用重复填写内容。

### 关于我

编辑 `content/about/index.md`：`title` 为介绍标题，`description` 为摘要。首页显示这些摘要信息；Markdown 正文显示在 `/about/` 完整介绍页。

### 新增项目

在 `content/projects/` 下新建 `my-project.md`：

```text
---
title: 我的项目
eyebrow: 项目类别
description: 这个项目解决什么问题。
tags: Python, AI
url: https://github.com/Codekiing/my-project
featured: true
order: 2
draft: false
---

## 项目介绍

在这里写背景、功能、使用方法，并添加图片或链接。
```

- 文件名决定详情地址，例如 `/projects/my-project/`，改名会改变链接。
- `featured: true` 显示在首页精选项目中；其他已发布项目仍显示在项目列表。
- `order` 是排序数字，越小越靠前；未填写按 0 处理。
- `draft: true` 隐藏项目，不生成详情页。
- `url` 可省略，填写后显示项目外链按钮。
- 可选 `workflow: 步骤一, 步骤二, 步骤三`，在项目卡片上显示流程。
- Fork 项目在 `content/projects/explorations.json` 的数组中添加，保留 `source` 标明来源。

### 写博客

在 `content/blogs/` 下新建 `my-first-project.md`：

```text
---
title: 从一个想法到一个项目
date: 2026-09-23
description: 这篇文章的简短介绍。
tags: 项目, Python
draft: false
---

在这里写正文。
```

博客按日期倒序排列，文件名决定 `/blog/my-first-project/` 地址。`draft: true` 的文章不会生成公开页面。博客网址继续使用 `/blog/`，与内容目录 `blogs` 的命名无关。

所有 Markdown 顶部元信息使用 `key: value` 格式，无需引号；也支持 `key: |` 加两个空格缩进的多行文本，不支持其他嵌套 YAML。标签和流程使用英文逗号分隔。正文支持标题、列表、代码块、表格、图片及链接。图片放在 `public/images/`，正文引用 `/images/文件名.png`。不要把私密材料放入 `public/`。

## 发布到 GitHub Pages

1. 在 Codekiing 账号下创建公开仓库 `codekiing.github.io`。
2. 将本目录源文件（包括隐藏的 `.github` 目录和 `package-lock.json`，不包括 `node_modules`、`dist`）推送到 `main` 分支。
3. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
4. 如首次构建早于 Pages 配置，在 **Actions → Publish GitHub Pages → Run workflow** 重新运行。
5. 成功后访问 https://codekiing.github.io 。后续推送代码或文章将自动更新。

部署工作流仅上传生成的 `dist/`，不会发布文章草稿和源文件目录中的其他内容。注意：公开仓库中的草稿源码仍然公开可见，请勿提交私密内容。

## 设计

参考用户提供的小红书个人网站设计笔记，使用居中的个人名片、两侧介绍、柔和的无衬线中文分区标题和留白布局。中央名片使用 Codekiing 的公开 GitHub 头像。JobPilot 封面是流程示意，不是产品截图。

支持深浅色切换（本地保存偏好）、轻量滚动入场和悬停反馈；遵循系统减少动态效果设置。不启用 JavaScript 时仍可阅读和跳转全部内容。中英文统一使用本地托管的霞鹜文楷（LXGW WenKai），字体按字符分片加载；代码保留等宽字体。授权文件位于 `public/fonts/wenkai/`。无服务端、数据库、跟踪脚本或运行时 API 依赖。

参考来源、查找结果和设计取舍见 `DESIGN.md`。

全站顶部固定显示「首页 / 项目作品 / 博客文章 / 关于我」，并高亮当前栏目。内页显示固定的返回入口和面包屑路径；项目详情返回项目列表，博客文章返回博客列表。移动端直接展示所有栏目，无需展开菜单。

## 示例文章

`content/blogs/example-*.md` 是三篇布局演示文章。`sample: true` 会在列表和正文显示示例标记。替换为自己的内容后可删除该字段；不需要示例时可以删除文件，或将 `draft` 改为 `true`，然后重新构建。

### About 时间线

`content/about/index.md` 正文中的 `## News` 是重大工作时间线，使用普通 Markdown 列表。按日期从新到旧排列，每条写日期、事件和你的主要贡献，可附项目或文章链接。当前条目与日期均为布局示例；替换为真实经历后，可以删除示例说明及条目前的 `Example:`。它显示在 About 详情页，首页仍只展示简介。

### Research Journey

编辑 `content/about/index.md` 顶部的 `journey` 字段，用英文逗号分隔阶段，顺序即显示顺序。路线显示在 About 简介与 News 之间；桌面横排，手机竖排。删除或留空该字段即可隐藏整个路线。

About 右上角照片由 `content/about/index.md` 的 `photo` 字段指定，原图放在 `public/images/about-photo.jpg`；修改路径可更换照片，删除字段可隐藏照片。

About 的 `description: |` 支持多行：每行开头缩进两个空格，空一行表示另起一段；段内换行会显示为换行。这些段落显示在 About Introduction；首页优先使用 `summary`。

### 首页摘要与 About 长文

在 `content/about/index.md` 中，`summary` 是首页短介绍，`description` 是 About 页 Introduction；Research Motivation、Looking Ahead 和 News 在下方 Markdown 正文中修改。首页未填写 `summary` 时会使用 `description`。
