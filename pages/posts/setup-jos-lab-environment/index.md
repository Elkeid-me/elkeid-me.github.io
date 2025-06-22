---
title: 操作系统实验 环境配置
date: 2023-09-10 20:00:00
excerpt: MIT 6.828 JOS Lab 环境配置
categories: JOS Lab
tags:
  - JOS
  - C/C++
  - 汇编
  - 操作系统
---

本文章描述了在 Ubuntu 22.04 上配置 JOS Lab 环境的过程。

1. 安装必要的工具软件与库：

```bash
sudo apt install build-essential gdb gcc-multilib libgmp-dev libmpfr-dev libfdt-dev libsdl1.2-dev libmpc-dev binutils python2.7 libtool-bin libglib2.0-dev libz-dev libpixman-1-dev
```

2. 获取 MIT 修改的 `qemu`：

```bash
git clone https://github.com/mit-pdos/6.828-qemu.git qemu
```

3. 把所有的 `#include <sys/types.h>` 改为 `#include <sys/sysmacros.h>`

4. 创建文件夹：

```bash
sudo mkdir /usr/local/etc/qemu
sudo mkdir /usr/local/share/qemu
```

5. 编译配置：

```
cd qemu
./configure --disable-kvm --disable-werror --python=python2.7 --target-list="i386-softmmu x86_64-softmmu"
```

6. 编译与安装：

```
make && sudo make install
```