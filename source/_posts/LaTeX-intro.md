---
title: LaTeX 入坑指南
date: 2022-06-10 22:00:00
excerpt: 一份不太正经的 LaTeX 介绍
categories:
  - LaTeX
tags:
  - LaTeX
  - 排版
---

## 什么是LaTeX?

先介绍TeX。早期计算机排版技术十分粗糙，影响到了~~知名艺术家~~高德纳老爷子的巨著《计算机程序设计艺术》的印刷质量，于是他决定自行编写一个排版软件：TeX。

~~这一写就是十年~~

除了指TeX软件外，TeX也用于代指编写TeX文档的语言（正如Python可以指Python语言，也可以指Python解释器）。一个简单的plain-TeX示例如下：

```tex
The quadratic formula is $-b \pm \sqrt{b^2 - 4ac} \over 2a$
\bye
```

<details>
  <summary>（一些奇怪的东西）</summary>
TeX看似只是Markdown或HTML那样的标记语言，但它是图灵完备的。事实上，TeX是一门宏语言。

你或许看过本站的[数字论证器](/homo)，知道它是用JavaScript实现的。但还有一个TeX实现的版本：

```tex
\def\inputNum{-20220520}
\toks0{(11/(45-1) \times 4)}
\toks1{(-11+4-5+14)}
\toks2{(-11-4+5+14)}
\toks3{(11-4-5+14)}
\toks4{((114-51) \times 4+(-11-4+5+14))}
\toks5{(114 \times 514+(11 \times 45 \times 14+(-11/4+51/4)))}
\count0=\inputNum\relax
\def\loop#1#2#3{
    #3
    \ifnum #1<#2
        \advance#1 by 1
        \loop{#1}{#2}{#3}
    \fi
}
\def\homoBinary#1{
    \ifnum #1=0
        \the\toks0
    \else
        \count4=#1
        \count5=1
        \count6=0
        \loop{\count5}{6}{
            \ifodd\count4
                \ifnum\count6=1
                    \times
                \fi
                \count6=1
                \the\toks\count5
            \fi
            \divide\count4 by 2
        }
    \fi
}
\def\homo#1{
    \ifnum #1=0
        (1-1) \times 4514
    \else
        \ifnum #1>0
            \count1=\the#1
            \count2=0
            \count3=0
            \loop{\count2}{32}{
                \ifodd\count1
                    \ifnum\count3=1
                        +
                    \fi
                    \count3=1
                    \homoBinary{\count2}
                \fi
                \divide\count1 by 2
            }
        \else
            \count1=0
            \advance\count1 by -\count0
            \count0=\count1
            (11-4-5+1-4) \times (\homo{#1})
        \fi
    \fi
}
Ok, You input $\the\count0$.

Obviously, $\the\count0 = \homo{\count0}$

\bye

```

~~没有什么用，除非你想在论文里唐突恶臭~~
</details>

那么LaTeX是什么呢？由于TeX本身的核心命令和plain-TeX的宏命令过少，用着不是很方便，莱斯利·兰伯特开发了LaTeX，这是TeX的一套**宏集**。一个典型的LaTeX2e文档如下：

```latex
\documentclass[a4paper]{ctexart}

% 标题，作者与日期
\title{LaTeX}
\author{瑶光}
\date{\today}

% 正文开始
\begin{document}
    % 生成标题、作者、日期
    \maketitle
    % % 摘要
    \begin{abstract}
        This is abstract.
    \end{abstract}
\end{document}
```

可以看到，LaTeX比plain-TeX更加的格式化，~~所以plain-TeX让宏包开发者学就行了，我们没必要学~~

## 为什么要用LaTeX？

如果你习惯了使用Word，且用Word用的很6（指排版正经论文没有问题的那种），且没有被强制使用LaTeX，那你直接关掉页面就好了。

否则，请认真看一下使用LaTeX的理由：

