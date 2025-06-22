---
title: 操作系统实验 3
date: 2023-11-05 23:50:00
excerpt: MIT 6.828 JOS Lab 3
categories: JOS Lab
tags:
  - JOS
  - C/C++
  - 汇编
  - 操作系统
---

选择了 Challenge 2（JOS monitor 的断点命令） 和 Challenge 3（快速系统调用）。

报告中，对于寄存器的名称混用了 Intel 和 AT&T 的汇编格式，如 `EAX` 和 `%eax`。

## Exercise 1
### `mem_init()`
加入：
```c
/////////////////////////////////////////////////////////////////
// Make 'envs' point to an array of size 'NENV' of 'struct Env'.
// LAB 3: Your code here.
envs = (struct Env*)boot_alloc(sizeof(struct Env) * NENV);

/////////////////////////////////////////////////////////////////
// Map 'pages' read-only by the user at linear address UPAGES
// Permissions:
//    - the new image at UPAGES -- kernel R, user R
//      (ie. perm = PTE_U | PTE_P)
//    - pages itself -- kernel RW, user NONE
// Your code goes here:
// 对 pages 本身的映射将在后续映射整个内核时进行
boot_map_region(kern_pgdir, UPAGES, PTSIZE, PADDR(pages), PTE_U);
```
## Exercise 2
### `env_init()`
注意链表方向：
```c
void env_init(void)
{
    env_free_list = NULL;
    for (int i = NENV - 1; i >= 0; i--)
    {
        envs[i].env_id = 0;
        envs[i].env_link = env_free_list;
        envs[i].env_status = ENV_FREE;
        env_free_list = &envs[i];
    }
    env_init_percpu();
}
```
注意第 4 行 `i` 的类型必须为 `int`，如果要设置为 `size_t`，需要改为：
```c
for (size_t i = NENV - 1; i-- > 0;)
```
### `env_setup_vm()`
复制 `UTOP` 以上的内核页表:
```c
static int env_setup_vm(struct Env *e)
{
    struct PageInfo *p = NULL;

    // Allocate a page for the page directory
    if (!(p = page_alloc(ALLOC_ZERO)))
        return -E_NO_MEM;

    // LAB 3: Your code here.
    p->pp_ref++;
    e->env_pgdir = page2kva(p);

    for (size_t i = PDX(UTOP); i < NPDENTRIES; i++)
        e->env_pgdir[i] = kern_pgdir[i];

    // UVPT maps the env's own page table read-only.
    // Permissions: kernel R, user R
    e->env_pgdir[PDX(UVPT)] = PADDR(e->env_pgdir) | PTE_P | PTE_U;

    return 0;
}
```
### `load_icode()`
需要注意三点：
1. 为了内存复制的方便，加载 ELF 时可以使用用户态页表。
2. 对 `p_memsz` 为 0 的情况特判。
3. 修改 `e->env_tf.tf_eip` 为入口函数的地址。

