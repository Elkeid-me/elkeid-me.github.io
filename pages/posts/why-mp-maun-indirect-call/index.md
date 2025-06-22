---
title: 操作系统 Lab 笔记——为什么 mpentry_start 到 mp_main 是间接调用？
date: 2024-05-03 21:00:00
excerpt: MIT 6.828 JOS Lab
categories: JOS Lab
tags:
  - JOS
  - C/C++
  - 汇编
  - 操作系统
---

本文内容分析于 2023 年 12 月 18 日。今整理成文。

先看源代码：`kern/mpentry.S:76`：

```asm
# Call mp_main(). (Exercise for the reader: why the indirect call?)
movl    $mp_main, %eax
call    *%eax
```

灵魂提问：why the indirect call?

直接调用的 `call` 指令，使用 `%eip` 相对寻址。而 `call` 指令的偏移量，是在链接时确定的。但 `mpentry.S` 链接地址和运行地址不一样（复制到 0x7000 再执行），这使得链接时确定的偏移量在运行时是错误的。因此，只能使用间接调用，将 `mp_main` 的绝对地址加载到 `%eax` 中，然后 `call *%eax`。

知道了原理，就可以改动链接脚本，使 `mpentry_start` 到 `mp_main` 通过 `call` 指令直接调用。

上面两句汇编改成：

```asm
# Call mp_main(). (Exercise for the reader: why the indirect call?)
movl    $mp_main, %eax // [!code --]
call    *%eax // [!code --]
call    true_mp_main // [!code ++]
```

链接脚本 `kern/kernel.ld`：

```txt
.text : AT(0x100000) {
    *(.text .stub .text.* .gnu.linkonce.t.*) // [!code --]
    PROVIDE(true_mp_main = mp_main + (0xF0100000 + mpentry_start - 0x7000)); // [!code ++]
    *(.text .stub .text.* .gnu.linkonce.t.*) // [!code ++]
}
```
