---
title: 操作系统实验 4
date: 2023-11-26 23:53:00
excerpt: MIT 6.828 JOS Lab 4
categories: JOS Lab
tags:
  - JOS
  - C/C++
  - 汇编
  - 操作系统
---
## Exercise 1 and 2
### `mmio_map_region()`
调用 `boot_map_region()` 即可。
```c
void *mmio_map_region(physaddr_t pa, size_t size)
{
    static uintptr_t base = MMIOBASE;

    // Your code here:
    if (size == 0)
        return (void *)base;
    uintptr_t ret = base;
    physaddr_t pa_start = ROUNDDOWN(pa, PGSIZE);
    physaddr_t pa_end = ROUNDUP(pa + size, PGSIZE);
    size_t real_size = pa_end - pa_start;
    if (base + real_size > MMIOLIM || pa_end < pa)
        panic("`%s': bigger than MMIOLIM.\n", __func__);
    base += real_size;
    boot_map_region(kern_pgdir, ret, real_size, pa_start,
                    PTE_PCD | PTE_PWT | PTE_W);
    return (void *)ret;
}
```
### `page_init`
在 `page_init()` 的最后，对 `MPENTRY_PADDR` 做出特判，将其排除在链表外。

```c
void page_init(void)
{
    pages[0].pp_ref = 1;

    for (size_t i = 1; i < npages_basemem; i++)
    {
        pages[i].pp_ref = 0;
        pages[i].pp_link = page_free_list;
        page_free_list = &pages[i];
    }

    size_t next_free_page_index = PGNUM(PADDR(boot_alloc(0)));
    for (size_t i = npages_basemem; i < next_free_page_index; i++)
    {
        pages[i].pp_ref = 1;
        pages[i].pp_link = NULL;
    }

    for (size_t i = next_free_page_index; i < npages; i++)
    {
        pages[i].pp_ref = 0;
        pages[i].pp_link = page_free_list;
        page_free_list = &pages[i];
    }

    // 以下为添加的内容
    size_t mpentry_page_id = PGNUM(MPENTRY_PADDR);

    if (mpentry_page_id == npages - 1)
        page_free_list = pages[mpentry_page_id].pp_link;
    else
        pages[mpentry_page_id + 1].pp_link = pages[mpentry_page_id].pp_link;

    pages[mpentry_page_id].pp_link == NULL;
    pages[mpentry_page_id].pp_ref = 1;
}
```

### Question 1
1. 宏 `MPBOOTPHYS` 用于计算对象在**运行期**的实际地址。
2. `mpentry.S` 中的代码，其链接时确定的地址不在 `MPENTRY_ADDR`，但实际运行时却要加载到 `MPENTRY_ADDR` 后再执行.并且，这段代码不是位置无关代码，因此需要宏 `MPBOOTPHYS` 在编译期计算出对象的绝对地址。
  `boot.S` 中的代码，其链接时确定的地址和实际加载运行的地址是一样的，因此不需要这个宏。
## Exercise 3 and 4
### `mem_init_mp()`
简单地使用 `boot_map_region()` 分配。
```c
static void mem_init_mp(void)
{
    for (size_t i = 0; i < NCPU; i++)
    {
        uintptr_t kstacktop_i = KSTACKTOP - i * (KSTKSIZE + KSTKGAP);
        boot_map_region(kern_pgdir, kstacktop_i - KSTKSIZE, KSTKSIZE,
                        PADDR(percpu_kstacks[i]), PTE_W);
    }
}
```
### `trap_init_percpu()`
初始化当前 CPU 的 TS 以及相应的 TSS 项，最终加载对应的 TSS 选择子和 IDT。
```c
void trap_init_percpu(void)
{
    int current_cpuid = cpunum();
    struct Taskstate *ts = &cpus[current_cpuid].cpu_ts;

    ts->ts_esp0 = KSTACKTOP - current_cpuid * (KSTKSIZE + KSTKGAP);
    ts->ts_ss0 = GD_KD;
    ts->ts_iomb = sizeof(struct Taskstate);

    // Initialize the TSS slot of the gdt.
    gdt[(GD_TSS0 >> 3) + current_cpuid] = SEG16(STS_T32A, (uint32_t)ts,
                    sizeof(struct Taskstate) - 1, 0);
    gdt[(GD_TSS0 >> 3) + current_cpuid].sd_s = 0;

    // Load the TSS selector (like other segment selectors, the
    // bottom three bits are special; we leave them 0)
    ltr(GD_TSS0 + (current_cpuid << 3));

    // Load the IDT
    lidt(&idt_pd);
}
```
## Exercise 5
### 代码
1. 在 `kern/init.c` 的 `i386_init()` 中获取锁：
```c
// Lab 4 multitasking initialization functions
pic_init();

