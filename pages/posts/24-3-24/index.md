---
title: 2024-3-24
date: 2024-03-24 23:49:28
excerpt: 啊？
categories: 发电
tags:
  - TeX
  - Mathematica
  - Python
---

很多时候我们会陷入对工具的惯性思维，即“手里拿着锤子，看什么任务都像钉子”。

但其实还有另一个问题，我们手里拿着瑞士军刀，但还是想砸钉子。瑞士军刀能砸钉子吗？能。好用吗？不好用。去年有一门课程叫 Python 程序设计与数据分析导论，其实数据分析就是砸钉子，而 Python 只是一把瑞士军刀。

任何试图用一种工具包办一切的思维都是愚蠢的，比如 LaTeX 里简单的图可以硬写 TikZ，复杂的图不如用 Visio 或者 Mathematica 画。如果不会专业工具，甚至用 PowerPoint 也可以。

Mathematica 也是万能的，上学期智能机器人课，我尝试过用 Mma 做数据分析，各种内置功能配合函数式风格非常适合写高层逻辑。但是碰到特定问题，Mma 写一长串列表生成函数，还真不如 Excel 写个 `=` 公式，再拉一下填充柄。

TeX 的宏确实可以解决一切问题，但没这个必要。未来可能属于 LuaTeX，至少 ConTeXt 里 TeX 和 Lua 已经五五开了。没有说某个功能只能用引擎原语、宏展开和内嵌脚本语言中的某一种，引擎做基础的 OpenType 支持，宏展开作为用户接口，内嵌脚本做逻辑也挺好。复杂语言排版交给扩展包，毕竟 TeX 不在乎速度，xeCJK 和 luatex-ja 就是很好的例子。

很多时候 LaTeX 不是好选择，对于萌新，我反而建议使用 Word、Markdown 或者新秀 Typst。至于 TeXmacs，我是看不起的[^1]。

[^1]: [评 TeXmacs 与墨干编辑器](/posts/comments-on-texmacs-and-mogan-editor)
