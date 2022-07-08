# zk-StealthGamble Backend

Run `yarn` to install. Check out `package.json` for other commands to compile circuits and contracts.

Validate the logic the backend by running the test cases `yarn test`

## Devnet

To deploy on Harmony devnet, run the above command first, then change the private key in `hardhat.config.js` to your own private key (Please be careful not to include your private key in any commit!). 

1. First deploy the GambleHouseFactory contract. This will enable us to keep track of ongoing betting contracts.
```shell
npx hardhat run --network devnet deploy_devnet/deployFactory.ts
```

2. Next lets deploy the GambleHouse and Verifier contracts. This enable us to start a betting session and let users validate pot distribution by using ZKPs.
```shell
npx hardhat run --network devnet deploy_devnet/deploy.ts
```

3. Odds or Amounts backing each party need to be updated by triggering the updateOdds function on the backend. This can also be used by the bookmaker to increase the min bet.
```shell
npx hardhat run --network devnet deploy_devnet/refreshOdds.ts
```

4. Once the game is over the Bookmaker distributes the rewards and starts the next betting session. We execute step 2 again to achieve this.
```shell
npx hardhat run --network devnet deploy_devnet/deploy.ts
```

Steps 2-3-4 keep repeating perpetually. We use crons to keep executing these.


## Mainnet

To deploy on Harmony devnet, run the above command first, then change the private key in `hardhat.config.js` to your own private key (Please be careful not to include your private key in any commit!). 

1. First deploy the GambleHouseFactory contract. This will enable us to keep track of ongoing betting contracts.
```shell
npx hardhat run --network mainnet deploy_mainnet/deployFactory.ts
```

2. Next lets deploy the GambleHouse and Verifier contracts. This enable us to start a betting session and let users validate pot distribution by using ZKPs.
```shell
npx hardhat run --network mainnet deploy_mainnet/deploy.ts
```

3. Odds or Amounts backing each party need to be updated by triggering the updateOdds function on the backend. This can also be used by the bookmaker to increase the min bet.
```shell
npx hardhat run --network mainnet deploy_mainnet/refreshOdds.ts
```

4. Once the game is over the Bookmaker distributes the rewards and starts the next betting session. We execute step 2 again to achieve this.
```shell
npx hardhat run --network mainnet deploy_mainnet/deploy.ts
```

Steps 2-3-4 keep repeating perpetually. We use crons to keep executing these.


