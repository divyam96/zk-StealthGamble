export {};

const { ethers } = require("hardhat");
const fs = require('fs');

// const { ethers } = require("hardhat");
// import { ethers } from "hardhat";


async function main() {

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const GambleHouseFactory = await ethers.getContractFactory("GambleHouseFactory");
  const Verifier = await ethers.getContractFactory("OddsVerifier");

  const verifier = await Verifier.deploy();
  console.log("Verifier address:", verifier.address)

  const gamHouse = await GambleHouseFactory.deploy(deployer.address,
                                                   verifier.address);

  console.log("Gamble House Factory address:", gamHouse.address);

  let config_data = JSON.stringify({"gambleHouseFactory": gamHouse.address}, null,2)
  console.log(config_data);

  fs.writeFileSync("./deploy_mainnet/mainnet_config.json", config_data);


}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);

});
