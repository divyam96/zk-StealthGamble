jest.setTimeout(900000);

import {
  buildEddsaModule,
  decrypt,
  encrypt,
  genKeypair,
  genEcdhSharedKey,
  buf2Bigint,
  Ciphertext,
  fromHexString,
  EdDSA
} from '../cryptocore';

import {Scalar} from "ffjavascript";

const { groth16 } = require("snarkjs");
const { ethers } = require("hardhat");
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

type Plaintext = bigint[];

describe('e2e test', () => {
  let eddsa: EdDSA;
  beforeAll(async () => {
    eddsa = await buildEddsaModule();
  }, 150000);

  it("Encrypt, Decrypt and Disribute Rewards", async () => {

      const mimc7 = buildMimc7();
      const {privKey: bookmakerPrivKey, pubKey: bookmakerPubKey} = genKeypair(eddsa);
      const {privKey: user1PrivKey, pubKey: user1PubKey} = genKeypair(eddsa);
      const {privKey: user2PrivKey, pubKey: user2PubKey} = genKeypair(eddsa);
      const {privKey: user3PrivKey, pubKey: user3PubKey} = genKeypair(eddsa);
      const {privKey: user4PrivKey, pubKey: user4PubKey} = genKeypair(eddsa);
      const {privKey: user5PrivKey, pubKey: user5PubKey} = genKeypair(eddsa);

      const GambleHouse = await ethers.getContractFactory("GambleHouse");

      var nowTs = Math.floor(Date.now() / 1000);
      var mockStartTime = nowTs + (60*60);
      var mockEndTime = nowTs + (24*60*60);
      var fixId = 123;
      var team0 = "Team A";
      var team1 = "Team B";
      var league = "Champions League";
      var venue = "Bangalore";

      var bookmakerPubKeyHex1 = Buffer.from(bookmakerPubKey[0]).toString('hex');
      var bookmakerPubKeyHex2 = Buffer.from(bookmakerPubKey[1]).toString('hex');

      const [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
      const addrs = [addr1, addr2, addr3, addr4, addr5]

      const contract = await GambleHouse.deploy(owner.address,
                                                bookmakerPrivKey,
                                                bookmakerPubKeyHex1,
                                                bookmakerPubKeyHex2,
                                                mockStartTime,
                                                mockEndTime,
                                                fixId,
                                                team0,
                                                team1,
                                                league,
                                                venue
                                               );
      const bookmakerKeys = await contract.getBookmakerKeys();
      var retBookmakerPubKey = [fromHexString(bookmakerKeys[1]),
                                fromHexString(bookmakerKeys[2])];

      // Encryption
      const ecdhSharedKeyEncrypt1 = await genEcdhSharedKey({
        eddsa,
        privKey: user1PrivKey,
        pubKey: retBookmakerPubKey,
      });

      const user1BetChoice: bigint[] = [20n, 0n];
      const user1Ciphertext = await encrypt(user1BetChoice, ecdhSharedKeyEncrypt1);
      console.log("User 1 Bet, Choice", user1BetChoice);

      const ecdhSharedKeyEncrypt2 = await genEcdhSharedKey({
        eddsa,
        privKey: user2PrivKey,
        pubKey: retBookmakerPubKey,
      });

      const user2BetChoice: bigint[] = [30n, 1n];
      const user2Ciphertext = await encrypt(user2BetChoice, ecdhSharedKeyEncrypt2);
      console.log("User 2 Bet, Choice", user2BetChoice);

      const ecdhSharedKeyEncrypt3 = await genEcdhSharedKey({
        eddsa,
        privKey: user3PrivKey,
        pubKey: retBookmakerPubKey,
      });


      const user3BetChoice: bigint[] = [30n, 0n];
      const user3Ciphertext = await encrypt(user3BetChoice, ecdhSharedKeyEncrypt3);
      console.log("User 3 Bet, Choice", user3BetChoice);

      const ecdhSharedKeyEncrypt4 = await genEcdhSharedKey({
        eddsa,
        privKey: user4PrivKey,
        pubKey: retBookmakerPubKey,
      });


      const user4BetChoice: bigint[] = [60n, 0n];
      const user4Ciphertext = await encrypt(user4BetChoice, ecdhSharedKeyEncrypt4);
      console.log("User 4 Bet, Choice", user4BetChoice);

      const ecdhSharedKeyEncrypt5= await genEcdhSharedKey({
        eddsa,
        privKey: user5PrivKey,
        pubKey: retBookmakerPubKey,
      });


      const user5BetChoice: bigint[] = [90n, 1n];
      const user5Ciphertext = await encrypt(user5BetChoice, ecdhSharedKeyEncrypt5);
      console.log("User 5 Bet, Choice", user5BetChoice);

      const ciphertexts = [user1Ciphertext, user2Ciphertext, user3Ciphertext,
                           user4Ciphertext, user5Ciphertext];

      const userPubKeys = [user1PubKey, user2PubKey, user3PubKey,
                           user4PubKey, user5PubKey];

     const depositAmount = ethers.utils.formatEther("100");

     for(let i=0; i<5; i++){

       var userPubKeyHex1 = Buffer.from(userPubKeys[i][0]).toString('hex');
       var userPubKeyHex2 = Buffer.from(userPubKeys[i][1]).toString('hex');

       await contract.connect(addrs[i])
       .deposit(ciphertexts[i]['iv'],
                ciphertexts[i]['data'][0],
                ciphertexts[i]['data'][1],
                userPubKeyHex1,
                userPubKeyHex2,
                {value: ethers.utils.parseEther(depositAmount.toString())});
     }

     const stateValues =  await contract.readParticipants();
     const contractCipherTexts: Ciphertext[] = [];

     const retUserPubKeys: any[] = [];

     for(let i=0; i<5; i++){
           expect(stateValues[0][i]).toEqual(addrs[i].address);
           expect(ethers.utils.formatEther(stateValues[1][i])).toEqual(depositAmount);
           expect(stateValues[2][i].toBigInt()).toEqual(ciphertexts[i]['iv']);
           expect(stateValues[3][i].toBigInt()).toEqual(ciphertexts[i]['data'][0]);
           expect(stateValues[4][i].toBigInt()).toEqual(ciphertexts[i]['data'][1]);
           var temp_map: Ciphertext = {'iv': stateValues[2][i].toBigInt(),
                           'data': [stateValues[3][i].toBigInt(), stateValues[4][i].toBigInt()]
                          };
           contractCipherTexts.push(temp_map);
           var userPubKey = [fromHexString(stateValues[5][i]),
                             fromHexString(stateValues[6][i])];
           retUserPubKeys.push(userPubKey);

    }


    const choice0Bets: number[] = [];
    const choice1Bets: number[] = [];

    const choice0Deposits: number[] = [];
    const choice1Deposits: number[] = [];

    const choice0Addrs: string[] = [];
    const choice1Addrs: string[] = [];

    for(let i=0; i<5; i++){


        var ecdhSharedKey = await genEcdhSharedKey({
                                                  eddsa,
                                                  privKey: bookmakerKeys[0].toBigInt(),
                                                  pubKey: retUserPubKeys[i],
                                                });

        var decryptedMessage = await decrypt(contractCipherTexts[i], ecdhSharedKey);
        // console.log("decrypted via js", decryptedMessage);
        if(decryptedMessage[1] == 0n){
          choice0Bets.push(Number(decryptedMessage[0]));
          choice0Addrs.push(stateValues[0][i]);
          choice0Deposits.push(stateValues[1][i].toNumber());
        }
        else if ((decryptedMessage[1] == 1n)){
          choice1Bets.push(Number(decryptedMessage[0]));
          choice1Addrs.push(stateValues[0][i]);
          choice1Deposits.push(stateValues[1][i].toNumber());
        }
    }

    const odds0 = choice0Bets.reduce((partialSum, a) => partialSum + a, 0);
    const odds1 = choice1Bets.reduce((partialSum, a) => partialSum + a, 0);
    contract.updateOdds(odds0, odds1, 10);
    const gameInfoUpdated = await contract.getGameInfo();

    // Distribute Prizes

    const potSize = gameInfoUpdated[4].toBigInt();

    const rewardAddrs: String[] = [];
    const rewardAmount: number[] = [];

    if (odds0 > odds1){

        for(let i=0; i<choice0Bets.length; i++){

            // console.log("Deposit, bet, odds1, odds0", choice0Deposits[i], choice0Bets[i], odds1, odds0);
            var reward: number = Math.floor(choice0Deposits[i]+(((choice0Bets[i])/odds0)*odds1));
            rewardAmount.push(reward);
            rewardAddrs.push(choice0Addrs[i]);

        }

        for(let i=0; i<choice1Bets.length; i++){

            var reward: number = choice1Deposits[i] - choice1Bets[i];
            rewardAmount.push(reward);
            rewardAddrs.push(choice1Addrs[i]);

        }

    }

    else if (odds1 > odds0){

        for(let i=0; i<choice1Bets.length; i++){

            // console.log("Deposit, bet, odds1, odds0", choice1Deposits[i], choice1Bets[i], odds1, odds0);
            var reward: number = Math.floor(choice1Deposits[i]+(((choice1Bets[i])/odds1)*odds0));
            rewardAmount.push(reward);
            rewardAddrs.push(choice1Addrs[i]);

        }

        for(let i=0; i<choice0Bets.length; i++){

            var reward: number = choice0Deposits[i] - choice0Bets[i];
            rewardAmount.push(reward);
            rewardAddrs.push(choice0Addrs[i]);

        }

    }

    else {

      for(let i=0; i<choice0Bets.length; i++){

          var reward: number = choice0Deposits[i];
          rewardAmount.push(reward);
          rewardAddrs.push(choice0Addrs[i]);

      }

      for(let i=0; i<choice1Bets.length; i++){

          var reward: number = choice1Deposits[i];
          rewardAmount.push(reward);
          rewardAddrs.push(choice1Addrs[i]);

      }

    }
    console.log("Reward Distribution: ", rewardAddrs, rewardAmount);
    await contract.setRewards(rewardAddrs, rewardAmount);
    await contract.distributeRewards();


  });


});