// Acquire the big kernel lock before waking up APs
// You code here:
lock_kernel();

// Starting non-boot CPUs
boot_aps();
```
2. 在 `kern/init.c` 的 `mp_main()` 中获取锁：
```c
xchg(&thiscpu->cpu_status, CPU_STARTED); // tell boot_aps() we're up

// Now that we have finished some basic setup, call sched_yield()
// to start running processes on this CPU.  But make sure that
// only one CPU can enter the scheduler at a time!
//
// Your code here:
lock_kernel();
sched_yield();
```
3. 在 `kern/trap.c` 的 `trap()` 中获取锁：
```c
if ((tf->tf_cs & 3) == 3)
{
    // Trapped from user mode.
    // Acquire the big kernel lock before doing any
    // serious kernel work.
    // LAB 4: Your code here.
    lock_kernel();
    // ......
}
```
4. 在 `kern/env.c` 的 `env_run()` 中释放锁：
```c
unlock_kernel();
env_pop_tf(&e->env_tf);
```
### Question 2
在陷入内核后，才会尝试获取内核锁。这意味着在尝试获取内核锁之前，内核栈上已经保存了上下文。如果多个 CPU 共享内核栈，由于每个 CPU 的 `%esp` 是独立的，在多个 CPU 同时陷入内核时，后陷入内核的 CPU 可能会覆盖之前保存的信息。
## Exercise 6
### `sched_yield()`
简单地线性搜索 `envs`。
```c
void sched_yield(void)
{
    struct Env *idle = NULL;

    // LAB 4: Your code here.
    if (curenv != NULL)
    {
        size_t cur_env_idx = ENVX(curenv->env_id);
        for (size_t i = 1; i < NENV; i++)
        {
            if (envs[(cur_env_idx + i) % NENV].env_status == ENV_RUNNABLE)
            {
                idle = &envs[(cur_env_idx + i) % NENV];
                break;
            }
        }
        if (idle == NULL && curenv->env_status == ENV_RUNNING)
            idle = curenv;
    }
    else
    {
        for (size_t i = 0; i < NENV; i++)
        {
            if (envs[i].env_status == ENV_RUNNABLE)
            {
                idle = &envs[i];
                break;
            }
        }
    }

    if (idle != NULL)
        env_run(idle);

    // sched_halt never returns
    sched_halt();
}
```

### `kern/syscall.c/syscall()`
为 `switch` 增加一个 `case`。代码省略。

此外，对 Lab 3 做出小修改。在 Lab 3 的 `trap_dispatch()` 中，对于系统调用是这样处理的：

```c
case T_SYSCALL:
    tf->tf_regs.reg_eax = syscall(tf->tf_regs.reg_eax, tf->tf_regs.reg_edx,
                                      tf->tf_regs.reg_ecx, tf->tf_regs.reg_ebx,
                                      tf->tf_regs.reg_edi, tf->tf_regs.reg_esi);
    env_run(curenv);
```

这样做在 Lab 3 是合法的，但在 Lab 4，由于有了 `sys_yield()`，就不太好了。因此，`env_run(curev)` 改为 `return`
### Question 3

因为所有进程的地址空间，在内核部分都是一样的。

### Question 4

因为进程没有自己的独立内核栈，因此上下文必须保存在 `struct Env` 中，以便之后恢复上下文。

保存上下文是在 `trap()` 函数内实现的：

```c
// Copy trap frame (which is currently on the stack)
// into 'curenv->env_tf', so that running the environment
// will restart at the trap point.
curenv->env_tf = *tf;
// The trapframe on the stack should be ignored from here on.
tf = &curenv->env_tf;
```

## Exercise 7
### `sys_exofork()`
按要求设置新的 `struct Env` 即可。
```c
static envid_t sys_exofork(void)
{
    // LAB 4: Your code here.
    struct Env *new_env = NULL;
    int env_alloc_ret;

    env_alloc_ret = env_alloc(&new_env, curenv->env_id);
    if (env_alloc_ret < 0)
        return env_alloc_ret;

    new_env->env_status = ENV_NOT_RUNNABLE;
    new_env->env_tf = curenv->env_tf;
    new_env->env_tf.tf_regs.reg_eax = 0;

    return new_env->env_id;
}
```
### `sys_env_set_status()`
按要求实现。注意检查 `status`，同时 `envid2env()` 的最后一个参数传入 `1`。
```c
static int sys_env_set_status(envid_t envid, int status)
{
    // LAB 4: Your code here.
    struct Env *env_ptr;
    envid2env(envid, &env_ptr, 1);
    if (env_ptr == NULL)
        return -E_BAD_ENV;
    if (status != ENV_RUNNABLE && status != ENV_NOT_RUNNABLE)
        return -E_INVAL;

    env_ptr->env_status = status;
    return 0;
}
```
### `sys_page_alloc() 等函数`
首先定义两个辅助函数：
```c
// 检查 va 是否小于 UTOP，且页对齐.
// 返回 0，如果 ptr 不符合要求. 返回 1，如果 ptr 符合要求.
static int check_ptr(const void *const ptr)
{
    return (uintptr_t)ptr < UTOP && ((uintptr_t)ptr & (PGSIZE - 1)) == 0;
}

