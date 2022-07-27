---
title: LaTeX 环境配置
date: 2022-07-27 12:27:43
excerpt: Windows 环境 VS Code + MiKTeX 配置
categories:
  - LaTeX
tags:
  - LaTeX
  - 排版
---

非著名鸽子来更新了（咕咕咕）

## 为什么选择MiKTeX？

> MiKTeX's integrated package manager installs missing components from the Internet, if required. This allows you to keep your TeX installation as minimal as possible (“Just enough TeX”).

即MiKTeX可以自动安装你需要的宏包，而不用像TeX Live那样上来就4.3 GB。

<details>
  <summary>插播</summary>
MiKTeX现在的图标是乌克兰国旗配色。。。说实话我非常反感把政治带进开源项目的行为。
</details>

## 安装MiKTeX

TUNA，请：[CTAN/MiKTeX | 清华大学开源软件镜像站](https://mirrors.tuna.tsinghua.edu.cn/CTAN/systems/win32/miktex/setup/windows-x64/)

选择`basic-miktex-xx.x-x64.exe`下载。截至本文发布，你应当选择`basic-miktex-22.7-x64.exe`

我想安装程序大家应该都会，在此不过多赘述。

## 配置MiKTeX源与更新宏包

在开始菜单中找到MiKTeX Console，在左侧选择“更新”

![MiKTeX Console](/img/tex-config/miktex-console.png)

此时，“检索源”是“<互联网上的随机存储库>”。强烈建议点击右侧的“更改”，切换到一个国内的源。

此后，点击“检查更新”：

![MiKTeX Update](/img/tex-config/update.png)

然后“立即更新”。

安装完成后的MiKTeX必须进行更新。同时，建议定期检查更新。

这时候的MiKTeX还没有安装CTeX等中文排版必备宏包，那么这些宏包怎么安装呢？[]()

## VS Code配置

习惯于TeXworks或TeXStudio的可跳过。。。

安装LaTeX Workshop插件。然后贴出我的`setting.json`：

<details>
  <summary>setting.json</summary>
```json
"latex-workshop.latex.autoBuild.run": "never", // 关闭 LaTeX Workshop 的自动编译
"latex-workshop.message.error.show": true,     // 显示警告与错误
"latex-workshop.message.warning.show": true,
"latex-workshop.latex.tools": [
    {
        "name": "xelatex",
        "command": "xelatex",
        "args": [
            "-synctex=1",
            "-interaction=nonstopmode",
            "-file-line-error",
            "%DOCFILE%"
        ]
    },
    {
        "name": "bibtex",
        "command": "bibtex",
        "args": [
            "%DOCFILE%"
        ]
    },
    {
        "name": "biber",
        "command": "biber",
        "args": [
            "%DOCFILE%"
        ]
    }
],
"latex-workshop.latex.recipes": [ // 工具链的配置，默认三套工具链
    {
        "name": "XeLaTeX",
        "tools": [
            "xelatex"
        ],
    },
    {
        "name": "xe->biber->xe->xe",
        "tools": [
            "xelatex",
            "biber",
            "xelatex",
            "xelatex"
        ]
    },
    {
        "name": "xe->bib->xe->xe",
        "tools": [
            "xelatex",
            "bibtex",
            "xelatex",
            "xelatex"
        ]
    }
],
"latex-workshop.latex.clean.fileTypes": [
    "*.aux",
    "*.bbl",
    "*.blg",
    "*.idx",
    "*.ind",
    "*.lof",
    "*.lot",
    "*.out",
    "*.toc",
    "*.acn",
    "*.acr",
    "*.alg",
    "*.glg",
    "*.glo",
    "*.gls",
    "*.ist",
    "*.fls",
    "*.log",
    "*.fdb_latexmk",
    "*.bcf",
    "*.run.xml",
    "*.synctex.gz"
],
```
</details>

LaTeX Workshop默认在VS Code内预览PDF。这里推荐SumatraPDF作为预览。闲话少说，上`setting.json`。**相关路径自行更改！**

<details>
  <summary>setting.json</summary>
```json
"latex-workshop.view.pdf.viewer": "external",
"latex-workshop.view.pdf.external.viewer.command": "D:/Softwares/SumatraPDF/SumatraPDF.exe",
"latex-workshop.view.pdf.external.synctex.command": "D:/Softwares/SumatraPDF/SumatraPDF.exe",
"latex-workshop.view.pdf.external.synctex.args": [
    "-forward-search",
    "%TEX%",
    "%LINE%",
    "-reuse-instance",
    "-inverse-search",
    "\"D:\\Softwares\\VS Code\\Code.exe\" \"D:\\Softwares\\VS Code\\resources\\app\\out\\cli.js\" --ms-enable-electron-run-as-node -r -g \"%f:%l\"",
    "%PDF%"
],
```
</details>

## 我的LaTeX模板

在这个模板里胡乱写点什么后编译，就可以安装缺失宏包（确信

```tex
% 基础文档类，基础宏包与页边距调整
\documentclass[a4paper]{ctexart}
\usepackage{graphicx, url, float}
\usepackage[left=3.18cm,right=3.18cm,top=2.54cm,bottom=2.54cm]{geometry}

% 调用 fontspec 宏包进行字体选择
\usepackage{fontspec}
\usepackage[colorlinks,linkcolor=red,anchorcolor=blue,citecolor=red,urlcolor=blue]{hyperref}

% % 使用 biblatex 与 GB/T 7714-2015 样式生成参考文献
% \usepackage[gbpub=false,style=gb7714-2015]{biblatex}
% \addbibresource{ref.bib}

% % 使 enumitem* 环境为行内排版
% \usepackage[inline]{enumitem}

% % 数学排版相关
% \usepackage{amssymb,amsmath}
% \renewcommand{\d}{\mathop{}\!\mathrm{d}}
% \newcommand{\e}{\mathrm{e}}
% \renewcommand{\i}{\mathrm{i}}
% \newcommand{\R}{\mathbb{R}}
% \newcommand{\C}{\mathbb{C}}
% \newcommand{\N}{\mathbb{N}}
% \newcommand{\Z}{\mathbb{Z}}
% \newcommand{\arsinh}{\operatorname{arsinh}}
% \newcommand{\arcosh}{\operatorname{arcosh}}


% % tikz 绘图
% \usepackage{tikz}


% % 算法与代码排版相关
% \usepackage{algorithm2e}
% \usepackage{listings}
% \lstset{
%     columns          = fixed,
%     numbers          = left,
%     frame            = none,
%     backgroundcolor  = \color[RGB]{244,244,244},
%     keywordstyle     = \color[RGB]{40,40,255},
%     numberstyle      = \footnotesize\tt,
%     commentstyle     = \it\color[RGB]{0,96,96},
%     showstringspaces = false,
%     language         = C++, % 默认编程语言
%     basicstyle       = \tt,
%     breaklines       = true
% }
% \renewcommand{\verb}{\lstinline[language=C++]} % 行内代码命令重定义

% 标题，作者与日期
\title{}
\author{}
\date{\today}

% 正文开始
\begin{document}
    % 生成标题、作者、日期
    \maketitle

    % % 摘要
    % \begin{abstract}

    % \end{abstract}

    % % 生成参考文献
    % \printbibliography[heading=bibliography,title=参考文献]
\end{document}
```

你也可以选择存为VS Code的代码片段。
