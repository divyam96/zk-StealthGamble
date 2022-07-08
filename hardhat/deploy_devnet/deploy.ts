export {};


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
const { groth16 } = require("snarkjs");
const buildMimc7 = require("circomlibjs").buildMimc7;

const fs = require('fs');
const fetch = require('node-fetch');
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts

let eddsa: EdDSA;

type Plaintext = bigint[];


// const { ethers } = require("hardhat");
// import { ethers } from "hardhat";
const API_KEY_FOOTBALL = "";

async function getFixtureData(){
    // Get relevant info while deploying the contract
    const tomorrow  = new Date(); // The Date object returns today's timestamp

    tomorrow.setDate(tomorrow.getDate() + 1);

    var data;
    var gameDetails;

    data = await fetch(`https://v3.football.api-sports.io/fixtures?date=${tomorrow.toISOString().split('T')[0]}`, {
    	"method": "GET",
    	"headers": {
    		"x-rapidapi-host": "v3.football.api-sports.io",
    		"x-rapidapi-key": API_KEY_FOOTBALL
    	}
    })
    .then(res => res.json())
    .catch(err => {
    	console.log(err);
    });
    gameDetails = data['response'][0]

    var fixture_id = gameDetails['fixture']['id'];
    var fixtureVenue = gameDetails['fixture']['venue']['name'] + ', ' + gameDetails['fixture']['venue']['city'];
    var leagueName = gameDetails['league']['name'] + ', ' + gameDetails['league']['country'];
    var team0 = gameDetails['teams']['home']['name'];
    var team1 =  gameDetails['teams']['away']['name'];
    var start_ts = gameDetails['fixture']['timestamp'];

    console.log("Fixture Data: ", fixture_id, fixtureVenue, leagueName,
                team0, team1, start_ts)
    return [fixture_id, fixtureVenue, leagueName, team0, team1, start_ts];

}

async function getFixtureResult(fixture_id){

    var data, gameDetails;

    data = await fetch(`https://v3.football.api-sports.io/fixtures?id=${fixture_id}`, {
    	"method": "GET",
    	"headers": {
    		"x-rapidapi-host": "v3.football.api-sports.io",
    		"x-rapidapi-key": API_KEY_FOOTBALL
    	}
    })
    .then(res => res.json())
    .catch(err => {
    	console.log(err);
    });
    gameDetails = data['response'][0];

    var winner;

    if(gameDetails['teams']['home']['winner']){
    		winner=0;
    }

    else if(gameDetails['teams']['away']['winner']){
    	  winner=1;
    }
    console.log("winner is", winner);
    return winner;

}

async function verifyOdds(verifier, INPUT){

  // console.log(INPUT);

  const { proof, publicSignals } = await groth16.fullProve(INPUT, "circuits/build/validateOdds_main_js/validateOdds_main.wasm","circuits/build/validateOdds_final.zkey");

  const calldata = await groth16.exportSolidityCallData(proof, publicSignals);

  const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());

  const a = [argv[0], argv[1]];
  const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
  const c = [argv[6], argv[7]];
  const Input = argv.slice(8);

  return await verifier.verifyProof(a, b, c, Input);


}

async function distributeRewards(contract, verifier, fixture_id, participantCount){

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

   const decryptedBetsChoices: Plaintext[] = [];

   for(let i=0; i<numParticipants; i++){


       var ecdhSharedKey = await genEcdhSharedKey({
                                                 eddsa,
                                                 privKey: bookmakerKeys[0].toBigInt(),
                                                 pubKey: retUserPubKeys[i],
                                               });

       var decryptedMessage = await decrypt(contractCipherTexts[i], ecdhSharedKey);

       decryptedBetsChoices.push(decryptedMessage);
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

  contract.updateOdds(odds0, odds1, retMinBet.toNumber());

  const winner = await getFixtureResult(fixture_id);

  const rewardAddrs: String[] = [];
  const rewardAmount: number[] = [];

  var verified = false;

  if (decryptedBetsChoices.length === 10){
      const INPUT = stringifyBigInts({
          "betsChoices": decryptedBetsChoices,
          "minBet": 5n,
          "depositMin": 100n,
          "odds0": BigInt(odds0),
          "odds1": BigInt(odds1)
      });

      verified = await verifyOdds(verifier, INPUT);
  }

  if(participantCount === 10 && odds1!=0 && odds0!=0 && winner!=null && verified){

        if (winner == 0){

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

        else if (winner == 1){

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

}


async function main() {

  eddsa = await buildEddsaModule();
  const mimc7 = buildMimc7();


  let rawdata = fs.readFileSync('deploy_devnet/devnet_config.json');
  let jsonConfig = JSON.parse(rawdata);

  let ghsJson = fs.readFileSync('./artifacts/contracts/gambleHouse.sol/GambleHouse.json');
  let GambleHouse = JSON.parse(ghsJson);
  let ghfJson = fs.readFileSync('./artifacts/contracts/gambleHouseFactory.sol/GambleHouseFactory.json');
  let GambleHouseFactory = JSON.parse(ghfJson);
  let verJson = fs.readFileSync('./artifacts/contracts/validateOdds_verifier.sol/OddsVerifier.json');
  let OddsVerifier = JSON.parse(verJson);



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
                                                GambleHouse.abi, deployer);

  console.log("Connect to GambleHouse Contract");//, GambleHouse.abi);

  let info = await gambleHouseContract.getGameInfo();

  var info_odds_0, info_odds_1, info_startTime, info_endTime,
   info_balance, info_team0, info_team1, info_league,
   info_venue, info_fixture_id, info_participantCount, info_rewardsDistributed;

  [info_odds_0, info_odds_1, info_startTime, info_endTime,
   info_balance, info_team0, info_team1, info_league, info_venue,
   info_fixture_id, info_participantCount, info_rewardsDistributed] = info;


   var nowTs = Math.floor(Date.now() / 1000);

   if(nowTs > info_endTime.toNumber()){

      if (!info_rewardsDistributed){
          let oddsVerifierContract = new ethers.Contract(verifierAddr,
                                                         OddsVerifier.abi, deployer);
          await distributeRewards(gambleHouseContract,
                                  oddsVerifierContract,
                                  info_fixture_id,
                                  info_participantCount.toNumber());
      }



      console.log("Deploying contracts with the account:", deployer.address);

      console.log("Account balance:", (await deployer.getBalance()).toString());

      const GambleHouseSession = await ethers.getContractFactory("GambleHouse");


      var fixture_id, fixtureVenue, leagueName, team0, team1, startTime;

      [fixture_id, fixtureVenue, leagueName, team0, team1, startTime] = await getFixtureData();

      var endTime = startTime + (300*60);

      const {privKey: bookmakerPrivKey, pubKey: bookmakerPubKey} = genKeypair(eddsa);

      var bookmakerPubKeyHex1 = Buffer.from(bookmakerPubKey[0]).toString('hex');
      var bookmakerPubKeyHex2 = Buffer.from(bookmakerPubKey[1]).toString('hex');

      const gamHouse = await GambleHouseSession.deploy(deployer.address,
                                                      bookmakerPrivKey,
                                                      bookmakerPubKeyHex1,
                                                      bookmakerPubKeyHex2,
                                                      startTime,
                                                      endTime,
                                                      fixture_id,
                                                      team0,
                                                      team1,
                                                      leagueName,
                                                      fixtureVenue);
      await gambleHouseFactoryContract.updateAddresses(gamHouse.address);
      console.log("Gamble House address:", gamHouse.address);
}

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);

});
