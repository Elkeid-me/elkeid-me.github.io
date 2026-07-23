---
title: Chipyard环境配置
date: 2026-06-20 21:47:00
excerpt: Ubuntu 26.04 LTS 或 Arch Linux Chipyard环境配置
categories: 环境配置
tags:
  - Scala
  - Chipyard
  - Chisel
  - Intellij IDEA
---

本文全程使用Nushell（因为笔者实在不会Bash的语法）。

## 安装依赖项

::: code-group

```nu [Ubuntu]
let ubuntu_deps = [
    autoconf automake autotools-dev bc bear bison build-essential
    clang-format cmake curl device-tree-compiler doxygen flex gawk git
    gperf help2man libboost-all-dev libboost-iostreams-dev libboost-log-dev
    libboost-program-options-dev libcapstone-dev libelf-dev libexpat-dev
    libglib2.0-dev libgmp-dev libgoogle-perftools-dev libhdf5-serial-dev
    libmpc-dev libmpfr-dev libncurses-dev libpng-dev libprotobuf-dev
    libprotoc-dev libslirp-dev libtool libvncserver-dev m4 mold mypy ninja-build
    nlohmann-json3-dev patchutils pkg-config pre-commit protobuf-compiler
    python3 python3-dev python3-pip python3-pydot python3-tk python3-tomli
    python3-venv scons texinfo wget zlib1g zlib1g-dev
]
sudo apt -y install ...$ubuntu_deps
```

```nu [Arch Linux]
let arch_deps = [
    base-devel boost capstone cmake dtc git gperftools help2man hdf5
    jdk17-openjdk make mold ninja nlohmann-json openssh protobuf scons
    zlib-ng-compat
]
sudo pacman -S --needed --noconfirm ...$arch_deps
```

:::

::: warning

对于Arch Linux，还需要额外添加 `/usr/bin/core_perl` 到 `PATH`。

```nu
$env.PATH ++= ["/usr/bin/core_perl"]
```
:::

最后创建我们的工作文件夹：

```nu
let WORK_DIR = ($env.HOME)/rv64g
let INSTALL_DIR = ($WORK_DIR)/install

mkdir $INSTALL_DIR
cd $WORK_DIR

let cpu_cores = sys cpu | length
```

## 克隆代码

```nu
git clone git@github.com:riscv-collab/riscv-gnu-toolchain.git --depth 1
git clone git@github.com:qemu/qemu.git --branch v11.0.2 --depth 1
git clone git@github.com:gem5/gem5.git --branch stable --depth 1
git clone git@github.com:verilator/verilator.git --branch v5.050 --depth 1
git clone git@github.com:riscv-software-src/riscv-isa-sim.git --depth 1
git clone git@github.com:riscv-software-src/riscv-pk.git --depth 1
git clone git@github.com:riscv-software-src/riscv-tests.git --depth 1
git clone git@github.com:ucb-bar/libgloss-htif.git --depth 1
git clone git@github.com:llvm/circt.git --branch firtool-1.153.1 --depth 1
```

开始编译！首先，编译RISC-V交叉编译工具链：

```nu
cd ($WORK_DIR)/riscv-gnu-toolchain
let rv_tool_config_args = [
    --prefix=($INSTALL_DIR)
    --with-arch=rv64g
    --with-abi=lp64d
    --with-cmodel=medany
    --disable-gdb
    --disable-multilib
]
./configure ...$rv_tool_config_args
make -j $cpu_cores
make linux -j $cpu_cores
```

接下来，可以把编译好的这批工具加进 `PATH`：

```nu
$env.PATH ++= [($INSTALL_DIR)/bin]
```

然后是QEMU：

```nu
cd ($WORK_DIR)/qemu
let qemu_build_args = [
    --prefix=($INSTALL_DIR)
    --target-list=riscv64-linux-user
    --disable-docs
    --enable-plugins
    --extra-ldflags=-fuse-ld=mold
    --enable-lto
]
./configure ...$qemu_build_args
cd build
ninja
ninja install
cp contrib/plugins/*.so ($INSTALL_DIR)/share/qemu/
```

gem5：

```nu
cd ($WORK_DIR)/gem5
let gem5_build_args = [
    build/RISCV/gem5.opt
    -j
    $cpu_cores
    --linker=mold
]
scons ...$gem5_build_args
```

Verilator：

```nu
cd ($WORK_DIR)/verilator
autoconf

with-env {
    LDFLAGS: -fuse-ld=mold
} {
    ./configure --prefix=($INSTALL_DIR)
}
make -j $cpu_cores
make install
```

Spike：

```nu
cd ($WORK_DIR)/riscv-isa-sim
mkdir build
cd build
with-env {
    LDFLAGS: -fuse-ld=mold
} {
    run-external ...[
        ../configure
        --prefix=($INSTALL_DIR)
        --with-boost=no
        --with-boost-asio=no
        --with-boost-regex=no
    ]
}
make -j $cpu_cores
make install
```

RISC-V Proxy Kernel：

