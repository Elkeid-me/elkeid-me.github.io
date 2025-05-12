---
title: LaTeX 模板文档
date: 2025-05-11 15:38:00
excerpt: 只是使用文档。
categories: 排版
tags:
  - TeX
  - LaTeX
---

:::warning
目前，本模板尚未发布稳定版本。
:::

## 特性

- 尽可能模仿 2025 年的毕业论文模板；
- 改了一些字体；
- 提供最小的功能，换句话说 `amsmath` 等包需要用户自己 `\usepackage`；
- 主要满足作者本人的需求。

## 环境要求

本模板要求 Windows 系统，因为调用了 Windows 自带的中易仿宋和楷体。

推荐的 LaTeX 发行版为 TeX Live 2025，它应当附带所有必须的宏包。如果您认为 TeX Live 的体积太大、安装太慢，有以下方案可供选择：

1. （未经测试）使用 MiKTeX 发行版，它会在缺失宏包时自动安装。
2. （作者本人的方案）使用 TinyTeX 发行版，这是一个精简的 TeX Live，缺失宏包时需要手动安装。对于本模板，您可以使用以下命令安装所需的最少宏包：
   ```bash
   tlmgr install ctex chinese-jfm fancyhdr enumitem caption tocloft footmisc perpage tabularray biblatex biblatex-gb7714-2015 xstring biber --repository https://mirrors.pku.edu.cn/ctan/systems/texlive/tlnet
   ```

要求使用 LuaLaTeX 编译，因为我们使用的是 LuaLaTeX，并且懒得适配 XeLaTeX。

假设您的文档为 `thesis.tex`，我们推荐的编译流程为：

```bash
lualatex thesis
biber thesis
lualatex thesis
lualatex thesis
```

以上流程将生成完整的文档。但如果您不关注目录、交叉引用和参考文献，可以仅使用以下流程：

```bash
lualatex thesis
```

我们期望在未来使用 `llmk` 等工具自动化构建流程。

## 安装

从 [Release](https://github.com/Elkeid-me/thesis-template/releases) 下载最新版本。如果您是**全新安装**，那么请下载 `.7z` 压缩包。自 0.3.0 起，它包含：

- 字体（`./fonts` 文件夹）。请安装这些字体，具体而言：
   - 对于 Windows 10，选择所有字体，右键，`为所有用户安装`
   - 对于 Windows 11，选择所有字体，右键，`显示更多选项 > 为所有用户安装`
- 北京大学校徽（`PKU-Logo.pdf`）
- 文档类本身（`pkuthesis.cls`）
- 示例文档《高超声速涡轮喷气发动机研究》（`example.tex`、`example.pdf`）
- 最小示例（`thesis.tex`），可以作为您论文的起点。

如果您要**升级模板**，请下载 `Source code (zip)`，获取其中的 `pkuthesis.cls`。此外，请仔细阅读更新日志。

## 使用

在导言区，你可以看见：

```latex
\newcommand{\titleCn}{中文标题}
\newcommand{\titleEn}{英文标题}
\newcommand{\studentName}{作者}
\newcommand{\studentID}{学号}
\newcommand{\schoolName}{学院}
\newcommand{\majorIn}{专业}
\newcommand{\tutorName}{导师}

\newcommand{\abstractCn}{中文摘要}
\newcommand{\keywordsCn}{中文关键词}
\newcommand{\abstractEn}{英文摘要}
\newcommand{\keywordsEn}{英文关键词}
```

它们的语义是十分清晰的。我们知道用 `\newcommand` 而不是更现代化的接口定义这些东西非常池沼，但能用就行（x

此外，你可以看到：

```latex
\newcommand{\preTitleCn}{}
\newcommand{\preTitleEn}{}
```

这两个命令用于在**封面**的**中文标题**和**英文标题**之前插入命令或内容。例如，如果您觉得封面的标题太大，想要改小，可以使用：

```latex
\newcommand{\preTitleCn}{\zihao{2}}
\newcommand{\preTitleEn}{\zihao{3}}
```

即将中文标题缩小为二号字，英文标题缩小为三号字。

我们提供了一个表格环境 `hqtblr`，实现了三线表。您可以查看 `example.tex` 中的示例。为什么叫 `hqtblr`？因为作者在对着论文哈气。

对于《毕业论文导师评阅表》，本模板应当能自动填充其中的部分字段。但其他的字段建议手动修改 `pkuthesis.cls`。

本模板有对 `markdown` 的实验性支持，但我们不对其功能的完整性和正确性做任何保证。

## 常见问题

1. 为啥它编译这么慢？

   - 首先，我们使用的是 LuaLaTeX，它本身就很慢；
   - 其次，我们使用了自定义的字体，而不是默认字体。调用字体是很慢的，特别是第一次，需要刷新字体缓存。
   - 最后，封面是用 `tabularray` 宏包画的。这是一个现代化的 LaTeX 表格/矩阵宏包，有着强大的功能和易用的用户接口，唯一的缺点是慢。

## 声明

1. 本模板非北京大学官方制作。
2. 本模板处于极早期开发阶段，功能可能不全。
3. 本模板可能出现各种格式错误，由此造成的后果我们概不负责。
4. 你可以以任何方式使用本模板的**代码部分**，包括二次修改/销售，但出现问题别来找我。
5. 模板使用的北京大学标志与中文校名组合（`PKU-Logo.pdf`）来自[北京大学标识管理办公室](https://vim.pku.edu.cn/)。
6. 本模板使用的开源字体遵循各自的开源许可，它们是：
   - Inter
   - JetBrains Mono
   - Nimbus Roman No. 9 L
   - 思源宋体
   - 思源黑体

   此外，本模板调用了 Windows 系统中的楷体和中易仿宋。
