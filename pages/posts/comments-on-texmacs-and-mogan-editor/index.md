---
title: 评TeXmacs与墨干编辑器
date: 2024-02-24 14:05:41
categories: 发电
tags:
  - 排印学
  - TeXmacs
  - TeX
  - LaTeX
excerpt: 我的评价是很难评价。
---

TeXmacs，特别是其国产fork[墨干编辑器](https://gitee.com/XmacsLabs/mogan)，这两个东西我已经批判过一番了。但是呢，鉴于TeXmacs/墨干的信徒们四处传教，在LaTeX讨论区传教、在Typst讨论区传教、在Word讨论区传教，甚至某些开发者自己做了个富文本编辑器，墨干还要在评论区传教，颇有“感觉不如原神”的架势，我还是来多说点罢。

![](./流汗黄豆.webp)_官  方  传  教_

本文主要围绕墨干的主导者[沈浪熊猫儿](https://www.zhihu.com/people/darcyshen)的言论而撰写。鉴于我们并不知道这位开发者姓甚名谁，下文皆以“沈老师”为尊称。

## “领先”时代的落后软件

沈老师对TeXmacs不吝溢美之词：

> GNU TeXmacs诞生于上个世纪末，**它的设计理念是领先于这个时代的**。

> GNU TeXmacs仿佛就是100年后的未来人，穿越到了上世纪末，但是上世纪末的操作系统、编程语言、字符编码并不足以支撑GNU TeXmacs的实现，所以作者Joris（疑似**未来人**），是以让一个软件活100年这样思路在设计和实现这个软件。

> 我觉得把GNU TeXmacs和LaTeX放在同一个层面上比较是不合适的。

> 100年之后，如果有七个人要乘一艘宇宙飞船去探索银河系，我相信他们会在个人的智能终端上预安装GNU TeXmacs。在漫长星际旅行中，使用GNU TeXmacs重新创造人类在过去100年创造的知识，会是他们日常的娱乐活动。

我倒是没看出来TeXmacs（1998）有什么“领先”的地方。断行与断字算法来自Knuth TeX（1982），所见即所得晚于Word/WordStar，图形化的公式排版也迟于LyX（1995）。甚至就连字体也是直接用Computer Modern：不是说“拿来主义不好”，你拿完之后又跟TeX切割彰显自己的高贵，就仿佛HarmonyOS用了AOSP源代码又吹嘘自己“自研”一样。

当然啦，TeXmacs自称“can be used as a graphical front-end for many systems in computer algebra, numerical analysis, statistics, etc.”，我去，这不是我们Mathematica（1988[^1]） 的梗吗？

Knuth自己搓了一套字体规范；1990年的pTeX扩展了TeX，原生支持东亚文字与直排；1998年Omega已经在研究多语言排版与多方向排版（32个方向…），而TeXmacs**至今仍不支持RTL**。所谓“操作系统、编程语言、字符编码并不足以支撑GNU TeXmacs的实现”，我的评价是菜就不要找借口，没有条件就创造条件，而不是在这里“**关于排版，我确信我有一种美妙的设计，可惜技术受限，写不下**”。

所以，TeXmacs没有什么“领先”，也没有什么“活100年”的底气。反倒是沈老师看不起的TeX有这个底气：活字印刷诞生于1045年，铅活字诞生于1450年，而TeX和MetaFont把过去500年印刷工人的排字技巧以算法的方式固化下来，可以说，TeX至少还能活500年。即便是微软，在设计OfficeMath和OpenType Math表的时候也要向Knuth老爷子请教公式排版。只要人类还有阅读的需求，Knuth-Plass断行算法就会在各类专业排版软件里流传下去。——而TeXmacs呢？

## 除了“自由”一无所有

作为一个排版软件，TeXmacs官方介绍自己的“哲学”，或者沈老师所称的“TeXmacs的目标”，不是排版上的美学高度，而是上来就大谈特谈“自由”[^2]：

> *As a mathematician, I am deeply convinced that only free programs are acceptable from a scientific point of view.*（作为一个数学家，从科学的角度来讲，我坚信只有自由软件才是可接受的。）

> *However, it is strange, and a shame, that the main mathematical programs which are currently being used are proprietary.*（然而，当前主流的数学软件大多是专有的。这很奇怪，且是一种耻辱。）

这就像某些“中文编程”的支持者不谈编程语言的设计，而是张口“英米鬼畜”闭口“昂撒匪帮”，你跟他谈技术他跟你讲意识形态，从一开始就走偏了。

如果说能排版数学方程式就是“数学软件”，且不提几乎已经属于公有领域的Knuth TeX，用MIT许可证的XeTeX和KaTeX、用GPLv2的LuaTeX以及用Apache 2.0的MathJax不比您那用GPLv3的TeXmacs更“自由”？

TeXmacs项目隶属自由软件基金会。自由软件基金会的使命是在“全球范围”内促进计算机用户的自由，然而相比于RTL都不支持的TeXmacs，在多语言多方向排版上积极探索的各种TeX引擎倒更能满足“全球范围”用户的需求。阿拉伯人、以色列人和蒙古人被排除“全球范围”了吗？

## 不支持OpenType的“完美”排版软件

回到技术上。沈老师说：

> GNU TeXmacs在功能上早已取代LaTeX。

王垠老师说：

> TeXmacs……是一个完全独立的，超越TeX的系统。

> 仍然对TeX顶礼膜拜的人应该看一下TeXmacs，看看它的作者是如何默默无闻的，彻彻底底的超越了TeX和Knuth。

OpenType特性不支持、RTL排版不支持、中文西文之间不会自动加空格[^3]、动不动就闪退崩溃的TeXmacs取代甚至超越TeX，看来领先的不是TeXmacs的设计理念，而是TeXmacs用户的做梦能力。在此基础上吹嘘“TeXmacs在功能上早已取代LaTeX”，也只能证明沈老师对排版缺乏最基本的了解。我的建议是沈老师应该把这类最基础的功能做好，而不是四处传教。

哇你们TeXmacs用户真是太可爱了。

## 有缺点的战士和有缺点的苍蝇

读到这里，你可能会觉得我是一个TeX吹。TeX不是完美的战士，它是有缺点的战士：扭曲而晦涩的语法、混乱的字体编码、割裂的引擎生态、宛如C++ 模板的宏展开报错，等等。TeX用户从不回避这些问题，并且积极解决这些问题（比如LaTeX 3项目，极大地简化了宏包和文档类的编写）。

但是TeXmacs用户把TeXmacs神化成完美的排版软件。很可惜，它连“完美的苍蝇”都算不上，只不过是有缺点的苍蝇。

[^1]: 想要符号化公式要等到1996的3.0版本
[^2]: [Why freedom is important for scientists](https://www.texmacs.org/tmweb/about/philosophy.en.html)
[^3]: 这个特性，墨干在2023年终于支持了，可喜可贺！
