jest.setTimeout(900000);

const { ethers } = require("hardhat");
const buildMimc7 = require("circomlibjs").buildMimc7;

// const chai = require("chai");
import {
  buildEddsaModule,
  decrypt,
  encrypt,
  genKeypair,
  genEcdhSharedKey,
  buf2Bigint,
  fromHexString,
  EdDSA
} from '../cryptocore';



describe("Transfer amounts contract", () => {

  let eddsa: EdDSA;


  beforeAll(async () => {
    eddsa = await buildEddsaModule();
  }, 150000);


  it("Deposit bet into the contract and read secret bets from contract", async  () => {

    // var currentDate = new Date();
    // currentDate.setDate(currentDate.getDate() + 1);
    // console.log(Math.floor(currentDate.getTime()/1000));

    const [owner, addr1, addr2] = await ethers.getSigners();

    const GambleHouse = await ethers.getContractFactory("GambleHouse");

    var nowTs = Math.floor(Date.now() / 1000);
    var mockStartTime = nowTs + (60*60);
    var mockEndTime = nowTs + (24*60*60);

    var fixId = 123;
    var team0 = "Team A";
    var team1 = "Team B";
    var league = "Champions League";
    var venue = "Bangalore";
    var minBet = 5;


    const mimc7 = buildMimc7();
    const {privKey: bookmakerPrivKey, pubKey: bookmakerPubKey} = genKeypair(eddsa);
    const {privKey: user1PrivKey, pubKey: user1PubKey} = genKeypair(eddsa);

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


    var bookmakerPubKeyHex1 = Buffer.from(bookmakerPubKey[0]).toString('hex');
    var bookmakerPubKeyHex2 = Buffer.from(bookmakerPubKey[1]).toString('hex');

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

    const user1Ciphertext = await encrypt(user1BetChoice, ecdhSharedKeyEncrypt1);


    var user1PubKeyHex1 = Buffer.from(user1PubKey[0]).toString('hex');
    var user1PubKeyHex2 = Buffer.from(user1PubKey[1]).toString('hex');

    await contract.connect(addr1).deposit(user1Ciphertext['iv'],
                                           user1Ciphertext['data'][0],
                                           user1Ciphertext['data'][1],
                                           user1PubKeyHex1,
                                           user1PubKeyHex2,
                          {value: ethers.utils.parseEther("2.5") });
    const stateValues =  await contract.readParticipants();

    expect(stateValues[0][0]).toEqual(addr1.address)
    expect(ethers.utils.formatEther(stateValues[1][0])).toEqual("2.5");
    expect(stateValues[2][0].toBigInt()).toEqual(user1Ciphertext['iv']);
    expect(stateValues[3][0].toBigInt()).toEqual(user1Ciphertext['data'][0]);
    expect(stateValues[4][0].toBigInt()).toEqual(user1Ciphertext['data'][1]);


  });

  it("Update gameInfo at construction, Update odds and verify bookmaker keys and gameInfo", async  () => {

    const mimc7 = buildMimc7();
    const {privKey: bookmakerPrivKey, pubKey: bookmakerPubKey} = genKeypair(eddsa);
    const {privKey: user1PrivKey, pubKey: user1PubKey} = genKeypair(eddsa);

    const [owner, addr1, addr2] = await ethers.getSigners();

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
    const retBookmakerPrivKey = bookmakerKeys[0].toBigInt();
    const retBookmakerPubKey = [fromHexString(bookmakerKeys[1]), fromHexString(bookmakerKeys[2])];
    expect(retBookmakerPrivKey).toEqual(bookmakerPrivKey);
    expect(retBookmakerPubKey).toEqual(bookmakerPubKey);

    const gameInfo = await contract.getGameInfo();
    // console.log("Game Info", gameInfo);
    expect(gameInfo[0].toBigInt()).toEqual(0n);
    expect(gameInfo[1].toBigInt()).toEqual(0n);
    expect(gameInfo[2].toBigInt()).toEqual(BigInt(mockStartTime));
    expect(gameInfo[3].toBigInt()).toEqual(BigInt(mockEndTime));

    var minBetUpdated = 10;

    await contract.updateOdds(5n, 4n, minBetUpdated);

    const gameInfoUpdated = await contract.getGameInfo();

    expect(gameInfoUpdated[0].toBigInt()).toEqual(5n);
    expect(gameInfoUpdated[1].toBigInt()).toEqual(4n);
    expect(gameInfoUpdated[2].toBigInt()).toEqual(BigInt(mockStartTime));
    expect(gameInfoUpdated[3].toBigInt()).toEqual(BigInt(mockEndTime));
    expect(gameInfoUpdated[5]).toEqual(team0);
    expect(gameInfoUpdated[6]).toEqual(team1);
    expect(gameInfoUpdated[7]).toEqual(league);
    expect(gameInfoUpdated[8]).toEqual(venue);
    expect(gameInfoUpdated[9].toNumber()).toEqual(fixId);

    const retMinBet = await contract.getMinBet();

    expect(retMinBet.toNumber()).toEqual(minBetUpdated);




  });

});
