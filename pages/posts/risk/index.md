---
title: 每个人承担自己的风险！
date: 2024-02-08 13:21:13
updated: 2024-11-24 00:15:00
excerpt: Use it at your own risk!
categories: 编程
tags:
  - Rust
---

Unwrap inner type when enum variant is known. From [Stack overflow](https://stackoverflow.com/questions/34953711/unwrap-inner-type-when-enum-variant-is-known).

```rust
/// 每个人承担自己的风险！
#[macro_export]
macro_rules! risk {
    ($expression:expr, $pattern:pat => $extracted_expression:expr) => {
        match $expression {
            $pattern => $extracted_expression,
            _ => unreachable!(),
        }
    };
}
```

Example:

```rust
enum Type {
    I32(i32),
    I64(i64),
    F32(f32),
    F64(f64)
}

fn fun() -> Type {
    /// ... ...
}

let i = risk!(fun(), Type::I32(i) => i);
```

也许 [`if let`](https://doc.rust-lang.org/book/ch06-03-if-let.html) 也是一个解决方案。

```rust
enum Type {
    I32(i32),
    I64(i64),
    F32(f32),
    F64(f64)
}

fn fun() -> Type {
    /// ... ...
}

if let Type::I32(i) = func() { i } else { unreachable!() }
```

实际上跟 `risk!()` 宏一样。不过既然能玩梗[^1]为什么不玩呢？

[^1]: 每个人承担自己的风险！
