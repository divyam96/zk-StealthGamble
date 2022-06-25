pragma circom 2.0.3;
include "./validateOdds.circom";


component main { public [minBet, depositMin] } = ValidateOdds(10);
