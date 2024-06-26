---
title: Graphite 描述语言（全文翻译）
date: 2024-03-31 22:45:18
excerpt: Graphite 描述语言文档的全文翻译
categories:
  - 排印学
tags:
  - 字体
  - Graphite
  - 状态机
---

> 原文档版权归 SIL International 所有。本文仅为翻译。翻译结果不一定准确。本人不对翻译结果负任何责任。

> 翻译仍在施工中。我们争取在 4 月完成。

## 简介

这份文档旨在半正式地描述一种名为 Graphite 描述语言 (GDL) 的 Graphite 描述文件格式。因此，它将以一种比正式描述更自然的方式引入概念（希望如此）。

这篇文章还主要关注确保该语言具有描述所有可能脚本行为的足够描述能力。因此，本文将倾向于关注脚本描述更复杂的方面，因此并不代表您在典型描述中找到的平衡，其中大多数行为都相对简单。

撰写本文时假定您对字体、字符、字形和渲染问题有基本的了解。有关术语的定义，请参阅第 9 节的术语表。

如果有任何评论或问题，请发送至 [graphite_nrsi@sil.org](mailto:graphite_nrsi@sil.org)。

### Graphite 系统的功能

Graphite 系统旨在处理以下类型的复杂渲染情况：

- 移位和字距调整，其中字形的的位置会根据相邻字形的存在进行调整
- 连字替换，其中一个字形用于表示几个底层字符
- 重排，典型见于印度书写系统，其中呈现的字形顺序与相应的底层字符数据顺序不同
- 堆叠附加符号，使用附着点
- 双向排版，见于希伯来语和阿拉伯语等书写系统

有关详细信息，请参阅“Graphite 需求”文档。

### Graphite 和 Unicode

Graphite旨在与 Unicode 数据一起使用，即在基础数据符合 Unicode 标准的情况下使用。同样，用于使用 Graphite 渲染的字体也应该是基于 Unicode 的；也就是说，字体 `cmap` 中的字符值应该是 Unicode 码点。虽然可以将 Graphite 与自定义编码一起使用，但这不是推荐的做法。

## 概述：规则、字形和趟

### 规则

渲染描述的基础是规则。规则用于几乎所有内容，并允许上下文属性分配、替换等。规则是替换类型规则，格式类似于熟悉生成音韵学的人。

我们最初的讨论将集中于替换类型规则。稍后讨论其他类型的规则。

典型的替换规则可能是：

```
gLowercaseI > gDotlessI / _ gTilde;
```

这条规则表示，底层的带小写的 I 字形在表面上被相应的无点 I 字形替换，后跟波浪号字形。更准确地说，包含以下内容的字形流：

```
... gLowercaseI gTilde ...
```

将被修改为包含：

```
... gDotlessI gTilde ...
```

用于字形的名称是标识符，假设它们已被定义为引用字体中的特定字形。具体的操作方法将在以后的部分介绍。

从上面的示例中，我们可以看到一条规则由三个部分组成：*左侧*、*右侧*和*上下文*。左侧由基础形式中要替换的特定字形组成。右侧给出了将替换左侧中的字形的字形。请注意，左侧和右侧上的字形之间存在严格的一对一对应关系。在 `/` 之后是 _上下文_，它描述了左侧所在的环境以及右侧将被输出的环境。

规则的不同部分——左侧、右侧和上下文——不应视为字符串，而应视为字形序列。因此，在上面的规则中，我们说当紧接波浪号字形时，字形 `gLowercaseI` 被字形 `gDotlessI` 替换。因此，上下文中，`_` 用于表示单个字形，对应于规则左侧中的字形。

指定右侧和上下文在匹配方面描述规则时提供了最大的清晰度和自我描述，但是可以为没有上下文的规则使用更简单的格式。例如，上面的规则可以写成：

```
gLowercaseI gTilde > gDotlessI gTilde;
```

这并不那么清楚，因为它没有突出显示正在更改的字形。它也不够强大，因为它不允许在同一趟中重新匹配 `gTilde`。但该规则是可能的，并且一个优化编译器（我们不承诺开发）应该给出相同的结果。这条规则严格等价于第一条规则，而不是

