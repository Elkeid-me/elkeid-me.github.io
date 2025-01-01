---
title: 操作系统实验 2
date: 2023-10-22 23:50:00
excerpt: MIT 6.828 JOS Lab 2
categories: JOS Lab
tags:
  - JOS
  - C/C++
  - 汇编
  - 操作系统
math: true
---
选择了 Challenge 1 和 2。

报告中省略了实际代码的 `assert()`。

## Exercise 1

`boot_alloc()` 的代码如下：

```c
static void *boot_alloc(uint32_t n)
{
    static char *nextfree;
    char *result;

    if (!nextfree)
    {
        extern char end[];
        nextfree = ROUNDUP((char *)end, PGSIZE);
    }

    // LAB 2: Your code here.
    if (n == 0)
        return nextfree;

    result = nextfree;
    uint32_t expand_size = ROUNDUP(n, PGSIZE);
    if ((uint32_t)nextfree > (KERNBASE + PTSIZE) - expand_size)
    {
        panic("boot_alloc: out of memory\n");
        return NULL;
    }
    nextfree += expand_size;

    return result;
}
```

其中，第 10 行用于判断是否有足够的内存空间。由于 `entrypgdir.c` 中的页表仅映射了 `PTSIZE` 字节（即 4 MB），因此，这里认为可用的空间最高只到 `KERNBASE` + 4 MB。

对于 `mem_init()`，暂且先补充两行：

```c
// Your code goes here:
pages = (struct PageInfo *)boot_alloc(sizeof(struct PageInfo) * npages);
memset(pages, 0, sizeof(struct PageInfo) * npages);
```

`page_init()` 的代码如下：

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
}
```

在执行完 `page_init()` 之后，`page_free_list` 指向最后一个物理页的 `PageInfo`，似乎 `page_alloc()` 会最先分配这一页，然而没有任何虚拟地址被映射到它——可能映射到它的虚拟地址是 `KERNBASE + 32767 * PGSIZE = 0xf7fff000` 和 `32767 * PGSIZE = 0x7fff000`，但当前的页表仅映射了 4 MB 字节，虚拟地址最高到 `0xf0400000` 和 `0x400000`。

但这不会发生，因为紧接着 `check_page_free_list(1)` 会重排链表，将 `PDX` 为 0 的页放在链表头。

`page_alloc()` 的代码如下：

```c
struct PageInfo *page_alloc(int alloc_flags)
{
    if (page_free_list != NULL)
    {
        struct PageInfo *result = page_free_list;

        page_free_list = page_free_list->pp_link;
        result->pp_link = NULL;
        if (alloc_flags & ALLOC_ZERO)
        {
            void *page_v_pointer = page2kva(result);
            memset(page_v_pointer, 0, PGSIZE);
        }

        return result;
    }

