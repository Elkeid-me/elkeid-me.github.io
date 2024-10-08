---
title: Data Lab
date: 2024-03-08 23:12:57
excerpt: 位运算黑魔法
categories: ICS
tags:
  - 'CS: APP'
  - ICS
  - C/C++
math: true
---

我没打算把每道题都拿出来讲. 只讲一些有意思的.

下文的数学式中，$\lnot$ 表示逻辑非，$\&$ 表示按位与，$\mid$ 表示按位或，$\bar{x}$ 表示 $x$ 按位取反，$\oplus$ 表示按位异或，$/$ 表示整数除，而分数线代表数学中的除法.

## Part A

### bitConditional

- 签名：`int bitConditional(int x, int y, int z)`
- 描述：按位计算 `x ? y : z`
- 分数：1
- 允许的运算符：`&`，`|`，`^`，`~`
- Max Ops: 8

简单的位运算秒了：`(y & x) | (z & ~x)`. 4 ops.

还能不能再卷一卷 ops？注意到：

```wl
In[1]: Simplify[LogicalExpand[(x && (y~Xor~z))~Xor~z]]
Out[1]: (x && y) || (! x && z)
```

所以直接用 `(x & (y ^ z)) ^ z` 就好了. 3 ops.

### countTrailingZero

- 签名：`int countTrailingZero(int x)`
- 描述：计算 `x` 的尾随零，即 `tzcnt`. 例如 `tzcnt(0x1) = 0`，`tzcnt(4) = 2`，`tzcnt(0) = 32`
- 分数：4
- 允许的运算符：`!`，`~`，`&`，`^`，`|`，`+`，`<<`，`>>`
- Max Ops：40
- 补充说明：这个函数中可以使用较大的整型字面量，如 `0xffff0000`

纯粹的黑魔法，我在 Data Lab 的得意之作，19 ops 的极致解答：
```c
int countTrailingZero(int x)
{
    int x_sub_1 = x + 0xffffffff;
    int tmp = ~x & x_sub_1;
    tmp = (tmp & 0x55555555) + ((tmp >> 1) & 0x55555555);
    tmp = (tmp & 0x33333333) + ((tmp >> 2) & 0x33333333);
    tmp = (tmp + (tmp >> 4)) & 0x0f0f0f0f;
    tmp = (tmp + (tmp >> 8));
    tmp = (tmp + (tmp >> 16)) & 0x000000ff;
    return tmp;
}
```

### isLessOrEqual

- 签名：`int isLessOrEqual(int x, int y)`
- 描述：判断是否有 `x <= y`
- 分数：3
- 允许的运算符：`!`，`~`，`&`，`^`，`|`，`+`，`<<`，`>>`
- Max Ops：24

让我们从数学的角度分析.

$$ x \leqslant y \Leftrightarrow x < y + 1, \qquad x, y \in \mathbb{Z} $$

从数学的角度，只需要计算 $x - (y + 1)$，判断其符号即可（以下 0 被视为正号）. 恰好，在计算机中，$-(y + 1) = \bar{y}$.

但是在计算机中，$x + \bar{y}$ 有溢出问题，例如 $x = -1, y = 2^{31} - 1$，$x + \bar{y} = 2^{31} - 1 > 0$.

下面讨论两种避开溢出的办法.

1. 注意到 $x, y$ 同号时，$x - (y + 1)$ 不会溢出（即便 $y + 1$ 溢出也没有问题，注意这是个环，$x - (y + 1) = x - y - 1$）. 所以 $x, y$ 同号时，$x \leqslant y$ 可以由 $x - (y + 1)$ 的符号来判断. 而 $x, y$ 异号时，$x \leqslant y$ 可以直接由 $x$ 的符号来判断！代码如下：
    ```c
    int isLessOrEqual(int x, int y)
    {
        int not_same_sign = x ^ y;
        int dis = x + ~y;
        return (((not_same_sign & x) | (~not_same_sign & dis)) >> 31) & 1;
    }
    ```
    9 ops.
    注意到上式中 `(not_same_sign & x) | (~not_same_sign & dis);` 正是 `bitConditional(not_same_sign, x, dis)`，又可以化为：
    ```c
    int isLessOrEqual(int x, int y)
    {
        int not_same_sign = x ^ y;
        int dis = x + ~y;
        return (((not_same_sign & (x ^ dis)) ^ dis) >> 31) & 1;
    }
    ```
    8 ops.
2. 注意到 $\forall x \in \mathbb{Z}$，有 $x$ 与 $\lfloor \frac{x}{2} \rfloor$ 同号. 所以只要找到一种方法，计算出 $\lfloor \frac{x - (y + 1)}{2} \rfloor$ 即可.
    注意到 $x + y = (x \oplus y) + 2(x \& y)$（半加器的原理），从而
    $$ \frac{x + y}{2} = \frac{x \oplus y}{2} + (x \& y) $$
    也即：
    $$ \left\lfloor \frac{x + y}{2} \right\rfloor = \left\lfloor \frac{x \oplus y}{2} \right\rfloor + (x \& y) = [(x \oplus y) >> 1] + (x \& y) $$
    所以：
    ```c
    int isLessOrEqual(int x, int y)
    {
        int not_y = ~y;
        return ((((x ^ not_y) >> 1) + (x & not_y)) >> 31) & 1;
    }
    ```
    7 ops.
