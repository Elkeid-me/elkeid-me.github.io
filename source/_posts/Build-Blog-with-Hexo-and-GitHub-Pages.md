---
title: Hexo与GitHub Pages搭建个人博客
date: 2022-05-29 16:00:00
excerpt: Hexo + GitHub Pages 搭建个人博客教程。本文针对 Windows 用户。
tags:
  - hexo
categories:
  - 杂项
---

## 前言

GitHub Pages已成为越来越多人建立个人博客的选择。本文介绍了基于Hexo搭建个人博客的方法。本文发布于2022年2月29日，并于2022年5月29日更新。

## 前置环境

首先安装[Node.js](https://nodejs.org/en/)与[Git](https://git-scm.com/)。

建议自备梯子，以便访问GitHub，同时也便于后续的配置。

## 安装Hexo

打开命令行窗口，输入：

```bash
npm install -g hexo-cli
```

即自动安装Hexo。

## 博客初始化

在**恰当的位置**新建一个文件夹。终端定位至该文件夹，输入：

```bash
hexo init
```

完成之后，文件夹内将多出`_config.yml`等文件。

## 配置

这里主要讲述`_config.yml`中的重要配置项。完整配置项参考[Configuration | Hexo](https://hexo.io/docs/configuration.html)。

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

稍等片刻，即可在`source/_post`文件夹下看见`<文章名>.md`文件。可以用VS Code或Typora等软件以Markdown语法编辑。

## 预览

在发布前，可以先预览自己的博客。终端输入：

```bash
hexo s
```

这时就可以访问[http://localhost:4000/](http://localhost:4000/)以预览博客。

## 发布到GitHub Pages

前置要求：你需要有一个GitHub账户，并且掌握基本的Git用法。

- “One-command deployment”发布法[^1]

  安装hexo-deployer-git：

  ```bash
  npm install hexo-deployer-git --save
  ```

  在`_config.yml`的`deploy`项加入配置：

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

  在`.github`文件夹中新建`workflows/pages.yml`，填入以下内容，这里假设你使用Node.js 16

  ```yaml
  name: Pages

  on:
    push:
      branches:
        - main  # default branch

  jobs:
    pages:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v2
        - name: Use Node.js 16.x
          uses: actions/setup-node@v2
          with:
            node-version: '16'
        - name: Cache NPM dependencies
          uses: actions/cache@v2
          with:
            path: node_modules
            key: ${{ runner.OS }}-npm-cache
            restore-keys: |
              ${{ runner.OS }}-npm-cache
        - name: Install Dependencies
          run: npm install
        - name: Build
          run: npm run build
        - name: Deploy
          uses: peaceiris/actions-gh-pages@v3
          with:
            github_token: ${{ secrets.GITHUB_TOKEN }}
            publish_dir: ./public
  ```

  push至github上相应repo。在相应repo的Setting->Pages->Source->Branch切换成`gh-pages`即可。如果没有，就等几分钟。

## 其他配置

可以配置主题、插件等。Hexo文档及相关主题、插件文档有详细描述。

[^1]: [GitHub Pages | Hexo](https://hexo.io/docs/github-pages#One-command-deployment)