    return NULL;
}
```

`page_free()` 的代码如下：

```c
void page_free(struct PageInfo *pp)
{
    // Fill this function in
    // Hint: You may want to panic if pp->pp_ref is nonzero or
    // pp->pp_link is not NULL.
    pp->pp_link = page_free_list;
    page_free_list = pp;
}
```

## Exercise 3

### Question 1

`x` 的类型是 `uintptr_t`。

注意到题目中给出的是 C 代码，而 JOS 在调用 C 代码（`i386_init()`）之前，已经在 `entry.S` 的汇编代码中加载了页表，并启用分页。因此 `char *value` 一定是虚拟地址；接下来又将 `value` 赋值给 `x`，那么 `x` 是虚拟地址。

## Exercise 4

`pgdir_walk()` 的代码如下：

```c
pte_t *pgdir_walk(pde_t *pgdir, const void *va, int create)
{
    // Fill this function in
    uint32_t pde_index = PDX(va);
    uint32_t pde = pgdir[pde_index];

    if (pde & PTE_P)
    {
        pte_t *result = (pte_t *)KADDR(PTE_ADDR(pde) + PTX(va) * sizeof(pte_t));
        return result;
    }

    if (create)
    {
        struct PageInfo *page_pgtb = page_alloc(ALLOC_ZERO);
        if (page_pgtb == NULL)
            return NULL;

        page_pgtb->pp_ref++;
        physaddr_t new_page = page2pa(page_pgtb);
        pgdir[pde_index] = new_page | PTE_U | PTE_W | PTE_P;

        pte_t *result = (pte_t *)KADDR(new_page + PTX(va) * sizeof(pte_t));
        return result;
    }
    return NULL;
}
```

需要注意第 9 和第 25 行：`PTX(va)` 需要乘 `sizeof(pte_t)`。

`boot_map_region()` 的代码如下：

```c
static void boot_map_region(pde_t *pgdir, uintptr_t va, size_t size,
                            physaddr_t pa, int perm)
{
    // Fill this function in
    for (size_t i = 0; i < size; i += PGSIZE)
    {
        pte_t *va_i_pte_va = pgdir_walk(pgdir, (char *)va + i, 1);
        *va_i_pte_va = PTE_ADDR(pa + i) | perm | PTE_P;
        tlb_invalidate(pgdir, (void *)va);
    }
}
```

需要注意第 10 行，在改变页表后需要使对应的 TLB 项失效。

`page_insert()` 的代码如下：

```c
int page_insert(pde_t *pgdir, struct PageInfo *pp, void *va, int perm)
{
    // Fill this function in
    pte_t *va_pte_va = pgdir_walk(pgdir, va, 1);
    if (va_pte_va == NULL)
        return -E_NO_MEM;

    pp->pp_ref++;
    page_remove(pgdir, va);

    *va_pte_va = page2pa(pp) | perm | PTE_P;
    return 0;
}
```

这个函数需要注意代码顺序。`pp->pp_ref++` 不能晚于 `page_remove(pgdir, va)`，否则出现特例（“same `pp` is re-inserted at the same virtual address in the same `pgdir`”）时很难处理。但又不能早于 `if (va_pte_va == NULL)`，只有在 `va_pte_va != NULL` 时才能断定这次插入是成功的，然后才可以增加对应页的引用计数——开香槟不能太早。

`page_lookup()` 的代码如下：

```c
struct PageInfo *page_lookup(pde_t *pgdir, void *va, pte_t **pte_store)
{
    // Fill this function in
    pte_t *va_pte_va = pgdir_walk(pgdir, va, 0);
    if (va_pte_va != NULL && ((*va_pte_va) & PTE_P))
    {
        physaddr_t original_page_pa = PTE_ADDR(*va_pte_va);
        struct PageInfo *original_page = pa2page(original_page_pa);

        if (pte_store != NULL)
            *pte_store = va_pte_va;
        return original_page;
    }
    return NULL;
}
```

`page_remove()` 的代码如下：

```c
void page_remove(pde_t *pgdir, void *va)
{
    // Fill this function in
    pte_t *pte_ptr;
    struct PageInfo *original_page = page_lookup(pgdir, va, &pte_ptr);
    if (original_page != NULL)
    {
        page_decref(original_page);
        *pte_ptr = 0;
        tlb_invalidate(pgdir, va);
    }
}
```

## Exercise 5

最终，补全 `mem_init()`

对于 `pages` 自身的映射将在后续映射 `KERNBASE` 时进行。

```c
//////////////////////////////////////////////////////////////////////
// Map 'pages' read-only by the user at linear address UPAGES
// Permissions:
//    - the new image at UPAGES -- kernel R, user R
//      (ie. perm = PTE_U | PTE_P)
//    - pages itself -- kernel RW, user NONE
// Your code goes here:
boot_map_region(kern_pgdir, UPAGES, PTSIZE, PADDR(pages), PTE_U);
```

```c
//////////////////////////////////////////////////////////////////////
// Use the physical memory that 'bootstack' refers to as the kernel
// stack.  The kernel stack grows down from virtual address KSTACKTOP.
// We consider the entire range from [KSTACKTOP-PTSIZE, KSTACKTOP)
// to be the kernel stack, but break this into two pieces:
//     * [KSTACKTOP-KSTKSIZE, KSTACKTOP) -- backed by physical memory
//     * [KSTACKTOP-PTSIZE, KSTACKTOP-KSTKSIZE) -- not backed; so if
//       the kernel overflows its stack, it will fault rather than
//       overwrite memory.  Known as a "guard page".
//     Permissions: kernel RW, user NONE
// Your code goes here:
boot_map_region(kern_pgdir, KSTACKTOP - KSTKSIZE, KSTKSIZE,
                PADDR(bootstacktop) - KSTKSIZE, PTE_W);
