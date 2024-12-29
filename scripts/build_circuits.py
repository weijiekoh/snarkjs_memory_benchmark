#!/usr/bin/env python3

import os

start = 10 # inclusive
end = 12 # not inclusive

def gen_build_dir_path():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(current_dir, "..", "build")

def gen_circom_dir_path():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(current_dir, "..", "circom")

def mkdir_if_not_exists(dirpath):
    if not os.path.exists(dirpath):
        os.makedirs(dirpath)

def gen_main_circom_filepath(num_constraints):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(gen_circom_dir_path(), gen_main_circom_filename(num_constraints))

def gen_zkey_filepath(num_constraints):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(gen_build_dir_path(), gen_zkey_filename(num_constraints))

def gen_vkey_filepath(num_constraints):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(gen_build_dir_path(), gen_vkey_filename(num_constraints))

def gen_r1cs_filepath(num_constraints):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(gen_build_dir_path(), gen_r1cs_filename(num_constraints))

def gen_zkey_filename(num_constraints):
    return f"main_{num_constraints}.zkey"

def gen_vkey_filename(num_constraints):
    return f"main_{num_constraints}.vkey"

def gen_r1cs_filename(num_constraints):
    return f"main_{num_constraints}.r1cs"

def gen_main_circom_filename(num_constraints):
    return f"main_{num_constraints}.circom"

def gen_main_circom_code(num_constraints):
    return f"""
pragma circom 2.0.0;
include "multiplier.circom";
component main = Multiplier({num_constraints});
""".strip() + "\n"

def gen_ppot_filepath():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(current_dir, "..", "powersOfTau28_hez_final_17.ptau")

if __name__ == '__main__':
    build_dir_path = gen_build_dir_path()

    mkdir_if_not_exists(build_dir_path)
    mkdir_if_not_exists(gen_circom_dir_path())

    for i in range(start, end):
        num_constraints = 2 ** i

        # Generate the main file
        main_circom_code = gen_main_circom_code(num_constraints)

        # Generate the filepath
        main_circom_filepath = gen_main_circom_filepath(num_constraints)

        # Generate the zkey filepath
        zkey_filepath = gen_zkey_filepath(num_constraints)

        # Generate the r1cs filepath
        r1cs_filepath = gen_r1cs_filepath(num_constraints)

        # Generate the vkey filepath
        vkey_filepath = gen_vkey_filepath(num_constraints)

        # Generate the PPOT filepath
        ppot_filepath = gen_ppot_filepath()

        # Write the main file
        with open(main_circom_filepath, "w") as f:
            f.write(main_circom_code)

        # Compile the circuit
        compile_cmd = f"circom -o {build_dir_path} {main_circom_filepath} --r1cs --wasm"

        # Execute the compilation command
        os.system(compile_cmd)

        # Groth16 setup
        setup_cmd = f"npx snarkjs groth16 setup {r1cs_filepath} {ppot_filepath} {zkey_filepath}"
        os.system(setup_cmd)

        # Generate the verification key
        vkey_cmd = f"npx snarkjs zkey export verificationkey {zkey_filepath} {vkey_filepath}"
        os.system(vkey_cmd)
