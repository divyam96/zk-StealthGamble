/* global BigInt */

import { generateWitness } from './generate_witness';
import { groth16 } from 'snarkjs';

import { F1Field, Scalar} from  "ffjavascript";
const Fr = new F1Field(Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617"));

export async function generateCalldata(input) {

    let generateWitnessSuccess = true;


    let witness = await generateWitness(input).then()
        .catch((error) => {
            console.error(error);
            generateWitnessSuccess = false;
        });


    if (!generateWitnessSuccess) { return; }

    const { proof, publicSignals } = await groth16.prove('validateOdds_final.zkey', witness);

    const calldata = await groth16.exportSolidityCallData(proof, publicSignals);

    const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());


    const a = [argv[0], argv[1]];
    const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
    const c = [argv[6], argv[7]];
    const Input = argv.slice(8);

    return [a, b, c, Input];
}
