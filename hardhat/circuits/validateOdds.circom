pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/binsum.circom";
include "../node_modules/circomlib/circuits/gates.circom";
include "../node_modules/circomlib/circuits/mux1.circom";

include "./decrypt.circom";


// Prove that the revealed secret and value correspond to the blinded bet
template ValidateOdds (nBets) {
    // blindedBetsChoices[i] is an EDcH encrypted value of [bet, choice]
    // signal input blindedBetsChoices[nBets][3];

    signal input depositMin;
    signal input minBet;



    // private inputs

    // bet and choice values
    signal input betsChoices[nBets][2];

    // shared keys for edsa decryption
    // signal input sharedKeys[nBets];

    // signal output highestBet[2];
    signal output odds[2];
    signal output betsWithValidityStatus[nBets];

    // component decryptBetChoice[nBets];
    component adder[nBets];
    // component EqComparator[nBets][5];
    component andGate[nBets];
    component cond0Mux[nBets];
    component cond1Mux[nBets];
    component lessEqComparator[nBets];
    component greaterEqComparator[nBets];

    var choice_0_sum = 0;
    var choice_1_sum = 0;
    var valid = 0;

    //Validate if inputs are <= Deposit amount.
    for (var j = 0; j < nBets; j++) {

        lessEqComparator[j] = LessEqThan(32);
        lessEqComparator[j].in[0] <== betsChoices[j][0];
        lessEqComparator[j].in[1] <== depositMin;
        assert(lessEqComparator[j].out == 1);

        greaterEqComparator[j] = GreaterEqThan(32);
        greaterEqComparator[j].in[0] <== betsChoices[j][0];
        greaterEqComparator[j].in[1] <== minBet;
        assert(greaterEqComparator[j].out == 1);
    }

    for (var i = 0; i < nBets; i++) {

          // decryptBetChoice[i] = Decrypt(2);
          // decryptBetChoice[i].message[0] <== blindedBetsChoices[i][0];
          // decryptBetChoice[i].message[1] <== blindedBetsChoices[i][1];
          // decryptBetChoice[i].message[2] <== blindedBetsChoices[i][2];

          // decryptBetChoice[i].private_key <== sharedKeys[i];

          // var decryptedBet = 0; //decryptBetChoice[i].out[0];
          // var decryptedChoice = 0; //decryptBetChoice[i].out[1];


          // EqComparator[i][0] = IsEqual();
          // EqComparator[i][0].in[0] <== decryptedBet;
          // EqComparator[i][0].in[1] <== betsChoices[i][0];

          // EqComparator[i][1] = IsEqual();
          // EqComparator[i][1].in[0] <== decryptedChoice;
          // EqComparator[i][1].in[1] <== betsChoices[i][1];


          // betsWithValidityStatus[i] <== EqComparator[i][0].out * EqComparator[i][1].out;

          cond0Mux[i] = Mux1();
          cond0Mux[i].c[0] <== betsChoices[i][0];
          cond0Mux[i].c[1] <== 0;
          cond0Mux[i].s <== betsChoices[i][1];
          choice_0_sum = choice_0_sum + cond0Mux[i].out;

          cond1Mux[i] = Mux1();
          cond1Mux[i].c[0] <== 0;
          cond1Mux[i].c[1] <== betsChoices[i][0];
          cond1Mux[i].s <== betsChoices[i][1];
          choice_1_sum = choice_1_sum + cond1Mux[i].out;

    }


    log(choice_0_sum);
    log(choice_1_sum);

  odds[0] <== choice_0_sum;
  odds[1] <== choice_1_sum;

}