// 检查 perm 是否符合要求.
static int check_perm(int perm)
{
    return (perm & (PTE_U | PTE_P)) == (PTE_U | PTE_P) &&
           (perm & (~PTE_SYSCALL)) == 0;
}
```
然后就可以写 `sys_page_alloc()` 等函数，并在 `syscall()` 中加入相应的 `case`。注意 `sys_page_alloc()` 在页插入不成功时，需要解分配刚刚分配的页。
```c
static int sys_page_alloc(envid_t envid, void *va, int perm)
{
    // LAB 4: Your code here.
    struct Env *env_ptr = NULL;
    if (envid2env(envid, &env_ptr, 1) < 0)
        return -E_BAD_ENV;

    if (!check_ptr(va))
        return -E_INVAL;

    if (!check_perm(perm))
        return -E_INVAL;

    struct PageInfo *page_info_ptr = page_alloc(ALLOC_ZERO);

    if (page_info_ptr == NULL)
        return -E_NO_MEM;

    if (page_insert(env_ptr->env_pgdir, page_info_ptr, va, perm) < 0)
    {
        page_decref(page_info_ptr);
        return -E_NO_MEM;
    }

    return 0;
}
```
```c
static int sys_page_map(envid_t srcenvid, void *srcva, envid_t dstenvid,
                        void *dstva, int perm)
{
    // LAB 4: Your code here.
    struct Env *src_env_ptr = NULL, *dst_env_ptr = NULL;
    int envid2env_ret_1 = envid2env(srcenvid, &src_env_ptr, 1),
        envid2env_ret_2 = envid2env(dstenvid, &dst_env_ptr, 1);

    if (envid2env_ret_1 < 0 || envid2env_ret_2 < 0)
        return -E_BAD_ENV;

    if (!check_ptr(srcva) || !check_ptr(dstva))
        return -E_INVAL;

    pte_t *pte;
    struct PageInfo *src_page_info_ptr =
        page_lookup(src_env_ptr->env_pgdir, srcva, &pte);

    if (src_page_info_ptr == NULL)
        return -E_INVAL;

    if (!check_perm(perm) || (((*pte) & PTE_W) == 0 && (perm & PTE_W) != 0))
        return -E_INVAL;

    if (page_insert(dst_env_ptr->env_pgdir, src_page_info_ptr, dstva, perm) < 0)
        return -E_NO_MEM;

    return 0;
}
```
```c
static int sys_page_unmap(envid_t envid, void *va)
{
    // LAB 4: Your code here.
    struct Env *env_ptr = NULL;
    if (envid2env(envid, &env_ptr, 1) < 0)
        return -E_BAD_ENV;
    if (!check_ptr(va))
        return -E_INVAL;
    page_remove(env_ptr->env_pgdir, va);
    return 0;
}
```
## Exercise 8
按要求实现。注意 `envid2env()` 的最后一个参数传入 1。并在 `syscall()` 中加入相应的 `case`。
```c
static int sys_env_set_pgfault_upcall(envid_t envid, void *func)
{
    // LAB 4: Your code here.
    struct Env *env_ptr;
    if (envid2env(envid, &env_ptr, 1) < 0)
        return -E_BAD_ENV;

    env_ptr->env_pgfault_upcall = func;
    return 0;
}
```
## Exercise 9
### `page_fault_handler()`
先定义一个辅助函数。这用于销毁一个进程.
```c
// Destroy the environment that caused the fault.
static void page_fault_handler_err(struct Trapframe *tf, uint32_t fault_va)
{
    cprintf("[%08x] user fault va %08x ip %08x\n", curenv->env_id, fault_va,
            tf->tf_eip);
    print_trapframe(tf);
    env_destroy(curenv);
}
```

给出 `page_fault_handler()` 的代码，然后解释。
```c
void page_fault_handler(struct Trapframe *tf)
{
    uint32_t fault_va;

    // Read processor's CR2 register to find the faulting address
    fault_va = rcr2();

    // Handle kernel-mode page faults.

    // LAB 3: Your code here.
    if ((tf->tf_cs & 3) == 0)
        panic("Kernel panic with page fault\n");
    // LAB 4: Your code here.
    if (curenv->env_pgfault_upcall == NULL)
        page_fault_handler_err(tf, fault_va);

    user_mem_assert(curenv, curenv->env_pgfault_upcall, 1, PTE_U);

    if (fault_va < UXSTACKTOP - PGSIZE && fault_va >= UXSTACKTOP - 2 * PGSIZE)
        page_fault_handler_err(tf, fault_va);

    uint32_t new_esp = UXSTACKTOP - sizeof(struct UTrapframe);
    if (tf->tf_esp >= UXSTACKTOP - PGSIZE && tf->tf_esp < UXSTACKTOP)
        new_esp = tf->tf_esp - 4 - sizeof(struct UTrapframe);

    user_mem_assert(curenv, (void *)(new_esp), sizeof(struct UTrapframe),
                    PTE_U | PTE_W);
    struct UTrapframe *utf_ptr = (struct UTrapframe *)new_esp;

    utf_ptr->utf_esp = tf->tf_esp;
    utf_ptr->utf_eflags = tf->tf_eflags;
    utf_ptr->utf_eip = tf->tf_eip;
    utf_ptr->utf_regs = tf->tf_regs;
    utf_ptr->utf_err = tf->tf_err;
    utf_ptr->utf_fault_va = fault_va;

    tf->tf_esp = new_esp;
    tf->tf_eip = (uintptr_t)(curenv->env_pgfault_upcall);
    return;
}
```

这里，14 ~ 17 行检查是否设置 `env_pgfault_upcall()`，以及是否有访问权限。注意我对 `env_init()` 做了修改，使得 `struct Env` 初始化时，字段 `env_pgfault_upcall` 为 `NULL`。

22 ~ 26 行设置并检查新的栈指针。这里有个小插曲：一开始，在这里我写的是：

```c
user_mem_assert(curenv, (void *)(UXSTACKTOP - PGSIZE), PGSIZE,
                PTE_U | PTE_W);
