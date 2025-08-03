---
title: Proxy Lab 的并发设计
date: 2024-03-04 18:48:14
excerpt: 看看 C++ 标准库有什么并发魔法
categories: ICS
tags:
  - 'CS: APP'
  - ICS
  - C/C++
---

Proxy Lab 要求我们自己写 Makefile，所以用 C++ 是完全可行的。

## Part A

Part A 要求做一个并发的 HTTP 代理。比较先进的思路可以考虑 I/O 多路复用、协程、线程池等。而我使用了摆烂的方式：来一个请求就新建一个线程。处理完请求之后直接销毁这个线程。

```cpp
#include <thread>
// ......

void do_proxy(int fd); // 处理请求的函数

int main()
{
    // ......
    while (true)
    {
        auto fd{accept(listen_fd)};
        if (fd >= 0)
        {
            std::thread th(do_proxy, fd);
            th.detach();
        }
    }
}
```

## Part B

Part B 要求在 Part A 的基础上加入缓存机制，且空间不够时使用 LRU 机制驱逐。这意味着：

- 有的线程会向缓存添加内容；空间不够时它还会删除内容；即这类线程会修改缓存。
- 有的线程会读缓存。

显然，这是读者—写者问题。我原本想直接把缓存用文件来实现（这样并发控制就能直接甩锅给文件系统了），但后来觉得不行。

我又懒得拿两个锁和一个数字记录读者数目，所以，直接用 `std::shared_mutex` 摆烂！

好，下一个问题。缓存里面存什么？显然 key 是 URL，value 是指向缓存对象的指针、时间戳以及对象的大小。那缓存就直接设计为一个 `std::unordered_map<std::string, cache_block>` 全局变量。`cache_block` 的大致结构如下：

```cpp
struct cache_block
{
    指针 ptr;
    对象大小 size;
    上次访问的时间戳 stamp;
};
```

继续思考。在查缓存的时候干什么？有两种方案。

- 第一种方案：
  - 读者锁定
  - 用给定的 URL 调用缓存的 `std::unordered_map::find()`
  - 若查找不到，则读者解锁并返回
  - 若查找到，直接将对应的缓存对象写入 tcp 套接字，并更新时间戳
  - 读者解锁，返回
- 第二种方案：
  - 读者锁定
  - 用给定的 URL 调用缓存的 `std::unordered_map::find()`
  - 若查找不到，则读者解锁并返回 `{nullptr, 0}`
  - 若查找到，则返回 `{ptr, size}` 并更新时间戳
  - 读者解锁，返回

第一种方案在数据安全上是没有问题的。但问题在于，临界区真的要这么大吗？（整个网络通信的部分都放在临界区里了。。。）

第二种方案有非常小的临界区，但问题在于，如果发生下面的情况：

- 线程 A 在缓存中查找到对象 o，返回 `{ptr, size}`。此时读锁定已经解除。
- 由于奇怪的操作系统调度，线程 A 被挂起；
- 线程 B、C、D……向缓存写入数据，写的对象太多以至于空间不够了，对象 o 被从缓存驱逐。
- 线程 A 又被调度，此时 `ptr` 已经是悬垂指针了。

所以我们希望：只要仍存在对 o 的引用，那就不要释放 o；如果不存在对 o 的引用，那就一定要释放 o。

这不就是垃圾回收吗？但是 C++ 又有什么垃圾回收呢？答案是 `std::shared_ptr`，引用计数 GC。

令 `cache_block` 中的 `ptr` 为 `std::shared_ptr<char[]>` 类型，再来看看上面的情况：

- 首先，对象 o 由缓存持有，引用计数为 1；
- 线程 A 在缓存中查找到对象 o，返回 `{ptr, size}`。此时读锁定已经解除。o 由缓存和线程 A 共同持有，引用计数为 2。
- 由于奇怪的操作系统调度，线程 A 被挂起；
- 线程 B、C、D……向缓存写入数据，写的对象太多以至于空间不够了，对象 o 被从缓存驱逐。缓存不再持有 o，o 的引用计数为 1，此时 o 还没有被释放。
- 线程 A 又被调度，将 o 写入 tcp 套接字。
- 线程 A 销毁，`ptr` 被析构，此时 o 不被任何人持有，内存被释放。

那多个线程同时查找 o 不会把引用计数搞乱吗？答案是还真不会，因为 `std::shared_ptr` 的引用计数是原子变量。

> Cppreference：多个线程能在 `shared_ptr` 的不同实例上调用所有成员函数（包含复制构造函数与复制赋值）而不附加同步，即使这些实例是同一对象的副本且共享所有权也是如此。

多个进程同时查找 o，会同时更新时间戳，造成数据竞争。但我认为这无伤大雅。

`cache_block` 的结构就这么愉快的决定了：

```cpp
struct cache_block
{
    std::shared_ptr<char[]> ptr;
    std::size_t size;
    std::size_t stamp;
};
```

查找缓存使用如下代码：

```cpp
std::pair<std::shared_ptr<char[]>, std::size_t>
cache::find_cache(const std::string &uri)
{
    std::shared_lock lock(mtx);
    if (auto it{map.find(uri)}; it != map.end())
    {
        auto [ptr, size, _]{it->second};
        it->second.stamp = ++clock;
        return {ptr, size};
    }
    return {nullptr, 0};
}
```

其中，`map` 是 `std::unordered_map<std::string, cache_block>`，`mtx` 是 `std::shared_mutex`，`clock` 是 `std::atomic_size_t`（要考虑多线程同时查缓存的情况）。

## Part C

Part C 要求处理 HTTPS 流量。HTTPS 是加密的，不可能被缓存，所以 Part C 实际上简单了很多。略！

## 其他：文件描述符的优雅释放？

你是否觉得代码里到处都是 `close()` 很不雅观？你是否害怕 `return` 之后忘记释放文件描述符？只需要使用 RAII 就能解决这个问题！

```cpp
class fd_wrapper
{
private:
    int m_fd{-1};

public:
    fd_wrapper() = default;
    fd_wrapper(int fd) : m_fd{fd} {}
    ~fd_wrapper()
    {
        if (m_fd >= 0)
            close(m_fd);
    }

    fd_wrapper(const fd_wrapper &) = delete;

    fd_wrapper(fd_wrapper &&other) { std::swap(m_fd, other.m_fd); }

    bool valid() const { return m_fd >= 0; }
    int get_fd() { return m_fd; }
};
```
