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
circom validateOdds_main.circom --r1cs --wasm --sym -o build
snarkjs r1cs info build/validateOdds_main.r1cs

# Start a new zkey and make a contribution
snarkjs groth16 setup build/validateOdds_main.r1cs powersOfTau28_hez_final_12.ptau build/validateOdds_0000.zkey
snarkjs zkey contribute build/validateOdds_0000.zkey build/validateOdds_final.zkey --name="1st Contributor Name" -v -e="random text"
snarkjs zkey export verificationkey build/validateOdds_final.zkey build/validateOdds_key.json

# generate solidity contract
snarkjs zkey export solidityverifier build/validateOdds_final.zkey ../contracts/validateOdds_verifier.sol




# echo "Compiling: circuit..."
#
# # compile circuit
# circom test/decrypt_test.circom --r1cs --wasm --sym -o build
# snarkjs r1cs info build/decrypt_test.r1cs
#
# # Start a new zkey and make a contribution
# snarkjs groth16 setup build/decrypt_test.r1cs powersOfTau28_hez_final_12.ptau build/decrypt_test_0000.zkey
# snarkjs zkey contribute build/decrypt_test_0000.zkey build/decrypt_test_final.zkey --name="1st Contributor Name" -v -e="random text"
# snarkjs zkey export verificationkey build/decrypt_test_final.zkey build/decrypt_test_key.json
#
# # generate solidity contract
# snarkjs zkey export solidityverifier build/decrypt_test_final.zkey ../contracts/decrypt_test_verifier.sol
