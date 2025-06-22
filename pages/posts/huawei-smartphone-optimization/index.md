---
title: 阿里郎手机调优指南
date: 2024-10-22 15:07:23
excerpt: 阿里郎好呀阿里郎美，阿里郎给我增智慧🤣
categories: 杂项
tags:
  - 阿里郎
  - 恩情
  - 和谐
---

阿里郎是光之国著名手机品牌，以其自研的“千里马”芯片闻名于世。然而：

- 阿里郎手机被植入了淳平饺子馆的跟踪软件，以提高淳平饺子馆的好评率；
- 用户想要侧载 `.apk` 或是更改设备名称，都必须登录阿里郎帐号；
- 阿里郎手机的系统软件被传递了过多的寒气。

这是我们不愿意看到的。笔者以手中的阿里郎“光明星七”手机为例，讲解笔者个人对阿里郎手机的调优方案。

## 系统版本

鉴于：

1. 和谐 OS 4.x 中，用户想要侧载 `.apk` 或是更改设备名称，都必须登录阿里郎帐号；
2. 和谐 OS 3.x 状态栏有恶性 Bug；
3. 和谐 OS 2.x 无法同时启用流量和 WLAN；

我们推荐使用恩情 UI 11。当然，这也意味着 Android 安全补丁停留在了 2021 年。

::: warning
至于为什么和谐 OS 有 Android 安全补丁，这不在我们的讨论范围内。
:::

