#!/usr/bin/env bash

circom -o ./build/ ./circom/main_1024.circom --r1cs --wasm

npx snarkjs plonk setup ./build/main_1024.r1cs ./powersOfTau28_hez_final_17.ptau build/main_1024.plonk.zkey 

npx snarkjs wtns calculate ./build/main_1024_js/main_1024.wasm input.json build/witness.wtns

npx snarkjs plonk prove build/main_1024.plonk.zkey ./build/witness.wtns proof.json
