---
title: C++ Curried
date: 2026-03-27 21:49:45
excerpt: 在C++中，柯里化任意可调用对象！
categories: 杂项
tags:
  - C++
---

## 什么事柯里化

> 柯里化，是把接受多个参数的函数变换成接受一个单一参数（最初函数的第一个参数）的函数，并且返回接受余下的参数而且返回结果的新函数的技术。——维基百科

来看一个例子好了。

```F#
let add (x: int) (y: int) : int = x + y
```

我们惊奇地发现，`add`竟然可以只用一个参数调用：

```F#
let addFive = add 5
```

那么`addFive`事什么呢？事实上，`addFive x`相当于`add 5 x`。它是一个整型到整型的函数。

```F#
printfn "%d" (addFive 10) // 15
```

如果这不能让你理解，那么我们换一种方式。在一些资料描述的λ演算中，函数只能有一个参数。那么想搞一个多参数函数怎么办呢？

```C++
auto add(int x)
{
    return [=](int y) { return x + y; };
}
```

这个C++的`add`也表现得类似F#的`add`

```C++
auto add_five{add(5)};
std::cout << add_five(10); // 15
```

事实上，上述F#`add`函数的类型是`int -> int -> int`，即表示`add`**接受一个`int`为参数**，**返回一个`int -> int`函数**。

> 在这里，符号`->`是右结合的，`int -> int -> int`等价于`int -> (int -> int)`。

可以看到，在F#中，函数是自动柯里化的。

> 在F#中也可以写出所谓非“柯里化函数”，例如
>
> ```F#
> let add (x: int, y: int) : int = x + y
> ```
>
> 于是它便只能用“两个参数”的元组来调用了：
>
> ```F#
> printfn "%d" (add (5, 10))
> ```
>
> 但事实上这个`add`的类型是`int * int -> int`，即`add`**接受一个`int * int`为参数**，**返回一个`int`**。
>
> ~~所以所有的函数都只有一个参数（确信）。~~

但C++的函数（或者Lambda表达式，又或者`std::greater<T>`这种可调用对象）并不是自动柯里化的。有没有可能创造一个函数`curried`，它接受**任意的一个可调用对象**，返回这个可调用对象的柯里化版本呢？

## 在C++中，柯里化任意可调用对象！

作为实际情况的简化，我们只考虑值传参；毕竟在函数式的世界里讨论左值引用右值引用还是太复杂了。特别是，如果被柯里化的函数中出现了移动语义，譬如：

```C++
void test_move(std::vector<int> &src,
               std::vector<int> &dest)
{
    dest = std::move(src);
}
```

那么柯里化的`test_move`怎么办？难道它只能用一次吗？所以还是只讨论值传参好了（摊手）。

---

`curried`函数长什么样呢？

```C++
template <typename F>
auto curried(F func);
```

这没有任何信息。想要获取`func`的返回值类型？没有。参数类型列表？没有。

☝️🤓但是我们C++的模板元编程神奇得很啊！设计一个类模板`struct function_inference<T>`，它有两个成员：

- `typename function_inference<T>::ret_type`：当`T`是一个可调用类型时，`ret_type`给出它的返回值。
- `typename function_inference<T>::arg_types`：当`T`是一个可调用类型时，`arg_types`为一个`std::tuple<U...>`，其中`U...`是参数类型列表。

首先，令`function_inference`针对函数、函数指针、函数的引用特化（这里只展示针对函数的特化）

```C++
template <typename R, typename... Args,
          bool _nothing_throw>
struct function_inference<R(Args...)
                          noexcept(_nothing_throw)>
{
    using ret_type = R;
    using arg_types = std::tuple<Args...>;
};
```