```c
static void load_icode(struct Env *e, uint8_t *binary)
{
    // LAB 3: Your code here.
    struct Elf *elf_header_ptr = (struct Elf *)binary;
    if (elf_header_ptr->e_magic != ELF_MAGIC)
        panic("`%s' error: It's not a valid ELF file!\n", __func__);

    struct Proghdr *program_header_table_ptr =
        (struct Proghdr *)(binary + elf_header_ptr->e_phoff);

    lcr3(PADDR(e->env_pgdir));
    for (size_t i = 0; i < elf_header_ptr->e_phnum; i++)
    {
        struct Proghdr *program_header = program_header_table_ptr + i;
        if (program_header_table_ptr->p_type == ELF_PROG_LOAD)
        {
            void *va = (void *)program_header->p_pa;
            size_t file_size = program_header->p_filesz;
            size_t mem_size = program_header->p_memsz;
            size_t ph_off = program_header->p_offset;
            if (file_size > mem_size)
            {
                panic("`%s' error: `filesz' is larger than `memsz'\n",
                      __func__);
            }
            if (mem_size > 0)
            {
                region_alloc(e, va, mem_size);
                memset(va, 0, mem_size);
                memcpy(va, binary + ph_off, file_size);
            }
        }
    }
    lcr3(PADDR(kern_pgdir));
    e->env_tf.tf_eip = elf_header_ptr->e_entry;

    region_alloc(e, (void *)(USTACKTOP - PGSIZE), PGSIZE);
}
```
### `region_alloc()`
这个函数中，要注意两个 `assert`。这可以保证申请的内存空间在 `[0, UTOP)` 之内。
```c
static void region_alloc(struct Env *e, void *va, size_t len)
{
    // LAB 3: Your code here.
    assert((uint32_t)va + len <= UTOP);
    assert((uint32_t)va + len > (uint32_t)va);
    uintptr_t p_limit = ROUNDUP((uintptr_t)va + len, PGSIZE);
    uintptr_t p_down = ROUNDDOWN((uintptr_t)va, PGSIZE);
    uint32_t page_num = (p_limit - p_down) / PGSIZE;
    for (uint32_t i = 0; i < page_num; i++)
    {
        struct PageInfo *pginfo_ptr = page_alloc(0);
        if (pginfo_ptr == NULL)
            panic("`%s' error: Can not allocate a physical page.\n", __func__);
        int err = page_insert(e->env_pgdir, pginfo_ptr,
                              (void *)(p_down + i * PGSIZE), PTE_U | PTE_W);
        if (err < 0)
            panic("`%s' error: %e\n", __func__, err);
    }
}
```
### `env_create()`
简单地分配一个新的 `struct Env`，然后设置相关字段即可。
```c
void env_create(uint8_t *binary, enum EnvType type)
{
    // LAB 3: Your code here.
    struct Env *new_env = NULL;
    int err = env_alloc(&new_env, 0);
    if (err < 0)
        panic("`%s' error: %e\n", __func__, err);
    load_icode(new_env, binary);
    new_env->env_parent_id = 0;
    new_env->env_type = type;
}
```
### `env_run()`
按要求设置 `struct Env` 的字段即可。考虑到未来的 Lab 会涉及其他 `env_status`，对 `env_status` 的判断使用 `switch` 而不是 `if`。
```c
void env_run(struct Env *e)
{
    if (curenv != NULL)
    {
        switch (curenv->env_status)
        {
        case ENV_RUNNING:
            curenv->env_status = ENV_RUNNABLE;
            break;
        }
    }
    curenv = e;
    curenv->env_status = ENV_RUNNING;
    curenv->env_runs++;
    lcr3(PADDR(curenv->env_pgdir));
    env_pop_tf(&(curenv->env_tf));
}
```
## Exercise 4
### kern/trapentry.S
构建处理程序：
```c
TRAPHANDLER_NOEC(Divide_Error_h, T_DIVIDE)
TRAPHANDLER_NOEC(Debug_Exception_h, T_DEBUG)
TRAPHANDLER_NOEC(NMI_Interrupt_h, T_NMI)
TRAPHANDLER_NOEC(Breakpoint_h, T_BRKPT)

TRAPHANDLER_NOEC(Overflow_h, T_OFLOW)
TRAPHANDLER_NOEC(BOUND_Range_Exceeded_error_h, T_BOUND)
TRAPHANDLER_NOEC(Invalid_Opcode_h, T_ILLOP)
TRAPHANDLER_NOEC(Device_Not_Available_h, T_DEVICE)

TRAPHANDLER(Double_Fault_h, T_DBLFLT)
// 9 is reserved by Intel.
TRAPHANDLER(Invalid_TSS_h, T_TSS)
TRAPHANDLER(Segment_Not_Present_h, T_SEGNP)

TRAPHANDLER(Stack_Segment_Fault_h, T_STACK)
TRAPHANDLER(General_Protection_h, T_GPFLT)
TRAPHANDLER(Page_Fault_h, T_PGFLT)
// 15 is reserved by Intel.

TRAPHANDLER_NOEC(x87_FPU_Floating_Point_Error_h, T_FPERR)
TRAPHANDLER(Alignment_Check_h, T_ALIGN)
TRAPHANDLER_NOEC(Machine_Check_h, T_MCHK)
TRAPHANDLER_NOEC(SIMD_Floating_Point_Exception_h, T_SIMDERR)
```

以及 `_alltraps:`，补充 `struct Trapframe` 的信息，修改 `DS` 与 `ES`，压栈 `ESP` 为 `trap()` 传参并最终调用 `trap()`。
```asm
_alltraps:
    pushw   $0
    pushw   %ds

    pushw   $0
    pushw   %es

    pushal

    xorl    %eax,   %eax

    movw    $GD_KD, %ax
    movw    %ax,    %ds
    movw    %ax,    %es

    pushl   %esp
    call    trap
