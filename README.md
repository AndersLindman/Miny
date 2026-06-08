# Miny
A minimalistic, stack-oriented **Zero-Knowledge Virtual Machine (zkVM)** designed for high-performance cryptographic primitives.

Miny is built to be the "bare metal" of the ZK world. Instead of emulating general-purpose hardware like an x86 or ARM CPU, Miny is a purpose-built state machine that operates natively in the Mersenne31 ($2^{31}-1$) prime field.

---

## 🚀 Why does Miny exist?
Imagine you want to prove to someone that you know a secret password without ever telling them the password itself. Usually, this requires complex, slow computers. 

**Miny is the ultra-efficient engine that makes these proofs possible.**

Most ZK projects try to run "everything" (like standard software) inside a ZK-proof, which makes them incredibly heavy and slow. Miny takes the opposite approach: it is a "minimalist calculator" specifically designed for the heavy math needed for modern privacy. It is small, fast, and designed to run directly in your web browser, ensuring your private data never leaves your device.

## 🛠 The Architecture
Miny is an experiment in **"Instruction-Set Minimalism."** It abandons general-purpose memory in favor of a dual-stack architecture (Control Flow vs. Data) to minimize polynomial degrees and maximize prover throughput.

### ISA Highlights
* **Field-Native Arithmetic:** Native Mersenne31 operations (`ADD`, `SUB`, `MUL`, `SQR`) with no bit-decomposition tax.
* **Stack-Based ISA:** High-performance, LIFO-based data manipulation (`PUSH`, `POP`, `DUP`, `SWAP`).
* **Branchless Design:** Uses `SELECT` (conditional assignment) instead of traditional branching to keep execution traces linear and prover-friendly.
* **Efficient Flow:** Features hardware-accelerated subroutines (`JSR`, `RET`) for compact, reusable cryptographic primitives.

### Why Miny?
* **Low-Degree Constraints:** Designed for optimal performance with the [Polygon Plonky3](https://github.com/Plonky3/Plonky3) proving system.
* **Bare Metal ZK:** Miny is not trying to compile un-modified C++ or Rust; it is a clean-slate architecture that lets you hand-optimize cryptographic circuits at the assembly level.
* **Browser-Native:** Designed to be implemented in Wasm for secure, client-side, zero-trust proof generation.

---

## 📁 Project Roadmap
* **v1 (Core):** Minimalist stack machine, field-native math, and basic control flow (Complete).
* **v2 (Expansion):** Scaling to 32 registers for compiler-friendly intermediate state.
* **v3 (Memory):** Implementation of persistent RAM with memory consistency arguments.

---

## 📜 License
This project is dedicated to the public domain under the **CC0 1.0 Universal (CC0 1.0) Public Domain Dedication**. You are free to use, modify, and build upon Miny without any restrictions.
