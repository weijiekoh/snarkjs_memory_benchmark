import * as builder from './witness_calculator'
import { groth16 } from 'snarkjs'

const staticPath = 'http://127.0.0.1:8000'
const sizes = [1024];

const calculateProof = async (
    size: number,
) => {
    const zkeyPath = `${staticPath}/main_${size}.zkey`
    const wasmPath = `${staticPath}/main_${size}_js/main_${size}.wasm`
    const vkPath = `${staticPath}/main_${size}_vkey.json`

    // Fetch the zkey and wasm files, and convert them into array buffers
    let resp = await fetch(wasmPath)
    const wasmBuff = await resp.arrayBuffer()
    resp = await fetch(zkeyPath)
    const zkeyBuff = await resp.arrayBuffer()

    const circuitInputs = {
        a: BigInt('1'),
        b: BigInt('1'),
    }

    const witnessCalculator = await builder(wasmBuff)

    const wtnsBuff = await witnessCalculator.calculateWTNSBin(circuitInputs, 0)

    const start = Date.now()
    const { proof, publicSignals } =
        await groth16.prove(new Uint8Array(zkeyBuff), wtnsBuff, null)
    const end = Date.now()
    const timeTaken = ((end - start) / 1000).toString() + ' seconds'

    const timeComponent = document.getElementById('time_1024')
    timeComponent.innerHTML = timeTaken

    const proofForTx = [
        proof.pi_a[0],
        proof.pi_a[1],
        proof.pi_b[0][1],
        proof.pi_b[0][0],
        proof.pi_b[1][1],
        proof.pi_b[1][0],
        proof.pi_c[0],
        proof.pi_c[1],
    ];

      const proofAsStr = JSON.stringify(
            proofForTx.map((x) => BigInt(x).toString(10)),
      ).split('\n').join().replaceAll('"', '')

    const proofCompnent = document.getElementById('proof')
    proofCompnent.innerHTML = proofAsStr

    // Verify the proof
    resp = await fetch(vkPath)
    const vkey = await resp.json()

    const res = await groth16.verify(vkey, publicSignals, proof);

    const resultComponent = document.getElementById('valid_1024')
    resultComponent.innerHTML = res;
}

const main = async () => {
    const bGenProof = document.getElementById("gen_proof_1024")

    bGenProof.addEventListener("click", () => {
        calculateProof(1024)
    })
}


main()
