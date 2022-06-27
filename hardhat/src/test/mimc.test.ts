const chai = require("chai");
const path = require("path");
const wasm_tester = require("circom_tester").wasm;

import {
  buildEddsaModule,
  decrypt,
  encrypt,
  genKeypair,
  genEcdhSharedKey,
  buf2Bigint,
  EdDSA
} from '../cryptocore';

const buildMimc7 = require("circomlibjs").buildMimc7;

describe("MiMC Circuit test", function () {
    let circuit;
    let mimc7;

    jest.setTimeout(900000);

    beforeAll( async () => {
        mimc7 = await buildMimc7();
        circuit = await wasm_tester("circuits/test/mimc_test.circom");
    });

    it("Should check constrain", async () => {
        const w = await circuit.calculateWitness({x_in: 1n, k: 2n}, true);

        const res2 = mimc7.hash(1n,2n,91);
        // console.log("res2", buf2Bigint(res2))
        // console.log("res2 object", mimc7.F.toObject(res2));
        await circuit.assertOut(w, {out: mimc7.F.toObject(res2)});
        await circuit.checkConstraints(w);
    });
});
