// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract GambleHouse {

    uint minBet_1 = 1;
    uint minBet_2 = 5;

    struct EdsaCommitment {
      uint iv;
      uint data_bet;
      uint data_choice;
    }

    struct Participant {
        uint depositAmount; // amount deposited by Participant
        EdsaCommitment  blindedBetChoice;
        bool participated;
    }

    struct GameInfo {
        uint odds_0;
        uint odds_1;
        uint startTime;
        uint endTime;
    }

    error OnlyBookmaker(string message);

    // Log the event about a deposit being made by an address and its amount
    event LogDepositMade(address indexed accountAddress, uint amount, uint balance);
    event LogRewardSent(address indexed accountAddress, uint amount);
    event LogBookmaker(address indexed accountAddress);

    GameInfo gameInfo;
    uint creationTime;
    mapping(address => Participant) public participants;
    uint participantCount = 0;
    address[] participantAddresses;
    mapping(address => uint) private rewardDistribution;

    address public bookmaker;
    EdsaCommitment[] public betsChoices;

    modifier onlyBookmaker() {
        if (msg.sender != bookmaker) revert OnlyBookmaker("Only Bookmaker can access this!");
        _;
    }

    constructor(address _bookmaker, uint _start_time, uint _end_time)  {

          creationTime = block.timestamp;
          bookmaker = _bookmaker;
          emit LogBookmaker(bookmaker);
          gameInfo.odds_0 = 1;
          gameInfo.odds_1 = 1;
          gameInfo.startTime = _start_time;
          gameInfo.endTime = _end_time;
   }

    function deposit(uint _iv, uint _data_bet, uint _data_choice) public payable  {


        if(participants[msg.sender].participated) revert("Already Participated");
        if(msg.sender == bookmaker) revert("Bookmaker cannot participate");
        if(block.timestamp > gameInfo.startTime) revert("Event has started. Cannot place bets");
        if((gameInfo.startTime - block.timestamp > 12 hours) && msg.value < minBet_1) revert("Min bet not satisfied");
        if((gameInfo.startTime - block.timestamp <= 12 hours) && msg.value < minBet_2) revert("Min bet not satisfied");
        participants[msg.sender].depositAmount = msg.value;
        participants[msg.sender].blindedBetChoice = EdsaCommitment(
                                                              {
                                                                  iv: _iv,
                                                                  data_bet: _data_bet,
                                                                  data_choice: _data_choice
                                                              }
                                                    );
        participantAddresses.push(msg.sender);
        betsChoices.push(participants[msg.sender].blindedBetChoice);
        participants[msg.sender].participated = true;
        participantCount +=1;
        emit LogDepositMade(msg.sender, msg.value, address(this).balance);
    }

    function setRewards(address[] memory partAddr, uint[] memory rewards) public onlyBookmaker {

        for (uint i=0; i<partAddr.length; i++) {
            rewardDistribution[partAddr[i]] = rewards[i];
        }

    }

    function distributeRewards() public onlyBookmaker {

        for (uint i=0; i<participantAddresses.length; i++) {
            payable(participantAddresses[i]).transfer(rewardDistribution[participantAddresses[i]]);
            emit LogRewardSent(participantAddresses[i], rewardDistribution[participantAddresses[i]]);
        }

    }


    function readParticipants() public view onlyBookmaker returns(address[] memory,
       uint[] memory, uint[] memory, uint[] memory, uint[] memory) {

        address[] memory _addr = new address[](participantCount);
        uint[]  memory _deposit = new uint[](participantCount);
        uint[]  memory _iv = new uint[](participantCount);
        uint[]  memory _data_bet = new uint[](participantCount);
        uint[]  memory _data_choice = new uint[](participantCount);

        for (uint i = 0; i < participantCount; i++) {
            _addr[i] = participantAddresses[i];
            Participant storage member = participants[_addr[i]];
            _deposit[i] = member.depositAmount;
            _iv[i] = member.blindedBetChoice.iv;
            _data_bet[i] = member.blindedBetChoice.data_bet;
            _data_choice[i] = member.blindedBetChoice.data_choice;
        }

        return (_addr, _deposit, _iv, _data_bet, _data_choice);
    }

    function updateOdds(uint  _odds_0, uint  _odds_1) public onlyBookmaker {

      gameInfo.odds_0 = _odds_0;
      gameInfo.odds_1 = _odds_1;

    }

    function getGameInfo() public view returns(uint, uint, uint, uint, uint) {

          return (gameInfo.odds_0, gameInfo.odds_1,
                  gameInfo.startTime, gameInfo.endTime, address(this).balance);

    }


}