if (fault_va < UXSTACKTOP - PGSIZE && fault_va >= UXSTACKTOP - 2 * PGSIZE)
    page_fault_handler_err(tf, fault_va);
uint32_t new_esp = UXSTACKTOP - sizeof(struct UTrapframe);
if (tf->tf_esp >= UXSTACKTOP - PGSIZE && tf->tf_esp < UXSTACKTOP)
    new_esp = tf->tf_esp - 4 - sizeof(struct UTrapframe);
if (new_esp < UXSTACKTOP - PGSIZE)
    page_fault_handler_err(tf, fault_va);
```

即在一开始就检查是否对 `UXSTACKTOP - PGSIZE` 处的页是否有访问权限。但这导致我一直无法通过 faultnostack 测试点。仔细阅读评分脚本，可知 faultnostack 测试点应当输出：
```text
user_mem_check assertion failure for va eebfff..
```
但由于我一开始就检查 `UXSTACKTOP - PGSIZE`，这会输出：
```text
user_mem_check assertion failure for va eebff0..
```

这是怎么回事呢？仔细阅读注释可知：

> *...The remaining three checks can be combined into a single test.*


因此，三个检查可以直接转化为一个检查：
```c
user_mem_assert(curenv, (void *)(new_esp), sizeof(struct UTrapframe),
                PTE_U | PTE_W);
```
并恰好可以通过 faultnostack 测试点.
## Exercise 10 and 11
### `_pgfault_upcall()`
先将返回地址保存到要返回的栈，然后恢复通用寄存器，切换栈指针，最后 `ret`。
```asm
.text
.globl _pgfault_upcall
_pgfault_upcall:
    // Call the C page fault handler.
    pushl %esp    // function argument: pointer to UTF
    movl _pgfault_handler, %eax
    call *%eax
    addl $4, %esp // pop function argument

    // LAB 4: Your code here.
    movl 48(%esp), %eax
    movl 40(%esp), %edx
    subl $4, %eax
    movl %edx, (%eax)
    movl %eax, 48(%esp)

    // Restore the trap-time registers.  After you do this, you
    // can no longer modify any general-purpose registers.
    // LAB 4: Your code here.
    addl $8, %esp
    popal
    // Restore eflags from the stack.  After you do this, you can
    // no longer use arithmetic operations or anything else that
    // modifies eflags.
    // LAB 4: Your code here.
    addl $4, %esp
    popf
    // Switch back to the adjusted trap-time stack.
    // LAB 4: Your code here.
    movl (%esp), %esp
    // Return to re-execute the instruction that faulted.
    // LAB 4: Your code here.
    ret
