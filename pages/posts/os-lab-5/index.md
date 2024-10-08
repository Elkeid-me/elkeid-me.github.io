---
title: 操作系统实验 5
date: 2023-12-17 23:53:00
excerpt: MIT 6.828 JOS Lab 5
categories: JOS Lab
tags:
  - JOS
  - C/C++
  - 汇编
  - 操作系统
---

选择了 Challenge 2：文件缓存的驱逐机制。

## 对 MIT 代码的修改

JOS Lab 最后更新于 2018 年。5 年来，GCC有了诸多更新，原有的 JOS 代码在新的 GCC 上会报错。在报告的这一部分，我将描述对原有 MIT 代码的修改，以使其通过现在 GCC 的编译检查。

### 修复变量重定义错误

在原有的代码中，`struct Super *super` 和 `uint32_t *bitmap` 定义在 `fs/fs.h`。然而 `fs/fs.h` 被多个源文件引用，这些源文件会分别编译，并链接到一起。这样，`super` 和 `bitmap` 在链接时就会有多重定义。

我的解决方案是：把 `super` 和 `bitmap` 的定义从 `fs/fs.h` 移至 `fs/bc.c`。而在 `fs/fs.c` 和 `fs/test.c`，对 `super` 和 `bitmap` 的声明加 `extern`。

### 绕过 GCC 的对齐检查

在 `lib/spawn.c` 的 `spawn()` 函数中，有这样一句：

```c
if ((r = init_stack(child, argv, &child_tf.tf_esp)) < 0)
    return r;
```

然而，现在的 GCC 认为，对 `child_tf.tf.esp` 取地址会无法满足对齐要求（因为 `struct Trapframe` 以 `__attribute__((packed))` 声明）。

注意到 JOS 提供了 `offsetof` 宏。可以借此绕过对齐检查：

```c
if ((r = init_stack(child, argv,
                    (uintptr_t *)(((char *)&child_tf)
                     + offsetof(struct Trapframe, tf_esp)))) < 0)
    return r;
```

（题外话：一开始我没有写 `(char *)`，导致大量 Page fault……所以指针加法一定要注意类型啊。）

## Exercise 1

在 `env_create()` 中加入：

```c
// If this is the file server (type == ENV_TYPE_FS) give it I/O privileges.
// LAB 5: Your code here.
new_env->env_tf.tf_eflags &= ~FL_IOPL_MASK;
if (type == ENV_TYPE_FS)
    new_env->env_tf.tf_eflags |= FL_IOPL_3;
else
    new_env->env_tf.tf_eflags |= FL_IOPL_0;
```

当然，这样的代码只是为了可读性。实际上完全可以写成：

```c
if (type == ENV_TYPE_FS)
    new_env->env_tf.tf_eflags |= FL_IOPL_3;
```

### Question 1

不需要做任何事。因为上下文切换时会自动保存和恢复 `EFLAGS`。

## Exercise 2

在 `bc_pgfault()` 中加入：

```c
// LAB 5: you code here:
addr = ROUNDDOWN(addr, PGSIZE);
r = sys_page_alloc(0, addr, PTE_P | PTE_U | PTE_W);
if (r < 0)
    panic("`%s' error: %e.", __func__, r);
r = ide_read(blockno * BLKSECTS, addr, BLKSECTS);
if (r < 0)
    panic("`%s' error: %e.", __func__, r);
```

在 `flush_block()` 中加入：

```c
// LAB 5: Your code here.
addr = ROUNDDOWN(addr, BLKSIZE);
if (!va_is_mapped(addr) || !va_is_dirty(addr))
    return;

int ret = ide_write(blockno * BLKSECTS, addr, BLKSECTS);
if (ret < 0)
    panic("`%s' error: %e.", __func__, ret);
ret = sys_page_map(0, addr, 0, addr, uvpt[PGNUM(addr)] & PTE_SYSCALL);
if (ret < 0)
    panic("`%s' error: %e.", __func__, ret);