```
### `trap_init()`
构建 IDT：
```c
#define DefAndSetGate(gate, istrap, sel, func, dpl) \
void func();                                        \
SETGATE(gate, istrap, sel, func, dpl)

DefAndSetGate(idt[T_DIVIDE], 0, GD_KT, Divide_Error_h, 0);
DefAndSetGate(idt[T_DEBUG], 0, GD_KT, Debug_Exception_h, 0);
DefAndSetGate(idt[T_NMI], 0, GD_KT, NMI_Interrupt_h, 0);
DefAndSetGate(idt[T_BRKPT], 0, GD_KT, Breakpoint_h, 3);

DefAndSetGate(idt[T_OFLOW], 0, GD_KT, Overflow_h, 3);
DefAndSetGate(idt[T_BOUND], 0, GD_KT, BOUND_Range_Exceeded_error_h, 3);
DefAndSetGate(idt[T_ILLOP], 0, GD_KT, Invalid_Opcode_h, 0);
DefAndSetGate(idt[T_DEVICE], 0, GD_KT, Device_Not_Available_h, 0);

DefAndSetGate(idt[T_DBLFLT], 0, GD_KT, Double_Fault_h, 0);
// 9 is reserved by Intel.
DefAndSetGate(idt[T_TSS], 0, GD_KT, Invalid_TSS_h, 0);
DefAndSetGate(idt[T_SEGNP], 0, GD_KT, Segment_Not_Present_h, 0);

DefAndSetGate(idt[T_STACK], 0, GD_KT, Stack_Segment_Fault_h, 0);
DefAndSetGate(idt[T_GPFLT], 0, GD_KT, General_Protection_h, 0);
DefAndSetGate(idt[T_PGFLT], 0, GD_KT, Page_Fault_h, 0);
// 15 is reserved by Intel.

DefAndSetGate(idt[T_FPERR], 0, GD_KT, x87_FPU_Floating_Point_Error_h, 0);
DefAndSetGate(idt[T_ALIGN], 0, GD_KT, Alignment_Check_h, 0);
DefAndSetGate(idt[T_MCHK], 0, GD_KT, Machine_Check_h, 0);
DefAndSetGate(idt[T_SIMDERR], 0, GD_KT, SIMD_Floating_Point_Exception_h, 0);
```

为简单起见，所有的门描述符全部定义为中断门。

需要注意，`#BP` 中断门的 `DPL` 应当设置为 3。`#OF` 和 `#BR` 也是如此。

### Question 1
有两点。
1. 有的中断/异常会压栈错误码，而其他的中断/异常不会；为每个中断/异常提供独立的处理程序，在不压栈错误码时压入 0，可以为 `trap()` 提供一致的 `struct Trapframe` 结构。

2. 为每个中断/异常提供独立的处理程序，可以压入对应的 `trapno`，以便 `trap_dispatch()` 识别不同的中断/异常。

### Question 2
`#PF` 中断门的 `dpl` 应当设置为 0。

Intel 手册 *Intel® 64 and IA-32 Architectures Software Developer's ManualVolume 2A* 之 3-520 页对 `INT` 指令指出：
```text
PROTECTED-MODE:
    (* 省略伪代码 *)
    IF software interrupt
    (* Generated by INT n, INT3, or INTO; does not apply to INT1 *)
        THEN
            IF gate DPL < CPL (* PE = 1, DPL < CPL, software interrupt *)
                THEN #GP(error_code(vector_number,1,0)); FI;
            (* idt operand to error_code set because vector is used *)
            (* ext operand to error_code is 0 because INT n, INT3, or INTO*)
    FI;
    (* 省略伪代码 *)
END;
```
Intel 手册 *Intel® 64 and IA-32 Architectures Software Developer's Manual Volume 3A* 之 6-41 页对 `#GP` 指出：
> *The following conditions cause general-protection exceptions to be generated:*
> ... ...
> - *Executing the `INT` n instruction when the `CPL` is greater than the `DPL` of the referenced interrupt, trap, or task gate.*
>
> ... ...

