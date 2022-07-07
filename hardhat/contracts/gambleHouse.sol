// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract GambleHouse {

    struct EdsaCommitment {
      uint iv;
      uint data_bet;
      uint data_choice;
    }

    struct Participant {
        uint depositAmount; // amount deposited by Participant
        EdsaCommitment  blindedBetChoice;
        bool participated;
        string pubKey_1;
        string pubKey_2;
    }

    struct GameInfo {
        uint odds_0;
        uint odds_1;
        string team0;
        string team1;
        string league;
        string venue;
        uint fixture_id;
        uint startTime;
        uint endTime;
    }

    error OnlyBookmaker(string message);

    // Log the event about a deposit being made by an address and its amount
    event LogDepositMade(address indexed accountAddress, uint amount, uint balance);
    event LogRewardSent(address indexed accountAddress, uint amount);
    event LogBookmaker(address indexed accountAddress);

    GameInfo gameInfo;
    uint minBet = 5;
    uint creationTime;
    mapping(address => Participant) public participants;
    uint participantCount = 0;
    address[] participantAddresses;
    EdsaCommitment[] public betsChoices;

    mapping(address => uint) private rewardDistribution;
    bool rewardsDistributed = false;

    address public bookmaker;
    string[2] public bookmakerPubKey;
    uint private bookmakerPrivKey;

    modifier onlyBookmaker() {
        if (msg.sender != bookmaker) revert OnlyBookmaker("Only Bookmaker can access this!");
        _;
    }

    constructor(address _bookmaker, uint _bookmaker_priv_key,
       string memory _bookmaker_pub_key_1, string memory _bookmaker_pub_key_2,
       uint _start_time, uint _end_time, uint _fixture_id, string memory _team0,
       string memory _team1, string memory _league, string memory _venue)  {

          creationTime = block.timestamp;
          bookmaker = _bookmaker;
          bookmakerPrivKey = _bookmaker_priv_key;
          bookmakerPubKey[0] = _bookmaker_pub_key_1;
          bookmakerPubKey[1] = _bookmaker_pub_key_2;
          emit LogBookmaker(bookmaker);
          gameInfo.odds_0 = 0;
          gameInfo.odds_1 = 0;
          gameInfo.startTime = _start_time;
          gameInfo.endTime = _end_time;
          gameInfo.fixture_id = _fixture_id;
          gameInfo.team0 = _team0;
          gameInfo.team1 = _team1;
          gameInfo.league = _league;
          gameInfo.venue = _venue;
   }

    function deposit(uint _iv, uint _data_bet, uint _data_choice,
       string memory _pub_key_1, string memory _pub_key_2) public payable  {


        if(participants[msg.sender].participated) revert("Already Participated");
        if(msg.sender == bookmaker) revert("Bookmaker cannot participate");
        if(block.timestamp > gameInfo.startTime) revert("Event has started. Cannot place bets");
        if(msg.value < minBet) revert("Min bet not satisfied");
        if(participantCount == 10) revert("HOUSEFULL! Cannot havemore than 10 participants.");
        participants[msg.sender].depositAmount = msg.value;
        participants[msg.sender].blindedBetChoice = EdsaCommitment(
                                                              {
                                                                  iv: _iv,
                                                                  data_bet: _data_bet,
                                                                  data_choice: _data_choice
                                                              }
                                                    );
        participants[msg.sender].pubKey_1 = _pub_key_1;
        participants[msg.sender].pubKey_2 = _pub_key_2;
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
        rewardsDistributed = true;

    }


    function readParticipants() public view onlyBookmaker returns(address[] memory,
       uint[] memory, uint[] memory, uint[] memory, uint[] memory,
       string[] memory, string[] memory) {

        address[] memory _addr = new address[](participantCount);
        uint[]  memory _deposit = new uint[](participantCount);
        uint[]  memory _iv = new uint[](participantCount);
        uint[]  memory _data_bet = new uint[](participantCount);
        uint[]  memory _data_choice = new uint[](participantCount);
        string[] memory _pub_key1 = new string[](participantCount);
        string[] memory _pub_key2 = new string[](participantCount);

        for (uint i = 0; i < participantCount; i++) {
            _addr[i] = participantAddresses[i];
            Participant storage member = participants[_addr[i]];
            _deposit[i] = member.depositAmount;
            _iv[i] = member.blindedBetChoice.iv;
            _data_bet[i] = member.blindedBetChoice.data_bet;
            _data_choice[i] = member.blindedBetChoice.data_choice;
            _pub_key1[i] = member.pubKey_1;
            _pub_key2[i] = member.pubKey_2;
        }

        return (_addr, _deposit, _iv, _data_bet, _data_choice, _pub_key1, _pub_key2);
    }

    function getBookmakerKeys() public view onlyBookmaker returns(uint ,
       string memory, string memory ){

         return (bookmakerPrivKey, bookmakerPubKey[0], bookmakerPubKey[1]);
    }

    function getBookmakerPubKey() public view  returns(
       string memory, string memory){

         return (bookmakerPubKey[0], bookmakerPubKey[1]);
    }

    function updateOdds(uint _odds_0, uint _odds_1, uint _minBet) public onlyBookmaker {

      gameInfo.odds_0 = _odds_0;
      gameInfo.odds_1 = _odds_1;
      minBet = _minBet;
    }

    function getGameInfo() public view returns(uint, uint, uint, uint, uint,
                                  string memory, string memory, string memory,
                                  string memory, uint, uint, bool) {

          return (gameInfo.odds_0, gameInfo.odds_1, gameInfo.startTime, gameInfo.endTime,
                 address(this).balance, gameInfo.team0, gameInfo.team1, gameInfo.league,
                 gameInfo.venue, gameInfo.fixture_id, participantCount,
                 rewardsDistributed);

    }

    function getMinBet() public view returns(uint) {

      return minBet;

    }


}