```

## Exercise 3

简单地线性搜索空闲块即可。

```c
int alloc_block(void)
{
    // The bitmap consists of one or more blocks.  A single bitmap block
    // contains the in-use bits for BLKBITSIZE blocks.  There are
    // super->s_nblocks blocks in the disk altogether.

    // LAB 5: Your code here.
    if (!super)
        panic("no super block");
    const uint32_t n_blocks = super->s_nblocks;
    for (uint32_t i = 0; i < n_blocks; i++)
    {
        if (block_is_free(i))
        {
            bitmap[i / 32] &= ~(1 << (i % 32));
            flush_block(bitmap);
            return i;
        }
    }
    return -E_NO_DISK;
}
```

## Exercise 4

### `file_block_walk()`

先保证块号合法，此后检查直接块，最后检查间接块。必要时分配一个间接块。

```c
static int file_block_walk(struct File *f, uint32_t filebno,
                           uint32_t **ppdiskbno, bool alloc)
{
    // LAB 5: Your code here.
    if (filebno >= NDIRECT + NINDIRECT)
        return -E_INVAL;
    if (filebno < NDIRECT)
    {
        *ppdiskbno = f->f_direct + filebno;
        return 0;
    }
    filebno -= NDIRECT;
    if (f->f_indirect == 0)
    {
        if (!alloc)
            return -E_NOT_FOUND;
        int new_indirect_block = alloc_block();
        if (new_indirect_block < 0)
            return new_indirect_block;
        f->f_indirect = new_indirect_block;
        memset(diskaddr(f->f_indirect), 0, BLKSIZE);
    }
    *ppdiskbno = (uint32_t *)diskaddr(f->f_indirect) + filebno;
    return 0;
}
```
### `file_get_block()`

依靠 `file_block_walk()` 寻找对应的块号指针，必要时分配一个块，然后返回相应的地址。

```c
int file_get_block(struct File *f, uint32_t filebno, char **blk)
{
    // LAB 5: Your code here.
    uint32_t *disk_block = NULL;
    int r = file_block_walk(f, filebno, &disk_block, 1);
    if (r < 0)
        return r;
    if (*disk_block == 0)
    {
        r = alloc_block();
        if (r < 0)
            return r;
        *disk_block = r;
    }
    *blk = (char *)diskaddr(*disk_block);
#ifdef Lab_5_Challenge_2
    r = buffer_visit();
    if (r < 0)
        return r;
#endif
    return 0;
}
```
## Exercise 5

通过 `openfile_lookup()` 查看已经打开的对应文件，然后用 `file_read()` 写入。最后更新 `offset`。

```c
int serve_read(envid_t envid, union Fsipc *ipc)
{
    struct Fsreq_read *req = &ipc->read;
    struct Fsret_read *ret = &ipc->readRet;

    if (debug)
        cprintf("serve_read %08x %08x %08x\n", envid, req->req_fileid,
                req->req_n);

    // Lab 5: Your code here:
    struct OpenFile *open_file = NULL;
    int r = openfile_lookup(envid, req->req_fileid, &open_file);
    if (r < 0)
        return r;

    r = file_read(open_file->o_file, ret->ret_buf, req->req_n,
                  open_file->o_fd->fd_offset);
    if (r < 0)
        return r;
    open_file->o_fd->fd_offset += r;
    return r;
}
```
## Exercise 6

### `serve_write()`

仿照 `serve_read()` 实现即可。

```c
int serve_write(envid_t envid, struct Fsreq_write *req)
{
    if (debug)
        cprintf("serve_write %08x %08x %08x\n", envid, req->req_fileid,
                req->req_n);

    // LAB 5: Your code here.
    struct OpenFile *open_file = NULL;
    int r = openfile_lookup(envid, req->req_fileid, &open_file);
    if (r < 0)
        return r;

    r = file_write(open_file->o_file, req->req_buf, req->req_n,
                   open_file->o_fd->fd_offset);
    if (r < 0)
        return r;
    open_file->o_fd->fd_offset += r;
    return r;
}
```
### `devfile_write()`

仿照 `devfile_read()` 实现即可。

```c
static ssize_t devfile_write(struct Fd *fd, const void *buf, size_t n)
{
    // Make an FSREQ_WRITE request to the file system server.  Be
    // careful: fsipcbuf.write.req_buf is only so large, but
    // remember that write is always allowed to write *fewer*
    // bytes than requested.
    // LAB 5: Your code here
    assert(n <= sizeof(fsipcbuf.write.req_buf));
    fsipcbuf.write.req_fileid = fd->fd_file.id;
    fsipcbuf.write.req_n = n;
    memcpy(fsipcbuf.write.req_buf, buf, n);
    int r = fsipc(FSREQ_WRITE, NULL);
    if (r < 0)
        return r;
    assert(r <= n);
    return r;
}
```

## Exercise 7

设置段寄存器的权限位以及 `EFLAGS` 中的标记位即可。特别注意 `envid2env()` 的 `checkperm` 传入 1。另外，在 `syscall()` 中添加 `case` 以正确分派 `SYS_env_set_trapframe`。

```c
static int sys_env_set_trapframe(envid_t envid, struct Trapframe *tf)
{
    // LAB 5: Your code here.
    // Remember to check whether the user has supplied us with a good
    // address!
    struct Env *env_ptr;
    if (envid2env(envid, &env_ptr, 1) < 0)
        return -E_BAD_ENV;
    env_ptr->env_tf = *tf;

    env_ptr->env_tf.tf_cs |= GD_UT | 3;
    env_ptr->env_tf.tf_ss |= GD_UD | 3;
    env_ptr->env_tf.tf_ds |= GD_UD | 3;
    env_ptr->env_tf.tf_es |= GD_UD | 3;

    env_ptr->env_tf.tf_eflags |= FL_IF;
    env_ptr->env_tf.tf_eflags &= ~FL_IOPL_MASK;
    env_ptr->env_tf.tf_eflags |= FL_IOPL_0;

    return 0;
}
```

## Exercise 8

### duppage()

这意味着判断 `!(pte & PTE_SHARE)` 才进行 COW 复制。此外，调用 `sys_page_map()` 时的 `perm` 也与 Lab 4 有区别。

```c
static int duppage(envid_t envid, unsigned pn)
{
    int r;
    pte_t pte = uvpt[pn];
    void *addr = (void *)(pn * PGSIZE);
    if ((pte & (PTE_P | PTE_U)) != (PTE_P | PTE_U))
        panic("`%s' error: pn %u is wrong.", __func__, pn);

    if (!(pte & PTE_SHARE) && ((pte & PTE_W) || (pte & PTE_COW)))
    {
        r = sys_page_map(0, addr, envid, addr,
                         (pte & PTE_SYSCALL & ~PTE_W) | PTE_COW);
        if (r < 0)
            panic("`%s' error: %e.", __func__, r);
        r = sys_page_map(0, addr, 0, addr,
                         (pte & PTE_SYSCALL & ~PTE_W) | PTE_COW);
        if (r < 0)
            panic("`%s' error: %e.", __func__, r);
    }
    else
    {
        r = sys_page_map(0, addr, envid, addr, pte & PTE_SYSCALL);
        if (r < 0)
            panic("`%s' error: %e.", __func__, r);
    }
    return 0;
}