```
cd ($WORK_DIR)/riscv-pk
mkdir build
cd build
run-external ...[
    ../configure
    --prefix=($INSTALL_DIR)
    --host=riscv64-unknown-elf
    --with-arch=rv64g_zifencei
]
make -j $cpu_cores
make install
```

RISC-V tests

```nu
cd ($WORK_DIR)/riscv-tests
git submodule update --init --recursive --depth 1
mkdir build
cd build
../configure --prefix=($INSTALL_DIR)/riscv64-unknown-elf --with-xlen=64
make -j $cpu_cores
make install
```

libgloss-htif：

```nu
cd ($WORK_DIR)/libgloss-htif
mkdir build
cd build
run-external ...[
    ../configure
    --prefix=($INSTALL_DIR)/riscv64-unknown-elf
    --host=riscv64-unknown-elf
]
make -j $cpu_cores
make install
```

CIRCT

```nu
cd ($WORK_DIR)/circt
git submodule update --init --recursive --depth 1
mkdir llvm/build
cd llvm/build
let llvm_build_args = [
    -DLLVM_ENABLE_PROJECTS=mlir
    -DLLVM_TARGETS_TO_BUILD=host
    -DLLVM_ENABLE_ASSERTIONS=ON
    -DCMAKE_BUILD_TYPE=RELEASE
    -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
    -DCMAKE_LINKER_TYPE=MOLD
]
cmake -G Ninja ../llvm ...$llvm_build_args
# 编译 LLVM。内存不够大会导致编译失败，建议使用 `ninja -j <一个小一些的数字>`
# 我 WSL 给了 16G 内存和 4G Swap，然而 `ninja -j 18` 直接崩崩炸弹
ninja

cd ($WORK_DIR)/circt
let SRC_DIR = $env.PWD
mkdir build
cd build
let circt_build_args = [
    -DMLIR_DIR=($SRC_DIR)/llvm/build/lib/cmake/mlir
    -DLLVM_DIR=($SRC_DIR)/llvm/build/lib/cmake/llvm
    -DLLVM_ENABLE_ASSERTIONS=ON
    -DCMAKE_BUILD_TYPE=RELEASE
    -DCMAKE_INSTALL_PREFIX=($INSTALL_DIR)
    -DCMAKE_LINKER_TYPE=MOLD
]
cmake -G Ninja .. ...$circt_build_args
ninja
ninja install
```

接下来，可以清理构建文件：

```nu
cd $WORK_DIR
let dirs_to_remove = [
    riscv-gnu-toolchain qemu verilator riscv-isa-sim riscv-pk riscv-tests
    libgloss-htif circt
]
rm -rf ...$dirs_to_remove
```

## Scala环境配置

我天朝自有国情在此。首先，配置镜像源。这里使用华为云镜像：

> 选择华为云的原因：网易云和腾讯云慢如蜗牛；阿里云镜像似乎对并发有限制，且似乎不适用于 `sbt`。

在 `~/.config/coursier/mirror.properties` 写入：

```properties
central.from=https://repo1.maven.org/maven2
central.to=https://mirrors.huaweicloud.com/repository/maven/
```

在 `~/.sbt/repositories` 写入：

```ini
[repositories]
  local
  huaweicloud-ivy: https://mirrors.huaweicloud.com/repository/ivy/, [organization]/[module]/(scala[scalaVersion]/)(sbt[sbtVersion]/)[revision]/[type]s/artifact.[ext],allowInsecureProtocol
  huaweicloud-maven: https://mirrors.huaweicloud.com/repository/maven/, allowInsecureProtocol
```

然后安装Scala。

```nu
curl -o cs.gz -L https://github.com/coursier/coursier/releases/latest/download/cs-x86_64-pc-linux.gz
gzip -d cs.gz
chmod +x cs
./cs install scala:2.13.12 scalac:2.13.12 sbt:1.8.2
```

## Chipyard

最后来到了Chipyard。

```nu
cd ~
git clone git@github.com:ucb-bar/chipyard.git --branch 1.13.0
cd chipyard
git switch -c main
let submodules = [
    generators/ara generators/bar-fetchers generators/boom
    generators/caliptra-aes-acc generators/compress-acc
    generators/constellation generators/cva6 generators/diplomacy
    generators/fft-generator generators/gemmini generators/hardfloat
    generators/ibex generators/icenet generators/mempress generators/nvdla
    generators/riscv-sodor generators/rerocc generators/rocc-acc-utils
    generators/rocket-chip generators/rocket-chip-blocks
    generators/rocket-chip-inclusive-cache generators/saturn generators/shuttle
    generators/testchipip generators/vexiiriscv sims/firesim tools/cde
    tools/DRAMSim2 tools/firrtl2 tools/fixedpoint tools/rocket-dsp-utils
    tools/dsptools
]

git submodule update --init ...$submodules
```

至于这个Python脚本为什么有问题，我暂时不知道。

~~搞不好是我用的CIRCT太新了。~~

```nu
sed 's/assert False,/continue #/g' scripts/split-mems-conf.py | save tmp.py
mv tmp.py scripts/split-mems-conf.py
chmod +x scripts/split-mems-conf.py
```

