pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/poseidon.circom";


// Prove that the revealed secret and value correspond to the blinded bid
template ValidateOdds (nBids) {
    // blindedbid = Poseidon(value, secret)
    signal input blindedBids[nBids];
    signal input blindedChoices[nBids];

    // each bid has a value and secret
    signal input bids[nBids][2];

    // each choice has a value and secret
    signal input choices[nBids][2];

    // signal output highestBid[2];
    signal output odds[2];
    signal output bidsWithValidityStatus[nBids];

    component hashesBid[nBids];
    component hashesChoice[nBids];

    var choice_0_sum = 0;
    var choice_1_sum = 0;

    for (var i = 0; i < nBids; i++) {
      hashesBid[i] = Poseidon(2);
      hashesBid[i].inputs[0] <== bids[i][0];
      hashesBid[i].inputs[1] <== bids[i][1];

      hashesChoice[i] = Poseidon(2);
      hashesChoice[i].inputs[0] <== choices[i][0];
      hashesChoice[i].inputs[1] <== choices[i][1];

      if (hashesBid[i].out == blindedBids[i] && hashesChoice[i].out == blindedChoices[i]) {
        // bid was valid
        if (choices[i][0] == 0) {
          choice_0_sum  += bids[i][0];
        }

        if (choices[i][0] == 1) {
          choice_1_sum  += bids[i][0];
        }

      }
      // 0 if bid was invalid, 1 if valid
      bidsWithValidityStatus[i] <-- (hashesBid[i].out == blindedBids[i] && hashesChoice[i].out == blindedChoices[i]);

    }
    log(choice_0_sum);
    log(choice_1_sum);

  odds[0] <-- choice_0_sum;
  odds[1] <-- choice_1_sum;

}

component main { public [ blindedBids, blindedChoices] } = ValidateOdds(4);