```
### `copy_shared_pages()`

逐页映射即可；遇到未映射的页目录项可以直接跳过 4 MB。

```c
static int copy_shared_pages(envid_t child)
{
    // LAB 5: Your code here.
    uintptr_t address = 0;
    while (address < UTOP)
    {
        if (uvpd[PDX(address)] & PTE_P)
        {
            pte_t pte = uvpt[PGNUM(address)];
            if ((pte & (PTE_P | PTE_U | PTE_SHARE)) ==
                (PTE_P | PTE_U | PTE_SHARE))
            {
                int r = sys_page_map(0, (void *)address, child,
                                     (void *)address, pte & PTE_SYSCALL);
                if (r < 0)
                    return r;
            }
            address += PGSIZE;
        }
        else
            address += PTSIZE;
    }
    return 0;
}
```
## Exercise 9

只需要在 `trap_dispatch()` 中的 `switch()` 增加两个 `case`：

```c
case IRQ_OFFSET + IRQ_KBD:
    kbd_intr();
    lapic_eoi();
    return;
case IRQ_OFFSET + IRQ_SERIAL:
    serial_intr();
    lapic_eoi();
    return;
```
## Exercise 10

仿照输出重定向即可。注意 Unix Style 的输入文件描述符是 0。

```c
// LAB 5: Your code here.
if ((fd = open(t, O_RDONLY)) < 0)
{
    cprintf("open %s for read: %e", t, fd);
    exit();
}
if (fd != 0)
{
    dup(fd, 0);
    close(fd);
}
```
## Challenge 2

我添加了一个结构：`struct buffer_block`，用于标记在内存中分配地址的文件块。即，每一个内存中分配地址的文件块，会对应一个分配的 `struct buffer_block`。

`buffer_block` 至多有 `N_BUFFER` 个，通过空闲链表 `buffer_free` 和已分配链表 `buffer_used` 管理。

当已分配的 `buffer_block` 达到 `N_BUFFER` 个时，会尝试驱逐一些块。优先驱逐没有 `PTE_A` 的块。如果没有这样的块，则会优先驱逐最先加入已分配链表的块。

每次调用 `bc_pgfault()` 时，会为文件块分配一个新的内存块。这时，也会分配一个新的 `buffer_block`。而每次 `file_get_block()` 时，会调用 `buffer_visit()`。`buffer_visit()` 会更新一个访问计数器；当访问计数器增加到一定值时，会清除所有的 `PTE_A`。

这样，可以近似达到 LRU 的效果。接下来是代码：

```c
// in fs.c
#define N_BUFFER 1024
#define N_VISIT 256

