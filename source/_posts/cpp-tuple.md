---
title: 'Love & Magic: Tuple'
date: 2024-03-06 19:45:29
excerpt: C++ 元编程魔法：实现 Tuple
categories:
  - 编程
tags:
  - C/C++
  - 元编程
  - 模板
---

先扔个草稿在这里.

## `type_traits.hxx`

```cpp
// L's Library <type_traits> -*- C++ -*-

#ifndef LL_TYPE_TRAITS
#define LL_TYPE_TRAITS
static_assert(__cplusplus >= 202002L, "Please use a compiler supporting C++ 20.");
namespace ll
{
    template <bool condition, typename T, typename F>
    struct conditional;
    template <typename T, typename F>
    struct conditional<true, T, F>
    {
        using type = T;
    };
    template <typename T, typename F>
    struct conditional<false, T, F>
    {
        using type = F;
    };
    template <bool condition, class T, class F>
    using conditional_t = typename conditional<condition, T, F>::type;

    template <typename T, T val>
    struct integral_constant
    {
        using value_type = T;

        using type = integral_constant;
        static constexpr value_type value{val};

        constexpr value_type operator()() const noexcept { return value; }
        constexpr operator value_type() const noexcept { return value; }
    };
    template <bool val>
    using bool_constant = integral_constant<bool, val>;

    using true_type = bool_constant<true>;
    using false_type = bool_constant<false>;

    template <typename T, typename U>
    struct is_same : false_type
    {
    };
    template <typename T>
    struct is_same<T, T> : true_type
    {
    };

    template <typename T, typename U>
    inline constexpr bool is_same_v{ll::is_same<T, U>::value};
}

namespace ll
{
    template <typename T>
    struct remove_const
    {
        using type = T;
    };
    template <typename T>
    struct remove_const<const T>
    {
        using type = T;
    };
    template <typename T>
    using remove_const_t = typename ll::remove_const<T>::type;

    template <typename T>
    struct remove_volatile
    {
        using type = T;
    };
    template <typename T>
    struct remove_volatile<volatile T>
    {
        using type = T;
    };

    template <typename T>
    using remove_volatile_t = typename ll::remove_volatile<T>::type;

    template <typename T>
    struct remove_cv
    {
        using type = typename remove_volatile<typename remove_const<T>::type>::type;
    };

    template <typename T>
    using remove_cv_t = typename ll::remove_cv<T>::type;
}

namespace ll
{
    template <class T>
    struct is_lvalue_reference : false_type
    {
    };
    template <class T>
    struct is_lvalue_reference<T &> : true_type
    {
    };
    template <class T>
    inline constexpr bool is_lvalue_reference_v{is_lvalue_reference<T>::value};
    template <class T>
    struct is_rvalue_reference : false_type
    {
    };
    template <class T>
    struct is_rvalue_reference<T &&> : true_type
    {
    };
    template <class T>
    inline constexpr bool is_rvalue_reference_v{is_rvalue_reference<T>::value};

    template <class T>
    struct is_const : false_type
    {
    };
    template <class T>
    struct is_const<const T> : true_type
    {
    };
    template <class T>
    inline constexpr bool is_const_v{is_const<T>::value};
}

namespace ll
{
    template <bool condition, typename T = void>
    struct enable_if;
    template <typename T>
    struct enable_if<true, T>
    {
        using type = T;
    };
    template <typename T>
    struct enable_if<false, T>
    {
        using type = T;
    };

    template <bool condition, typename T = void>
    using enable_if_t = typename enable_if<condition, T>::type;
}

namespace ll
{
    template <typename T>
    struct is_integral : bool_constant<ll::is_same_v<char, ll::remove_cv_t<T>> ||
                                       ll::is_same_v<signed char, ll::remove_cv_t<T>> ||
                                       ll::is_same_v<unsigned char, ll::remove_cv_t<T>> ||
                                       ll::is_same_v<wchar_t, ll::remove_cv_t<T>> ||
                                       ll::is_same_v<char8_t, ll::remove_cv_t<T>> ||
                                       ll::is_same_v<char16_t, ll::remove_cv_t<T>> ||
                                       ll::is_same_v<char32_t, ll::remove_cv_t<T>> ||
                                       ll::is_same_v<short, ll::remove_cv_t<T>> ||
                                       ll::is_same_v<unsigned short, ll::remove_cv_t<T>> ||
                                       ll::is_same_v<int, ll::remove_cv_t<T>> ||
                                       ll::is_same_v<unsigned int, ll::remove_cv_t<T>> ||
                                       ll::is_same_v<long, ll::remove_cv_t<T>> ||
                                       ll::is_same_v<unsigned long, ll::remove_cv_t<T>> ||
                                       ll::is_same_v<long long, ll::remove_cv_t<T>> ||
                                       ll::is_same_v<unsigned long long, ll::remove_cv_t<T>>>
    {
    };

    template <typename T>
    inline constexpr bool is_integral_v{ll::is_integral<T>::value};

    template <typename T>
    struct is_floating_point : bool_constant<ll::is_same_v<float, ll::remove_cv_t<T>> ||
                                             ll::is_same_v<double, ll::remove_cv_t<T>> ||
                                             ll::is_same_v<long double, ll::remove_cv_t<T>>>
    {
    };

    template <typename T>
    inline constexpr bool is_floating_point_v{ll::is_floating_point<T>::value};

    template <typename T>
    struct is_arithmetic : bool_constant<ll::is_integral_v<T> ||
                                         ll::is_floating_point_v<T>>
    {
    };

    template <typename T>
    inline constexpr bool is_arithmetic_v{ll::is_arithmetic<T>::value};

    template <typename T, bool __is_arithmetic__ = ll::is_arithmetic_v<T>>
    struct __is_signed_impl;
    template <typename T>
    struct __is_signed_impl<T, false> : false_type
    {
    };
    template <typename T>
    struct __is_signed_impl<T, true> : ll::bool_constant<T(-1) < T(0)>
    {
    };

    template <typename T>
    struct is_signed : bool_constant<ll::__is_signed_impl<T>::value>
    {
    };

    template <typename T>
    inline constexpr bool is_signed_v{ll::is_signed<T>::value};

    template <typename T, bool __is_arithmetic__ = ll::is_arithmetic_v<T>>
    struct __is_unsigned_impl;
    template <typename T>
    struct __is_unsigned_impl<T, false> : false_type
    {
    };
    template <typename T>
    struct __is_unsigned_impl<T, true> : ll::bool_constant<(T(0) < T(-1))>
    {
    };

    template <typename T>
    struct is_unsigned : bool_constant<ll::__is_unsigned_impl<T>::value>
    {
    };

    template <typename T>
    inline constexpr bool is_unsigned_v{ll::is_unsigned<T>::value};

    template <typename T>
    struct type_identity
    {
        using type = T;
    };
    template <typename T>
    using type_identity_t = typename type_identity<T>::type;

    template <typename T>
    struct remove_reference
    {
        using type = T;
    };
    template <typename T>
    struct remove_reference<T &>
    {
        using type = T;
    };
    template <typename T>
    struct remove_reference<T &&>
    {
        using type = T;
    };
    template <typename T>
    using remove_reference_t = typename remove_reference<T>::type;
}
#endif
```

