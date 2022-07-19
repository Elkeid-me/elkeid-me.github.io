---
title: Lambda演算
date: 2022-06-07 00:25:22
excerpt: Lambda 演算入门，使用 F# 语言
categories:
  - 编程
tags:
  - F#
  - Lambda 演算
  - 函数式编程
katex: true
---

这里讲的是无类型Lambda演算。

## 基础概念

Lambda演算由三种元素组成：**变量**、**函数**和**应用**。

| 名称 | 语法                 | 示例             | 解释                                                 |
| ---- | -------------------- | ---------------- | ---------------------------------------------------- |
| 变量 | `<变量名>`           | $x$              | 一个名为$x$的变量                                    |
| 函数 | `λ<参数>.<函数体>`   | $\lambda x.x$    | 一个以$x$（前者）为参数、以$x$（后者）为函数体的函数 |
| 应用 | `<函数><变量或函数>` | $(\lambda x.x)a$ | 以$a$为参数调用$\lambda x.x$                         |

最基本的函数为恒等函数$\lambda x.x$，即：

```fsharp
let f x = x
```

## 求值
求值操作是通过β-归约（β-Reduction）完成的，它本质上是词法层面上的替换。

当对表达式$(\lambda x.x)a$求值时，我们将函数体中所有出现的$x$替换为$a$。

- $(\lambda x.x)a$计算结果为$a$
- $(λx.y)a$计算结果为$y$

高阶函数：

$(\lambda x.(\lambda y.x))a$的计算结果为$\lambda y.a$

即：

```fsharp
let f x =
    fun y -> x

f 114514
```

Lambda演算传统上仅支持单个参数的函数，但可以通过反柯里化（Uncurrying）创建多个参数的函数。

$\lambda x.(\lambda y.(\lambda z.xyz))\Leftrightarrow\lambda x.\lambda y.\lambda z.xyz\Leftrightarrow\lambda xyz.xyz$

```fsharp
let f x =
    fun y ->
        fun z -> (x * y * z)

let ans = f 1 2 3 // ans = 6
```

有时`λxy.<函数体>`与`λx.λy.<函数体>`可以互换使用。

而现代的函数式语言默认对多参数函数柯里化（Currying）：

```fsharp
let f x y z =
    x * y * z

let g = f 2     // g 也是一个函数
                // 类似于 int g(int y, int z) { return 2 * y * z; }
let ans = g 3 4 // ans = 24
```

<div class="info">

> 鸽了，但没有完全鸽

</div>
