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
} from '../src/cryptocore';

import {Scalar} from "ffjavascript";

const { ethers } = require("hardhat");
const buildMimc7 = require("circomlibjs").buildMimc7;

const fs = require('fs');
const fetch = require('node-fetch');

let eddsa: EdDSA;


async function refreshOdds(contract){

    const bookmakerKeys = await contract.getBookmakerKeys();

    const stateValues =  await contract.readParticipants();

    const contractCipherTexts: Ciphertext[] = [];

    const retUserPubKeys: any[] = [];

    const numParticipants = stateValues[0].length;

    for(let i=0; i<numParticipants; i++){
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

   for(let i=0; i<numParticipants; i++){


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

  const retMinBet = await contract.getMinBet();

  await contract.updateOdds(odds0, odds1, retMinBet.toNumber()+5);
  console.log("New min bet: ", retMinBet.toNumber()+5);

}



async function main() {

  eddsa = await buildEddsaModule();
  const mimc7 = buildMimc7();


  let rawdata = fs.readFileSync('deploy_mainnet/mainnet_config.json');
  let jsonConfig = JSON.parse(rawdata);

  let ghsJson = fs.readFileSync('./artifacts/contracts/gambleHouse.sol/GambleHouse.json');
  let GambleHouseSession = JSON.parse(ghsJson);
  let ghfJson = fs.readFileSync('./artifacts/contracts/gambleHouseFactory.sol/GambleHouseFactory.json');
  let GambleHouseFactory = JSON.parse(ghfJson);


  const network = await ethers.getDefaultProvider().getNetwork();
  console.log("Network name=", network.name);
  console.log("Network chain id=", network.chainId);
  const [deployer] = await ethers.getSigners();

  let gambleHouseFactoryContract = new ethers.Contract(jsonConfig['gambleHouseFactory'],
                                                GambleHouseFactory.abi, deployer);

  var gambleSessionAddr, verifierAddr;

  [gambleSessionAddr, verifierAddr] = await gambleHouseFactoryContract.readAddresses();

  console.log("Found gamble house session at:", gambleSessionAddr);

  let gambleHouseContract = new ethers.Contract(gambleSessionAddr,
                                                GambleHouseSession.abi, deployer);

  await refreshOdds(gambleHouseContract);


}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);

});