## `utility.hxx`

```cpp
// L's Library <utility> -*- C++ -*-

#ifndef LL_UTILITY
#define LL_UTILITY
static_assert(__cplusplus >= 202002L, "Please use a compiler supporting C++ 20.");
#include "type_traits.hxx"
namespace ll
{
    template <typename T>
    constexpr typename remove_reference<T>::type &&move(T &&t) noexcept { return static_cast<typename remove_reference<T>::type &&>(t); }

    template <typename T>
    constexpr T &&forward(typename remove_reference<T>::type &t) noexcept { return static_cast<T &&>(t); }
    template <typename T>
    constexpr T &&forward(typename remove_reference<T>::type &&t) noexcept
    {
        static_assert(!is_lvalue_reference<T>::value, "forward 不能将左值引用转发为右值引用");
        return static_cast<T &&>(t);
    }
}
#endif
```

## `tuple.hxx`

```cpp
// L's Library <tuple> -*- C++ -*-

#ifndef LL_TUPLE
#define LL_TUPLE
static_assert(__cplusplus >= 202002L, "Please use a compiler supporting C++ 20.");
#include "type_traits.hxx"
#include "utility.hxx"
#include <cstddef>
namespace std
{
    template <typename T>
    struct tuple_size;
    template <std::size_t index, typename T>
    struct tuple_element;
}

namespace ll
{
    template <typename... Elements>
    class tuple;
    template <typename... Elements>
    struct __tuple_impl;
    template <std::size_t index, typename... Elements>
    struct __tuple_element_helper;
    template <std::size_t index, typename... Elements>
    struct __get_helper;

    template <typename Head, typename... Tail>
    struct __tuple_impl<Head, Tail...>
    {
        Head value;
        __tuple_impl<Tail...> next;
        constexpr explicit __tuple_impl() = default;
        constexpr explicit __tuple_impl(const Head &head, const Tail &...tail) : value{head}, next{tail...} {}
        // 注意使用 ll::forward 而不是 forward, 避免实参依赖查找到 std::forward.
        template <typename H, typename... T>
        constexpr explicit __tuple_impl(H &&head, T &&...tail) : value{ll::forward<H>(head)}, next{ll::forward<T>(tail)...} {}
    };

    template <typename Head>
    struct __tuple_impl<Head>
    {
        Head value;
        constexpr explicit __tuple_impl() = default;
        constexpr explicit __tuple_impl(const Head &head) : value{head} {}
        template <typename H, typename... T>
        constexpr explicit __tuple_impl(H &&head) : value{ll::forward<H>(head)} {}
    };

    template <std::size_t index, typename Head, typename... Tail>
    struct __get_helper<index, Head, Tail...>
    {
        constexpr static typename __tuple_element_helper<index, Head, Tail...>::type &__get(__tuple_impl<Head, Tail...> &t) { return __get_helper<index - 1, Tail...>::__get(t.next); }
        constexpr static const typename __tuple_element_helper<index, Head, Tail...>::type &__get(const __tuple_impl<Head, Tail...> &t) { return __get_helper<index - 1, Tail...>::__get(t.next); }
        constexpr static typename __tuple_element_helper<index, Head, Tail...>::type &&__get(__tuple_impl<Head, Tail...> &&t) { return __get_helper<index - 1, Tail...>::__get(ll::move(t.next)); }
        constexpr static const typename __tuple_element_helper<index, Head, Tail...>::type &&__get(const __tuple_impl<Head, Tail...> &&t) { return __get_helper<index - 1, Tail...>::__get(ll::move(t.next)); }
    };
    template <typename Head, typename... Tail>
    struct __get_helper<0, Head, Tail...>
    {
        constexpr static Head &__get(__tuple_impl<Head, Tail...> &t) { return t.value; }
        constexpr static const Head &__get(const __tuple_impl<Head, Tail...> &t) { return t.value; }
        constexpr static Head &&__get(__tuple_impl<Head, Tail...> &&t) { return ll::move(t.value); }
        constexpr static const Head &&__get(const __tuple_impl<Head, Tail...> &&t) { return ll::move(t.value); }
    };

    template <typename... Elements>
    class tuple
    {
    private:
        __tuple_impl<Elements...> impl;

    public:
        constexpr explicit tuple() = default;
        constexpr explicit tuple(const Elements &...elements) : impl{elements...} {}
        template <typename... E>
        constexpr explicit tuple(E &&...elements) : impl{ll::forward<E>(elements)...} {}

        template <std::size_t index, typename... elements>
        friend struct __get_helper_2;
    };

    template <std::size_t index, typename... Elements>
    struct __get_helper_2
    {
        constexpr static typename std::tuple_element<index, tuple<Elements...>>::type &__get(tuple<Elements...> &t) { return __get_helper<index, Elements...>::__get(t.impl); }
        constexpr static const typename std::tuple_element<index, tuple<Elements...>>::type &__get(const tuple<Elements...> &t) { return __get_helper<index, Elements...>::__get(t.impl); }
        constexpr static typename std::tuple_element<index, tuple<Elements...>>::type &&__get(tuple<Elements...> &&t) { return __get_helper<index, Elements...>::__get(ll::move(t.impl)); }
        constexpr static const typename std::tuple_element<index, tuple<Elements...>>::type &&__get(const tuple<Elements...> &&t) { return __get_helper<index, Elements...>::__get(ll::move(t.impl)); }
    };

    template <std::size_t index, typename... Elements>
    constexpr typename std::tuple_element<index, tuple<Elements...>>::type &get(tuple<Elements...> &t) { return __get_helper_2<index, Elements...>::__get(t); }
    template <std::size_t index, typename... Elements>
    constexpr const typename std::tuple_element<index, tuple<Elements...>>::type &get(const tuple<Elements...> &t) { return __get_helper_2<index, Elements...>::__get(t); }
    template <std::size_t index, typename... Elements>
    constexpr typename std::tuple_element<index, tuple<Elements...>>::type &&get(tuple<Elements...> &&t) { return __get_helper_2<index, Elements...>::__get(ll::move(t)); }
    template <std::size_t index, typename... Elements>
    constexpr const typename std::tuple_element<index, tuple<Elements...>>::type &&get(const tuple<Elements...> &&t) { return __get_helper_2<index, Elements...>::__get(ll::move(t)); }

    template <>
    class tuple<>
    {
    };
    template <class... Elements>
    tuple(Elements...) -> tuple<Elements...>;

    template <typename Head, typename... Tail>
    struct __tuple_element_helper<0, Head, Tail...>
    {
        using type = Head;
    };
    template <std::size_t index, typename Head, typename... Tail>
    struct __tuple_element_helper<index, Head, Tail...>
    {
        using type = typename __tuple_element_helper<index - 1, Tail...>::type;
    };

    template <typename T, typename... Elements>
    struct __typed_get_index_helper;
    template <typename T, typename Head, typename... Tail>
    struct __typed_get_index_helper<T, Head, Tail...> : integral_constant<std::size_t, __typed_get_index_helper<T, Tail...>::value + 1>
    {
    };
    template <typename T, typename... Tail>
    struct __typed_get_index_helper<T, T, Tail...> : integral_constant<std::size_t, 0>
    {
    };

    template <typename T, typename... Elements>
    struct __typed_get_times_helper;
    template <typename T, typename Head, typename... Tail>
    struct __typed_get_times_helper<T, Head, Tail...> : integral_constant<std::size_t, __typed_get_times_helper<T, Tail...>::value>
    {
    };
    template <typename T, typename... Tail>
    struct __typed_get_times_helper<T, T, Tail...> : integral_constant<std::size_t, __typed_get_times_helper<T, Tail...>::value + 1>
    {
    };
    template <typename T>
    struct __typed_get_times_helper<T> : integral_constant<std::size_t, 0>
    {
    };

    template <typename T, typename... Elements>
    constexpr T &get(tuple<Elements...> &t)
    {
        static_assert(__typed_get_times_helper<T, Elements...>::value == 1, "类型 T 在 Elements... 中必须出现且仅能出现 1 次");
        return get<__typed_get_index_helper<T, Elements...>::value>(t);
    }
    template <typename T, typename... Elements>
    constexpr const T &get(const tuple<Elements...> &t)
    {
        static_assert(__typed_get_times_helper<T, Elements...>::value == 1, "类型 T 在 Elements... 中必须出现且仅能出现 1 次");
        return get<__typed_get_index_helper<T, Elements...>::value>(t);
    }
    template <typename T, typename... Elements>
    constexpr T &&get(tuple<Elements...> &&t)
    {
        static_assert(__typed_get_times_helper<T, Elements...>::value == 1, "类型 T 在 Elements... 中必须出现且仅能出现 1 次");
        return get<__typed_get_index_helper<T, Elements...>::value>(ll::move(t));
    }
    template <typename T, typename... Elements>
    constexpr const T &&get(const tuple<Elements...> &&t)
    {
        static_assert(__typed_get_times_helper<T, Elements...>::value == 1, "类型 T 在 Elements... 中必须出现且仅能出现 1 次");
        return get<__typed_get_index_helper<T, Elements...>::value>(ll::move(t));
    }

    // template <typename... Elements>
    // tuple<Elements &&...> forward_as_tuple(Elements &&...args) noexcept { return tuple<Elements &&...>(ll::forward<Elements>(args)...); }

    template <typename... T>
    struct __tuple_cat_type;
    template <typename... Elements_1, typename... Elements_2, typename... Tuples>
    struct __tuple_cat_type<tuple<Elements_1...>, tuple<Elements_2...>, Tuples...>
    {
        using type = typename __tuple_cat_type<tuple<Elements_1..., Elements_2...>, Tuples...>::type;
    };
    template <typename... Elements_1>
    struct __tuple_cat_type<tuple<Elements_1...>>
    {
        using type = tuple<Elements_1...>;
    };
    // template <typename... T>
    // typename __tuple_cat_type<typename remove_cv<typename remove_reference<T>::type>::type...>::type tuple_cat(T &&...arg);
}

namespace std
{
    template <typename T>
    struct tuple_size;
    template <typename... Types>
    struct tuple_size<ll::tuple<Types...>> : ll::integral_constant<std::size_t, sizeof...(Types)>
    {
    };

    template <std::size_t index, typename T>
    struct tuple_element;
    template <std::size_t index, typename... Types>
    struct tuple_element<index, ll::tuple<Types...>>
    {
        static_assert(index < tuple_size<ll::tuple<Types...>>::value);
        using type = typename ll::__tuple_element_helper<index, Types...>::type;
    };
}
#endif
```
