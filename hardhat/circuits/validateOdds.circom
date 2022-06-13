pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/binsum.circom";
include "../node_modules/circomlib/circuits/gates.circom";
include "../node_modules/circomlib/circuits/mux1.circom";

include "./decrypt.circom";


// Prove that the revealed secret and value correspond to the blinded bid
template ValidateOdds (nBids) {
    // blindedBidsChoices[i] is an EDcH encrypted value of [bid, choice]
    signal input blindedBidsChoices[nBids][3];

    signal input depositCurrent;
    signal input depositMin;
    signal input minBid;



    // private inputs

    // bid and choice values
    signal input bidsChoices[nBids][2];

    // shared keys for edsa decryption
    signal input sharedKeys[nBids];

    // signal output highestBid[2];
    signal output odds[2];
    signal output bidsWithValidityStatus[nBids];

    component decryptBidChoice[nBids];
    component adder[nBids];
    component EqComparator[nBids][5];
    component andGate[nBids];
    component cond0Mux[nBids];
    component cond1Mux[nBids];
    component lessEqComparator[nBids];
    component greaterEqComparator[nBids];

    var choice_0_sum = 0;
    var choice_1_sum = 0;
    var valid = 0;

    //Validate if inputs are <= Deposit amount.
    for (var j = 0; j < nBids; j++) {

        lessEqComparator[j] = LessEqThan(32);
        lessEqComparator[j].in[0] <== bidsChoices[j][0];
        lessEqComparator[j].in[1] <== depositMin;
        assert(lessEqComparator[j].out == 1);

        greaterEqComparator[j] = GreaterEqThan(32);
        greaterEqComparator[j].in[0] <== bidsChoices[j][0];
        greaterEqComparator[j].in[1] <== minBid;
        assert(greaterEqComparator[j].out == 1);
    }

    for (var i = 0; i < nBids; i++) {

          decryptBidChoice[i] = Decrypt(2);
          decryptBidChoice[i].message[0] <== blindedBidsChoices[i][0];
          decryptBidChoice[i].message[1] <== blindedBidsChoices[i][1];
          decryptBidChoice[i].message[2] <== blindedBidsChoices[i][2];

          decryptBidChoice[i].private_key <== sharedKeys[i];

          var decryptedBid = 0; //decryptBidChoice[i].out[0];
          var decryptedChoice = 0; //decryptBidChoice[i].out[1];


          EqComparator[i][0] = IsEqual();
          EqComparator[i][0].in[0] <== decryptedBid;
          EqComparator[i][0].in[1] <== bidsChoices[i][0];

          EqComparator[i][1] = IsEqual();
          EqComparator[i][1].in[0] <== decryptedChoice;
          EqComparator[i][1].in[1] <== bidsChoices[i][1];


          bidsWithValidityStatus[i] <== EqComparator[i][0].out * EqComparator[i][1].out;

          cond0Mux[i] = Mux1();
          cond0Mux[i].c[0] <== bidsChoices[i][0];
          cond0Mux[i].c[1] <== 0;
          cond0Mux[i].s <== bidsChoices[i][1];
          choice_0_sum = choice_0_sum + cond0Mux[i].out;

          cond1Mux[i] = Mux1();
          cond1Mux[i].c[0] <== 0;
          cond1Mux[i].c[1] <== bidsChoices[i][0];
          cond1Mux[i].s <== bidsChoices[i][1];
          choice_1_sum = choice_1_sum + cond1Mux[i].out;

    }


    log(choice_0_sum);
    log(choice_1_sum);

  odds[0] <== choice_0_sum;
  odds[1] <== choice_1_sum;

}

component main { public [ bidsChoices, minBid, depositMin, depositCurrent] } = ValidateOdds(4);
