pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/mimc.circom";
include "../node_modules/circomlib/circuits/escalarmulany.circom";


template Decrypt(N) {
  // Where N is the length of the
  // decrypted message
  signal input message[N+1];
  signal input private_key;
  signal output out[N];
  component hasher[N];

  // iv is message[0]
  for(var i=0; i<N; i++) {
    hasher[i] = MiMC7(91);
    hasher[i].x_in <== private_key;
    hasher[i].k <== message[0] + i;
    //log(i);
    //log(message[i+1]); // e
    //log(hasher[i].out);  // mimc_val
    //log(message[i+1] - hasher[i].out);
    out[i] <== message[i+1] - hasher[i].out;
    log(out[i]);

  }
}
