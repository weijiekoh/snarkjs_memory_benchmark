import * as builder from './witness_calculator'
import { groth16 } from 'snarkjs'

const numRuns = 1
const start = 10
const end = 22

let staticPath = '/static/'
if (process.env.NODE_ENV !== 'production') {
    staticPath = 'http://localhost:8000'
}

const round = (num: number, precision: number) => {
    const factor = 10 ** precision
    return Math.round(num * factor) / factor
}

const setBtnStatus = (enabled: boolean) => {
    const genProofBtns = document.getElementsByClassName('gen_proof_btn')
    for (let i = 0; i < genProofBtns.length; i++) {
        genProofBtns[i].disabled = !enabled 
    }
}

const calculateProofs = async (
    size: number,
) => {
    const groth16ZkeyPath = `${staticPath}/main_${size}.zkey`
    const wasmPath = `${staticPath}/main_${size}_js/main_${size}.wasm`
    const vkPath = `${staticPath}/main_${size}.vkey`

    const wasmSizeComponent = document.getElementById('wasm_size_' + size)
    wasmSizeComponent.innerHTML = "Downloading..."
    let resp = await fetch(wasmPath)
    const wasmBuff = await resp.arrayBuffer()
    const wasmMb = wasmBuff.byteLength / 1024 / 1024
    wasmSizeComponent.innerHTML = round(wasmMb, 2).toString()

    const zkeySizeComponent = document.getElementById('zkey_size_' + size)
    zkeySizeComponent.innerHTML = "Downloading..."
    resp = await fetch(groth16ZkeyPath)
    const zkeyBuff = await resp.arrayBuffer()
    const zkeyMb = zkeyBuff.byteLength / 1024 / 1024
    zkeySizeComponent.innerHTML = round(zkeyMb, 2).toString()

    const circuitInputs = {
        a: BigInt('1'),
        b: BigInt('1'),
    }

    const startWitnessCalc = Date.now()
    for (let i = 1; i < numRuns; i++) {
        const witnessCalculator = await builder(wasmBuff)
        await witnessCalculator.calculateWTNSBin(circuitInputs, 0)
    }
    const witnessCalculator = await builder(wasmBuff)
    const wtnsBuff = await witnessCalculator.calculateWTNSBin(circuitInputs, 0)
    const endWitnessCalc = Date.now()
    const timeTakenWitnessCalc = (((endWitnessCalc - startWitnessCalc) / numRuns) / 1000).toString()

    const witnessCalcTimeComponent = document.getElementById('witness_calc_' + size)
    witnessCalcTimeComponent.innerHTML = round(timeTakenWitnessCalc, 3)

    const timeComponent = document.getElementById('groth16_time_' + size)
    timeComponent.innerHTML = "Please wait..."

    // Start timer for Groth16
    const start = Date.now()

    for (let i = 1; i < numRuns; i++) {
        await groth16.prove(new Uint8Array(zkeyBuff), wtnsBuff, null)
    }

    const { proof, publicSignals, timings } =
        await groth16.prove(new Uint8Array(zkeyBuff), wtnsBuff, null)

    // End timer
    const end = Date.now()

    const timeTaken = (((end - start) / numRuns) / 1000).toString()

    timeComponent.innerHTML = round(timeTaken, 3)

    const abc = document.getElementById('groth16_abc_' + size)
    abc.innerHTML = JSON.stringify(timings.abc)

    const msmA = document.getElementById('groth16_msm_a_' + size)
    msmA.innerHTML = JSON.stringify(timings.msmA)

    const msmB1 = document.getElementById('groth16_msm_b1_' + size)
    msmB1.innerHTML = JSON.stringify(timings.msmB1)

    const msmB2 = document.getElementById('groth16_msm_b2_' + size)
    msmB2.innerHTML = JSON.stringify(timings.msmB2)

    const msmC = document.getElementById('groth16_msm_c_' + size)
    msmC.innerHTML = JSON.stringify(timings.msmC)

    const msmH = document.getElementById('groth16_msm_h_' + size)
    msmH.innerHTML = JSON.stringify(timings.msmH)

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

    const p = document.createElement("p")
    const genAllBtn = document.createElement("button")
    genAllBtn.className = "gen_proof_btn"
    genAllBtn.innerHTML = "Generate all"
    genAllBtn.addEventListener("click", async () => {
        setBtnStatus(false)
        for (let i = start; i < end; i++) {
            await calculateProofs(2 ** i)
        }
        setBtnStatus(true)
    })
    p.appendChild(genAllBtn)
    mainDiv.appendChild(genAllBtn)

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
    thWasmSize.innerHTML = "WASM size (MB)"
    theadTr.appendChild(thWasmSize)

    const thZkeySize = document.createElement("th")
    thZkeySize.innerHTML = "zkey size (MB)"
    theadTr.appendChild(thZkeySize)

    const thWitnessCalc = document.createElement("th")
    thWitnessCalc.innerHTML = "Witness computation (s)"
    theadTr.appendChild(thWitnessCalc)

    const thGroth = document.createElement("th")
    thGroth.innerHTML = "Proof generation (s)"
    theadTr.appendChild(thGroth)

    const thABC = document.createElement("th")
    thABC.innerHTML = "ABC (ms)"
    theadTr.appendChild(thABC)

    const thMsmA = document.createElement("th")
    thMsmA.innerHTML = "MSM A (ms)"
    theadTr.appendChild(thMsmA)

    const thMsmB1 = document.createElement("th")
    thMsmB1.innerHTML = "MSM B1 (ms)"
    theadTr.appendChild(thMsmB1)

    const thMsmB2 = document.createElement("th")
    thMsmB2.innerHTML = "MSM B2 (ms)"
    theadTr.appendChild(thMsmB2)

    const thMsmC = document.createElement("th")
    thMsmC.innerHTML = "MSM C (ms)"
    theadTr.appendChild(thMsmC)

    const thMsmH = document.createElement("th")
    thMsmH.innerHTML = "MSM H (ms)"
    theadTr.appendChild(thMsmH)

    const th2 = document.createElement("th")
    th2.innerHTML = "Proof valid?"
    theadTr.appendChild(th2)
    thead.appendChild(theadTr)

    const tbody = document.createElement("tbody")
    table.appendChild(tbody)

    for (let i = start; i < end; i++) {
        const numConstraints = 2 ** i
        const tr = document.createElement("tr")

        const tdG = document.createElement("td")
        const genProofBtn = document.createElement("button")
        genProofBtn.className = "gen_proof_btn"
        genProofBtn.innerHTML = "Generate"
        genProofBtn.addEventListener("click", async () => {
            setBtnStatus(false)
            await calculateProofs(numConstraints)
            setBtnStatus(true)
        })
        tdG.appendChild(genProofBtn)
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

        const tdWitnessCalc = document.createElement("td")
        tdWitnessCalc.id = "witness_calc_" + numConstraints
        tr.appendChild(tdWitnessCalc)
        tbody.appendChild(tr)

        const tdGroth16 = document.createElement("td")
        tdGroth16.id = "groth16_time_" + numConstraints
        tr.appendChild(tdGroth16)
        tbody.appendChild(tr)

        const tdAbc = document.createElement("td")
        tdAbc.id = "groth16_abc_" + numConstraints
        tr.appendChild(tdAbc)
        tbody.appendChild(tr)

        const tdMsmA = document.createElement("td")
        tdMsmA.id = "groth16_msm_a_" + numConstraints
        tr.appendChild(tdMsmA)
        tbody.appendChild(tr)

        const tdMsmB1 = document.createElement("td")
        tdMsmB1.id = "groth16_msm_b1_" + numConstraints
        tr.appendChild(tdMsmB1)
        tbody.appendChild(tr)

        const tdMsmB2 = document.createElement("td")
        tdMsmB2.id = "groth16_msm_b2_" + numConstraints
        tr.appendChild(tdMsmB2)
        tbody.appendChild(tr)

        const tdMsmC = document.createElement("td")
        tdMsmC.id = "groth16_msm_c_" + numConstraints
        tr.appendChild(tdMsmC)
        tbody.appendChild(tr)

        const tdMsmH = document.createElement("td")
        tdMsmH.id = "groth16_msm_h_" + numConstraints
        tr.appendChild(tdMsmH)
        tbody.appendChild(tr)

        const tdValid = document.createElement("td")
        tdValid.id = "groth16_valid_" + numConstraints
        tr.appendChild(tdValid)
        tbody.appendChild(tr)
    }
}

main()