```
### `set_pgfault_handler()`
在 `_pgfault_handler` 为 `NULL` 时，分配用户异常栈空间，并设置 upcall 函数即可。
```c
void set_pgfault_handler(void (*handler)(struct UTrapframe *utf))
{
    if (_pgfault_handler == 0)
    {
        // First time through!
        // LAB 4: Your code here.
        int ret = 0;

        ret = sys_page_alloc(0, (void *)(UXSTACKTOP - PGSIZE), PTE_P | PTE_U | PTE_W);
        if (ret < 0)
            panic("`%s' error: %e", __func__, ret);

        ret = sys_env_set_pgfault_upcall(0, _pgfault_upcall);
        if (ret < 0)
            panic("`%s' error: %e", __func__, ret);
    }

    // Save handler pointer for assembly to call.
    _pgfault_handler = handler;
}
```
## Exercise 12
### `fork()`
首先，设置恰当的缺页处理函数，`exofork()` 一个新的进程，使用 `duppage()` 复制 `UTOP` 以下的映射（注意千万不要复制用户异常栈）。

然后，在父进程中，为子进程分配新的异常栈，设置 upcall，最终将子进程设为 `ENV_RUNNABLE`。
```c
envid_t fork(void)
{
    // LAB 4: Your code here.
    set_pgfault_handler(pgfault);

    int fork_ret = sys_exofork();
    if (fork_ret == 0)
        thisenv = &envs[ENVX(sys_getenvid())];

    else if (fork_ret > 0)
    {
        size_t page_addr = 0;
        while (page_addr < UTOP - PGSIZE)
        {
            if ((uvpd[PDX(page_addr)] & (PTE_P | PTE_U)) != (PTE_P | PTE_U))
            {
                page_addr += PGSIZE;
                continue;
            }
            if ((uvpt[PGNUM(page_addr)] & (PTE_P | PTE_U)) != (PTE_P | PTE_U))
            {
                page_addr += PGSIZE;
                continue;
            }

            duppage(fork_ret, PGNUM(page_addr));
            page_addr += PGSIZE;
        }

        int ret = sys_page_alloc(fork_ret, (void *)(UXSTACKTOP - PGSIZE),
                                 PTE_P | PTE_U | PTE_W);
        if (ret < 0)
            panic("1");
        ret = sys_env_set_pgfault_upcall(fork_ret, thisenv->env_pgfault_upcall);
        if (ret < 0)
            panic("2");
        ret = sys_env_set_status(fork_ret, ENV_RUNNABLE);
        if (ret < 0)
            panic("3");
    }

    return fork_ret;
}
```
### `duppage()`
按要求复制页面映射。需要注意 11 和 14 两行代码的顺序，不能颠倒。
```c
static int duppage(envid_t envid, unsigned pn)
{
    int r;
    pte_t pte = uvpt[pn];
    void *addr = (void *)(pn * PGSIZE);
    if ((pte & (PTE_P | PTE_U)) != (PTE_P | PTE_U))
        panic("`%s' error: pn %u is wrong.", __func__, pn);

    if ((pte & PTE_W) == PTE_W || (pte & PTE_COW) == PTE_COW)
    {
        r = sys_page_map(0, addr, envid, addr, PTE_P | PTE_U | PTE_COW);
        if (r < 0)
            panic("`%s' error: %e.", __func__, r);
        r = sys_page_map(0, addr, 0, addr, PTE_P | PTE_U | PTE_COW);
        if (r < 0)
            panic("`%s' error: %e.", __func__, r);
    }
    else
    {
        r = sys_page_map(0, addr, envid, addr, PTE_P | PTE_U);
        if (r < 0)
            panic("`%s' error: %e.", __func__, r);
    }
    // LAB 4: Your code here.
    return 0;
}
```
### `pgfault()`
按要求实现，注意对页的检查。第 11 行必须先检查 `uvpd[PDX(addr)] & PTE_P`。
```c
static void pgfault(struct UTrapframe *utf)
{
    void *addr = (void *)utf->utf_fault_va;
    uint32_t err = utf->utf_err;
    int r;

    // LAB 4: Your code here.

    addr = ROUNDDOWN(addr, PGSIZE);

    if ((uvpd[PDX(addr)] & PTE_P) != PTE_P ||
        (uvpt[PGNUM(addr)] & (PTE_P | PTE_U | PTE_COW)) !=
            (PTE_P | PTE_U | PTE_COW) ||
        (err & FEC_WR) != FEC_WR)
        panic("`%s' error: addr %x is wrong.\n", __func__, addr);

    // LAB 4: Your code here.
    r = sys_page_alloc(0, PFTEMP, PTE_P | PTE_U | PTE_W);
    if (r < 0)
        panic("`%s' error: %e\n", __func__, r);
    memcpy(PFTEMP, addr, PGSIZE);

    r = sys_page_map(0, PFTEMP, 0, addr, PTE_P | PTE_U | PTE_W);
    if (r < 0)
        panic("`%s' error: %e\n", __func__, r);
    r = sys_page_unmap(0, PFTEMP);
    if (r < 0)
        panic("`%s' error: %e\n", __func__, r);
}
```
## Exercise 13 and 14
分别在 `trapentry.S` 和 `trap.c` 中加入：
```c
TRAPHANDLER_NOEC(irq_timer_h, IRQ_OFFSET + IRQ_TIMER)
TRAPHANDLER_NOEC(irq_kbd_h, IRQ_OFFSET + IRQ_KBD)
TRAPHANDLER_NOEC(irq_serial_h, IRQ_OFFSET + IRQ_SERIAL)
TRAPHANDLER_NOEC(irq_spurious_h, IRQ_OFFSET + IRQ_SPURIOUS)
TRAPHANDLER_NOEC(irq_ide_h, IRQ_OFFSET + IRQ_IDE)
TRAPHANDLER_NOEC(irq_error_h, IRQ_OFFSET + IRQ_ERROR)
```
```c
DefAndSetGate(idt[IRQ_OFFSET + IRQ_TIMER], 0, GD_KT, irq_timer_h, 3);
DefAndSetGate(idt[IRQ_OFFSET + IRQ_KBD], 0, GD_KT, irq_kbd_h, 3);
DefAndSetGate(idt[IRQ_OFFSET + IRQ_SERIAL], 0, GD_KT, irq_serial_h, 3);
DefAndSetGate(idt[IRQ_OFFSET + IRQ_SPURIOUS], 0, GD_KT, irq_spurious_h, 3);
DefAndSetGate(idt[IRQ_OFFSET + IRQ_IDE], 0, GD_KT, irq_ide_h, 3);
DefAndSetGate(idt[IRQ_OFFSET + IRQ_ERROR], 0, GD_KT, irq_error_h, 3);
```

在 `env_alloc()` 中加入：
```c
// Enable interrupts while in user mode.
// LAB 4: Your code here.
e->env_tf.tf_eflags |= FL_IF;
```

并在 `trap_dispatch()` 中的 `switch` 加入一个 `case`：
```c
case IRQ_OFFSET + IRQ_TIMER:
    lapic_eoi();
    sched_yield();
    return;
