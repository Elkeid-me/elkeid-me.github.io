---
title: Waydroid on WSL2
date: 2024-10-08 15:36:27
excerpt: 如题
categories: 杂项
tags:
  - WSL
  - WSLg
  - Waydroid
  - Linux Kernel
---

## 环境

- WSL 版本： 2.3.24.0
- 内核版本： 5.15.153.1-2
- WSLg 版本： 1.0.65
- MSRDC 版本： 1.2.5620
- Direct3D 版本： 1.611.1-81528511
- DXCore 版本： 10.0.26100.1-240331-1435.ge-release
- Windows 版本： 10.0.19045.4894
- 发行版：Ubuntu 24.04

::: warning
对于其他环境，本文不保证有效。
:::

## 安装必要的软件包
```bash
sudo apt update
sudo apt install bc bison build-essential cpio flex libelf-dev libncurses-dev libssl-dev pahole pkg-config python3 pulseaudio weston
```
## 克隆 WSL Kernel 代码
```bash
git clone https://github.com/microsoft/WSL2-Linux-Kernel.git --depth=1 --branch=linux-msft-wsl-5.15.y
```
::: warning
这里克隆的是 `linux-msft-wsl-5.15.y` 分支。对于其他分支，本文不保证有效。
:::

::: warning
请自行解决国际互联网访问。
:::
## 自定义内核选项
```bash
cd WSL2-Linux-Kernel
cp Microsoft/config-wsl .config
make menuconfig
```
Save & Exit。打开 `.config`
```makefile
# CONFIG_PSI is not set // [!code --]
CONFIG_PSI=y // [!code ++]
CONFIG_PSI_DEFAULT_DISABLED=n // [!code ++]
......
# CONFIG_ANDROID is not set // [!code --]
CONFIG_ANDROID=y // [!code ++]
CONFIG_ANDROID_BINDER_IPC=y // [!code ++]
CONFIG_ANDROID_BINDERFS=y // [!code ++]
CONFIG_ANDROID_BINDER_DEVICES="" // [!code ++]
CONFIG_ANDROID_BINDER_IPC_SELFTEST=y // [!code ++]
```
> 参考 [Waydroid - ArchWiki](https://wiki.archlinux.org/title/Waydroid)

## 编译自定义内核
```bash
make -j $(nproc)
```
## 启用自定义内核

此时，编译好的内核在 `arch/x86/boot/bzImage`。把它复制到 Windows 下。

关闭 WSL:
```bash
wsl --shutdown
```
在 `.wslconfig`：
```ini
[wsl2] // [!code ++]
kernel=<path to custom kernel> # 路径中的反斜杠要再加反斜杠转义，例如 C:\\Users\\username\\kernel // [!code ++]
```
::: tip
什么是 `.wslconfig`？请参考 [WSL 中的高级配置设置](https://learn.microsoft.com/zh-cn/windows/wsl/wsl-config#wslconfig)
:::

## 安装 Waydroid
```bash
sudo apt install curl ca-certificates
curl https://repo.waydro.id | sudo bash
sudo apt install waydroid
```
## 初始化 Waydroid
```bash
sudo waydroid init
```
Waydroid 会自动下载 LineageOS 镜像。如果速度很慢，请考虑 [Using custom Waydroid images | Waydroid](https://docs.waydro.id/faq/using-custom-waydroid-images)。

关闭 WSL 并重启:
```bash
wsl --shutdown
```

## 启动 Waydroid

在 `/var/lib/waydroid/waydroid_base.prop`：

```txt
ro.hardware.gralloc=gbm // [!code --]
ro.hardware.egl=mesa-drivers // [!code --]
ro.hardware.gralloc=default // [!code ++]
ro.hardware.egl=swiftshader // [!code ++]
```
::: tip
这一步可能不是必须的。参考 [Waydroid - NixOS Wiki](https://wiki.nixos.org/wiki/Waydroid)。
:::

***

然后：
```bash
unset WAYLAND_DISPLAY
weston
```
此时会打开一个 WSLg 窗口。点击窗口左上角，打开两个 Weston 终端。

其中一个输入：
```bash
waydroid session start
```
等到 `Andorid with user 0 is ready`.

另一个输入：
```bash
waydroid show-full-ui
```
最终：

![](./waydroid.webp)

::: tip
其实不经过 `waydroid session start`，直接 `waydroid show-full-ui` 也可以。
:::