```
```c
//////////////////////////////////////////////////////////////////////
// Map all of physical memory at KERNBASE.
// Ie.  the VA range [KERNBASE, 2^32) should map to
//      the PA range [0, 2^32 - KERNBASE)
// We might not have 2^32 - KERNBASE bytes of physical memory, but
// we just set up the mapping anyway.
// Permissions: kernel RW, user NONE
// Your code goes here:
boot_map_region(kern_pgdir, KERNBASE, (size_t)((1ull << 32) - KERNBASE), 0,
                PTE_W);
```

### Question

2.
| Entry | Base Virtual Address                  | Points to (logically): |
|------:|:--------------------------------------|:-----------------------|
| 1023  | 0xffc00000                            | Page table for [252 MB, 256 MB) of phys memory |
| 1022  | 0xff800000                            | Page table for [248 MB, 252 MB) of phys memory |
| ...   | ...                                   | ...   |
| 960   | 0xf0000000 (`KERNBASE`) | Page table for [0 MB, 4 MB) of phys memory |
| 959   | 0xefc00000                            | Page table for [`PADDR(bootstacktop)` - 4 MB, `PADDR(bootstacktop)`) of phys memory [^1] |
| 958   | 0xef800000                            | none |
| 957   | 0xef400000                            | Page table for [`PADDR(kern_pgdir)`, `PADDR(kern_pgdir)` + 4 MB) of phys memory |
| 956   | 0xef000000 (`UPAGES`)   | Page table for [`PADDR(pages)`, `PADDR(pages)` + 4 MB) of phys memory |
| 955   | 0xeec00000                            | none  |
| ...   | ...                                   | ...   |
| 0     | 0x00000000                            | none  |

[^1]: 只有 [`PADDR(bootstacktop)` - `KSTKSIZE`, `PADDR(bootstacktop)`) 的页表项有效。

3. 页表可以设置权限位，如果没有设置 `PTE_U` 则用户无权访问。

4. 128 MB。这是硬件（qemu）限制的。
抛开硬件限制，注意到以下的事实：
    1. 所有的物理页的信息 `PageInfo` 存储于 `pages` 数组；
    2. `pages` 通过 `boot_alloc()` 申请；
    3. `boot_alloc()` 最多分配 `KERNBASE + PTSIZE - ROUNDUP((char *)end)` 的空间；
    4. 上述空间中，有一个页用作第一级页表。

因此，留给 `pages` 的空间至多为：

$$S = \texttt{KERNBASE} + \texttt{PTSIZE} - \texttt{ROUNDUP((char *)end)} - \texttt{PGSIZE}$$

最多支持物理内存：

$$\frac{S}{\texttt{sizeof(PageInfo)}} \times \texttt{PGSIZE} < \text{2 GB}$$

应当指出，如果把内存空间 $S$ 全部分配给 `pages`，在 `mem_init()` 中将无法正常创建二级页表。

5. 开销至多为 1 个一级页表、1023 个二级页表（考虑到页表自映射）、$\frac{S}{\texttt{sizeof(PageInfo)}}$ 项 `PageInfo`，以及指针（`page_free_list`、`pages`、`kern_pgdir`），总计要小于 8196.012 kB。
应当指出，多数情况下只有很少一部分二级页表存在于内存中。
为了减小开销，可以使用大页。
6. 如下：
    - 通过如下的代码跳转到 `relocated()` 函数。而 `relocated()` 函数的链接地址高于 `KERNBASE`，从而使 `%eip` 高于 `KERNBASE`。
    - 此时的页表将物理地址 0 ~ 4 MB 同时映射到虚拟地址 0 ~ 4 MB 和 `KERNBASE` ~ `KERNBASE` + 4 MB。低位的 `%eip` 会恒等映射到相应的物理地址。
    - 因为在 `mem_init()` 之后，虚拟地址 0 ~ 4 MB 将不对应任何物理地址，因此内核必须转移到高的虚拟地址运行。
```asm
mov $relocated, %eax
jmp *%eax
```

## Challenge 1

Intel IA-32 手册第 3A 卷的 *3.7.3 Mixing 4-KByte and 4-MByte Pages* 指出：

> *When the PSE flag in CR4 is set, both 4-MByte pages and page tables for 4-KByte pages can be accessed from the same page directory. If the PSE flag is clear, only page tables for 4-KByte pages can be accessed (regardless of the setting of the PS flag in a page-directory entry).*

对于 PS flag，*3.7.6 Page-Directory and Page-Table Entries* 指出：

> **Page size (PS) flag, bit 7 page-directory entries for 4-KByte pages**
>
> *Determines the page size. When this flag is clear, the page size is 4 KBytes and the page-directory entry points to a page table. When the flag is set, the page size is 4 MBytes for normal 32-bit addressing (and 2 MBytes if extended physical addressing is enabled) and the page-directory entry points to a page. If the page-directory entry points to a page table, all the pages associated with that page table will be 4-KByte pages.*

在什么情况下可以使用大页呢？*17.29.1 Large Pages* 指出：

> *The availability of large pages on any IA-32 processor can be determined via feature bit 3 (PSE) of register EDX after the CPUID instruction has been execution with an argument of 1.*

据此可以修改代码。首先加入一个全局变量，用于判断是否启用大页：

```c
// These variables are set in mem_init()
// ...
static int is_large_page_enabled;
```

然后新增函数 `boot_map_region_large_page()`，这是 `boot_map_region()` 的大页版本：

```c
static void boot_map_region_large_page(pde_t *pgdir, uintptr_t va, size_t size,
                                       physaddr_t pa, int perm)
{
    if (is_large_page_enabled)
    {
        for (size_t i = 0; i < size; i += PTSIZE)
        {
            pgdir[PDX(va + i)] = (pa + i) | perm | PTE_PS | PTE_P;
            tlb_invalidate(pgdir, (void *)va);
        }
    }
    else
    {
        panic("Call `boot_map_region_large_page' when large page is not "
              "enabled.\n");
    }
}
```

最终，可以修改 `mem_init()` 如下：

```c
uint32_t edx = 0;
cpuid(1, NULL, NULL, NULL, &edx);