设置 `RISCV` 环境变量：

```nu
load-env {RISCV: $INSTALL_DIR}
```

最后编译：

```nu
cd sims/verilator
make CONFIG=MediumBoomV3Config
```

## 编辑器配置

IntelliJ IDEA提供了较完善的Scala支持（通过Scala插件）。可以使用。

---

Metals是一个Scala语言服务器；在VS Code中可以通过[Scala (Metals)](https://marketplace.visualstudio.com/items?itemName=scalameta.metals)扩展使用。

推荐使用Metals v2测试版。至本文截稿，最新版本是 `2.0.0-M16`。

为使用Metals v2测试版，请在尚未安装Metals扩展的情况下，打开Chipyard文件夹，在工作区配置文件 `.vscode/settings.json` 写入以下官方推荐的配置项：

```jsonc
"metals.serverVersion": "2.0.0-M16",  // Metals 版本
"metals.serverProperties": [
  "-Xmx4g" // 官方推荐的一个参数，虽然我不知道有什么用
]
```

同时，我建议打开以下内联提示：

```jsonc
"metals.inlayHints.inferredTypes.enable": true,
"metals.inlayHints.hintsXRayMode.enable": true,
"metals.inlayHints.namedParameters.enable": true
```

然后安装Metals扩展，当右下角提示Import Build时同意即可。

> 内联提示是如下的效果：
>
> ![](./imgs/inlay-hints.webp)

## 编译与仿真加速

从 Chisel 到最终的模拟器二进制文件，经历了这样的过程：

$$
\begin{aligned}
    \text{Chisel} &\xrightarrow{\text{Scala编译与运行}} \text{FIRRTL} \xrightarrow{\text{CIRCTL}} \text{Verilog} \\
                  &\xrightarrow{\text{Verilator}} \text{C++} \xrightarrow{\text{C/C++编译}} \text{模拟器二进制文件}
\end{aligned}
$$

以上的过程全部由一个Makefile驱动。其中，Scala编译、CIRCTL和Verilator较难加速。我们能下手的，只有C/C++编译，以及最终模拟器的多线程执行。

### 使用ccache编译缓存

ccache是一个用于加速C/C++代码编译的缓存工具。我们来看Gemini对它的介绍：

> 当你使用常规编译器（如GCC或Clang）编译一个 `.c` 或 `.cpp` 文件时，编译器会进行词法分析、解析、优化并生成目标文件（`.o`）。如果项目很大，这个过程会非常耗时。
>
> ccache作为一个“代理层”坐在你的编译器前面。它的核心逻辑非常简单粗暴（但高效）：
>
> 1. 检测变化：当你编译一个文件时，ccache会快速计算该文件的哈希值（包含源文件内容、编译选项、包含的头文件等）。
> 2. 缓存命中：如果哈希值与之前编译过的完全一致，ccache会直接把之前生成好的 `.o` 文件复制过来，根本不调用真实的编译器。
> 3. 缓存未命中：如果文件改动了，ccache会调用真正的编译器去编译，并把新生成的 `.o` 文件存入缓存，供下次使用。
>
> 带来的改变：第一次编译（Clean Build）由于要写入缓存，时间没有任何缩短（甚至多消耗算力用于哈希计算）；但从第二次编译开始，速度会提升几倍到几十倍，几乎是瞬间完成。

修改一个Scala文件，尽管Scala层是增量编译的，但Verilator层是全量编译的，导致后面的C/C++也是全量编译——尽管大部分代码都没变。毫无疑问使用ccache能大幅提升编译速度。

根据Verilator文档可知，要使用ccache编译缓存，需设置 `OBJCACHE` 环境变量。

::: warning

为什么不用更现代化的sccache？因为sccache对于 `-include` 一个预编译头文件没有很好支持；而这是BOOM编译过程中需要的。

详见此链接：[Does not support PCH compilation using `-include`](https://github.com/mozilla/sccache/issues/615)

:::

### 使用并行编译

Verilator调用C/C++编译器时，默认是单线程编译。根据Verilator文档可知，欲使用并行编译，需设置环境变量 `VM_PARALLEL_BUILDS` 为 `1`。

### 使用mold链接器

mold是一个现代的、并行的高速链接器，可以有效加速C/C++二进制的链接（例如，在前面的环境配置中，使用mold链接gem5有奇效）。

阅读Verilator官方文档可知，要更改链接器，需设置 `LINK` 环境变量。

你以为需要设置 `LINK` 为 `mold` 参数？戳啦！你需要设置 `LINK` 为 `g++ -fuse-ld=mold`。

因为这玩意的默认定义是：

```makefile
LINK = g++
```

### 总结

（还是用Nushell语法）：

```nu
with-env {
    OBJCACHE: ccache,
    VM_PARALLEL_BUILDS: 1
    LINK: "g++ -fuse-ld=mold"
} {
    make CONFIG=MediumBoomV3Config -j (sys cpu | length)
}
```