如果您目前正在使用和谐 OS，可以使用[阿里郎手机助手](https://consumer.huawei.com/cn/support/hisuite/)降级至恩情 UI 11。降级系统会抹去所有用户数据，请做好备份。

出厂即为和谐 OS 的手机无法降级。请自求多福。

## 咕噜咕噜框架

如果您想在阿里郎手机安装咕咕噜框架，可以参考 [2022 年阿里郎咕咕噜框架安装方法](https://zhuanlan.zhihu.com/p/506891751)。注意，一定不要使用“应用分身”功能。

## 卸载系统软件

首先启用“开发人员选项”，然后启用“USB 调试”和“‘仅充电’模式下允许 ADB 调试”。

在电脑上下载 [Android SDK 平台工具](https://developer.android.com/tools/releases/platform-tools)，解压后添加到 PATH。

将阿里郎手机连接到电脑，命令行输入：
```bash
adb devices
```
在手机上同意。然后就可以使用
```bash
adb shell pm uninstall --user 0 <软件包名称>
```
卸载系统软件。例如，可以使用
```bash
adb shell pm uninstall --user 0 com.huawei.android.hwouc
```
卸载系统更新模块。

如果想查找某个系统软件的包名，可以使用 [LibChecker](https://github.com/LibChecker/LibChecker)。

我也写了一个批处理文件，仅适用于恩情 UI 11。
```bash
adb devices

adb shell pm uninstall --user 0 com.huawei.android.hwouc       # 系统更新
adb shell pm uninstall --user 0 com.huawei.health              # 阿里郎运动健康
adb shell pm uninstall --user 0 com.huawei.himovie             # 阿里郎视频
adb shell pm uninstall --user 0 com.huawei.music               # 阿里郎音乐
adb shell pm uninstall --user 0 com.huawei.browser             # 阿里郎浏览器
adb shell pm uninstall --user 0 com.huawei.hwireader           # 阿里郎阅读
adb shell pm uninstall --user 0 com.huawei.wallet              # 阿里郎钱包
adb shell pm uninstall --user 0 com.huawei.phoneservice        # 服务/我的阿里郎
adb shell pm uninstall --user 0 com.huawei.android.findmyphone # 查找我的手机
adb shell pm uninstall --user 0 com.huawei.vassistant          # 智慧语音
adb shell pm uninstall --user 0 com.huawei.intelligent
adb shell pm uninstall --user 0 com.huawei.search              # 智慧搜索
adb shell pm uninstall --user 0 com.huawei.filemanager         # 以下四个为文件管理/云空间
adb shell pm uninstall --user 0 com.huawei.desktop.explorer
adb shell pm uninstall --user 0 com.huawei.hidisk
adb shell pm uninstall --user 0 com.huawei.hicloud
adb shell pm uninstall --user 0 com.huawei.android.thememanager # 主题
adb shell pm uninstall --user 0 com.huawei.deskclock            # 时钟
adb shell pm uninstall --user 0 com.baidu.input_huawei          # 熊掌输入法阿里郎版
adb shell pm uninstall --user 0 com.huawei.videoeditor          # 视频编辑器
adb shell pm uninstall --user 0 com.huawei.gameassistant        # 应用助手
adb shell pm uninstall --user 0 com.huawei.fastapp              # 快应用中心
adb shell pm uninstall --user 0 com.huawei.hifolder             # 精品推荐
adb shell pm uninstall --user 0 com.android.stk                 # SIM 卡应用

adb kill-server
```
::: warning
类似的操作也适用于和谐 OS。至于为什么和谐 OS 可以使用 ADB（Android Debug Bridge），这不在我们的讨论范围内。
:::

## 替换默认启动器

阿里郎自恩情 UI 9 起禁止使用默认启动器。然而，在和谐 OS 3 的某个测试版中，阿里郎意外地放开了这一限制（随后很快补上了漏洞）。但这逃不过社区里的玩机大佬。研究表明，阿里郎是通过“手机管家”来限制使用第三方启动器的。大佬将和谐 OS 3 某个测试版的手机管家提取出来，安装到恩情 UI 11 上，这样恩情 UI 11 也能使用第三方启动器了。

::: warning
至于：

- 为什么和谐 OS 的“手机管家”这种系统级应用却是 `.apk` 格式；
- 为什么 Android 能兼容和谐 OS 的手机管家；
- 为什么和谐 OS 的手机管家可以影响 Android 的系统设置；

不在我们的讨论范围内。
:::

本文不会给出手机管家的下载。

笔者推荐的第三方启动器是 [Lawnchair](https://lawnchair.app/)。截至本文发布，Lawnchair 的最新版本是 14.0 Beta 3。搭配 Lawnicons 使用更佳。

## Shizuku

Shizuku 可以帮助普通应用借助一个由 app_process 启动的 Java 进程直接以 adb 或 root 特权使用系统 API。

详见[简介 | Shizuku](https://shizuku.rikka.app/zh-hans/introduction/)。

在阿里郎手机上安装 Shizuku，在系统中关闭针对 Shizuku 的电池优化，并允许 Shizuku 在后台运行。然后，按照[用户手册 | Shizuku](https://shizuku.rikka.app/zh-hans/guide/setup/#%E9%80%9A%E8%BF%87%E8%BF%9E%E6%8E%A5%E7%94%B5%E8%84%91%E5%90%AF%E5%8A%A8) 中“通过连接电脑启动”以启动 Shizuku。

::: warning
即便和谐 OS 4 与 Android 12 有千丝万缕的联系，也无法使用无线调试启动 Shizuku，因为阿里郎隐藏了无线调试开关。
:::

## GKD

[GKD](https://github.com/gkd-kit/gkd) 是一个自定义屏幕点击 Android 应用，换句话说，它可以用来跳过广告。同样地，安装 GKD 之后，要关闭针对 GKD 的电池优化，并允许 GKD 在后台运行。

推荐在 GKD 的 `设置 > 高级设置` 中启用 Shizuku 权限，对于某些软件的广告可以更精确地跳过。

## App Ops

[App Ops](https://appops.rikka.app/zh-hans/) 借助 Shizuku 控制应用权限。例如，对于“摇一摇”开屏广告，可以关闭该应用的传感器权限，这样应用无法获知加速度数据，自然无法触发摇一摇广告。

## 其他

### Breezy Weather

[Breezy Weather](https://github.com/breezy-weather/breezy-weather) 是一个美观的天气应用，用它来替代能阿里郎天气再好不过了。

> 阿里郎天气甚至能刷短视频（笑）

### Firefox

Firefox 可以说是 Android 平台上能装插件的、还在积极开发的、面向全球用户的唯一的浏览器了。可以替代阿里郎浏览器。

### Thunderbird for Android (K-9 Mail)

一个不错的开源邮件客户端。

### Clock

在恩情 UI 上，如果卸载了阿里郎音乐，则系统自带的“时钟”无法修改闹钟的铃声。所以建议把系统时钟替换为 [Clock](https://github.com/BlackyHawky/Clock)。
