#!/bin/bash

#export NODE_OPTIONS="--max-old-space-size=16384"

cd circuits
mkdir -p build

if [ -f ./powersOfTau28_hez_final_12.ptau ]; then
    echo "powersOfTau28_hez_final_12.ptau already exists. Skipping."
else
    echo 'Downloading powersOfTau28_hez_final_12.ptau'
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau
fi

echo "Compiling: circuit..."

# compile circuit
circom validateOdds.circom --r1cs --wasm --sym -o build
snarkjs r1cs info build/validateOdds.r1cs

# Start a new zkey and make a contribution
snarkjs groth16 setup build/validateOdds.r1cs powersOfTau28_hez_final_12.ptau build/validateOdds_0000.zkey
snarkjs zkey contribute build/validateOdds_0000.zkey build/validateOdds_final.zkey --name="1st Contributor Name" -v -e="random text"
snarkjs zkey export verificationkey build/validateOdds_final.zkey build/validateOdds_key.json

# generate solidity contract
snarkjs zkey export solidityverifier build/circuit_final.zkey ../contracts/verifier.sol
