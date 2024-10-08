---
title: 每个人承担自己的风险！
date: 2024-02-08 13:21:13
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

let i = risk!(fun(), I32(i) => i);
```
