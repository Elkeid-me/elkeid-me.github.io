---
title: 针对 OCaml 的 RISC-V 指令扩展
date: 2026-02-21 17:00:00
excerpt: 构建 OCaml 交叉编译器，添加自定义指令，实现自动优化并在 QEMU 中检测正确性。
categories: 杂项
tags:
  - OCaml
  - RISC-V
---

使用 Ubuntu 24.04 LTS。

## 构建 OCaml RISC-V 交叉编译器

1. 安装 RISC-V 工具链

   ```bash
   sudo apt install gcc-riscv64-linux-gnu g++-riscv64-linux-gnu binutils-riscv64-linux-gnu
   ```

   注意，这里安装的工具均以 `riscv64-linux-gnu-` 开头。自行编译的工具可能以 `riscv64-unknown-linux-gnu-` 开头

2. 安装 OCaml 工具链。具体来讲：

   ```bash
   bash -c "sh <(curl -fsSL https://opam.ocaml.org/install.sh)"
   opan switch create 5.4.0
   # 假设使用 Bash/Zsh
   eval $(opam env --switch=5.4.0)
   ```

3. 克隆 OCaml 5.4.0 编译器代码。

   ```bash
   git clone https://github.com/ocaml/ocaml.git --depth 1 --branch 5.4.0
   ```

4. 编译。如果你的 RISC-V 工具链以 `riscv64-unknown-linux-gnu-` 开头，请将以下命令中的 `target` 换为 `riscv64-unknown-linux-gnu`。

   ```bash
   ./configure --prefix=$PWD/cross/rv64 --target=riscv64-linux-gnu --disable-ocamldoc --disable-ocamltest    --disable-debug-runtime
   make crossopt -j $(nproc)
   ```

5. 安装

   ```bash
   cp ~/.opam/5.4.0/bin/ocamllex.opt ./lex/ocamllex.opt
   cp ~/.opam/5.4.0/bin/ocamldebug ./debugger/ocamldebug
   cp ~/.opam/5.4.0/bin/ocamlrun ./boot/ocamlrun
   ```

   ```bash
   make install --ignore-errors
   ```

## 构建 QEMU

