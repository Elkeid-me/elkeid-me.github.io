---
title: "`pkuthesis`：信科 2025 年本科生毕业论文 LaTeX 文档类"
date: 2025-05-26 00:00:00
excerpt: 只是使用文档。
categories: 排版
tags:
  - TeX
  - LaTeX
  - pkuthesis
hide: true
---

本文为 1.x 版本文档。关于 1.0.0 版本之前的 `pkuthesis` 文档，请见 [LaTeX 模板文档](/posts/pkuthesis-doc-pre-1.0)。

## 特性

- 尽可能模仿 2025 年信科毕业论文 Word 模板；
- 改了一些字体；
- 提供最小的功能；
- 易于修改，作者不希望文档类充斥着 Plain TeX 或 LaTeX2e 古神语；
- 主要满足作者本人的需求。

## 环境要求

请使用 UTF-8 编码撰写文档，TeX Studio 用户请注意这一点。

`pkuthesis` 已在以下在线环境测试：

- [Overleaf](https://www.overleaf.com/)
  - Overleaf 免费账号至多上传 50 MB 的 `.zip` 文件。目前有两个办法：
    1. 创建项目后，再上传 `fonts` 文件夹；
    2. 使用[北大 LaTeX](https://latex.pku.edu.cn)。
  - Overleaf 免费账号编译时间为 20 秒。仍然建议使用北大 LaTeX，或考虑以下两个在线平台：

- [TeXPage](https://www.texpage.com/)
  - 没有 50 MB 上传大小限制；
  - 免费账号编译时间 1 分钟。
- [Cloud LaTeX](https://cloudlatex.io/)
  - 没有 50 MB 上传大小限制；
  - 免费账号编译时间 2 分钟。
  - 而且这玩意有 VS Code 扩展（

### 操作系统

对于本地环境，`pkuthesis` 已在 Windows 和 Linux 操作系统测试。

### LaTeX 发行版

推荐的 LaTeX 发行版为 TeX Live 2025，它应当附带所有必须的宏包。如果您认为 TeX Live 的体积太大、安装太慢，有以下方案可供选择：

1. （未经测试）使用 MiKTeX 发行版，它会在缺失宏包时自动安装。
2. （作者本人的方案）使用 TinyTeX 发行版，这是一个精简的 TeX Live，缺失宏包时需要手动安装。您可以使用以下命令安装所需的最少宏包：
   ```bash
   tlmgr install ctex chinese-jfm fancyhdr enumitem caption tocloft footmisc bigfoot tabularray biblatex biblatex-gb7714-2015 xstring biber
   ```

   在安装宏包之前，您可能想切换到 CTAN 北京大学镜像：
   ```bash
   tlmgr option repository https://mirrors.pku.edu.cn/ctan/systems/texlive/tlnet
   ```
### TeX 引擎

`pkuthesis` 目前支持 XeLaTeX 和 LuaLaTeX。对 upLaTeX 的测试仍在进行中。

## 使用 `pkuthesis`

### 目录结构

从 [Release](https://github.com/Elkeid-me/pkuthesis/releases) 下载最新版本。截至本文撰稿时，最新版本是 1.1.0。

下载，并解压（或上传 `.zip` 至 Overleaf）后，应当包含如下文件（夹）：

```text
│  ctex-fontset-pkuthesis.def
│  example.bib
│  example.tex
│  example.pdf
│  PKU-Logo.pdf
│  pkuthesis.cls
│  thesis.bib
│  thesis.tex
└─ fonts
       -HYFangSongS.ttf
       -HYKaiTiS.ttf
       -Inter-Bold.otf
       ......
```
解释如下：

- `fonts` 文件夹为 `pkuthesis` 使用的字体；
- `PKU-Logo.pdf` 为北京大学校徽与中文校名；
- `pkuthesis.cls` 为文档类本身；
- `ctex-fontset-pkuthesis.def` 为字体配置文件；
- `example.tex`、`example.bib`、`example.pdf` 为示例文档《高超声速涡轮喷气发动机研究》；
- `thesis.tex`、`thesis.bib` 为最小示例，可以作为您论文的起点。

### 用户接口

使用 `\documentclass` 引入文档类。开关 `centersec` 可以将一级标题由阿拉伯数字编号、左对齐，改为中文编号、居中对齐。

::: code-group

```latex [无 centersec]
\documentclass{pkuthesis}

效果：

1. Section 1

  Lorem ipsum dolor sit amet, consectetur adipiscing
elit.Ut finibus lacus ut nunc porta euismod. Sed sit
amet ante vel enim tempus hendrerit eget eget erat.
Suspendisse tempor at purus vel tristique. Integer
urna turpis, auctor eget metus vel, rhoncus vehicula.
```

```latex [有 centersec]
\documentclass[centersec]{pkuthesis}

效果：

                 第一章 Section 1

  Lorem ipsum dolor sit amet, consectetur adipiscing
elit.Ut finibus lacus ut nunc porta euismod. Sed sit
amet ante vel enim tempus hendrerit eget eget erat.
Suspendisse tempor at purus vel tristique. Integer
urna turpis, auctor eget metus vel, rhoncus vehicula.
```

:::


命令 `\titleCn` 和 `\titleEn` 用于设置中、英文标题。示例：

```latex
\titleCn{高超声速涡轮喷气发动机研究}
\titleEn{Research on Hypersonic Turbojet}
```

`pkuthesis` 对中、英文标题使用一号字，与教务模板保持一致。如果您认为字号太大，可以使用 `\titleCnFormat` 和 `\titleEnFormat` 命令修改。示例：

```latex
\titleCnFormat{\zihao{2}}
\titleEnFormat{\zihao{3}}
```

即中文标题使用二号字，英文标题使用三号字。

命令 `\author` 和 `\studentID` 设置作者和学号。`\school` 和 `\major` 设置学院和专业。

命令 `\mentor` 设置论文导师相关的信息。它有三个必须的参数，即导师姓名、单位和职称。示例：

```latex
\mentor{长崎素世}{月之森女子学园}{贝斯手}
```

此外，`\mentor` 还有一个可选参数，用于调整《毕业论文导师评阅表》中导师姓名的排版。假设您有两位导师：

```latex
\mentor[{长崎素世 \\ 椎名立希}]{长崎素世、椎名立希}{{月之森女子学园 \\ 花咲川女子学园}}{{贝斯手 \\ 鼓手}}
```

这样，封面中的导师姓名不换行，而《毕业论文导师评阅表》中的导师姓名将分两行展示。

命令 `\abstractCn`、`\keywordsCn`、`\abstractEn` 和 `\keywordsEn` 分别设置中文摘要、中文关键词、英文摘要和英文关键词。

命令 `\grade` 设置论文成绩。

命令 `\mentorComments` 填写导师评语，自动以楷体排版。

命令 `\appendix` 和 `\acknowledgments` 用于开始《附录》和《致谢》。**它们不是在导言区使用，而是在正文使用**。请参考 `example.tex` 或 `thesis.tex`。

`pkuthesis` 提供了一个表格环境 `hqtblr`，实现了三线表。您可以查看 `example.tex` 中的示例。

> 为什么叫 `hqtblr`？因为作者在对着论文哈气。

`pkuthesis` 有对 `markdown` 的实验性支持，但我们不对其功能的完整性和正确性做任何保证。

`pkuthesis` 在用户载入 `hyperref` 后会自动设置 PDF 元数据中的标题、作者和关键词。如果这导致您的论文无法编译，可以删除。

`pkuthesis` 假定用户使用 `biblatex` 包（且以 `biber` 为后端）生成参考文献表。我们不对使用 BibTeX 时功能的完整性和正确性做任何保证。

### 编译

`pkuthesis` 支持的 TeX 引擎见[前文所述](#tex-引擎)。再次强调，**对 upLaTeX 的测试仍在进行中**，不保证功能的完整性和正确性。

您可以使用 XeLaTeX 以获得更高的编译速度；或使用 LuaLaTeX 以获得（可能）更好的兼容性，因为 `pkuthesis` 最初是为 LuaLaTeX 开发的。

#### Overleaf

左上角 `Menu > Settings > Compiler` 选 XeLaTeX 或 LuaLaTeX。

#### 本地环境

根据 TeX 引擎的不同，使用下面的命令编译完整的文档（假设您的文档为 `thesis.tex`）：

::: code-group

```bash [XeLaTeX]
xelatex thesis
biber thesis
xelatex thesis
xelatex thesis
```

```bash [LuaLaTeX]
lualatex thesis
biber thesis
lualatex thesis
lualatex thesis
```

```bash [upLaTeX]
uplatex thesis
biber thesis
uplatex thesis
uplatex thesis
dvipdfmx thesis
```

:::

而如果您不关注交叉引用、目录和参考文献表，仅关注正文部分，那也可以只运行一遍 TeX 引擎以节省时间：

::: code-group

```bash [XeLaTeX]
xelatex thesis
```

```bash [LuaLaTeX]
lualatex thesis
```

```bash [upLaTeX]
uplatex thesis
dvipdfmx thesis
```

:::

## 功能建议或报告错误

首选在 [Issues · Elkeid-me/pkuthesis](https://github.com/Elkeid-me/pkuthesis/issues) 打开新的议题。如果您有作者的 QQ/微信，也可以直接联系作者。

## 声明

1. `pkuthesis` 非北京大学官方制作，是作者个人为 2025 年信科本科毕设准备的。
2. `pkuthesis` 使用的北京大学标志与中文校名组合（`PKU-Logo.pdf`）来自[北京大学标识管理办公室](https://vim.pku.edu.cn/)。
3. `pkuthesis` 使用了以下开源字体：
   - Adobe 发布的思源黑体和思源宋体。
   - STI Pub 发布的 STIX Two。
   - Rasmus Andersson 发布的 Inter。
   - JetBrains 发布的 JetBrains Mono。
   - FONTDASU 发布的 Shippori Mincho。`pkuthesis` 使用其子集模仿中易仿宋的阿拉伯数字部分，用于排版学号。

   此外，`pkuthesis` 使用了闭源字体汉仪楷体和汉仪仿宋。使用 `pkuthesis` 意味着您同意[《汉仪字库个人非商用须知》](https://www.hanyi.com.cn/faq-doc-1)。

   上述字体的文件名前添加 `-`，以避免 LuaLaTeX 字体缓存冲突。

## 更新日志

- 1.1.0
  1. 升级思源黑体到 2.005；
  2. 修改封面标题的间距；
  3. 导师评价现以 `\mentorComments` 定义，而不是 `\turtorComments`。显然，这是作者在 1.0.0 版本中的疏漏；

     原有的 `\turtorComments` 仍然保留。
  4. 更改字体配置。
- 1.0.0
  1. 整理了代码；
  2. 支持 Linux，支持 XeLaTeX，这意味着支持 Overleaf；
  3. 以 STIX Two 替换 Nimbus Roman No. 9 L，以汉仪楷体替换华文楷体，以汉仪仿宋替换中易仿宋的中文部分，以 Shippori Mincho 替换中易仿宋的西文部分；
  4. 微调了页边距；
  5. 对 upLaTeX 的支持正在进行中。
- 1.0.0-rc4
  1. 微调目录及图表 `caption` 的字号和行距；
  2. 导师现以 `\mentor` 而不是 `\tutor` 定义；
  3. 修复《学位论文使用授权说明》没有缩进的 Bug。
- 1.0.0-rc3
  1. 使用 LaTeX3 重写了用户接口；
  2. 为 `hyperref` 包添加钩子。用户使用 `hyperref` 后，将会自动设置 PDF 元数据中的标题、作者和关键词。
  3. 《毕业论文导师评阅表》的“导师评语”之上不再有空行。
  4. 参考文献文件 `*.bib` 的基本名称遵循 llmk 的最佳实践。即原本是 `thesis.tex` 和 `ref.bib`，现在是 `thesis.tex` 和 `thesis.bib`。
  5. 添加了 llmk magic comment。现在可以用 `llmk <TeX 文件名>` 编译文档。
- 1.0.0-rc2
  1. 修复了“目录”二字中间没有 `\ccwd` 间距的 Bug。
- 1.0.0-rc1
  1. `\paragraph` 后会新起一行，而不是该行后直接排版正文内容。即 `ctexart` 文档类的 `sub3section` 开关；
  2. 引入 `centersec` 开关，当用户以 `\documentclass[centersec]{pkuthesis}` 使用文档类时，`\section` 将会居中，且编号以类似“第一章”的格式显示。
- 0.4.3
  1. 修复了作者打错字体名的 Bug（应为 JetBrains Mono NL，不是 JetBrains Mono NF）。
- 0.4.2
  1. 调整《毕业论文导师评阅表》中导师签字和日期的缩进和间距。
- 0.4.1
  1. 调整《毕业论文导师评阅表》中导师签字和日期的间距。
- 0.4.0
  1. 添加《毕业论文导师评阅表》；
  2. 对 `markdown` 包的实验性支持，不对其功能的完整性和正确性做任何保证。
- 0.3.0
  1. 添加摘要、关键词、附录和致谢；
  2. 参考文献的样式改用 Hook 解决；文档里奇怪的
     ```latex
     \defbibheading{bibliography}[\refname]{
        \section*{#1}
        \addcontentsline{toc}{section}{#1}
        \vspace*{16.5pt}
     }
     ```
     可以删掉了；
  3. 三线表环境 `hqtblr`。
- 0.2.1
  1. 微调行距；
  2. 恢复列表环境的 `topsep`；
  3. 目录后添加 `\clearpage`，防止页码从目录的第二页开始。
- 0.2.0
  1. 脚注在每一页从 1 重新编号；
  2. 脚注使用带圈数字，代价是每页至多 9 个脚注。

  添加了对 `footmisc` 和 `bigfoot` 包的依赖，TinyTeX 用户可能需要手动安装。
- 0.1.0
  1. 添加了《版权声明》和《论文原创性声明和使用授权说明》。
- 0.0.1
  1. 表格的 `caption` 格式正确了；
  2. `\section` 的 `break` 改为 `\clearpage`。
- 0.0.0
  1. 初始版本。