user/softint 中试图以 `int $14` 触发 `#PF`，但由于 `#PF` 中断门的 `DPL` 小于当前 `CS` 寄存器中的 `CPL`，最终触发 `#GP`。

如果内核允许用户程序以 `int $14` 触发 `#PF`，那么内核将无法区分哪些是真的缺页，哪些是用户程序触发的 `#PF`。

## Exercise 5 and 6
### `trap_dispatch()`
增加一个 `switch`，识别 `tf_trapno`：
```c
switch (tf->tf_trapno)
{
case T_PGFLT:
    page_fault_handler(tf);
    return;
case T_BRKPT:
    monitor(tf);
    return;
}
```
### Question 3
如 Question 2 所言，需要将 `#BP` 中断门的 `DPL` 设为 3，否则用户程序以 `int3` 指令将触发 `#GP`。
### Question 4
意义在于阻止用户程序随意触发中断/异常，但又留有接口，使用户程序受控地使用内核功能。
## Exercise 7
### kern/trapentry.S 和 `trap_init()`
在相应的源文件中加上这两行，构建处理程序和 IDT 条目。
```asm
TRAPHANDLER_NOEC(System_Call_h, T_SYSCALL)
```

```c
DefAndSetGate(idt[T_SYSCALL], 0, GD_KT, System_Call_h, 3);
```

### `trap_dispatch()`
增加一个 `case`，用于处理系统调用：

```c
case T_SYSCALL:
    tf->tf_regs.reg_eax = syscall(tf->tf_regs.reg_eax, tf->tf_regs.reg_edx,
                                  tf->tf_regs.reg_ecx, tf->tf_regs.reg_ebx,
                                  tf->tf_regs.reg_edi, tf->tf_regs.reg_esi);
    env_run(curenv);
```

### kern/syscall.c: `syscall()`
增加一个 `switch`，用于识别 `syscallno`。对于未知的系统调用，返回 `-E_INVAL`。
```c
int32_t syscall(uint32_t syscallno, uint32_t a1, uint32_t a2, uint32_t a3,
                uint32_t a4, uint32_t a5)
{
    switch (syscallno)
    {
    case SYS_cgetc:
        return sys_cgetc();
    case SYS_cputs:
        sys_cputs((const char *)a1, a2);
        return 0;
    case SYS_getenvid:
        return sys_getenvid();
    case SYS_env_destroy:
        return sys_env_destroy(a1);
    default:
        return -E_INVAL;
    }
}
```

## Exercise 8
### `libmain()`
添加：
```c
thisenv = &envs[ENVX(sys_getenvid())];
```

## Exercise 9
### `page_fault_handler()`
检查 `CPL`，即 `CS` 寄存器的低 2 位是否为 0：
```c
if ((tf->tf_cs & 3) == 0)
    panic("Kernel panic with page fault\n");
```

### `user_mem_check()`
可以逐页检查。最重要的是将 `user_mem_check_addr` 设定为恰当的值。考虑到分页机制，第一个出现错误的地址要么是某个页的起始，要么是 `va`。
```c
int user_mem_check(struct Env *env, const void *va, size_t len, int perm)
{
    // LAB 3: Your code here.
    perm = perm | PTE_U | PTE_P;
    uintptr_t va_start = ROUNDDOWN((uintptr_t)va, PGSIZE);
    uintptr_t va_end = ROUNDUP((uintptr_t)va + len, PGSIZE);

    // 检查是否溢出
    if (va_end < va_start || va_end > ULIM)
    {
        user_mem_check_addr = MAX(ULIM, (uintptr_t)va);
        return -E_FAULT;
    }

    // 检查第一个页
    pte_t *pte_ptr = pgdir_walk(env->env_pgdir, va, 0);
    if (pte_ptr == NULL)
    {
        user_mem_check_addr = (uintptr_t)va;
        return -E_FAULT;
    }
    if ((*pte_ptr & perm) != perm)
    {
        user_mem_check_addr = (uintptr_t)va;
        return -E_FAULT;
    }

    // 从第二个页开始检查
    for (uintptr_t va_2 = va_start + PGSIZE; va_2 < va_end; va_2 += PGSIZE)
    {
        pte_t *pte_ptr = pgdir_walk(env->env_pgdir, (void *)va_2, 0);
        if (pte_ptr == NULL)
        {
            user_mem_check_addr = va_2;
            return -E_FAULT;
        }
        if ((*pte_ptr & perm) != perm)
        {
            user_mem_check_addr = va_2;
            return -E_FAULT;
        }
    }

    return 0;
}
```
`user_mem_check()` 也可以使用简单的逐字节检查的方式：
```c
int user_mem_check(struct Env *env, const void *va, size_t len, int perm)
{
    perm = perm | PTE_U | PTE_P;
    for (size_t i = 0; i < len; i++)
    {
        char *va_2 = (char *)va + i;
        if ((uintptr_t)va_2 >= ULIM)
        {
            user_mem_check_addr = (uintptr_t)va_2;
            return -E_FAULT;
        }

        pte_t *pte_ptr = pgdir_walk(env->env_pgdir, va_2, 0);
        if (pte_ptr == NULL)
        {
            user_mem_check_addr = (uintptr_t)va_2;
            return -E_FAULT;
        }
        if ((*pte_ptr & perm) != perm)
        {
            user_mem_check_addr = (uintptr_t)va_2;
            return -E_FAULT;
        }
    }
    return 0;
}
```

