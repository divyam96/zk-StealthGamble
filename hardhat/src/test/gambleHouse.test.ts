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
    var mockStartTIme = nowTs + (60*60);
    var mockEndTIme = nowTs + (24*60*60);

    const contract = await GambleHouse.deploy(owner.address,
                                              mockStartTIme,
                                              mockEndTIme);

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
    const user1Ciphertext = await encrypt(user1BetChoice, ecdhSharedKeyEncrypt1);
    await contract.connect(addr1).deposit(user1Ciphertext['iv'],
                                     user1Ciphertext['data'][0],
                                     user1Ciphertext['data'][1],
                          {value: ethers.utils.parseEther("2.5") });
    const stateValues =  await contract.readParticipants();

    expect(stateValues[0][0]).toEqual(addr1.address)
    expect(ethers.utils.formatEther(stateValues[1][0])).toEqual("2.5");
    expect(stateValues[2][0].toBigInt()).toEqual(user1Ciphertext['iv']);
    expect(stateValues[3][0].toBigInt()).toEqual(user1Ciphertext['data'][0]);
    expect(stateValues[4][0].toBigInt()).toEqual(user1Ciphertext['data'][1]);

    const gameInfo = await contract.getGameInfo();

  });

  it("Update gameInfo at construction, Update odds and verify gameInfo", async  () => {

    const [owner, addr1, addr2] = await ethers.getSigners();

    const GambleHouse = await ethers.getContractFactory("GambleHouse");

    var nowTs = Math.floor(Date.now() / 1000);
    var mockStartTime = nowTs + (60*60);
    var mockEndTime = nowTs + (24*60*60);

    const contract = await GambleHouse.deploy(owner.address,
                                              mockStartTime,
                                              mockEndTime);

    const gameInfo = await contract.getGameInfo();

    expect(gameInfo[0].toBigInt()).toEqual(1n);
    expect(gameInfo[1].toBigInt()).toEqual(1n);
    expect(gameInfo[2].toBigInt()).toEqual(BigInt(mockStartTime));
    expect(gameInfo[3].toBigInt()).toEqual(BigInt(mockEndTime));

    await contract.updateOdds(5n, 4n);

    const gameInfoUpdated = await contract.getGameInfo();

    expect(gameInfoUpdated[0].toBigInt()).toEqual(5n);
    expect(gameInfoUpdated[1].toBigInt()).toEqual(4n);
    expect(gameInfoUpdated[2].toBigInt()).toEqual(BigInt(mockStartTime));
    expect(gameInfoUpdated[3].toBigInt()).toEqual(BigInt(mockEndTime));

  });

});
