---
title: C/C++环境配置
date: 2022-05-21 19:27:00
excerpt: C/C++ 环境配置，基于 Visual Studio Code 和 MinGW-w64
categories:
  - 编程
tags:
  - C/C++
  - VS Code
  - clangd
---
## 前言

原文写于2022年2月23日，于2022年5月21日更新内容。

本文将介绍以下环境的配置：

- 编辑器：Visual Studio Code（简称VS Code）
- 工具链（编译器、调试器等）MinGW_w64
- IntelliSense（[C/C++](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools)插件）
- IntelliSense（[clangd](https://marketplace.visualstudio.com/items?itemName=llvm-vs-code-extensions.vscode-clangd)插件）（选读）

本文仅针对Windows用户，仅针对C/C++初学者。

## 理论时间

不同于Python一般只使用CPython解释器，C/C++的编译器种类繁多，对于标准语法的支持、扩展语法的实现、标准库的实现也各不相同。常用的有以下：

- MSVC
  即Microsoft Visual C++，是微软的C++编译器，自VS 2019起支持C11和C17标准。
- GCC
  广义上指GNU Complier Collection（GNU编译器集，包含C/C++、Objective-C、Ada、Fortran、D等多种语言的编译器），狭义上指GNU C Complier（GNU C语言编译器），而一般的GCC指两者之间：即C语言编译器和C++编译器。

  为使GCC在Windows平台上能利用Win32 API编译程序，诞生了MinGW项目，以及同时支持32位和64位的MinGW-w64项目。
- Clang/LLVM
  严格说来，Clang是C/C++、Objective-C/C++的编译器前端，其后端为LLVM。而在Windows平台上，LLVM需要依赖MinGW或MSVC的库。

## VS Code 安装

前去[VS Code官网](https://code.visualstudio.com/)下载并安装。

## MinGW 配置

前去[MinGW的GitHub页面](https://github.com/niXman/mingw-builds-binaries/releases)下载文件名中包含“x86_64”、“posix”和“seh”的版本。截至本文发布，你应该下载`x86_64-11.2.0-release-posix-seh-rt_v9-rev1.7z`。

此后将文件解压缩到一个**合适**的地方，不推荐解压到桌面或“下载”文件夹。要求路径中**不包含中文与空格**。如果没有解压缩软件，可以使用7-Zip，具体配置可以搜索。

打开这个文件夹，在其中找到`bin`子文件夹，例如我选择了`D:\mingw64\bin`。记住这个路径，并将其添加到PATH中。

打开终端。输入`gcc -v`，回车。如果看到**类似的**提示：

```bash
......省略了一些输出
Thread model: posix
Supported LTO compression algorithms: zlib
gcc version 11.2.0 (x86_64-posix-seh-rev1, Built by Guyutongxue)
```

说明环境变量配置成功。而如果出现：

```bash
'gcc' 不是内部或外部命令，也不是可运行的程序
或批处理文件。
```

则请检查环境变量配置。

## VS Code 配置

### 插件安装

- 中文语言包：[Chinese (Simplified)](https://marketplace.visualstudio.com/items?itemName=MS-CEINTL.vscode-language-pack-zh-hans)
  该插件为VS Code提供中文界面

- C/C++插件：[C/C++](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools)
  该插件为VS Code提供C/C++的调试，代码格式化、自动补全与静态代码分析（称之为IntelliSense）

- （可选）clangd：[clangd](https://marketplace.visualstudio.com/items?itemName=llvm-vs-code-extensions.vscode-clangd)
  为VS Code提供C/C++的IntelliSense。个人认为比[C/C++](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools)的IntelliSense更强大，但配置也更加复杂。

- （可选）vscode-icons：[vscode-icons](https://marketplace.visualstudio.com/items?itemName=vscode-icons-team.vscode-icons)
  一个图标包。个人认为比VS Code默认的文件图标更加美观。

### 配置文件的编写

在合适的地方新建一个文件夹，同样要求路径中**不包含中文与空格**。这个文件夹将是你未来写代码的地方，请认真选择，例如我选择`D:\Codes\C++`。

打开刚刚建立的文件夹，再新建一个名为`.vscode`的文件夹。在`.vscode`中新建几个文件：

#### `tasks.json`

在`tasks.json`中写入：

```json
{
    "tasks": [
        {
            "type": "process",
            "label": "Compile-gcc11",
            "command": "gcc", // 编译器命令，若是写C++语言则改为g++
            "args": [                   // 编译器参数
                "-std=c17",             // 设置编译的C语言标准，这里使用C17。C++可使用C++17或C++20
                "-g",                   // 开启调试信息
                "-fexec-charset=UTF-8", // 设置编码（主要防止程序中文乱码，如果出现乱码可以把UTF-8换成GBK）
                "-m64",            // 强制编译64位程序
                "-static-libgcc",  // 静态链接libgcc，一般都会加上
                "-Wall",           // 开启额外警告
                "-pedantic-errors", // 视警告为错误，可以理解为严格模式
                "-o",                   // 允许自定义输出文件名
                "${fileDirname}\\${fileBasenameNoExtension}.exe", // 目标文件名，此参数将由VS Code解析
                "${file}"              // 源文件名，此参数将由VS Code解析
            ],
            "options": {
                "cwd": "${fileDirname}"
            },
            "problemMatcher": [
                "$gcc"
            ],
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "presentation": {
                "echo": true,
                "reveal": "always", // 执行任务时是否跳转到终端面板，可以为always，silent，never。具体参见VSC的文档，即使设为never，手动点进去还是可以看到
                "focus": false,     // 设为true后可以使执行task时焦点聚集在终端，但对编译C/C++来说，设为true没有意义
                "panel": "shared"   // 不同的文件的编译信息共享一个终端面板
            },
            "detail": "gcc11"
        }
    ],
    "version": "2.0.0"
}
```

并注意**保存**。

#### `launch.json`

在`launch.json`中写入：

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "gcc11 With gdb10",
            "type": "cppdbg",
            "request": "launch",
            "program": "${fileDirname}\\${fileBasenameNoExtension}.exe",
            "args": [],
            "stopAtEntry": false,
            "cwd": "${fileDirname}",
            "environment": [],
            "externalConsole": false,
            "MIMode": "gdb",
            "internalConsoleOptions": "neverOpen",
            "miDebuggerPath": "gdb", // 调试器命令
            "setupCommands": [
                {
                    "description": "Enable pretty-printing for gdb",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                }
            ],
            "preLaunchTask": "Compile-gcc11"
        }
    ]
}
```

并注意**保存**。

#### `c_cpp_properties.json`

**注意：**这个文件是为C/C++插件的IntelliSense提供更详细的配置，如果你选择使用[clangd](https://marketplace.visualstudio.com/items?itemName=llvm-vs-code-extensions.vscode-clangd)提供IntelliSense，可以忽略这部分内容，并阅读后续的[clangd配置](#clangd配置（选读）)。

在`c_cpp_properties.json`中写入：

```json
{
    "configurations": [
        {
            "compilerPath": "D:\\mingw64\\bin\\gcc.exe", // 这里改为你自己电脑上编译器的路径，如是C++则把gcc.exe改为g++.exe
            "cStandard": "c17",
            "cppStandard": "c++20",
            "intelliSenseMode": "windows-gcc-x64",
            "name": "Win32"
        }
    ],
    "version": 4
}
```

并注意**保存**。

### 环境配置的检查

启动VS Code，选择`文件>打开文件夹`，打开你刚刚创建的文件夹（即`.vscode`的**父目录**）。如果操作正确的话，会类似这样：

![](/img/vsc_config.png)

这时在文件夹中新建一个以`.c`为扩展名的文件，例如`hello.c`。输入以下内容：

```c
#include <stdio.h>
int main(void)
{
    printf("Hello, world!\n");
    return 0;
}
```

对于C++语言，可以新建`hello.cxx`，输入如下内容：

```cpp
#include <iostream>
int main()
{
    std::cout << "Hello, world!\n" << std::endl;
    return 0;
}
```

菜单栏选择`运行 > 启动调试`，等待片刻。若在下方的终端上显示出

```bash
Hello, world!
```

则配置成功。如不然，可尝试关闭VS Code再重启。

## clangd配置（选读）

**注意：**以下内容需要你对一些专业术语有相当的了解。如果你不想配置clangd，可以回到上面配置C/C++插件。

**注意：**笔者本人仍然没有彻底研究明白clangd的配置，此处相当于个人笔记而非教程。

**注意：**如果你不明白以下内容的意思，请不要胡乱配置！

下文中“clangd”均指clangd语言服务器，VS Code中的clangd插件将被称为“clangd插件”。

clangd官网：[What is clangd?](https://clangd.llvm.org/)

### 什么是 clangd？

是LLVM项目下的C/C++语言服务器，通过相应插件可以支持不同的编辑器。

> clangd understands your C++ code and adds smart features to your editor: code completion, compile errors, go-to-definition and more.

### 安装 clangd

**注意：**这里的内容不是clangd插件的安装。

两种方法选其一：

1. 前去LLVM的release页下载完整的LLVM：[Releases · LLVM](https://github.com/llvm/llvm-project/releases/)
  （然后你会发现不如一步到位把MSVC也装上）

2. 下载单独的clangd二进制文件：[Releases · clangd](https://github.com/clangd/clangd/releases/)

### 安装 clangd 插件

[clangd](https://marketplace.visualstudio.com/items?itemName=llvm-vs-code-extensions.vscode-clangd)

### 插件配置

1. 关闭C/C++插件的IntelliSense，以免与clangd插件冲突：
  在VS Code的`setting.json`中加入：

  ```json
  "C_Cpp.intelliSenseEngine": "Disabled",
  ```

2. 配置clangd的路径，如果你已经添加到PATH，则这步可以省略：
  在`setting.json`中加入：

  ```json
  "clangd.path": "D:\\Softwares\\Tools\\clangd_15.0.0\\bin\\clangd",
  ```

3. clangd的参数配置
  在`setting.json`中加入：

  ```json
  "clangd.arguments": [
      "--clang-tidy",
      "--header-insertion-decorators",
      "--header-insertion=iwyu",
  ],
  ```

  在代码文件夹中新建`.clang`文件，加入：

  ```yaml
  ---
  If:
    PathMatch: .*\.cpp
    CompileFlags:
    Compiler: g++
    Add: [-std=c++20, -g, -fexec-charset=UTF-8, -m64, -Wall, -pedantic-errors, -static-libgcc, --target=x86_64-w64-windows-gnu]
  ---
  If:
    PathMatch: .*\.c
  CompileFlags:
    Compiler: gcc
    Add: [-std=c17, -g, -fexec-charset=UTF-8, -m64, -Wall, -pedantic-errors, -static-libgcc, --target=x86_64-w64-windows-gnu]
  ```

  在代码文件夹中新建`.clangformat`，加入：

  ```yaml
  BasedOnStyle: LLVM
  UseTab: Never
  IndentWidth: 4
  TabWidth: 4
  BreakBeforeBraces: Allman
  AllowShortIfStatementsOnASingleLine: false
  IndentCaseLabels: false
  ColumnLimit: 0
  AccessModifierOffset: -4
  NamespaceIndentation: All
  FixNamespaceComments: false
  ```

4. 配置inlay hints的格式

  在VS Code的`setting.json`中加入：

  ```json
  "editor.inlayHints.fontSize": 12,
  "editor.inlayHints.padding": true,
  ```

## 私货（选读）

我们知道啊，VS Code的Default Light+主题的侧栏是突兀的黑色：

![](/img/vsc_default_light.png)

在VS Code的`setting.json`中加入：

```json
"workbench.colorCustomizations": {
    "[Default Light+]": {
        "activityBar.background": "#f3f3f3",
        "activityBar.foreground": "#008ad3",
    }
},
```

并**保存**，你就能得到浅色侧栏：

![](/img/vsc_default_light_edited.png)
