# zk-StealthGamble

![apple-touch-icon](https://user-images.githubusercontent.com/9394461/177982921-cafedfdf-c2af-447e-874b-7d71dcecc2a0.png)

## Objective

To use zero-knowledge proofs to build a gambling platform that allows users to place bets anonymously on their favorite teams before live sporting events. 

Here anonymity encapsulates the following:
1. The bets made by users are hidden from each other to prevent them from biasing each other and ensure that they make independent decisions. 
2. At the end of the event winners/losers are kept hidden to prevent public shaming/ faming.  Only final withdrawal amounts will be visible publicly.

## Public Information
-  Pot size backing each party 
-  Deposit amount to participate in a bet.
-  Number of participants.
-  Min bet size

## Rules of the Game

1. A fixed deposit amount of 100 ONE will be taken as deposit when the bet is successfully submitted. The betting amount must always be less than the deposit.
Only whole integer bets are accepted.
2. Only whole integer bets are accepted.
3. Each player(i.e. Account) can participate only once and cannot withdraw a deposit once submitted. 
4. The betting period is 24-48 hrs. 
5. Odds will be refreshed every 6hrs. Min bet is increased with this refresh to encourage early betting with minimal bias.
6. Gas fees are not refunded and act as participation fees.
      - Amount equalling "Deposit - gasfees - Bet " will be returned participants that loose.
      - Amount equalling "Deposit - gasfees + reward" will be returned participants that win.
      - Amount equalling "Deposit - gasfees" will be returned to every participant incase it is a tie or violation of rules(ZKP failure).
7. Wins are distributed as per the proportion of stake of each winning participant in the winning pot. For example, let's assume the winning pot has 250 ONE and the losing pot has 300 ONE.  The participant has bet 25 ONE in the winning pot amounting to 25/250 i.e. 10% contribution. This means that the participant will receive 10% of the losing pot as the reward amount(10% of 300 ONE is 30).


### Role of Zero Knowledge Proofs
ZKP is used to ensure that the odds are computed correctly at the end of the event to ensure that the amounts are distributed in a fair manner to winners.

## Possible improvements
1. Currently, decryption happens outside the ZKP and the ZKP simply verifies if the odds are computed correctly using these decrypted bets. This had to be done as the current Edsa encryption/decryption scheme from MACI has bugs in circomlib(privacy-scaling-explorations/maci#460)
2. Once decryption works within circom, it can also be used to determine the reward distribution alongside the odds. This will not only give confidence that odds are corect but there will be no scope of malicious behavior while distributing rewards as the entire logic can run on smart contracts.
3. Using oracles to get sports events data. The current implementation uses an API. Oracles will make it more transparent.
4. Enabling custom gambling rooms. Any person on the internet can become a bookmaker. Currently, a centralized server/contract acts as a bookmaker to distribute rewards.




