---
title: 模板元的尝试
date: 2022-06-08 16:40:08
excerpt: 采用模板元生成素数表
categories:
  - 编程
tags:
  - C/C++
  - 元编程
  - 函数式编程
---

采用模板元生成素数表

<div class="info">

> 做人呢，最重要的，是开心（雾

</div>

```cpp
#include <iostream>
#include <type_traits>
template <bool Condition, typename Then, typename Else>
struct IF;
template <typename Then, typename Else>
struct IF<true, Then, Else> { typedef Then result; };
template <typename Then, typename Else>
struct IF<false, Then, Else> { typedef Else result; };
template <int N, int test>
struct __is_prime_impl
{
    static constexpr bool value{
        IF<(test * test > N),
           std::true_type,
           typename IF<(N % test == 0),
                       std::false_type,
                       __is_prime_impl<N, test + 2>>::result>::result::value};
};
template <int N>
struct is_prime
{
    static constexpr bool value{
        IF<N % 2 == 0,
           std::false_type,
           __is_prime_impl<N, 3>>::result::value};
};
template <>
struct is_prime<1> { static constexpr bool value{false}; };
template <>
struct is_prime<2> { static constexpr bool value{true}; };
template <int N>
struct prime;
template <int N>
struct find_prime_with_value
{
    static constexpr int value{
        IF<is_prime<N>::value,
           std::integral_constant<int, N>,
           find_prime_with_value<N + 2>>::result::value};
};
template <int N>
struct __prime_impl { static constexpr int value{find_prime_with_value<prime<N - 1>::value + 2>::value}; };
template <int N>
struct prime { static constexpr int value{__prime_impl<N>::value}; };
template <>
struct prime<1> { static constexpr int value{2}; };
template <>
struct prime<2> { static constexpr int value{3}; };
template <int len, int startIndex>
struct prime_list
{
    constexpr static int value_{prime<startIndex>::value};
    typedef prime_list<len - 1, startIndex + 1> next;
    template <int index>
    struct sub_script
    {
        static_assert(index < len, "");
        constexpr static int value{
            IF<index == 0,
               std::integral_constant<int, value_>,
               typename next::template sub_script<index - 1>>::result::value};
    };
};
template <int Index>
struct prime_list<1, Index>
{
    constexpr static int value_{prime<Index>::value};
    template <int index>
    struct sub_script
    {
        static_assert(index == 0, "");
        constexpr static int value{value_};
    };
};
int main()
{
    constexpr int a{prime_list<100, 1>::sub_script<99>::value};
    // a = 541
    return 0;
}
```

