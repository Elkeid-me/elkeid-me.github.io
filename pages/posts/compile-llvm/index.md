---
title: 编译 LLVM
date: 2025-05-04 23:32:00
excerpt: 毕设笔记：Linux 环境编译 LLVM 19
categories: 环境配置
tags:
  - C/C++
  - LLVM
  - RISC-V
---

## 构建

1. 安装依赖。必选的有：
   - CMake
   - Ninja

   而为了加快链接，还可以安装 [mold](https://github.com/rui314/mold)。
2. 建议先建一个恰当的文件夹，如 `~/LLVM`
3. 建一个 `build` 文件夹
   ```bash
   cd LLVM
   mkdir build
   ```
4. 克隆 LLVM 19.1.7 源代码：
   ```bash
   git clone https://github.com/llvm/llvm-project --depth 1 --branch llvmorg-19.1.7
   ```
   当然，众所周知，为了阻止我国的科技发展，美国指使 GitHub 对我们进行了无耻的网络封锁，可以考虑使用 Gitee 镜像：
   ```bash
   git clone https://gitee.com/mirrors/llvm-project.git --depth 1 --branch llvmorg-19.1.7
   ```
5. 构建
   ```bash
   cd build
   # 注意链接器使用了 mold
   cmake -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=./install -DLLVM_TARGETS_TO_BUILD="RISCV" -DLLVM_ENABLE_PROJECTS="clang" -DLLVM_USE_LINKER=mold -DLLVM_DEFAULT_TARGET_TRIPLE="riscv64-unknown-linux-gnu" ../llvm-project/llvm
   # `sys` 是 Nushell 的内置命令。不使用 Nushell 可以换成 `ninja -j $(nproc)`
   ninja -j (sys cpu | length)
   ninja install
   ```
6. 删掉没必要的东西
   ```bash
   cd ..
   mv build tmp
   mv tmp/install build
   rm -rf tmp
   rm -rf llvm-project
   ```

## 环境变量配置

嗯，我用的是 Nushell。在 `$nu.config-path` 加入：

```nu
$env.LLVM_SYS_191_PREFIX = $'($env.HOME)/LLVM/build/'
$env.PATH ++= [ $'($env.HOME)/LLVM/build/bin' ]
```