int n_visit = 0;
struct buffer_block
{
    struct buffer_block *prev, *next;
    void *buffer_ptr;
};

struct buffer_block buffers[N_BUFFER];
struct buffer_block buffer_free, buffer_used;
int n_buffer_used;

int buffer_alloc(void *ptr)
{
    if (ptr < diskaddr(2))
        return 0;
    cprintf("new block\n");
    if (n_buffer_used == N_BUFFER)
    {
        int r = buffer_evict();
        if (r < 0)
            return r;
    }

    struct buffer_block *new_block = buffer_free.next;
    buffer_free.next->next->prev = &buffer_free;
    buffer_free.next = buffer_free.next->next;

    new_block->next = &buffer_used;
    new_block->prev = buffer_used.prev;

    buffer_used.prev->next = new_block;
    buffer_used.prev = new_block;

    new_block->buffer_ptr = ptr;
    n_buffer_used++;
    return 0;
}

int buffer_visit(void)
{
    n_visit++;
    if (n_visit < N_VISIT)
        return 0;

    n_visit = 0;

    for (struct buffer_block *p = buffer_used.next; p != &buffer_used;
         p = p->next)
    {
        flush_block(p->buffer_ptr);
        int r = sys_page_map(0, p->buffer_ptr, 0, p->buffer_ptr,
                             uvpt[PGNUM(p->buffer_ptr)] & PTE_SYSCALL);
        if (r < 0)
            return r;
    }

    return 0;
}

int buffer_evict(void)
{
    struct buffer_block *p = buffer_used.next;
    while (p != &buffer_used)
    {
        struct buffer_block *p_next = p->next;
        if (!(uvpt[PGNUM(p->buffer_ptr)] & PTE_A))
        {
            flush_block(p->buffer_ptr);
            int r = sys_page_unmap(0, p->buffer_ptr);
            if (r < 0)
                return r;
            p->prev->next = p->next;
            p->next->prev = p->prev;

            p->buffer_ptr = NULL;

            p->prev = buffer_free.prev;
            buffer_free.prev->next = p;
            p->next = &buffer_free;
            buffer_free.prev = p;

            n_buffer_used--;
        }
        p = p_next;
    }
    if (n_buffer_used == N_BUFFER)
    {
        p = buffer_used.next;
        flush_block(p->buffer_ptr);
        int r = sys_page_unmap(0, p->buffer_ptr);
        if (r < 0)
            return r;
        p->prev->next = p->next;
        p->next->prev = p->prev;

        p->buffer_ptr = NULL;

        p->prev = buffer_free.prev;
        buffer_free.prev->next = p;
        p->next = &buffer_free;
        buffer_free.prev = p;
        n_buffer_used--;
    }
    return 0;
}

void buffer_init(void)
{
    buffer_free.next = buffers;
    buffers[0].prev = &buffer_free;
    buffers[0].next = buffers + 1;
    for (size_t i = 1; i < N_BUFFER - 1; i++)
    {
        buffers[i].prev = buffers + i - 1;
        buffers[i].next = buffers + i + 1;
    }
    buffers[N_BUFFER - 1].prev = buffers + N_BUFFER - 2;
    buffers[N_BUFFER - 1].next = &buffer_free;
    buffer_free.prev = buffers + N_BUFFER - 1;

    buffer_used.next = &buffer_used;
    buffer_used.prev = &buffer_used;
}
```

在 `file_get_block()` 后：

```c
    *blk = (char *)diskaddr(*disk_block);
// 以下是新添加的
r = buffer_visit();
if (r < 0)
    return r;
