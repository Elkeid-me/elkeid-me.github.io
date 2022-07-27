---
title: 初见Rust
date: 2022-03-20 10:20:00
categories:
  - 编程
excerpt: Rust 简介、工具链安装与第一个程序
tags:
  - Rust
---

## Rust主要特点

- 零开销原则
- 内存安全~~除非你胡乱`unsafe`~~
- 无运行时，无GC。
- ~~有不少东西跟OCaml挺像的~~

## Rust工具链

- `rustup`：Rust的工具链管理器。

- `Cargo`：Rust的包管理与项目管理工具。
- `rustc`：Rust的编译器。

### Rust工具链境安装（Windows）

首先请安装MSVC构建工具。一般而言，建议直接安装Visual Studio的C++部分。

前往[安装 Rust - Rust 程序设计语言 (rust-lang.org)](https://www.rust-lang.org/zh-CN/tools/install)，下载`rustup-init.exe`。此后双击安装即可。

### Rust开发环境

建议使用 VS Code。安装 Rust-Analyzer 扩展。

## 第一个Rust项目

终端中进入项目目录，输入`cargo new 项目名`

在src文件夹中可找到main.rs，包含以下内容

```rust
fn main() {
    println!("Hello, world!");
}
```

- `fn`是Rust关键字，是function的缩写。
- 可以看到，与众多语言一道，Rust也将`main()`函数作为程序入口。与C/C++、C#等语言不同，Rust的主函数一定是无参数的。
- `println!`是Rust**宏**，用于在一行中输出字符串。这里的叹号表明是宏，而非函数。
  - 可以类比C++的`std::cout << 输出内容 << std::endl;`
  - Rust中还有另一个宏`print!`，与`println!`之区别即在于`ln`（确信）。

## 编译与运行

- `cargo run`或`cargo r`
  如果源文件存在修改，则会先进行编译；如果已编译且源文件没有修改，则会直接运行。
- `cargo build [--release]`
  `cargo run`如果发生了编译，则实质上先调用了`cargo build`。`cargo build`默认编译的是debug版本，如果要编译release，则需要加入`--release`参数。
- `cargo check`
  检查程序中是否有语法错误。
