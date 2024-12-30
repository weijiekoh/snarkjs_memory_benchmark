# snarkjs_memory_benchmark

This repository provides in-browser benchmarks for Groth16 proof generation
using [snarkjs](https://github.com/iden3/snarkjs) for circuits ranging from
2^10 to 2^19 constraints, inclusive.

It has been deployed at
[https://bit.ly/snarkjsgroth16benchmarks](https://bit.ly/snarkjsgroth16benchmarks).

## Quick start

To run this locally, you need circom 2.0 installed.

Build the circuits and generate their proving and verification keys (the
trusted setup is insecure, so don't use them in production):

```bash
./scripts/build_circuits.py
```

In the `web` directory, run each of these commands in a separate terminal:

```bash
npm run serve
```

```bash
npm run serve-static
```

## Docker

Make sure that you have built the circuits using `scripts/build_circuits.py`
before running the following commands:

```bash
./build_docker.sh
./run_docker.sh
```