### kern/syscall.c
当前的系统调用只有 `sys_cputs()` 涉及到访问内存，因此在其中加入：
```c
user_mem_assert(curenv, s, len, PTE_U);
```

### `debuginfo_eip()`
添加：
```c
if (user_mem_check(curenv, usd, sizeof(struct UserStabData), PTE_U) < 0)
    return -1;
// ...
if (user_mem_check(curenv, stabs,
                   (uintptr_t)stab_end - (uintptr_t)stabs,
                   PTE_U) < 0)
    return -1;
if (user_mem_check(curenv, stabstr,
                   (uintptr_t)stabstr_end - (uintptr_t)stabstr,
                   PTE_U) < 0)
    return -1;
```
## Challenge 2

Intel 手册 *Intel® 64 and IA-32 Architectures Software Developer's Manual Volume 3A* 之第 2-9 页和 2-10 页指出：

> ***`TF` Trap (bit 8)*** --- *Set to enable single-step mode for debugging; clear to disable single-step mode. In single-step mode, the processor generates a debug exception after each instruction. This allows the execution state of a program to be inspected after each instruction. If an application program sets the `TF` flag using a `POPF`, `POPFD`, or `IRET` instruction, a debug exception is generated after the instruction that follows the `POPF`, `POPFD`, or `IRET`.*

可以借此实现断点。

为 JOS monitor 添加两个新命令：`si` 和 `c`，以及对应的函数 `mon_si()` 和 `mon_c()`。两个函数都检查当前是否为用户程序，且当前是否为 `#BP` 或 `DB`，然后简单地设置 `TF`。

```c
int mon_si(int argc, char **argv, struct Trapframe *tf)
{
    if (tf != NULL && (tf->tf_trapno == T_DEBUG || tf->tf_trapno == T_BRKPT) &&
        (tf->tf_cs & 3) == 3)
    {
        void env_run(struct Env * e);
        extern struct Env *curenv;
        tf->tf_eflags |= FL_TF;
        env_run(curenv);
    }

    cprintf("Nothing running\n");
    return 0;
}

int mon_c(int argc, char **argv, struct Trapframe *tf)
{
    if (tf != NULL && (tf->tf_trapno == T_DEBUG || tf->tf_trapno == T_BRKPT) &&
        (tf->tf_cs & 3) == 3)
    {
        void env_run(struct Env * e);
        extern struct Env *curenv;

        tf->tf_eflags &= ~FL_TF;
        env_run(curenv);
    }

    cprintf("Nothing running\n");
    return 0;
}
```
然后修改 `trap_dispatch()`，增加 `case T_DEBUG:`
```c
switch (tf->tf_trapno)
{
case T_DEBUG:
case T_BRKPT:
    monitor(tf);
    return;
// (省略代码)
}
```
## Challenge 3
在执行 `SYSENTER` 指令时，`EIP` 和 `ESP` 会被设为相应 MSR 寄存器的值。特别地，CS 和 SS 描述符会被设为固定的值，即假定使用平坦寻址。

