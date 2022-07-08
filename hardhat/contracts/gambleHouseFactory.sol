// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract GambleHouseFactory {


    address bookmaker;// Keep track of bookmaker address
    address gambleHouseContract; // Keep track of current betting session
    address verifierContract;// Keep track of verifier address


    constructor(address _bookmaker, address _verifierContract)
    {

      bookmaker = _bookmaker;
      verifierContract = _verifierContract;

    }

    error OnlyBookmaker(string message);


    modifier onlyBookmaker() {
        if (msg.sender != bookmaker) revert OnlyBookmaker("Only Bookmaker can access this!");
        _;
    }

    function updateAddresses(address _gambleHouseContract) public onlyBookmaker {

          gambleHouseContract = _gambleHouseContract;

    }


    function readAddresses() public view returns (address, address){

      return (gambleHouseContract, verifierContract);

    }


}
