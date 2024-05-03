---
title: 操作系统 Lab 笔记——为什么 mpentry_start 到 mp_main 是间接调用？
date: 2024-05-03 21:00:00
excerpt: MIT 6.828 JOS Lab
categories:
  - JOS Lab
tags:
  - JOS
  - C/C++
  - 汇编
  - 操作系统
---

本文内容分析于 2023 年 12 月 18 日。今整理成文。

```asm
# kern/mpentry.S:76
    # Call mp_main().  (Exercise for the reader: why the indirect call?)
    movl    $mp_main, %eax
    call    *%eax
```

因为链接地址和运行地址不一样，而 `call` 指令的偏移量是根据链接地址算的，运行时会出现错误。

知道了原理，就可以改动链接器脚本，使 `mpentry_start` 到 `mp_main` 通过 `call` 指令直接调用。

上面两句汇编改成：

```asm
call true_mp_main
```

链接器脚本 `kern/kernel.ld` 原本有：

```ld
    .text : AT(0x100000) {
        *(.text .stub .text.* .gnu.linkonce.t.*)
    }
```

现在改成：

```ld
    .text : AT(0x100000) {
        PROVIDE(true_mp_main = mp_main + (0xF0100000 + mpentry_start - 0x7000));
        *(.text .stub .text.* .gnu.linkonce.t.*)
    }
```