// 以上是新添加的
return 0;
```

`free_block()` 后也可以从内存中解分配：

```c
void free_block(uint32_t blockno)
{
	// Blockno zero is the null pointer of block numbers.
	if (blockno == 0)
		panic("attempt to free zero block");
	bitmap[blockno/32] |= 1<<(blockno%32);
    // 以下是新添加的
    int r = sys_page_unmap(0, diskaddr(blockno));
	if (r < 0)
		panic("`%s', error: %e.", __func__, r);
}
```

在 `bc_pgfault()` 后要调用 `buffer_alloc()`：

```c
// in bc.c, function `bc_pgfault()`
// Check that the block we read was allocated. (exercise for
// the reader: why do we do this *after* reading the block
// in?)
if (bitmap && block_is_free(blockno))
    panic("reading free block %08x\n", blockno);

int buffer_alloc(void *ptr);
r = buffer_alloc(addr);
if (r < 0)
    panic("`%s' error: %e", __func__, r);
```

在 `bc_init()` 中调用 `buffer_init()`：

```c
void bc_init(void)
{
	void buffer_init(void);
	buffer_init();
    // ......
}
```
在测试中，可以使用较小的 `N_BUFFER` 和 `N_VISIT`（如 16 和 4），以便在 testfile 的大文件测试中出现驱逐现象。

## 附录：以往的 Challenge

在这一部分，我将回顾以往的 Challenge，并添加补充说明。

### Lab 1

Lab 1 中，我选择了唯一的 Challenge：JOS console 的彩色输出。这部分代码在后续的 Lab 中无需改动。

### Lab 2

Lab 2 中，我选择了 Challenge 1：内核部分虚拟内存使用 4 MB 大页，以及 Challenge 2：虚拟内存映射相关的 JOS monitor 命令。

#### Lab 2 Challenge 1

在 Lab 2 Challenge 1 中，在映射内核部分的虚拟内存时，使用了 4 MB 大页（如果处理器支持的话）。这需要修改 `CR4` 寄存器的 `PSE` 标记位：

```c
// in pmap.c, function `mem_init()`
uint32_t edx = 0;
cpuid(1, NULL, NULL, NULL, &edx);
int is_large_page_supported = (edx >> 3) & 1;
if (is_large_page_supported)
{
    uint32_t cr4 = rcr4();
    cr4 |= CR4_PSE;
    lcr4(cr4);
    is_large_page_enabled = 1; // 全局变量
    boot_map_region_large_page(kern_pgdir, KERNBASE,
                                (size_t)((1ull << 32) - KERNBASE), 0, PTE_W);
}
else
{
    boot_map_region(kern_pgdir, KERNBASE, (size_t)((1ull << 32) - KERNBASE),
                    0, PTE_W);
}
```

而 Lab 4 启用了多处理器支持。因此，每个处理器核心都需要 `CR4` 寄存器的 `PSE` 标记位。在 `mp_main()` 中：

```c
// in init.c, function `mp_main()`
// We are in high EIP now, safe to switch to kern_pgdir
// `is_large_page_enabled` 是 `pmap.c` 中的全局变量
extern int is_large_page_enabled;
if (is_large_page_enabled)
{
    uint32_t cr4 = rcr4();
    cr4 |= CR4_PSE;
    lcr4(cr4);
}
lcr3(PADDR(kern_pgdir));
```

#### Lab 2 Challenge 2

这部分代码实在没有用处，因此，自 Lab 3 起，我删除了这部分代码。

### Lab 3

Lab 3 中，我选择了 Challenge 2：JOS monitor 的继续与单步运行命令与 Challenge 3：使用 `sysenter` 与 `sysexit` 指令实现快速系统调用。

#### Lab 3 Challenge 2

这部分代码无需改动。

#### Lab 3 Challenge 3

在 Lab 3 Challenge 3 中，我使用 `sysenter` 和 `sysexit` 指令实现了快速系统调用。

```c
// in trap.c, function `trap_init()`
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

```c
// in lib/syscall.c, function `syscall()`
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
                 : "%esi", "memory");
    break;
default:
    // 保留原有的，基于 int $0x30 的系统调用方法
    // (省略代码)
}
```