```

## Exercise 15
### `sys_ipc_try_send()` 与 `sys_ipc_recv()`
需要注意其中的各种检查。

```c
static int sys_ipc_try_send(envid_t envid, uint32_t value, void *srcva,
                            unsigned perm)
{
    // LAB 4: Your code here.
    struct Env *dst_env = NULL;
    int ret = envid2env(envid, &dst_env, 0);
    if (ret < 0)
        return -E_BAD_ENV;
    if (!dst_env->env_ipc_recving || dst_env->env_status != ENV_NOT_RUNNABLE)
        return -E_IPC_NOT_RECV;

    if ((uintptr_t)srcva < UTOP && (uintptr_t)dst_env->env_ipc_dstva < UTOP)
    {
        if (((uintptr_t)srcva & (PGSIZE - 1)) != 0)
            return -E_INVAL;
        if (!check_perm(perm))
            return -E_INVAL;
        pte_t *pte;
        struct PageInfo *page = page_lookup(curenv->env_pgdir, srcva, &pte);
        if (page == NULL)
            return -E_INVAL;
        if ((*pte & PTE_W) == 0 && (perm & PTE_W) == PTE_W)
            return -E_INVAL;
        ret =
            page_insert(dst_env->env_pgdir, page, dst_env->env_ipc_dstva, perm);
        if (ret < 0)
            return -E_NO_MEM;
    }

    dst_env->env_ipc_recving = 0;
    dst_env->env_ipc_from = curenv->env_id;
    dst_env->env_ipc_value = value;
    dst_env->env_ipc_perm = perm;
    dst_env->env_status = ENV_RUNNABLE;
    dst_env->env_tf.tf_regs.reg_eax = 0;
    return 0;
}

