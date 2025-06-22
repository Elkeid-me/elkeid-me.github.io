---
title: 搭建静态博客
date: 2022-12-24 19:32:00
updated: 2024-11-24 00:15:00
excerpt: Hexo + GitHub Pages 搭建个人博客教程。
tags:
  - Hexo
  - GitHub
categories: 杂项
---

## 前言

静态博客是静态网站~~废话~~，是将作者的博文编译到 HTML、JS、CSS 静态文件。用户通过浏览器访问托管服务器，直接获得已编译的静态资源。

相比于带有后端的博客，静态博客最大的优点是可以做到免费[^1]。

你需要这些东西：

- 一个托管平台。如 [GitHub Pages](https://pages.github.com/)、[Gitee Pages](https://gitee.com/help/articles/4136)。当然，大佬可以选择自己租服务器。

- 一个静态博客框架，用来把你的博文编译到 HTML、JS、CSS。如 Hexo、Hugo 或 Jekyll。大佬也可以手搓 HTML。

- 学习 Markdown。目前所有的静态博客框架都支持 Markdown 语法，并做了不同程度的扩展。当然，这些框架也支持其他的标记语言。

本教程使用 GitHub Pages 作为托管平台，这意味着你还需要学会 [Git](https://git-scm.com/)。使用 Hexo 作为静态博客框架。

无论什么时候，请记住一句话：RTFM（Read The ~~Fucking~~ Fantastic Manual）。

## 安装Hexo

Hexo 需要 [Node.js](https://nodejs.org/en/)。请首先安装 Node.js。

打开命令行窗口，输入：

```bash
npm install -g hexo-cli
```

即安装 Hexo 的命令行接口。

## 博客初始化

在**恰当的位置**新建一个目录。在该目录下输入命令行：

```bash
hexo init
```

完成之后，文件夹内将多出`_config.yml`等文件。

这里有个坑：`hexo init` 在默认情况下，是将 GitHub 上的 [hexo-starter](https://github.com/hexojs/hexo-starter) 仓库克隆到本地[^1]。然而，由于 GitHub 对塞里斯进行了无耻的网络封锁，如果无法连接到 GitHub，Hexo 会转而 Copying data instead。你会看到类似的终端输出：

```bash
INFO  Cloning hexo-starter https://github.com/hexojs/hexo-starter.git
fatal: unable to access 'https://github.com/hexojs/hexo-starter.git/': OpenSSL SSL_read: Connection was reset, errno 10054
WARN  git clone failed. Copying data instead
```

但是，从 hexo-starter 仓库克隆，和 “Copying data”，两者得到的文件是不一样的。请尽可能保证得到的是前者。如果你得到了后者，可以手动将 hexo-starter 仓库的 package.json 文件复制到本地。

## 配置

这里主要讲述 `_config.yml` 中的重要配置项。完整配置项参考 [Configuration | Hexo](https://hexo.io/docs/configuration.html)。

| 参数        | 描述                                              |
| ----------- | ------------------------------------------------- |
| title       | 网站标题                                          |
| subtitle    | 网站副标题                                        |
| description | 网站描述                                          |
| keywords    | 网站的关键词                                      |
| author      | 您的名字                                          |
| language    | 网站语言。对于简体中文用户设置为`zh-CN`           |
| timezone    | 网站时区。对于中国大陆地区可以使用`Asia/Shanghai` |
| url         | 网址，设为`https://<你的GitHub用户名>.github.io`  |

## 写作

终端定位至博客文件夹，输入：

```bash
hexo new post <文章名>
```

稍等片刻，即可在 `source/_post` 文件夹下看见 `<文章名>.md` 文件。可以用 VS Code 或 Typora 等软件以 Markdown 语法编辑。

## 预览

在发布前，可以先预览自己的博客。终端输入：

```bash
hexo s
```

这时就可以访问 [http://localhost:4000/](http://localhost:4000/) 以预览博客。

## 发布到 GitHub Pages

假定你有一个 GitHub 账户，并且掌握基本的 Git 用法。

- “One-command deployment”发布法[^2]

  安装hexo-deployer-git：

  ```bash
  npm install hexo-deployer-git --save
  ```

  在 `_config.yml` 的 `deploy` 项加入配置：

  ```yaml
  deploy:
    type: git
    repo: https://github.com/<username>/<project>
    # 这里指你个人网站的版本库地址。上述示例是https方式，但目前建议使用ssh方式：
    # repo: git@github.com:<username>/<project>
    branch: gh-pages
  ```

  此后，终端输入：

  ```bash
  hexo clean
  hexo deploy
  ```
- 普通发布法：

  在 `.github` 文件夹中新建 `workflows/pages.yml`，填入以下内容，这里假设你使用 Node.js 20。

  ```yaml
  name: Pages

  on:
    push:
      branches:
        - main

  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - name: Use Node.js 20
          uses: actions/setup-node@v4
          with:
            node-version: "20"
        - name: Cache NPM dependencies
          uses: actions/cache@v4
          with:
            path: node_modules
            key: ${{ runner.OS }}-npm-cache
            restore-keys: |
              ${{ runner.OS }}-npm-cache
        - name: Install Dependencies
          run: npm install
        - name: Build
          run: npm run build
        - name: Upload Pages artifact
          uses: actions/upload-pages-artifact@v3
          with:
            path: ./public
    deploy:
      needs: build
      permissions:
        pages: write
        id-token: write
      environment:
        name: github-pages
        url: ${{ steps.deployment.outputs.page_url }}
      runs-on: ubuntu-latest
      steps:
        - name: Deploy to GitHub Pages
          id: deployment
          uses: actions/deploy-pages@v4
  ```

  push 至 GitHub 上相应仓库。在相应仓库选择 Setting->Pages->Source，切换成 Github Actions 即可。

## 其他配置

可以配置主题、插件等。Hexo 文档及相关主题、插件文档有详细描述。

GitHub Pages 的连接速度是大问题。必要时可以使用 WebP、HEIC、AVIF 等现代图片格式。

[^1]: Oracle Cloud 可以白嫖 ARM 服务器。
[^2]: [Commands | Hexo](https://hexo.io/docs/commands.html)
[^3]: [GitHub Pages | Hexo](https://hexo.io/docs/github-pages#One-command-deployment)