```asm
// in trapentry.S
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

而 Lab 4 启用了多处理器支持，需要对每个处理器内核初始化 `msr` 寄存器，并设置单独的内核栈。为此，把原本的 `asm volatile("wrmsr" ...` 从 `trap_init()` 移到 `trap_init_percpu()`：

```c
// in trap.c, function `trap_init_percpu()`
#define IA32_SYSENTER_CS 0x174
#define IA32_SYSENTER_ESP 0x175
#define IA32_SYSENTER_EIP 0x176
    void fast_system_call();
    asm volatile("wrmsr" : : "c"(IA32_SYSENTER_CS), "d"(0),
                             "a"(GD_KT));
    asm volatile("wrmsr" : : "c"(IA32_SYSENTER_ESP), "d"(0),
                             "a"(KSTACKTOP -
                                 current_cpuid * (KSTKSIZE + KSTKGAP)));
    asm volatile("wrmsr" : : "c"(IA32_SYSENTER_EIP), "d"(0),
                             "a"(fast_system_call));
```

需要在进入内核时加锁。为此，在 `kern/syscall.c` 中新增一个函数：

```c
int32_t syscall_fast(uint32_t syscallno, uint32_t a1, uint32_t a2, uint32_t a3,
                     uint32_t a4, uint32_t a5)
{
    lock_kernel();
    int32_t ret = syscall(syscallno, a1, a2, a3, a4, a5);
    unlock_kernel();
    return ret;
}
```

并将 `trapentry.S` 中的 `call syscall` 改成 `call syscall_fast`。

在 Lab 4 中，使用了时钟中断。注意到 `sysenter` 指令会把 `EFLAGS` 寄存器的 `IF` 位清零以屏蔽外部中断，但 `sysexit` 指令却不会复位 `IF`。因此，在 `sysexit` 之前，需要 `sti`。

```asm
// in trapentry.S
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

    call    syscall_fast // 现在调用 syscall_fast

    movl    %esi,   %edx
    movl    %ebp,   %ecx
    sti                  // sti 以复位 IF
    sysexit
```

那么，哪些系统调用函数可以通过快速系统调用实现呢？注意到 `sysexit` 指令总是回到调用点，因此，`sys_yield()`，以及其他涉及到 yield 的系统调用，如 `sys_ipc_recv()`，不能使用快速系统调用。（还有另外一个原因：我做了 Lab 4 的 Challenge 3，因此 `sys_yield()` 需要保存浮点状态，但是快速系统调用不会做这一点）

`sys_env_set_trapframe()` 可能会修改 `EIP` 和/或 `ESP`，它也不能用快速系统调用实现。

`sys_page_map()` 也不能通过快速系统调用实现，因为它有 5 个参数，而快速系统调用至多支持 4 个参数。

因为 `sys_exofork()` 直接在 `inc/lib.h` 内联定义，为了保证代码的简单性，它也无法通过快速系统调用实现。

最终，修改 `lib/syscall.c` 中的 `syscall()` 如下：

```c
switch (num)
{
case SYS_cputs: case SYS_cgetc: case SYS_getenvid: case SYS_page_alloc:
case SYS_page_unmap: case SYS_env_set_status: case SYS_env_set_pgfault_upcall:
case SYS_ipc_try_send:
    asm volatile("pushl %%ebp\n"
                 "movl %%esp, %%ebp\n"
                 "leal 114514f, %%esi\n"
                 "sysenter\n"
                 "114514:\n"
                 "popl %%ebp\n"
                 : "=a"(ret)
                 : "a"(num), "d"(a1), "c"(a2), "b"(a3), "D"(a4)
                 : "%esi", "cc", "memory");
    break;
default:
    asm volatile("int %1\n"
                 : "=a"(ret)
                 : "i"(T_SYSCALL), "a"(num), "d"(a1), "c"(a2), "b"(a3),
                 "D"(a4), "S"(a5)
                 : "cc", "memory");
}
```

注意，考虑到系统调用可能改变条件码，我对 clobber 加上了 `"cc"`，这是 Lab 3 中我没有做的。

### Lab 4

在 Lab 4 中，我选择了 Challenge 3：使用 `fxrstor` 和 `fxsave` 指令进行浮点状态的保存和恢复。这部分代码无需改动。

现在，我的 JOS Lab 可以将 Lab 1 Challenge 1、Lab 2 Challenge 1、Lab 3 Challenge 2 & 3、Lab 4 Challenge 3 和 Lab 5 Challenge 2 全部启用的情况下，在 Lab 5 获得满分（喜）。
