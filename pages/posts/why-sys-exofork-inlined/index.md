---
title: 操作系统 Lab 笔记——为什么 sys_exofork() 必须内联？
date: 2024-05-03 21:00:00
excerpt: MIT 6.828 JOS Lab
categories: JOS Lab
tags:
  - JOS
  - C/C++
  - 汇编
  - 操作系统
---

本文内容写于 2023 年 12 月 18 日，为 JOS Lab 的分析笔记。今正式公开。

如果 `sys_exofork()` 不内联，在 `ret` 指令前，`%esp` 为 `0xeebfdf34`，`%ebp` 为 `0xeebfdf70`（实际上是 `fork()` 的 `%ebp`，因为 `sys_exofork()` 没有 `push %ebp` 和 `mov %esp, %ebp`）。

新建的子环境会卡在 `ret` 之前，等待 `iret` 从系统调用返回。而父环境继续 `fork()`。在调用 `sys_page_map()` 进行 COW 映射之前，`%esp` 会降至 `%0xeebfdf28`，即父环境会覆盖子环境的返回地址（因为此时两者公用栈）。仔细来说，是在调用 `sys_page_map()` 之前 `push %edi` 传入参数时。这个参数是 `dstva`。

而如果 `sys_exo_fork()` 是内联的，就不会有以上问题。`fork()` 调用的叶函数不会修改 `fork()` 的返回地址，而 `fork()` 完成后，已经完成了栈的 COW 映射，父环境的其他过程不会修改子环境 `fork()` 的返回地址。

事实上，只考虑测试样例的话，我已经设计出了非内联版本的 `sys_exofork()`。原理很简单：把返回地址搬到一个不会被修改的地方。

```c
static envid_t __attribute__((noinline))
sys_exofork(void)
{
    envid_t ret;
    asm volatile("movl (%esp), %eax\n"
                 "movl %eax, -0x80(%esp)\n");
    asm volatile("int %2" : "=a"(ret) : "a"(SYS_exofork), "i"(T_SYSCALL));
    asm volatile("push %eax\n"
                 "movl -0x7c(%esp), %eax\n"
                 "movl %eax, 0x4(%esp)\n"
                 "pop %eax\n");
    return ret;
}
```

或者：

```c
asm(".type sys_exofork, @function\n"
    "sys_exofork:\n"
    "\tmovl (%esp), %eax\n"
    "\tmovl %eax, -0x80(%esp)\n"
    "\tmovl $7, %eax\n"
    "\tint $48\n"
    "\tpush %eax\n"
    "\tmovl -0x7c(%esp), %eax\n"
    "\tmovl %eax, 0x4(%esp)\n"
    "\tpop %eax\n"
    "\tret\n");
```