static int sys_ipc_recv(void *dstva)
{
    // LAB 4: Your code here.
    if ((uintptr_t)dstva < UTOP)
    {
        if (((uintptr_t)dstva & (PGSIZE - 1)) != 0)
            return -E_INVAL;
    }

    curenv->env_ipc_dstva = dstva;
    curenv->env_ipc_recving = 1;
    curenv->env_status = ENV_NOT_RUNNABLE;
    sys_yield();
    return 0;
}
```

### `ipc_send()` 与 `ipc_send()`

在这两个函数中，如果 `pg` 为 `NULL`，则会向对应的系统调用传入 `UTOP`。

```c
void ipc_send(envid_t to_env, uint32_t val, void *pg, int perm)
{
    // LAB 4: Your code here.
    if (pg == NULL)
        pg = (void *)UTOP;
    while (1)
    {
        int ret = sys_ipc_try_send(to_env, val, pg, perm);
        if (ret == -E_IPC_NOT_RECV)
        {
            sys_yield();
            continue;
        }
        if (ret == 0)
            return;
        panic("`%s' error: %e\n", __func__, ret);
    }
}
```

```c
int32_t ipc_recv(envid_t *from_env_store, void *pg, int *perm_store)
{
    // LAB 4: Your code here.
    if (pg == NULL)
        pg = (void *)UTOP;

    int ret = sys_ipc_recv(pg);
    if (ret < 0)
        return ret;

    if (from_env_store != NULL)
        *from_env_store = thisenv->env_ipc_from;
    if (perm_store != NULL)
        *perm_store = thisenv->env_ipc_perm;
    return thisenv->env_ipc_value;
}
```
## Challenge 3
Intel 手册 *Intel® 64 and IA-32 Architectures Software Developer's Manual Volume 2A* 对 `FXSAVE` 指令指出：

> *Saves the current state of the x87 FPU, MMX technology, XMM, and MXCSR registers to a 512-byte memory location specified in the destination operand.*
> *The destination operand contains the first byte of the memory image, and it must be aligned on a 16-byte boundary.*

对 `FXRSTOR` 指令指出：

> *Reloads the x87 FPU, MMX technology, XMM, and MXCSR registers from the 512-byte memory image specified in the source operand. This data should have been written to memory previously using the FXSAVE instruction, and in the same format as required by the operating modes.*

即 `FXSAVE` 和 `FXRSTOR` 需要 512 字节大小，且 16 字节对齐的内存空间来保存和恢复浮点状态。我选择在 `struct Env` 中留出 512 字节空间（且 16 字节对齐），用来保存浮点状态。即，原来的 `struct Env` 是这样的：

```c
struct Env
{
    // ......
    int env_ipc_perm;           // Perm of page mapping received
};
```

现在需要改成这样：
```c
struct Env
{
    // ......
    int env_ipc_perm;           // Perm of page mapping received

    int padding;                // 为了 16 字节对齐而增加 padding
    char float_regs[512];
} __attribute__((aligned(16)));
```

那么，在上下文切换的时候，怎样保存/恢复浮点状态呢？注意到 JOS 内核并不会使用浮点寄存器。

在 `trap()` 中加入：
```c
if ((tf->tf_cs & 3) == 3)
{
    // Trapped from user mode.
    // Acquire the big kernel lock before doing any
    // serious kernel work.
    // LAB 4: Your code here.
    lock_kernel();
    assert(curenv);
    // 下面一行是新增的
    asm volatile("fxsave (%0)" ::"r"(&curenv->float_regs) : "memory");

    // ......
}
```

在 `env_run()` 中加入：
```c
void env_run(struct Env *e)
{
    // ......

    lcr3(PADDR(curenv->env_pgdir));
    // 下面一行是新增的
    asm volatile("fxrstor (%0)" ::"r"(curenv->float_regs) : "memory");
    unlock_kernel();
    env_pop_tf(&(curenv->env_tf));
}
```

以上即 Challenge 3 的全部代码。下面修改 `user_yield` 程序进行验证。

```c
#include <inc/lib.h>

