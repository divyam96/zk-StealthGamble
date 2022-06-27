const fs = require("fs");
const solidityRegex = /pragma solidity \^\d+\.\d+\.\d+/

let content = fs.readFileSync("./contracts/validateOdds_verifier.sol", { encoding: 'utf-8' });
let bumped = content.replace(solidityRegex, 'pragma solidity ^0.8.4');

fs.writeFileSync("./contracts/validateOdds_verifier.sol", bumped);
