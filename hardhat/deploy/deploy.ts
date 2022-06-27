const { ethers } = require("hardhat");
// const { ethers } = require("hardhat");
// import { ethers } from "hardhat";


async function main() {

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const GambleHouse = await ethers.getContractFactory("GambleHouse");
  const Verifier = await ethers.getContractFactory("OddsVerifier");


  var nowTs = Math.floor(Date.now() / 1000);
  var mockStartTime = nowTs + (60*60);
  var mockEndTime = nowTs + (24*60*60);



  const gamHouse = await GambleHouse.deploy(deployer.address,
                                            mockStartTime,
                                            mockEndTime);
  console.log("Gamble House address:", gamHouse.address);

  const verifier = await Verifier.deploy();
  console.log("Verifier address:", verifier.address)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);

});
