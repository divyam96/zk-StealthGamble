jest.setTimeout(900000);

import {
  buildEddsaModule,
  decrypt,
  encrypt,
  genKeypair,
  genEcdhSharedKey,
  buf2Bigint,
  EdDSA
} from '../cryptocore';

import {Scalar} from "ffjavascript";


import { utils } from "ethers"
const ff = require('ffjavascript')
const chai = require("chai");
const path = require("path");

const wasm_tester = require("circom_tester").wasm;

const buildMimc7 = require("circomlibjs").buildMimc7;


const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
// exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
// const Fr = new F1Field(exports.p);

const assert = chai.assert;

const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts

const getSignalByName = (
    circuit: any,
    witness: any,
    signal: string,
) => {

    return witness[circuit.symbols[signal].varIdx]
}

describe('ECDH test', () => {
  let eddsa: EdDSA;
  beforeAll(async () => {
    eddsa = await buildEddsaModule();
  }, 150000);
  it('should encrypt/decrypt text', async () => {
    const { privKey: bobPrivKey, pubKey: bobPubKey } = genKeypair(eddsa);
    const { privKey: alicePrivKey, pubKey: alicePubKey } = genKeypair(eddsa);
    const ecdhSharedKey = await genEcdhSharedKey({
      eddsa,
      privKey: alicePrivKey,
      pubKey: bobPubKey,
    });

    const aliceMessage: bigint[] = [];
    for (let i = 0; i < 5; i++) {
      aliceMessage.push(BigInt(Math.floor(Math.random() * 50)));
    }
    //console.log('plaintext:', aliceMessage);
    // Alice encrypt with her private key and bob pubkey
    const ciphertext = await encrypt(aliceMessage, ecdhSharedKey);

    // decrypting using bob's private key + alice pubkey
    const ecdhbobSharedKey = await genEcdhSharedKey({
      eddsa,
      privKey: bobPrivKey,
      pubKey: alicePubKey,
    });
    const decryptedMessage = await decrypt(ciphertext, ecdhbobSharedKey);
    expect(decryptedMessage).toStrictEqual(aliceMessage);
  });


  // it("hould encrypt via js and decrypt text using Circom", async () => {
  //     const { privKey: bobPrivKey, pubKey: bobPubKey } = genKeypair(eddsa);
  //     const { privKey: alicePrivKey, pubKey: alicePubKey } = genKeypair(eddsa);
  //     const ecdhSharedKey = await genEcdhSharedKey({
  //       eddsa,
  //       privKey: alicePrivKey,
  //       pubKey: bobPubKey,
  //     });
  //     const mimc7 = buildMimc7();
  //     const aliceMessage: bigint[] = [5n, 10n, 15n, 20n, 25n];
  //     // for (let i = 0; i < 5; i++) {
  //     //   aliceMessage.push(BigInt(Math.floor(Math.random() * 50)));
  //     // }
  //     console.log("Alice Message", aliceMessage);
  //     //console.log('plaintext:', aliceMessage);
  //     // Alice encrypt with her private key and bob pubkey
  //     const ciphertext = await encrypt(aliceMessage, ecdhSharedKey);
  //
  //     // decrypting using bob's private key + alice pubkey
  //     const ecdhbobSharedKey = await genEcdhSharedKey({
  //       eddsa,
  //       privKey: bobPrivKey,
  //       pubKey: alicePubKey,
  //     });
  //
  //     const decryptedMessage = await decrypt(ciphertext, ecdhbobSharedKey);
  //     console.log("decrypted via js", decryptedMessage);
  //
  //
  //     // Circuit for decryption
  //     const circuit = await wasm_tester("circuits/test/decrypt_test.circom");
  //     await circuit.loadConstraints();
  //
  //     const message = [ciphertext['iv'], ...ciphertext['data']]
  //
  //     // console.log("ecdh key:", ecdhbobSharedKey)
  //     // console.log("ecdh key buf2Bigint :", buf2Bigint(ecdhbobSharedKey));
  //     // console.log("ecdh key stringifyBigInts :", stringifyBigInts(ecdhbobSharedKey));
  //     // console.log("ecdh key stringifyBigInts buf2Bigint:", stringifyBigInts(buf2Bigint(ecdhbobSharedKey)));
  //
  //     const INPUT = stringifyBigInts({
  //         "message": message,
  //         "private_key": buf2Bigint(ecdhbobSharedKey),
  //     });
  //     // console.log("Input *****", INPUT);
  //     const witness = await circuit.calculateWitness(INPUT, true);
  //     await circuit.checkConstraints(witness);
  //     await circuit.loadSymbols();
  //     const e = 9217832752965163281126794696382167582253754326422264172574459058501773557008n
  //     const mimc7_val = 17087339816844755265819021972696339962546302780432107849561487350141042098409n
  //     console.log("*** e - mimc7_val", mimc7.F.e(BigInt(e)) - mimc7.F.e(BigInt(mimc7_val)));
  //     // for (let i = 0; i < 5; i++) {
  //     //       const out = getSignalByName(circuit, witness, 'main.out[' + i + ']').toString()
  //     //       console.log("output", out);
  //     //       //expect(mimc7.F.e(BigInt(out)).toString()).toEqual(aliceMessage[i].toString());
  //     // }
  //
  //
  // });

  it('should fail if decrypted with incorrect public key', async () => {
    const { privKey: bobPrivKey, pubKey: bobPubKey } = genKeypair(eddsa);
    const { privKey: alicePrivKey } = genKeypair(eddsa);

    const ecdhSharedKey = await genEcdhSharedKey({
      eddsa,
      privKey: alicePrivKey,
      pubKey: bobPubKey,
    });

    const aliceMessage: bigint[] = [];
    for (let i = 0; i < 5; i++) {
      aliceMessage.push(BigInt(Math.floor(Math.random() * 50)));
    }
    //console.log('plaintext:', aliceMessage);
    // Alice encrypt with her private key and bob pubkey
    const ciphertext = await encrypt(aliceMessage, ecdhSharedKey);

    const maliciousPubKey = [eddsa.prv2pub(123n.toString())];
    const ecdhSharedIncorrectKey = await genEcdhSharedKey({
      eddsa,
      privKey: bobPrivKey,
      pubKey: maliciousPubKey,
    });

    const decryptedMessage = await decrypt(ciphertext, ecdhSharedIncorrectKey);
    expect(decryptedMessage).not.toEqual(aliceMessage);
  });


});
