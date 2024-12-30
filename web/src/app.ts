import * as builder from './witness_calculator'
import { groth16, plonk } from 'snarkjs'

const numRuns = 3

const staticPath = 'http://127.0.0.1:8000'

const round = (num: number, precision: number) => {
    const factor = 10 ** precision
    return Math.round(num * factor) / factor
}

const calculateProofs = async (
    size: number,
) => {
    const groth16ZkeyPath = `${staticPath}/main_${size}.zkey`
    const wasmPath = `${staticPath}/main_${size}_js/main_${size}.wasm`
    const vkPath = `${staticPath}/main_${size}.vkey`

    const plonkZkeyPath = `${staticPath}/main_${size}.plonk.zkey`
    const plonkVkPath = `${staticPath}/main_${size}.plonk.vkey`

    // Fetch the zkey and wasm files, and convert them into array buffers
    let resp = await fetch(wasmPath)
    const wasmBuff = await resp.arrayBuffer()
    resp = await fetch(groth16ZkeyPath)
    const zkeyBuff = await resp.arrayBuffer()
    resp = await fetch(plonkZkeyPath)
    const plonkZkeyBuff = await resp.arrayBuffer()

    const wasmKb = wasmBuff.byteLength / 1024
    const zkeyKb = zkeyBuff.byteLength / 1024
    const plonkZkeyKb = plonkZkeyBuff.byteLength / 1024

    const circuitInputs = {
        a: BigInt('1'),
        b: BigInt('1'),
    }

    const witnessCalculator = await builder(wasmBuff)

    const wtnsBuff = await witnessCalculator.calculateWTNSBin(circuitInputs, 0)

    // Start timer for Groth16
    const start = Date.now()

    for (let i = 1; i < numRuns; i++) {
        await groth16.prove(new Uint8Array(zkeyBuff), wtnsBuff, null)
    }

    const { proof, publicSignals } =
        await groth16.prove(new Uint8Array(zkeyBuff), wtnsBuff, null)

    // End timer
    const end = Date.now()

    const timeTaken = (((end - start) / numRuns) / 1000).toString()

    const timeComponent = document.getElementById('groth16_time_' + size)
    timeComponent.innerHTML = round(timeTaken, 3)

    // Start timer for Plonk
    const startPlonk = Date.now()

    // TODO: fix this
    //for (let i = 1; i < numRuns; i++) {
        //await plonk.prove(new Uint8Array(plonkZkeyBuff), wtnsBuff, null)
    //}

    // End timer
    const endPlonk = Date.now()
    const timeTakenPlonk = (((endPlonk - startPlonk) / numRuns) / 1000).toString()
    const plonkTimeComponent = document.getElementById('plonk_time_' + size)
    //plonkTimeComponent.innerHTML = round(timeTakenPlonk, 3)
    plonkTimeComponent.innerHTML = "Not implemented yet"

    const wasmSizeComponent = document.getElementById('wasm_size_' + size)
    wasmSizeComponent.innerHTML = round(wasmKb, 2).toString()

    const zkeySizeComponent = document.getElementById('zkey_size_' + size)
    zkeySizeComponent.innerHTML = round(zkeyKb, 2).toString()

    const plonkZkeySizeComponent = document.getElementById('plonk_zkey_size_' + size)
    plonkZkeySizeComponent.innerHTML = round(plonkZkeyKb, 2).toString()

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

    // Verify the proof
    resp = await fetch(vkPath)
    const vkey = await resp.json()

    const res = await groth16.verify(vkey, publicSignals, proof);

    const resultComponent = document.getElementById('groth16_valid_' + size)
    resultComponent.innerHTML = res;
}

const main = async () => {
    // Build the main table
    const mainDiv = document.getElementById("main")

    // Insert a table into mainDiv
    const table = document.createElement("table")
    mainDiv.appendChild(table)

    // Table header
    const thead = document.createElement("thead")
    table.appendChild(thead)
    const theadTr = document.createElement("tr")

    const thGenProof = document.createElement("th")
    thGenProof.innerHTML = "Generate proof"
    theadTr.appendChild(thGenProof)

    const th0 = document.createElement("th")
    th0.innerHTML = "# constraints"
    theadTr.appendChild(th0)

    const thWasmSize = document.createElement("th")
    thWasmSize.innerHTML = "WASM size (KB)"
    theadTr.appendChild(thWasmSize)

    const thZkeySize = document.createElement("th")
    thZkeySize.innerHTML = "Groth16 zkey size (KB)"
    theadTr.appendChild(thZkeySize)

    const thPlonkZkeySize = document.createElement("th")
    thPlonkZkeySize.innerHTML = "Plonk zkey size (KB)"
    theadTr.appendChild(thPlonkZkeySize)

    const thGroth = document.createElement("th")
    thGroth.innerHTML = "Groth16 proofgen time (s)"
    theadTr.appendChild(thGroth)

    const thPlonk = document.createElement("th")
    thPlonk.innerHTML = "Plonk proofgen time (s)"
    theadTr.appendChild(thPlonk)

    const th2 = document.createElement("th")
    th2.innerHTML = "Groth16 valid?"
    theadTr.appendChild(th2)
    thead.appendChild(theadTr)

    const start = 10
    const end = 17

    const tbody = document.createElement("tbody")
    table.appendChild(tbody)

    for (let i = start; i < end; i++) {
        const numConstraints = 2 ** i
        const tr = document.createElement("tr")

        const tdG = document.createElement("td")
        const bGenProof = document.createElement("button")
        bGenProof.innerHTML = "Generate proofs"
        bGenProof.addEventListener("click", () => {
            calculateProofs(numConstraints)
        })
        tdG.appendChild(bGenProof)
        tr.appendChild(tdG)
        tbody.appendChild(tr)

        const tdConstraints = document.createElement("td")
        tdConstraints.innerHTML = numConstraints
        tr.appendChild(tdConstraints)
        tbody.appendChild(tr)

        const tdWasm = document.createElement("td")
        tdWasm.id = "wasm_size_" + numConstraints
        tr.appendChild(tdWasm)
        tbody.appendChild(tr)

        const tdZkey = document.createElement("td")
        tdZkey.id = "zkey_size_" + numConstraints
        tr.appendChild(tdZkey)
        tbody.appendChild(tr)

        const tdPlonkZkey = document.createElement("td")
        tdPlonkZkey.id = "plonk_zkey_size_" + numConstraints
        tr.appendChild(tdPlonkZkey)
        tbody.appendChild(tr)

        const tdTime = document.createElement("td")
        tdTime.id = "groth16_time_" + numConstraints
        tr.appendChild(tdTime)
        tbody.appendChild(tr)

        const tdPlonkTime = document.createElement("td")
        tdPlonkTime.id = "plonk_time_" + numConstraints
        tr.appendChild(tdPlonkTime)
        tbody.appendChild(tr)

        const tdValid = document.createElement("td")
        tdValid.id = "groth16_valid_" + numConstraints
        tr.appendChild(tdValid)
        tbody.appendChild(tr)
    }
}


main()
