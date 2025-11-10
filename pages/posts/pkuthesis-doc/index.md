---
title: "`pkuthesis` 2.0：信科 2025 年本科生毕业论文 LaTeX 文档类"
date: 2025-08-25 00:00:00
excerpt: 只是使用文档。
categories: 排版
tags:
  - TeX
  - LaTeX
  - pkuthesis
---

本文为 2.x 版本文档。关于 1.x 版本的 `pkuthesis` 文档，请见 [`pkuthesis`：信科 2025 年本科生毕业论文 LaTeX 文档类](/posts/pkuthesis-doc-1.0)。

## 特性

- 尽可能模仿 2025 年信科毕业论文 Word 模板；
- 改了一些字体；
- 提供最小的功能；
- 易于修改，作者不希望文档类充斥着 Plain TeX 或 LaTeX2e 古神语；
- 主要满足作者本人的需求。

## 环境要求

请使用 UTF-8 编码撰写文档，TeX Studio 用户请注意这一点。

### 在线环境

`pkuthesis` 已在以下在线环境测试：

- [Overleaf](https://www.overleaf.com/)
- [TeXPage](https://www.texpage.com/)
- [Cloud LaTeX](https://cloudlatex.io/)

但请注意，Overleaf 免费账号至多上传 50 MB 的 `.zip` 文件。建议您创建项目后，再上传 `fonts` 文件夹；

此外，Overleaf 免费账号编译时间为 20 秒。为避免以上限制，建议您：

- 使用[北大 LaTeX](https://latex.pku.edu.cn)，这是北大内网部署的 Overleaf 环境。但如果遇到停电、校园网故障或机房宕机，则无法使用。
- 使用 [TeXPage](https://www.texpage.com/)，其免费账号编译时间 1 分钟。
- 使用 [Cloud LaTeX](https://cloudlatex.io/)，其免费账号编译时间 2 分钟。

无论您使用哪个在线环境，请经常性备份数据到本地。或者，您可以使用[本地环境](#本地环境)。

### 本地环境

#### 操作系统

对于本地环境，`pkuthesis` 已在 Windows 和 Linux 操作系统测试。

#### LaTeX 发行版

推荐的 LaTeX 发行版为 TeX Live 2025，它应当附带所有必须的宏包。如果您认为 TeX Live 的体积太大、安装太慢，有以下方案可供选择：

1. （未经测试）使用 MiKTeX 发行版，它会在缺失宏包时自动安装。
2. （作者本人的方案）使用 TinyTeX 发行版，这是一个精简的 TeX Live，缺失宏包时需要手动安装。您可以使用以下命令安装所需的最少宏包：

```bash
tlmgr install ctex chinese-jfm fancyhdr footmisc bigfoot caption enumitem tabularray tocloft biblatex biblatex-gb7714-2015 xstring biber
```

#### TeX 引擎

`pkuthesis` 目前支持 XeLaTeX 和 LuaLaTeX。

## 使用 `pkuthesis`

从 [Release](https://github.com/Elkeid-me/pkuthesis/releases) 下载最新版本。截至本文撰稿时，最新版本是 2.0.0。

```text
│  ctex-fontset-pkuthesis.def
│  ctex-fontset-windows.def
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

- `fonts` 文件夹为 `pkuthesis` 使用的字体；
- `PKU-Logo.pdf` 为北京大学校徽与中文校名；
- `pkuthesis.cls` 为文档类本身；
- `ctex-fontset-pkuthesis.def` 为字体配置文件；
- `example.tex`、`example.bib`、`example.pdf` 为示例文档；
- `thesis.tex`、`thesis.bib` 为最小示例，可以作为您论文的起点。

### 用户接口

使用 `\documentclass` 引入文档类。`pkuthesis` 有以下用户接口：

- 使用 `\documentclass` 时的开关；
- `\ThesisInfo`（用于设置标题等论文信息）和 `\ThesisStyle`（用于设置标题格式等论文样式），这两个命令采用键值对风格。
- `\appendix` 和 `\acknowledgments`，开始附录和致谢部分。

#### 文档类开关

使用 `\documentclass` 引入文档类时，有如下三个开关：

1. `centersec` 可以将一级标题由阿拉伯数字编号、左对齐，改为中文编号、居中对齐。
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

2. `draft` 开关，在撰写草稿时，不插入实际图片，仅包含占位符，提升编译速度。
3. `debug` 开关，为 `pkuthesis` 的开发调试用。

#### `\ThesisInfo`

用于设置论文信息。示例如下：

```latex
\ThesisInfo {
    title  = {中文标题},
    title* = {英文标题},
}
```

所有字段如下：

---

- 标题：
  - `title = {中文标题}`
  - `title* = {英文标题}`

    论文标题。默认会自动断行，但为了语义的连贯以及排版的美观，如果您的标题长于一行，建议使用 `\\` 手动断行。
- 学生信息：
  - `author = {学生姓名（作者）}`
  - `student-id = {学号}`
  - `school = {学院名称}`
  - `specialty = {专业名称}`
- 摘要
  - `abstract = {中文摘要}`
  - `abstract* = {英文摘要}`
- 关键词：
  - `keywords = {中文关键词}`
  - `keywords* = {英文关键词}`

    关键词列表。请填写一个**逗号分隔列表**，后文将详细说明。

---

- `grade = {论文成绩（等级制）}`
- `mentor-comments = {导师评语}`

以上所有字段在不填写时，默认为空。

---

- `year = {年份}`，填写阿拉伯数字。此键值对可以不填写，默认为编译时系统时间；
- `month = {月份}`，填写阿拉伯数字。此键值对可以不填写，默认为 5；

---

- `evaluation-form = {《导师评阅表》}`，填写一个 PDF 文件路径。

  填写此键值对时，该 PDF 文件的第一页将作为《导师评阅表》插入编译好的论文中。

  不填写此键值对时，`pkuthesis` 会自行绘制《导师评阅表》。

- `declaration-page = {《论文原创性声明和使用授权说明》}`，填写一个 PDF 文件路径。

  填写此键值对时，该 PDF 文件的第一页将作为《论文原创性声明和使用授权说明》插入编译好的论文中。

  不填写此键值对时，`pkuthesis` 会自行绘制《论文原创性声明和使用授权说明》。

---

以下几个字段填写导师信息。在不填写时，默认为空。

- `mentor/name = {导师姓名}`

  导师姓名。有多位导师时，请填写一个**逗号分隔列表**，后文将详细说明。
- `mentor/workplace = {导师单位/所在学院}`

  同样地，有多个字段时，请填写一个**逗号分隔列表**，后文将详细说明。
- `mentor/academic-rank = {导师职称}`

  有多个字段时，请填写一个**逗号分隔列表**，后文将详细说明。

在导师部分，除了使用“`mentor/name`”这种格式作为键之外，也可以将 `mentor` 部分作为一个块统一填写。以下两者是等同的：

```latex
\ThesisInfo {
    mentor/name          = {千早爱音},
    mentor/workplace     = {羽丘女子学园},
    mentor/academic-rank = {吉他手},
}
```

```latex
\ThesisInfo {
    mentor = {
        name          = {千早爱音},
        workplace     = {羽丘女子学园},
        academic-rank = {吉他手},
    },
}
```

::: tip

所谓**逗号分隔列表**，即外侧以花括号包裹，字段间以**英文逗号**隔开的列表。

```latex
\ThesisInfo {
    mentor/name = {千早爱音, 安和昴},
}
```

必要时，为防止歧义，可以用花括号 `{...}` 把各成员字段括起来。示例：

```latex
\ThesisInfo {
    mentor/name = {{千早爱音}, {安和昴}},
}
```

:::

#### `\ThesisStyle`

`\ThesisStyle` 用于配置论文格式。所有字段如下：

- 标题格式配置：
  - `title-format = {中文标题格式}`
  - `title-format* = {英文标题格式}`

  `pkuthesis` 对中、英文标题使用一号字，与教务模板保持一致。如果您认为字号太大，可以使用这两个字段修改：
  ```latex
  \ThesisStyle {
      title-format  = {\zihao{2}},
      title-format* = {\zihao{3}},
  }
  ```

  即中文标题使用二号字，英文标题使用三号字。

- `keywords-separator = {关键词分隔符}`

  可选的值为：`comma`（逗号）和 `semicolon`（分号）。不填写时，默认为 `comma`。

  用于设置文档中关键词的分隔符。注意，这只会影响论文编译后 PDF 中的分隔符，在 LaTeX 源码中，关键词仍遵循上述“**逗号分隔列表**”。

::: tip

`\ThesisInfo` 和 `\ThesisStyle` 在字段之间不可有空行：

```latex
% 编译错误：
\ThesisStyle {
    title-format  = {\zihao{2}},

    title-format* = {\zihao{3}},
}
```

但字段内部可以，例如摘要和导师评语：

```latex
\ThesisInfo {
    mentor-comments = {
        千早爱音同学的这篇论文深入探讨了键盘手在乐队中的重要性，选题新颖，论证充分。通过对《BanG Dream! It's MyGO!!!!!》和《Girls Band Cry》两部作品的细致分析，结合具体音乐表现案例，有力地支持了“乐队必须有键盘手”这一论点。

        论文结构严谨，语言流畅，展现了作者扎实的音乐理论功底和对乐队实践的深刻理解。尤其对《春日影》和《熙熙攘攘，我们的城市》的对比分析，见解独到，令人印象深刻。

        本论文达到了学士学位论文的优秀水平，同意提交答辩。
    },
}
```

:::

#### 字体配置

默认情况下，`pkuthesis` 使用如下字体配置：

![](./fontset.webp)

这由字体配置文件（`ctex-fontset-pkuthesis.def`）和字体文件（`fonts/*`）提供。

此外，在 Windows 系统下，您可以手动将 `pkuthesis` 源代码中的 `fontset = pkuthesis` 改为 `fontset = windows` 以启用如下字体配置：

![](./fontset-2.webp)

#### 三线表

`pkuthesis` 提供了简易的三线表环境 `3-l-tablr`，示例见 `example.tex`。

对于复杂的三线表，建议您使用 `tabularray` 宏包自行绘制。更多信息见 `tabularray` 宏包的文档。

### 编译

`pkuthesis` 支持的 TeX 引擎见[前文所述](#tex-引擎)。

您可以使用 XeLaTeX 以获得更高的编译速度；或使用 LuaLaTeX 以获得（可能）更好的兼容性，因为 `pkuthesis` 最初是为 LuaLaTeX 开发的，且目前优先在 LuaLaTeX 上测试。

#### Overleaf

左上角 `Menu > Settings > Compiler` 选 XeLaTeX 或 LuaLaTeX。

#### 本地环境

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

:::

而如果您不关注交叉引用、目录和参考文献表，仅关注正文部分，那也可以只运行一遍 TeX 引擎以节省时间：

::: code-group

```bash [XeLaTeX]
xelatex thesis
```

```bash [LuaLaTeX]
lualatex thesis
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

- 2.0.0
  1. 放弃 upLaTeX 支持，在字体配置中增加 Slanted 风格（但是 Fake slanted）；
  2. `pdfkeywords` 现在跟随用户设定的分隔符；
  3. 可以指定封面的年和月；不指定时，年为本机时间，而月为五月；
  4. 支持插入 PDF 页为导师评阅表和原创性声明；
  5. 脚注由 1 ~ 9 增加至 1 ~ 50；
  6. 新的基于 Key-Value 的用户接口：`\ThesisInfo` 与 `\ThesisStyle`；
  7. 封面标题支持使用 `\\` 手动换行。
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