所以，这几个 MSR 寄存器需要初始化。在 `trap_init()` 中使用 `wrmsr` 指令：
```c
#define IA32_SYSENTER_CS 0x174
#define IA32_SYSENTER_ESP 0x175
#define IA32_SYSENTER_EIP 0x176
    void fast_system_call();
    asm volatile("wrmsr" : : "c"(IA32_SYSENTER_CS), "d"(0),
                             "a"(GD_KT));
    asm volatile("wrmsr" : : "c"(IA32_SYSENTER_ESP), "d"(0),
                             "a"(KSTACKTOP));
    asm volatile("wrmsr" : : "c"(IA32_SYSENTER_EIP), "d"(0),
                             "a"(fast_system_call));
```

`fast_system_call()` 用于处理快速系统调用，它直接调用 kern/syscall.c: `syscall()`。在这之前，先来看 lib/syscall.c。

在系统调用时会切换栈，所以用户态只能使用寄存器向内核态传参。8 个通用寄存器中，`ESP` 被 `SYSENTER` 破坏，1 个寄存器存储系统调用号，2 个寄存器存储用户态的 `EIP` 和 `ESP`，以备 `SYSEXIT` 从内核态返回用户态，其余 4 个传参。

以 `EBP` 和 `ESI` 存储用户态的 `EIP` 和 `ESP`，因为在 IA-32 默认的 cdecl 调用约定中，被调用函数不会破坏 `EBP` 和 `ESI`。

在 lib/syscall.c: `syscall()` 中添加一个 `switch`：
```c
switch (num)
{
case SYS_cputs: case SYS_cgetc: case SYS_getenvid: case SYS_env_destroy:
    asm volatile("pushl %%ebp\n"
                 "movl %%esp, %%ebp\n"
                 "leal 114514f, %%esi\n"
                 "sysenter\n"
                 "114514:\n"
                 "popl %%ebp\n"
                 : "=a"(ret)
                 : "a"(num), "d"(a1), "c"(a2), "b"(a3), "D"(a4)
                 : "%esi");
    break;
default:
    // 保留原有的，基于 int $0x30 的系统调用方法
    // (省略代码)
}
```

`default:` 标签保留原有的系统调用方法，因为它可以传递更多参数；而目前的 `SYS_cputs` 等系统调用，参数少于 5 个，可以使用 `SYSENTER` 快速系统调用。

这个 `switch` 不会带来性能问题：`num` 是编译期常数，而 lib/syscall.c: `syscall()` 又是内联的，编译器可以直接优化为：
```c
asm volatile("pushl %%ebp\n"
             "movl %%esp, %%ebp\n"
             "leal 114514f, %%esi\n"
             "sysenter\n"
             "114514:\n"
             "popl %%ebp\n"
             : "=a"(ret)
             : "a"(num), "d"(a1), "c"(a2), "b"(a3), "D"(a4)
             : "%esi", "cc", "memory");
```

简单来说，这段内联汇编将 `num` 存储于 `EAX`，`a1` 等 4 个参数也存储于相应的寄存器；`pushl %ebp` 和 `popl %ebp` 用于保存和恢复 `EBP`；`movl %esp, %ebp` 将用户态的 `ESP` 存储于 `EBP` 中；`leal 114514f, %esi` 将 `popl %ebp`，即 `sysenter` 后第一条指令的地址存储于 `ESI`。

这里，`popl %ebp` 前有标签 `114514`；而 `leal 114514f, %esi` 中的 `114514f` 表示在代码“forward”方向上的第一个名字叫 `114514` 的标签。这是 lib/syscall.c: `syscall()` **可以成为内联函数的关键**。

`sysenter` 进行快速系统调用，根据之前 MSR 寄存器中保存的信息，控制流会跳转到 `fast_system_call()`：
```asm
.global fast_system_call
.type fast_system_call, @function
.align 2
fast_system_call:
    pushl   $0
    pushl   %edi
    pushl   %ebx
    pushl   %ecx
    pushl   %edx
    pushl   %eax

    call    syscall

    movl    %esi,   %edx
    movl    %ebp,   %ecx
    sysexit
```

5 ~ 12 行传参并调用 kern/syscall.c: `syscall()`，14 和 15 行为 `sysexit` 提供相关信息。

`sysenter` 和 `sysexit` 的正确执行依赖于 GDT 的一些假定，而 JOS 的 GDT 满足这些假定。