1. 美观的断行算法（Knuth & Plass line-breaking），这是一种动态规划算法。~~这一点是Word永远比不上的，Word是贪心算法~~。Wikipedia给出了一个[示例](https://zh.wikipedia.org/zh-cn/TeX#断字与断行)：

{% tabs line-breaking-sample %}
<!-- tab 贪心算法-->
```
  The quick brown fox jumps over
the lazy dog. The words here are
quite  short.  Aren't they?  But
long     ones      such       as
perhydrocyclopentanophenanthrene
may appear.
```
<!-- endtab -->

<!-- tab Knuth & Plass line-breaking -->
```
  The  quick  brown  fox   jumps
over  the  lazy  dog.  The words
here  are  quite  short.  Aren't
they?  But  long  ones  such  as
perhydrocyclopentanophenanthrene
may appear.
```
<!-- endtab -->
{% endtabs %}

2. 强大的数学公式支持。~~你要是习惯Word+Mathtype也不是不行~~

3. 开源，Bug少，且绝大多数发行版免费。

4. 输出高质量的PDF。~~Word输出的pdf是个啥啊，根本不能看~~

5. 丰富的宏包。例如：
    - 使用tikz绘制数学图形：
{% tabs tikz-sample %}
<!-- tab 图片 -->
![](/img/tex-intro/math.png)
<!-- endtab -->

<!-- tab 代码（高能预警） -->
```latex
\begin{tikzpicture}
    \pgfsetxvec{\pgfpoint{-0.70710cm}{-0.70710cm}}
    \pgfsetyvec{\pgfpoint{2cm}{0cm}}
    \pgfsetzvec{\pgfpoint{0cm}{2cm}}
    \coordinate[label=270:$A$](A)at(1,0,0);
    \coordinate[label=270:$B$](B)at(1,1,0);
    \coordinate[label=270:$C$](C)at(0,1,0);
    \coordinate[label=270:$D$](D)at(0,0,0);
    \coordinate[label=90:$A_1$](A1)at(1,0,1);
    \coordinate[label=90:$B_1$](B1)at(1,1,1);
    \coordinate[label=90:$C_1$](C1)at(0,1,1);
    \coordinate[label=90:$D_1$](D1)at(0,0,1);
    \coordinate[label=225:$P$](P)at(0.4,0.4,0.6);
    \coordinate[label=0:$Q$](Q)at(1,1,0.7);
    \draw (A)--(B)--(C);
    \draw[dashed](C)--(D)--(A) (D)--(D1);
    \draw (A1)--(B1)--(C1)--(D1)--(A1);
    \draw (A)--(A1) (B)--(B1) (C)--(C1);
    \draw[dashed] (B)--(D1) (C1)--(P)--(Q);
    \draw (C1)--(Q);
\end{tikzpicture}
\begin{tikzpicture}
    \pgfsetxvec{\pgfpoint{-0.70710cm}{-0.70710cm}}
    \pgfsetyvec{\pgfpoint{2cm}{0cm}}
    \pgfsetzvec{\pgfpoint{0cm}{2cm}}
    \coordinate[label=270:$A$](A)at(1,0,0);
    \coordinate[label=270:$B$](B)at(1,1,0);
    \coordinate[label=270:$C$](C)at(0,1,0);
    \coordinate[label=180:$D(C_1')$](D)at(0,0,0);
    \coordinate[label=90:$A_1$](A1)at(1,0,1);
    \coordinate[label=90:$B_1$](B1)at(1,1,1);
    \coordinate[label=90:$C_1$](C1)at(0,1,1);
    \coordinate[label=90:$D_1$](D1)at(0,0,1);
    \coordinate[label=0:$C_1''$](C1'')at({sqrt(2)/2+1},{sqrt(2)/2+1},1);
    \draw (A)--(B)--(C);
    \draw[dashed](C)--(D)--(A) (D)--(D1);
    \draw (A1)--(B1)--(C1)--(D1)--(A1);
    \draw (A)--(A1) (C)--(C1);
    \draw[dashed] (B)--(D);
    \draw[dashed,name path=BD1] (B)--(D1);
    \draw (C1'')--(D1) (C1'')--(B);
    \fill[gray,fill opacity=0.5](D)--(D1)--(C1'')--(B);
    \draw[name path=BB1](B)--(B1);
    \path[name path=DC1''](D)--(C1'');
    \path[name intersections={of=BD1 and DC1''}] (intersection-1) coordinate [label=180:$P$](P);
    \path[name intersections={of=BB1 and DC1''}] (intersection-1) coordinate [label=120:$Q$](Q);
    \draw (C1'')--(Q) (C1)--(Q);
    \draw[dashed] (D)--(Q) (C1)--(P);
\end{tikzpicture}
\begin{tikzpicture}
    \pgfsetxvec{\pgfpoint{2cm}{0cm}}
    \pgfsetyvec{\pgfpoint{0cm}{2cm}}
    \coordinate[label=90:$D_1$](D1)at(0,1);
    \coordinate[label=90:$B_1$](B1)at({sqrt(2)},1);
    \coordinate[label=270:$D(C_1')$](D)at(0,0);
    \coordinate[label=90:$C_1''$](C1'')at({sqrt(2)+1},1);
    \coordinate[label=270:$B$](B)at({sqrt(2)},0);
    \draw (D)--(D1)--(C1'')--(B)--(D);
    \draw[name path=BB1](B)--(B1);
    \draw[name path=BD1](B)--(D1);
    \draw[name path=DC1''](D)--(C1'');
    \path[name intersections={of=BD1 and DC1''}] (intersection-1) coordinate [label=270:$P$](P);
    \path[name intersections={of=BB1 and DC1''}] (intersection-1) coordinate [label=-30:$Q$](Q);
\end{tikzpicture}
```
<!-- endtab -->
{% endtabs %}
    - 使用chemfig绘制血红素：
{% tabs chemfig-sample %}
<!-- tab 图片 -->
![](/img/tex-intro/heme.png)
<!-- endtab -->

<!-- tab 代码（高能预警） -->
```latex
\chemfig[atom sep=2em]{Fe(-[2,,,,dash pattern=on 1pt off 1pt]N*5(=?[2]-(-=[::60])=(-)-(=[::-81]?[3])-))(-[4]N*5(-?[3]=(-=[::60])-(-)=?[4]-))(-[6,,,,dash pattern=on 1pt off 1pt]N*5(-(=[::-27]?[4])-(-)=(--[::-60]-[::60](=[::60]O)-[::-60]HO)-?[1]=))-N*5(-(=[::-27]?[1])-(--[::60]-[::-60](=[::-60]O)-[::60]OH)=(-)-(=[::-81]?[2])-)}
```
<!-- endtab -->
{% endtabs %}
    - 使用listings书写代码：
{% tabs listing-sample %}
<!-- tab 图片 -->
![](/img/tex-intro/code-highlighting.png)
<!-- endtab -->

<!-- tab 代码 -->
```latex
\begin{lstlisting}
#define disableBit(source, position) \
    asm volatile("btr %1,%0;"        \
                 : "+r"(source)      \
                 : "r"(position))

#define countTrailingZero(source, result) \
    asm volatile("tzcnt %1, %0;"          \
                 : "=r"(result)           \
                 : "r"(source))
\end{lstlisting}
```
<!-- endtab -->
{% endtabs %}

6. 配合BiBTeX/biblatex实现强大的参考文献管理，以及论文参考文献列表的自动生成。

## LaTeX的缺点

1. 不是所见即所得的。当然，也有LyX和TeXmacs这样所见即所得的。。。
2. 表格的支持不及Word。~~但或许有大佬拿tikz硬画~~
3. 会出现奇怪的编译错误。
4. 常用的XeLaTeX引擎对直排的支持极不友好。
5. 欢迎在评论区补充。

## 如何配置LaTeX环境？

<div class="info">

> {% post_link LaTeX-Config %}

</div>

## 其他资源

<div class="info">

> 咕，咕咕咕

</div>
