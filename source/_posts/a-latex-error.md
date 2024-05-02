---
title: 一个奇怪的 LaTeX 字体问题
date: 2024-05-02 14:12:24
excerpt: 使用 ctex 文档类且 fontspec 更新至 2.9b 时，使用 LuaLaTeX 引擎，如果 \setmainfont 使用 Renderer=OpenType 选项，则不能正确加载名称中含有空格的某些字体。
categories:
  - LaTeX
tags:
  - ctex
  - fontspec
  - luatex-ja
  - TeX
  - LaTeX
---

前几天 fontspec 更新到了 2.9b，然后我的文档就没办法正常编译了。问题出在 `\setmainfont{Noto Serif}[Renderer=OpenType]`，但是它告诉我找不到名为 Noto 的字体。

昨天凌晨查到应该是 [stop stripping spaces. Hope this doesn't lead to more problems!](https://github.com/latex3/fontspec/commit/b3f91feab5519d1a04db4b63adfc397e3e81a742) 这个提交的问题，尝试把 fontspec-luatex.sty 的代码改成之前的，文档就能正常编译了。

今天想构造一个 MWE 反馈给 fontspec 开发者，但是

```latex
\documentclass{article}
\usepackage{fontspec}
\setmainfont{Noto Serif}[Renderer=OpenType]
```

是正常的（？）

所以我怀疑是 luatex-ja 没有对新版 fontspec 做适配，然而

```latex
\documentclass{ltjarticle}
\usepackage{fontspec}
\setmainfont{Noto Serif}[Renderer=OpenType]
```

也是正常的（？）

那我只能怀疑到 ctex 头上了。

```latex
\documentclass{article}
\usepackage{ctex}
\usepackage{fontspec}
\setmainfont{Noto Serif}[Renderer=OpenType]
```

正常；

```latex
\documentclass{ctexart}
\usepackage{fontspec}
\setmainfont{Noto Serif}[Renderer=OpenType]
```

编译错误；如果把最后一句改成：

```latex
\setmainfont{NotoSerif}[Renderer=OpenType]
```

至少能正常编译了，但是文档中会输出一堆奇怪的信息。

好，这时候可以把目标锁定在 ctex 文档类上了。然而，当我想构造一个 MWE 反馈给 ctex 开发者时，诡异的事情又发生了：

```latex
\documentclass{ctexart}
\usepackage{fontspec}
\setmainfont{Times New Roman}
```

也是正常的！看到这里你应该明白了：问题出在 `Renderer=OpenType` 这一选项上。

所以问题应该描述为：

<div class="info">

> 使用 ctex 文档类且 fontspec 更新至 2.9b 时，使用 LuaLaTeX 引擎，如果 \setmainfont 使用 Renderer=OpenType 选项，则不能正确加载名称中含有空格的字体。

</div>

到这里就结束了吗？你会发现 `\setmainfont{NotoSerif Italic}[Renderer=OpenType]` 就能编译，虽然还是会输出一堆奇怪的信息。

太有趣了.jpg