int is_large_page_supported = (edx >> 3) & 1;
if (is_large_page_supported)
{
    uint32_t cr4 = rcr4();
    cr4 |= CR4_PSE;
    lcr4(cr4);

    is_large_page_enabled = 1;
    boot_map_region_large_page(kern_pgdir, KERNBASE,
                               (size_t)((1ull << 32) - KERNBASE), 0, PTE_W);
}
else
{
    boot_map_region(kern_pgdir, KERNBASE, (size_t)((1ull << 32) - KERNBASE),
                    0, PTE_W);
}
```

还需要对 `check_va2pa()` 进行修改，以支持大页：

```c
if (is_large_page_enabled && (*pgdir & PTE_PS))
    return PTE_ADDR(*pgdir) + (va & (0x3ff << PTXSHIFT));
```

为了后续调试方便，对 `pgdir_walk()` 进行修改，在发现是大页时直接 panic。

```c
if ((pde & PTE_P) && (pde & PTE_PS))
    panic("Its a large page.\n");
```

## Challenge 2

增加两个命令：`showmap` 和 `setperm`。两者的实现详见代码。

`showmap` 的示例输出：

```text
K> showmap 0xeffff000 0xf0000000

 V address -> P address   Permission  K | R
0xeffff000 -> 0x00116000, Permission: RW|--
0xf0000000 -> 0x00000000, Permission: RW|-- It's a large page
```

`setperm` 的示例输出：

```text
K> setperm 0xf0000000 U
PTE_U on virtual address 0xf0000000 is enabled. It's a large page
K> setperm 0xf0000000 K
PTE_U on virtual address 0xf0000000 is disabled. It's a large page
```
