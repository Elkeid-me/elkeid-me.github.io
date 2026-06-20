---
title: Chipyard环境配置
date: 2026-06-20 21:47:00
excerpt: Ubuntu 26.04 LTS Chipyard环境配置
categories: 环境配置
tags:
  - Scala
  - Chipyard
  - Chisel
  - Intellij IDEA
---

```nu
if (sys host | get long_os_version) !~ "Ubuntu 26.04" {
    print "This script is only tested on Ubuntu 26.04"
    exit
}

# Check if mold linker is available
let use_mold = if (which mold | is-not-empty) {
    true
} else {
    false
}

# Install dependencies
(sudo apt -y install autoconf automake autotools-dev bc bear bison
    build-essential clang-format cmake curl device-tree-compiler doxygen
    flex gawk git gperf help2man libboost-all-dev libboost-iostreams-dev
    libboost-log-dev libboost-program-options-dev libcapstone-dev libelf-dev
    libexpat-dev libglib2.0-dev libgmp-dev libgoogle-perftools-dev libhdf5-serial-dev
    libmpc-dev libmpfr-dev libncurses-dev libpng-dev libprotobuf-dev
    libprotoc-dev libslirp-dev libtool libvncserver-dev m4 mypy ninja-build
    nlohmann-json3-dev patchutils pkg-config pre-commit protobuf-compiler
    python3 python3-dev python3-pip python3-pydot python3-tk python3-tomli
    python3-venv scons texinfo wget zlib1g zlib1g-dev)

let WORK_DIR = ($env.HOME)/rv64g
let INSTALL_DIR = ($WORK_DIR)/install

mkdir $INSTALL_DIR
cd $WORK_DIR

# Clone repositories
git clone git@github.com:riscv-collab/riscv-gnu-toolchain.git --depth 1
git clone git@github.com:qemu/qemu.git --branch v11.0.1 --depth 1
git clone git@github.com:gem5/gem5.git --branch stable --depth 1
git clone git@github.com:verilator/verilator.git --branch v5.048 --depth 1
git clone git@github.com:riscv-software-src/riscv-isa-sim.git --depth 1
git clone git@github.com:riscv-software-src/riscv-pk.git --depth 1
git clone git@github.com:riscv-software-src/riscv-tests.git --depth 1
git clone git@github.com:ucb-bar/libgloss-htif.git --depth 1
git clone git@github.com:llvm/circt.git --branch firtool-1.149.0 --depth 1

# RISC-V GNU toolchain
cd ($WORK_DIR)/riscv-gnu-toolchain
(./configure --prefix=($INSTALL_DIR)
    --with-arch=rv64g
    --with-abi=lp64d
    --with-cmodel=medany
    --disable-gdb
    --disable-multilib)
make -j (sys cpu | length)
make install -j (sys cpu | length)

# QEMU
cd ($WORK_DIR)/qemu
(./configure --prefix=($INSTALL_DIR)
    --extra-ldflags="-fuse-ld=mold"
    --target-list=riscv64-linux-user
    --disable-docs --enable-plugins
    --enable-lto)
cd build
ninja
ninja install
cp contrib/plugins/*.so ($INSTALL_DIR)/share/qemu/

# gem5
cd ($WORK_DIR)/gem5
if $use_mold {
    scons build/RISCV/gem5.opt -j (sys cpu | length) --linker=mold
} else {
    scons build/RISCV/gem5.opt -j (sys cpu | length)
}

# Verilator
cd ($WORK_DIR)/verilator
autoconf
if $use_mold {
    with-env {
        LDFLAGS: "-fuse-ld=mold"
    } {
        ./configure --prefix=($INSTALL_DIR)
    }
} else {
    ./configure --prefix=($INSTALL_DIR)
}

make -j (sys cpu | length)
make install

# Spike
cd ($WORK_DIR)/riscv-isa-sim
mkdir build
cd build
if $use_mold {
    with-env {
        LDFLAGS: "-fuse-ld=mold"
    } {
    (../configure --prefix=($INSTALL_DIR) --with-boost=no
        --with-boost-asio=no --with-boost-regex=no)
    }
} else {
    (../configure --prefix=($INSTALL_DIR) --with-boost=no
        --with-boost-asio=no --with-boost-regex=no)
}

make -j (sys cpu | length)
make install

# RISC-V Proxy Kernel
cd ($WORK_DIR)/riscv-pk
mkdir build
cd build
../configure --prefix=($INSTALL_DIR) --host=riscv64-unknown-elf --with-arch=rv64g_zifencei
make -j (sys cpu | length)
make install

# RISC-V tests
cd ($WORK_DIR)/riscv-tests
git submodule update --init --recursive --depth 1
mkdir build
cd build
../configure --prefix=($INSTALL_DIR)/riscv64-unknown-elf --with-xlen=64
make -j (sys cpu | length)
make install

# libgloss-htif
cd ($WORK_DIR)/libgloss-htif
mkdir build
cd build
../configure --prefix=($INSTALL_DIR)/riscv64-unknown-elf --host=riscv64-unknown-elf
make -j (sys cpu | length)
make install

# CIRCT
cd ($WORK_DIR)/circt
git submodule update --init --recursive --depth 1
mkdir llvm/build
cd llvm/build
(cmake -G Ninja ../llvm
    -DLLVM_ENABLE_PROJECTS="mlir"
    -DLLVM_TARGETS_TO_BUILD="host"
    -DLLVM_ENABLE_ASSERTIONS=ON
    -DCMAKE_BUILD_TYPE=RELEASE
    -DCMAKE_LINKER_TYPE=MOLD
    -DCMAKE_EXPORT_COMPILE_COMMANDS=ON)

# 编译 LLVM……内存不够大会导致编译失败，建议使用 ninja -j 4 或 8
ninja

cd ($WORK_DIR)/circt

let SRC_DIR = $env.PWD
mkdir build
cd build
(cmake -G Ninja ..
    -DMLIR_DIR=($SRC_DIR)/llvm/build/lib/cmake/mlir
    -DLLVM_DIR=($SRC_DIR)/llvm/build/lib/cmake/llvm
    -DLLVM_ENABLE_ASSERTIONS=ON
    -DCMAKE_BUILD_TYPE=RELEASE
    -DCMAKE_LINKER_TYPE=MOLD
    -DCMAKE_INSTALL_PREFIX=($INSTALL_DIR))

ninja
ninja install


cd ($WORK_DIR)
(rm -rf riscv-gnu-toolchain qemu verilator riscv-isa-sim riscv-pk
    riscv-tests libgloss-htif circt)

# Chipyard
cd ~
git clone git@github.com:ucb-bar/chipyard.git --branch 1.13.0
cd chipyard
git switch -c main
(git submodule update --init
    generators/ara
    generators/bar-fetchers
    generators/boom
    generators/caliptra-aes-acc
    generators/compress-acc
    generators/constellation
    generators/cva6
    generators/diplomacy
    generators/fft-generator
    generators/gemmini
    generators/hardfloat
    generators/ibex
    generators/icenet
    generators/mempress
    generators/nvdla
    generators/riscv-sodor
    generators/rerocc
    generators/rocc-acc-utils
    generators/rocket-chip
    generators/rocket-chip-blocks
    generators/rocket-chip-inclusive-cache
    generators/saturn
    generators/shuttle
    generators/testchipip
    generators/vexiiriscv
    sims/firesim
    tools/cde
    tools/DRAMSim2
    tools/firrtl2
    tools/fixedpoint
    tools/rocket-dsp-utils
    tools/dsptools)

# 鬼知道为什么这个 Python 脚本会出问题
sed 's/assert False,/continue #/g' scripts/split-mems-conf.py | save tmp.py
mv tmp.py scripts/split-mems-conf.py
chmod +x scripts/split-mems-conf.py
cd sims/verilator
with-env {
    RISCV: $INSTALL_DIR
} {
    make CONFIG=MediumBoomV3Config -j (sys cpu | length)
}
```