1. 安装依赖。根据 [Host/Linux - QEMU](https://wiki.qemu.org/Hosts/Linux)：
   ```bash
   sudo apt install git libglib2.0-dev libfdt-dev libpixman-1-dev zlib1g-dev ninja-build
   ```
2. 克隆 QEMU 代码
   ```bash
   git clone https://github.com/qemu/qemu.git --depth --branch stable-10.0
   ```

3. 编译

   ```bash
   mkdir build
   cd build
   ../configure --target-list=riscv64-linux-user
   make -j $(nproc)
   ```

6. 简易的测试

   编译一个程序测试。注意使用静态链接：

   ```ocaml
   (* hello.ml *)
   print_endline "Hello, World!"
   ```
   按以下命令编译：

   ```bash
   <path to ocamlopt> -ccopt -static -o hello hello.ml
   ```

   使用 QEMU 运行：

   ```bash
   <path to qemu-riscv64> hello
   # 输出：
   # Hello, World!
   ```

## 指令扩展概述

OCaml 目前仅支持 64 位机器，并使用 63 位整数（最低位用于区分立即数和指针）。

因此，对于 `a + b` 这样的表达式，OCaml Native 编译器会生成如下的 CMM IR（OCaml 的最低层机器无关 IR）：

```lisp
(+ (+ a b) -1)
```

因此，考虑添加 `oadd` 指令，语义如下：

```asm
oadd rd, rs1, rs2 # rd = rs1 + rs2 - 1
```

这是一条 R 型指令。为简单起见，`opcode` 选择 `0x1f`，`funct7` 和 `funct3` 都为 0。

类似地，我们添加了 `osub` 和 `omul` 指令。

## 修改 OCaml 编译器

1. 首先，添加指令：

   ```ocaml
   (* asmcomp/riscv/arch.ml *)
   type specific_operation =
     | Imultaddf of bool        (* multiply, optionally negate, and add *)
     | Imultsubf of bool        (* multiply, optionally negate, and subtract *)
     | RiscvOAdd                (* RISC-V OCaml 扩展：加法 *) // [!code ++]
     | RiscvOSub                // [!code ++]
     | RiscvOMul                // [!code ++]
   ```

2. 添加打印指令的代码。因为我懒得修改 GNU Assembler 以支持新指令，我决定指令直接以 `.word <指令编码>` 的形式打印。

   此为获得 `<指令编码>` 的核心代码：

   ```ocaml
   (* asmcomp/riscv/emit.mlp *)
   let inst_code inst rd rs1 rs2 =
     let opcode = rv_ocaml_inst_opcode inst in
     let funct3 = rv_ocaml_inst_funct3 inst in
     let funct7 = rv_ocaml_inst_funct7 inst in
     (opcode) lor (rd lsl 7) lor (funct3 lsl 12) lor (rs1 lsl 15) lor (rs2 lsl 20) lor (funct7 lsl 25)
   ```

   添加获取 `opcode`、`funct3` 和 `funct7` 的代码：

   ```ocaml
   (* asmcomp/riscv/emit.mlp *)
   let rv_ocaml_inst_opcode = function
     | RiscvOAdd -> 0x1f
     | RiscvOSub -> 0x1f
     | RiscvOMul -> 0x1f
     | _ -> Misc.fatal_error "Emit.rv_ocaml_inst_opcode"

   let rv_ocaml_inst_funct3 = function
     | RiscvOAdd -> 0x0
     | RiscvOSub -> 0x1
     | RiscvOMul -> 0x2
     | _ -> Misc.fatal_error "Emit.rv_ocaml_inst_funct3"

   let rv_ocaml_inst_funct7 = function
     | RiscvOAdd -> 0x00
     | RiscvOSub -> 0x00
     | RiscvOMul -> 0x00
     | _ -> Misc.fatal_error "Emit.rv_ocaml_inst_funct7"
   ```

   添加获取寄存器编号的代码。因为 OCaml 内部的寄存器编号并不是按照 RISC-V 顺序的（例如 0 在 OCaml 中对应 `a0/x10`，但在 RISC-V 中对应 `zero/x0`），需要先获取对应的寄存器名，再转换成对应的 RISC-V 寄存器编号。

   ```ocaml
   (* asmcomp/riscv/emit.mlp *)
   let reg_num = function
     | {loc = Reg r} ->
       let name = register_name r in
       begin match name with
       | "a0" -> 10 | "a1" -> 11 | "a2" -> 12 | "a3" -> 13 | "a4" -> 14 | "a5" -> 15 | "a6" -> 16 | "a7" -> 17
       | "s2" -> 18 | "s3" -> 19 | "s4" -> 20 | "s5" -> 21 | "s6" -> 22 | "s7" -> 23 | "s8" -> 24 | "s9" -> 25
       | "t2" -> 7 | "t3" -> 28 | "t4" -> 29 | "t5" -> 30 | "t6" -> 31
       | "s0" -> 8
       | "t0" -> 5 | "t1" -> 6
       | "s1" -> 9 | "s10" -> 26 | "s11" -> 27
       | _ -> Misc.fatal_error ("Emit.reg_num: unknown register " ^ name)
       end
     | _ -> Misc.fatal_error "Emit.reg_num"
   ```

   最后：

   ```ocaml
   (* asmcomp/riscv/emit.mlp *)
   let emit_instr env i =
     emit_debug_info i.dbg;
     match i.desc with
     (* ... ... *)
     | Lop(Ispecific sop) ->
         begin match sop with
         | RiscvOAdd | RiscvOSub | RiscvOMul
           -> let rd = reg_num i.res.(0) in
              let rs1 = reg_num i.arg.(0) in
              let rs2 = reg_num i.arg.(1) in
              let code = inst_code sop rd rs1 rs2 in
              `  .word  {emit_int code}\n`
         | _ ->
           let instr = name_for_specific sop in
           `  {emit_string instr}  {emit_reg i.res.(0)}, {emit_reg i.arg.(0)}, {emit_reg i.arg.(1)}, {emit_reg i.arg.(2)}\n`
         end
      (* ... ... *)
   ```

   最后，补齐 `.mli` 文件及某些模式匹配的 `case`。

3. 添加指令选择的代码。只需简单地匹配 CMM：

   ```ocaml
   (* asmcomp/riscv/selection.ml *)
   method! select_operation op args dbg =
     match (op, args) with
     (* ... ... *)
     | (Caddi, [Cop(Caddi, [arg1; arg2], _); Cconst_int (-1, _)])
       when (arg_check arg1 && arg_check arg2) -> (Ispecific RiscvOAdd, [arg1; arg2])
     | (Caddi, [Cop(Csubi, [arg1; arg2], _); Cconst_int (1, _)])
       when (arg_check arg1 && arg_check arg2) -> (Ispecific RiscvOSub, [arg1; arg2])
     | (Caddi,
        [Cop(Cmuli, [Cop(Caddi, [arg1; Cconst_int (-1, _)], _);
                     Cop(Casr, [arg2; Cconst_int (1, _)], _)], _);
          Cconst_int (1, _)]) when (arg_check arg1 && arg_check arg2) ->
         (Ispecific RiscvOMul, [arg1; arg2])
     (* ... ... *)
   ```

   这里 `arg_check` 是一个简单的检查函数：

   ```ocaml
   (* asmcomp/riscv/selection.ml *)
   let arg_check = function
     | (Cconst_int _) -> false
     | _ -> true
   ```

## 修改 QEMU

首先添加 DecodeTree，以使 QEMU 能正常译码指令：

```
# target/riscv/insn32.decode
# *** OCaml Extension ***

oadd  0000000 ..... ..... 000 ..... 0011111 @r
osub  0000000 ..... ..... 001 ..... 0011111 @r
omul  0000000 ..... ..... 010 ..... 0011111 @r
```

然后添加相应的指令语义：

```c
// target/riscv/insn_trans/trans_rvi.c.inc
static bool trans_osub(DisasContext *ctx, arg_oadd *a)
{
    TCGv_i64 rs_1 = get_gpr(ctx, a->rs1, EXT_NONE);
    TCGv_i64 rs_2 = get_gpr(ctx, a->rs2, EXT_NONE);
    TCGv_i64 val_1 = tcg_temp_new_i64();
    tcg_gen_add_i64(val_1, rs_1, rs_2);
    tcg_gen_subi_i64(val_1, val_1, 1);
    gen_set_gpr(ctx, a->rd, val_1);
    return true;
}

static bool trans_oadd(DisasContext *ctx, arg_osub *a)
{
    TCGv_i64 rs_1 = get_gpr(ctx, a->rs1, EXT_NONE);
    TCGv_i64 rs_2 = get_gpr(ctx, a->rs2, EXT_NONE);
    TCGv_i64 val_1 = tcg_temp_new_i64();
    tcg_gen_sub_i64(val_1, rs_1, rs_2);
    tcg_gen_addi_i64(val_1, val_1, 1);
    gen_set_gpr(ctx, a->rd, val_1);
    return true;
}

static bool trans_omul(DisasContext *ctx, arg_omul *a)
{
    TCGv_i64 rs_1 = get_gpr(ctx, a->rs1, EXT_NONE);
    TCGv_i64 rs_2 = get_gpr(ctx, a->rs2, EXT_NONE);
    TCGv_i64 val_1 = tcg_temp_new_i64();
    tcg_gen_subi_i64(rs_1, rs_1, 1);
    tcg_gen_sari_i64(rs_2, rs_2, 1);
    tcg_gen_mul_i64(val_1, rs_1, rs_2);
    tcg_gen_addi_i64(val_1, val_1, 1);
    gen_set_gpr(ctx, a->rd, val_1);
    return true;
}
```

## 评测

不知道
