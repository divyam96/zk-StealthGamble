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

const { ethers } = require("hardhat");
const { groth16 } = require("snarkjs");
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

type Plaintext = bigint[];

describe('ECDH test', () => {
  let eddsa: EdDSA;
  beforeAll(async () => {
    eddsa = await buildEddsaModule();
  }, 150000);

  it("Test if validate odds is computing odds correctly", async () => {

      const mimc7 = buildMimc7();
      const {privKey: bookmakerPrivKey, pubKey: bookmakerPubKey} = genKeypair(eddsa);
      const {privKey: user1PrivKey, pubKey: user1PubKey} = genKeypair(eddsa);
      const {privKey: user2PrivKey, pubKey: user2PubKey} = genKeypair(eddsa);
      const {privKey: user3PrivKey, pubKey: user3PubKey} = genKeypair(eddsa);
      const {privKey: user4PrivKey, pubKey: user4PubKey} = genKeypair(eddsa);
      const {privKey: user5PrivKey, pubKey: user5PubKey} = genKeypair(eddsa);


      // Encryption
      const ecdhSharedKeyEncrypt1 = await genEcdhSharedKey({
        eddsa,
        privKey: user1PrivKey,
        pubKey: bookmakerPubKey,
      });
      // decrypting using bookmaker's private key + user pubkey
      const ecdhBookmakerUser1SharedKey = await genEcdhSharedKey({
        eddsa,
        privKey: bookmakerPrivKey,
        pubKey: user1PubKey,
      });
      const user1BetChoice: bigint[] = [20n, 0n];
      const user1Ciphertext = await encrypt(user1BetChoice, ecdhSharedKeyEncrypt1);
      console.log("User 1 Bet, Choice", user1BetChoice);

      const ecdhSharedKeyEncrypt2 = await genEcdhSharedKey({
        eddsa,
        privKey: user2PrivKey,
        pubKey: bookmakerPubKey,
      });
      // decrypting using bookmaker's private key + user pubkey
      const ecdhBookmakerUser2SharedKey = await genEcdhSharedKey({
        eddsa,
        privKey: bookmakerPrivKey,
        pubKey: user2PubKey,
      });
      const user2BetChoice: bigint[] = [30n, 1n];
      const user2Ciphertext = await encrypt(user2BetChoice, ecdhSharedKeyEncrypt2);
      console.log("User 2 Bet, Choice", user2BetChoice);

      const ecdhSharedKeyEncrypt3 = await genEcdhSharedKey({
        eddsa,
        privKey: user3PrivKey,
        pubKey: bookmakerPubKey,
      });
      // decrypting using bookmaker's private key + user pubkey
      const ecdhBookmakerUser3SharedKey = await genEcdhSharedKey({
        eddsa,
        privKey: bookmakerPrivKey,
        pubKey: user3PubKey,
      });
      const user3BetChoice: bigint[] = [30n, 0n];
      const user3Ciphertext = await encrypt(user3BetChoice, ecdhSharedKeyEncrypt3);
      console.log("User 3 Bet, Choice", user3BetChoice);

      const ecdhSharedKeyEncrypt4 = await genEcdhSharedKey({
        eddsa,
        privKey: user4PrivKey,
        pubKey: bookmakerPubKey,
      });
      // decrypting using bookmaker's private key + user pubkey
      const ecdhBookmakerUser4SharedKey = await genEcdhSharedKey({
        eddsa,
        privKey: bookmakerPrivKey,
        pubKey: user4PubKey,
      });
      const user4BetChoice: bigint[] = [60n, 0n];
      const user4Ciphertext = await encrypt(user4BetChoice, ecdhSharedKeyEncrypt4);
      console.log("User 4 Bet, Choice", user4BetChoice);

      const ecdhSharedKeyEncrypt5= await genEcdhSharedKey({
        eddsa,
        privKey: user5PrivKey,
        pubKey: bookmakerPubKey,
      });
      // decrypting using bookmaker's private key + user pubkey
      const ecdhBookmakerUser5SharedKey = await genEcdhSharedKey({
        eddsa,
        privKey: bookmakerPrivKey,
        pubKey: user5PubKey,
      });
      const user5BetChoice: bigint[] = [90n, 1n];
      const user5Ciphertext = await encrypt(user5BetChoice, ecdhSharedKeyEncrypt5);
      console.log("User 5 Bet, Choice", user5BetChoice);

      const ciphertexts = [user1Ciphertext, user2Ciphertext, user3Ciphertext,
                           user4Ciphertext, user5Ciphertext];
      const ecdhBookmakerSharedKeys = [ecdhBookmakerUser1SharedKey,
                                       ecdhBookmakerUser2SharedKey,
                                       ecdhBookmakerUser3SharedKey,
                                       ecdhBookmakerUser4SharedKey,
                                       ecdhBookmakerUser5SharedKey];

      const decryptedBetsChoices: Plaintext[] = [];

      for(let i=0; i<5; i++){
          var decryptedMessage = await decrypt(ciphertexts[i], ecdhBookmakerSharedKeys[i]);
          // console.log("decrypted via js", decryptedMessage);
          decryptedBetsChoices.push(decryptedMessage)
      }

      // console.log(decryptedBetsChoices);

      // Circuit for decryption
      const circuit = await wasm_tester("circuits/test/validateOdds_test.circom");
      await circuit.loadConstraints();
      const INPUT = stringifyBigInts({
          "betsChoices": decryptedBetsChoices,
          "minBet": 5n,
          "depositMin": 100n,
          "odds0": 110n,
          "odds1": 120n
      });
      // console.log("Input *****", INPUT);
      const witness = await circuit.calculateWitness(INPUT, true);
      await circuit.checkConstraints(witness);
      await circuit.loadSymbols();

      const trueOdds = [110, 120];

      for (let i = 0; i < 2; i++) {
            const out = getSignalByName(circuit, witness, 'main.odds[' + i + ']').toString()
            // console.log("odds", i, out);
            expect(BigInt(out).toString()).toEqual(trueOdds[i].toString());
      }


  });


});

describe("Verifier Contract", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("OddsVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proofs", async function () {

        const BetsChoices = [[20n, 0n], [30n, 1n], [40n, 0n],
                             [20n, 0n], [30n, 1n], [80n, 0n],
                             [30n, 1n], [40n, 2n], [15n, 0n],
                             [20n, 1n]];
        const INPUT = stringifyBigInts({
            "betsChoices": BetsChoices,
            "minBet": 5n,
            "depositMin": 100n,
            "odds0": 135n,
            "odds1": 190n
        });

        // console.log(INPUT);

        const { proof, publicSignals } = await groth16.fullProve(INPUT, "circuits/build/validateOdds_main_js/validateOdds_main.wasm","circuits/build/validateOdds_final.zkey");

        const calldata = await groth16.exportSolidityCallData(proof, publicSignals);

        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());

        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);
        expect(await verifier.verifyProof(a, b, c, Input)).toEqual(true);
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0, 0, 0, 0 ,0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        expect(await verifier.verifyProof(a, b, c, d)).toEqual(false);
    });
});