> 根据[Deconstructing function pointers in a C++ template, the noexcept complication](https://devblogs.microsoft.com/oldnewthing/20200714-00/?p=103981)，这里`noexcept(_nothing_throw)`只有GCC和Clang支持。

然后考虑重载了`operator()`的类（Lambda本质上也只是重载了`operator()`的匿名类）。这里就不能只匹配“类”的类型，而应该匹配其`operator()`的函数指针的类型。为简单起见，以下展示的代码没有考虑`const`重载：

```C++
template <typename C, typename R,
          typename... Args, bool _nothing_throw>
struct instance_method_inference<R (C::*)(Args...)
                                 noexcept(_nothing_throw)>
{
    using ret_type = R;
    using arg_types = std::tuple<Args...>;
};
```

最后，把没有特化的`function_inference`从上述`instance_method_inference`继承：

```C++
template <typename T>
struct function_inference
    : instance_method_inference<decltype(&T::operator())>
{
};
```

试一下效果：

```C++
int add(int a, int b) { return a + b; }

// int
using add_ret = typename
    function_inference<decltype(add)>::ret_type;
// std::tuple<int, int>
using add_args = typename
    function_inference<decltype(add)>::arg_types;

// bool
using int_greater_ret = typename
    function_inference<std::greater<int>>::ret_type;
// std::tuple<const int &, const int &>
using int_greater_args = typename
    function_inference<std::greater<int>>::arg_types;

auto lambda = [](int a, int b) { return a + b; };

// int
using lambda_ret = typename
    function_inference<decltype(lambda)>::ret_type;
// std::tuple<int, int>
using lambda_args = typename
    function_inference<decltype(lambda)>::arg_types;
```

~~哇真是太好玩了（x~~

现在，`curried`函数内可以获得可调用类型`F`的返回值类型和参数类型列表，然后我们考虑用一个接受更多信息的函数`impl`来实现。

> 因为普通的函数模板无法偏特化，这里`impl`是偏特化的模板类`curried_impl`的静态方法。

```C++
template <typename F>
auto curried(F func)
{
    using R =
        typename function_inference<F>::ret_type;
    using Args =
        typename function_inference<F>::arg_types;
    return curried_impl<F, R, Args>::impl(func);
}
```

对于0个和1个参数的函数，直接返回其本身：

```C++
template <typename F, typename R>
struct curried_impl<F, R, std::tuple<>>
{
    static auto impl(F func) { return func; }
};

template <typename F, typename R, typename First>
struct curried_impl<F, R, std::tuple<First>>
{
    static auto impl(F func) { return func; }
};
```

而对于 $n$ 个参数的函数`func`，我们逐个参数柯里化：外层Lambda表达式接受第一个参数；内部的Lambda表达式接受后 $n - 1$ 个参数，并捕获外层Lambda表达式的参数，返回`func`作用于这 $n$ 个参数的结果。

最重要的是，**内层Lambda表达式也被`curried`**。

```C++
template <typename F, typename R, typename First,
          typename... Rest>
struct curried_impl<F, R,
                    std::tuple<First, Rest...>>
{
    static auto impl(F func)
    {
        return [=](First arg_1)
        {
            return curried(
                [=](Rest... rest)
                { return func(arg_1, rest...); });
        };
    }
};
```

> 我在这里并不想考虑`std::forward<T>`之类的东西……所以捕获列表就直接`[=]`摆烂好了。

所以最后？

```C++
// let add a b c = a + b + c
// printfn "%d" (add 1 1 4)
// let addOne = add 1
// printfn "%d" (addOne 114 514)
// let addThree = add 1 2
// printfn "%d" (addThree 114)

int add(int a, int b, int c) { return a + b + c; }

int main()
{
    auto curried_add{curried(add)};
    std::cout << curried_add(1)(1)(4) << std::endl; // 6
    auto add_one{curried_add(1)};
    std::cout << add_one(114)(514) << std::endl; // 629
    auto add_three{curried_add(1)(2)};
    std::cout << add_three(114) << std::endl; // 117
}
```

### 完整代码

```C++
#include <tuple>
#include <utility>

namespace detail
{
    template <typename T>
    struct instance_method_inference;

    template <typename C, typename R, typename... Args, bool _nothing_throw>
    struct instance_method_inference<R (C::*)(Args...) noexcept(_nothing_throw)>
    {
        using ret_type = R;
        using arg_types = std::tuple<Args...>;
    };

    template <typename C, typename R, typename... Args, bool _nothing_throw>
    struct instance_method_inference<R (C::*)(Args...)
                                         const noexcept(_nothing_throw)>
    {
        using ret_type = R;
        using arg_types = std::tuple<Args...>;
    };
} // namespace detail

template <typename T>
struct function_inference
    : detail::instance_method_inference<decltype(&T::operator())>
{
};

template <typename R, typename... Args, bool _nothing_throw>
struct function_inference<R (*)(Args...) noexcept(_nothing_throw)>
{
    using ret_type = R;
    using arg_types = std::tuple<Args...>;
};

template <typename R, typename... Args, bool _nothing_throw>
struct function_inference<R (&)(Args...) noexcept(_nothing_throw)>
{
    using ret_type = R;
    using arg_types = std::tuple<Args...>;
};

template <typename R, typename... Args, bool _nothing_throw>
struct function_inference<R(Args...) noexcept(_nothing_throw)>
{
    using ret_type = R;
    using arg_types = std::tuple<Args...>;
};

template <typename F>
auto curried(F);

namespace detail
{
    template <typename, typename, typename>
    struct curried_impl;

    template <typename F, typename R>
    struct curried_impl<F, R, std::tuple<>>
    {
        static auto impl(F func) { return func; }
    };

    template <typename F, typename R, typename First>
    struct curried_impl<F, R, std::tuple<First>>
    {
        static auto impl(F func) { return func; }
    };

    template <typename F, typename R, typename First, typename... Rest>
    struct curried_impl<F, R, std::tuple<First, Rest...>>
    {
        static auto impl(F func)
        {
            return [=](First arg_1) mutable
            {
                return curried([=](Rest... rest) mutable
                               { return func(arg_1, rest...); });
            };
        }
    };
} // namespace detail

template <typename F>
auto curried(F func)
{
    using R = typename function_inference<F>::ret_type;
    using Args = typename function_inference<F>::arg_types;
    return detail::curried_impl<F, R, Args>::impl(func);
}
```
