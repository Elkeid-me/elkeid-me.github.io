---
title: 编译 LLVM
date: 2025-05-04 23:32:00
excerpt: 毕设笔记：Linux 环境编译 LLVM 19
categories: 环境配置
tags:
  - C/C++
  - LLVM
---

## 构建

1. 建议先建一个恰当的文件夹，如 `~/LLVM`
2. 建一个 `build` 文件夹
   ```bash
   cd LLVM
   mkdir build
   ```
3. 克隆 LLVM 19.1.7 源代码：
   ```bash
   git clone https://github.com/llvm/llvm-project --depth 1 --branch llvmorg-19.1.7
   ```
   当然，众所周知，为了阻止我国的科技发展，美国指使 GitHub 对我们进行了无耻的网络封锁，可以考虑使用 Gitee 镜像：
   ```bash
   git clone https://gitee.com/mirrors/llvm-project.git --depth 1 --branch llvmorg-19.1.7
   ```
4. 构建
   ```bash
   cd build
   cmake -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=./install -DLLVM_TARGETS_TO_BUILD="RISCV" -DLLVM_ENABLE_PROJECTS="clang;lld" -DLLVM_USE_LINKER=gold -DLLVM_DEFAULT_TARGET_TRIPLE="riscv64-unknown-linux-gnu" ../llvm-project/llvm
   ninja -j <你期望的线程数>
   ninja install
   ```

   线程数的选取自己看着办罢。在 Intel 搞大小核之后 `nproc` 不太行得通。
5. 删掉没必要的东西
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
