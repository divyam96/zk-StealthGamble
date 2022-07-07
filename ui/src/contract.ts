import { ethers } from "ethers";
import address from './artifacts/devnet_config.json';
import OddsVerifier from './artifacts/OddsVerifier.json';
import GambleHouse from './artifacts/GambleHouse.json';
import GambleHouseFactory from './artifacts/GambleHouseFactory.json';
import { generateCalldata } from './circuit_js/generate_calldata';

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
} from './cryptocore';

import { buildMimc7 } from 'circomlibjs'

let eddsa: EdDSA;

let verifier: ethers.Contract;
let gambleHouse: ethers.Contract;
let gambleHouseFactory: ethers.Contract;


export async function connectVerifierContract(address: string) {
    const { ethereum } = window;

    let provider = new ethers.providers.Web3Provider(ethereum);
    let signer = provider.getSigner();
    console.log('Verifier signer: ', await signer.getAddress());

    verifier = new ethers.Contract(address, OddsVerifier.abi, signer);

}


export async function connectGambleHouseContract(address: string) {
    const { ethereum } = window;

    let provider = new ethers.providers.Web3Provider(ethereum);
    let signer = provider.getSigner();
    // console.log('Gamble House signer: ', await signer.getAddress());

    gambleHouse = new ethers.Contract(address, GambleHouse.abi, signer);

}

export async function connectGambleHouseFactoryContract() {
    const { ethereum } = window;

    let provider = new ethers.providers.Web3Provider(ethereum);
    let signer = provider.getSigner();
    console.log('Gamble House Factorysigner: ', await signer.getAddress());

    gambleHouseFactory = new ethers.Contract(address['gambleHouseFactory'], GambleHouseFactory.abi, signer);
}

export async function verifyProof(input: Object) {

    var gambleSessionAddr, verifierAddr;


    await connectGambleHouseFactoryContract();
    [gambleSessionAddr, verifierAddr] = await gambleHouseFactory.readAddresses();

    await connectVerifierContract(verifierAddr);

    let calldata = await generateCalldata(input);

    if (calldata) {
        let valid = await verifier.verifyProof(calldata[0], calldata[1], calldata[2], calldata[3]);
        if (valid) {
            console.log("calldata 3", calldata[3]);
            return calldata[3].slice(0, 2);
        }
        else {
            throw "Invalid proof."
        }
    }
    else {
        throw "Witness generation failed.";
    }
}

export async function getGameInfo() {

  var gambleSessionAddr, verifierAddr;

  await connectGambleHouseFactoryContract();
  [gambleSessionAddr, verifierAddr] = await gambleHouseFactory.readAddresses();

  await connectGambleHouseContract(gambleSessionAddr);
  let info = await gambleHouse.getGameInfo();

  let minBet = await gambleHouse.getMinBet();

  return info;

}

export async function getMinBet() {

  var gambleSessionAddr, verifierAddr;

  await connectGambleHouseFactoryContract();
  [gambleSessionAddr, verifierAddr] = await gambleHouseFactory.readAddresses();

  await connectGambleHouseContract(gambleSessionAddr);

  let minBet = await gambleHouse.getMinBet();

  return minBet;

}

export async function depositHashCommitment(betsChoice){

eddsa =  await buildEddsaModule();
const mimc7 =  await buildMimc7();

var gambleSessionAddr, verifierAddr;

await connectGambleHouseFactoryContract();
[gambleSessionAddr, verifierAddr] = await gambleHouseFactory.readAddresses();

await connectGambleHouseContract(gambleSessionAddr);

let retBookmakerPubKey = await gambleHouse.getBookmakerPubKey();
var bookmakerPubKey = [fromHexString(retBookmakerPubKey[0]),
                          fromHexString(retBookmakerPubKey[1])];

const {privKey: userPrivKey, pubKey: userPubKey} = genKeypair(eddsa);
const ecdhSharedKeyEncrypt = await genEcdhSharedKey({
                                                      eddsa,
                                                      privKey: userPrivKey,
                                                      pubKey: bookmakerPubKey,
                                                    });
const userCiphertext = await encrypt(betsChoice, ecdhSharedKeyEncrypt);
console.log(userCiphertext);
const depositAmount = ethers.utils.formatEther("100");
var userPubKeyHex1 = Buffer.from(userPubKey[0]).toString('hex');
var userPubKeyHex2 = Buffer.from(userPubKey[1]).toString('hex');

await gambleHouse.deposit(userCiphertext['iv'],
         userCiphertext['data'][0],
         userCiphertext['data'][1],
         userPubKeyHex1,
         userPubKeyHex2,
         {value: ethers.utils.parseEther(depositAmount.toString())});

}
