---
title: （水）原来 LaTeX 是函数式语言啊
date: 2024-03-30 23:35:42
excerpt: 没有数字论证
categories:
  - LaTeX
tags:
  - TeX
  - LaTeX
---

其实 LaTeX 是函数式语言。首先，LaTeX 里函数是一等公民：
```latex
\documentclass{article}
\NewDocumentCommand { \addstyle } { mm } { #1{#2} }
\begin{document}
    \addstyle{\textbf}{114514}
    \addstyle{\textit}{114514}
\end{document}
```
其次，LaTeX 有柯里化：
```latex
\documentclass{article}
\ExplSyntaxOn
    \NewDocumentCommand { \add } { mm }
      { \int_eval:n { #1 + #2 } }
    \NewDocumentCommand { \addCXMMMMDXIV } {}
      { \add{114514} }
\ExplSyntaxOff
\begin{document}
    \add{1919810}{1}

    \addCXMMMMDXIV{1}
\end{document}
% 输出：
% 1919811
% 114515
```
更好的柯里化例子（给一个四参数函数传入两个参数，得到一个二参数函数）：
```latex
\cs_new:Npn \int_step_function:nN
  { \int_step_function:nnnN { 1 } { 1 } }
```
同时，LaTeX 没有循环；你以为的循环不过是宏递归：
```latex
% 代码来自 l3kernel
\cs_new:Npn \__int_step:wwwN #1; #2; #3; #4
  {
    \int_compare:nNnTF {#2} > \c_zero_int
      { \__int_step:NwnnN > }
      {
        \int_compare:nNnTF {#2} = \c_zero_int
          {
            \msg_expandable_error:nnn
              { kernel } { zero-step } {#4}
            \prg_break:
          }
          { \__int_step:NwnnN < }
      }
      #1 ; {#2} {#3} #4
    \prg_break_point:
  }
```
真是函函又数数啊，你们有这样的函数式语言吗