```
gLowercaseI gTilde > gDotlessI gTilde / _ _ ;
```

请注意两个 `_`，规则左侧的每个字形都对应一个 `_`。如果上下文中 `_` 的数量与左侧和右侧的字形数量不同，则会出错。

规则的上下文可以根据需要变得复杂。左侧不必引用连续的字形序列：

```
gLowercaseI gTilde > gDotlessI gTilde / _ gLowerDia _ ;
```

请注意，上下文中的两个 _ 与左侧的两个字形相对应，也与右侧的两个字形相对应。

有些规则根本不执行替换，而只对字形流中的项设置*属性*。在这种情况下，左侧（和右侧角括号）被省略：

```
gCapA {kern.x = -Kern1} / clsCapVW _ ;
```

大括号内的代码设置了大写 A 字形的属性，使其向大写 V 或 W 方向字距调整。`Kern1` 在文件的其他地方被定义为该字形的数字常量。

不带左侧的规则主要用于定位表，下文将详细讨论。

规则的结束需要使用分号。如果没有分号，则假定续行。其他语句可以使用可选的分号结束符。（对于技术人员来说，分号实际上是分隔符）。

注释前有两条斜线。

```
a > b / _ c; // this is a comment
```

请注意，注释不需要分号。

#### 类

如果我们想要修改的每个独立的字形组合都必须使用自己的规则来详细说明，那么描述将变得不可能长。相反，我们可以使用字形类的系统。我们的第一个规则可以概括如下：

```
clsDotted > clsDotless / _ clsUpperDia;
```

这个规则表明所有有点的字形（比如 `i`、`j` 等）在后面跟着一个上标点时会被替换为它们的无点对应字形。

从这里我们可以看出，类有点像数组。当匹配到类中的一个元素时，它在类中的位置会被记住，以便可以用来指代另一个类中的元素（该类必须是同样大小或更大）。这种对应关系非常有助于减少规则的数量。

在类名前使用 `cls` 的前缀是一种纯粹的编码约定。在本文档中使用它是为了增加规则的可读性。

一个更复杂的替换规则可能会同时更改两个字形：

```
clsCons clsVowel > clsConsJoin clsVowelDia / _ ZWJ _ ;
```

这个规则可能出现在一个印度脚本中，其中元音可以通过零宽连接字符（在这个上下文中是字形）与前面的辅音结合。这个规则并不理想，因为在同一时间删除 ZWJ 可能更可取。我们稍后会讨论到这一点。

##### 变量和列表

类是使用标准的赋值命令（在字形表中）来定义的。赋值允许变量被定义为单个值或列表。赋值的形式如下：

```
variable = value;
```

在列表的情况下，列表在 `()` 之间被识别。因此：

```
clsDottedI = (gLI, gLBarredI);
clsIWidth = (clsDottedI, gLL, gUI, gUBarredI);
```

列表中的逗号是可选的。还要注意，类定义或变量赋值后的分号是可选的，不像在规则中是必需的。类名不需要单独声明，不像许多编程语言；赋值语句就是声明。

可以使用 `+=` 运算符将元素添加到列表的末尾。例如：

```
clsDottedI += gLJ;
clsIWidth += (gUJ, gUL);
```

列表机制还允许在规则中使用临时未命名的“类”，尽管这不是良好的做法，因为它不鼓励定义自我说明。给每个字形类命名相当于在编写 GDL 代码的同时编写文档。在整个文件中有其他机制鼓励这样做。

一个临时列表的例子（如果必须使用）是：

```
clsDotted > (gLDotlessI, gLDotlessBarredI, gLDotlessJ) / _ clsUpperDia;
```

##### 范围

列表也可以由范围组成。范围是一个包含两个端点的包含列表。因此：

```
clsCaps = unicode(0x0041 .. 0x005A);
```

相当于：

```
clsCaps = (unicode(0x0041), unicode(0x0042), unicode(0x0043), unicode(0x0044), ..., unicode(0x005A));
```

这两种形式都会创建一个包含标准罗马字母表中所有大写字母的类。`unicode` 和相关函数将在后面更详细地讨论。

##### ANY 类

一个特殊的类，称为“ANY”，可用于匹配任何字形。