void umain(int argc, char **argv)
{
    int i;

    int tmp1 = thisenv->env_id;
    asm volatile("movd (%0), %%mm0" ::"r"(&tmp1) : "memory");
    int tmp2;
    cprintf("Hello, I am environment %08x.\n", thisenv->env_id);
    for (i = 0; i < 5; i++)
    {
        sys_yield();
        asm volatile("movd %%mm0, (%0)" ::"r"(&tmp2) : "memory");
        cprintf("Back in environment %08x, iteration %d. tmp2 is %08x\n",
                thisenv->env_id, i, tmp2);
        tmp2 = 7;
    }
    cprintf("All done in environment %08x.\n", thisenv->env_id);
}
```

在修改的 `user_yield` 中，7、8 两行将 `thisenv->env_id` 放入 MMX 指令集定义的 `%mm0` 寄存器，第 14 行在每次 yield 返回后，将 `%mm0` 寄存器的值移入 `tmp2`。

第 15、16 行打印相关信息，包括打印 `tmp2`。而第 17 行故意破坏 `tmp2`。

运行 `make qemu-nox`，结果如下：
```text
SMP: CPU 0 found 1 CPU(s)
enabled interrupts: 1 2
[00000000] new env 00001000
[00000000] new env 00001001
[00000000] new env 00001002
Hello, I am environment 00001000.
Hello, I am environment 00001001.
Hello, I am environment 00001002.
Back in environment 00001000, iteration 0. tmp2 is 00001000
Back in environment 00001001, iteration 0. tmp2 is 00001001
Back in environment 00001002, iteration 0. tmp2 is 00001002
Back in environment 00001000, iteration 1. tmp2 is 00001000
Back in environment 00001001, iteration 1. tmp2 is 00001001
Back in environment 00001000, iteration 2. tmp2 is 00001000
Back in environment 00001001, iteration 2. tmp2 is 00001001
Back in environment 00001002, iteration 1. tmp2 is 00001002
Back in environment 00001000, iteration 3. tmp2 is 00001000
Back in environment 00001001, iteration 3. tmp2 is 00001001
Back in environment 00001002, iteration 2. tmp2 is 00001002
Back in environment 00001000, iteration 4. tmp2 is 00001000
All done in environment 00001000.
[00001000] exiting gracefully
[00001000] free env 00001000
Back in environment 00001001, iteration 4. tmp2 is 00001001
All done in environment 00001001.
[00001001] exiting gracefully
[00001001] free env 00001001
Back in environment 00001002, iteration 3. tmp2 is 00001002
Back in environment 00001002, iteration 4. tmp2 is 00001002
All done in environment 00001002.
[00001002] exiting gracefully
[00001002] free env 00001002
No runnable environments in the system!
```

可以看到 `env_id` 与 `tmp2` 的对应关系。

而如果**删去** `FXSAVE` 与 `FXRSTOR` 指令对应的代码，将会看见如下的输出，`env_id` 与 `tmp2` 之间毫无关系。

```text
SMP: CPU 0 found 1 CPU(s)
enabled interrupts: 1 2
[00000000] new env 00001000
[00000000] new env 00001001
[00000000] new env 00001002
Hello, I am environment 00001000.
Hello, I am environment 00001001.
Hello, I am environment 00001002.
Back in environment 00001000, iteration 0. tmp2 is 00001002
Back in environment 00001001, iteration 0. tmp2 is 00001002
Back in environment 00001002, iteration 0. tmp2 is 00001002
Back in environment 00001000, iteration 1. tmp2 is 00001002
Back in environment 00001001, iteration 1. tmp2 is 00001002
Back in environment 00001000, iteration 2. tmp2 is 00001002
Back in environment 00001001, iteration 2. tmp2 is 00001002
Back in environment 00001002, iteration 1. tmp2 is 00001002
Back in environment 00001000, iteration 3. tmp2 is 00001002
Back in environment 00001001, iteration 3. tmp2 is 00001002
Back in environment 00001002, iteration 2. tmp2 is 00001002
Back in environment 00001000, iteration 4. tmp2 is 00001002
Back in environment 00001001, iteration 4. tmp2 is 00001002
All done in environment 00001001.
[00001001] exiting gracefully
[00001001] free env 00001001
All done in environment 00001000.
[00001000] exiting gracefully
[00001000] free env 00001000
Back in environment 00001002, iteration 3. tmp2 is 00001002
Back in environment 00001002, iteration 4. tmp2 is 00001002
All done in environment 00001002.
[00001002] exiting gracefully
[00001002] free env 00001002
No runnable environments in the system!
```
可见 `%mm0` 确实是由 `FXSAVE` 与 `FXRSTOR` 保存和恢复的，即我对 Challenge 3 的解答是正确的。
