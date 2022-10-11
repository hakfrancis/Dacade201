// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract StakersContract is IERC721Receiver {

    using Counters for Counters.Counter;
    
    IERC721 immutable nftContract;
    Counters.Counter private potCounter;
    uint256 randNonce = 0;

    enum Status {
        Open,
        Closed
    }

    struct Pot {
        string name;
        uint256 size;
        address creator;
        address winner;
        uint256[] tokens;
        address[] stakers;
        Status status;
    }

    mapping(uint256 => Pot) allPot;

    event PotCreated(string name, address indexed creator);

    constructor(address _nftContractAddress) {
        nftContract = IERC721(_nftContractAddress);
    }

    // Function to help create a new pot
    function createPot(string memory _potName, uint256 _size) public {
        require(_size >= 3, "Pot size must be greater than 2");
        uint256 potId = potCounter.current();
        uint256[] memory tokens;
        address[] memory stakers;
        Status _status;
        allPot[potId] = Pot(
            _potName,
            _size,
            msg.sender,
            address(0),
            tokens,
            stakers,
            _status
        );
        emit PotCreated(_potName, msg.sender);
        potCounter.increment();
    }

    // Functino to stake token into a pot
    function stake(uint256 _potId, uint256 _tokenId) public {
        Pot storage pot = allPot[_potId];
        require(pot.tokens.length < pot.size, "Pot already filled up");
        nftContract.safeTransferFrom(msg.sender, address(this), _tokenId);
        pot.tokens.push(_tokenId);
        pot.stakers.push(msg.sender);
        pot.status = Status.Open;

        // last staker shakes the pot
        if (pot.tokens.length == pot.size) {
            shakePot(_potId);
        }
    }

    // Function to shake pot and randomly select winner
    function shakePot(uint256 _potId) public {
        Pot storage pot = allPot[_potId];
        uint256 winningIndex = getWinningIndex(pot.tokens.length);
        address winner = pot.stakers[winningIndex];
        pot.winner = winner;
        pot.status = Status.Closed;

        // Transfer all tokens in pot to winner
        for (uint256 i = 0; i < pot.tokens.length; i++) {
            nftContract.safeTransferFrom(address(this), winner, pot.tokens[i]);
        }
    }

    // Return details of a single pot
    function getOnePot(uint256 _potId)
        public
        view
        returns (
            string memory name,
            uint256 size,
            address creator,
            address winner,
            uint256[] memory tokens,
            address[] memory stakers,
            Status status
        )
    {
        Pot memory pot = allPot[_potId];
        name = pot.name;
        size = pot.size;
        creator = pot.creator;
        winner = pot.winner;
        tokens = pot.tokens;
        stakers = pot.stakers;
        status = pot.status;
    }

    // Return all pots with their details
    function getAllPots() public view returns (Pot[] memory) {
        Pot[] memory allPots = new Pot[](potCounter.current());
        for (uint256 i = 0; i < potCounter.current(); i++) {
            allPots[i] = allPot[i];
        }
        return allPots;
    }

    // Helper function to randomly select winner
    function getWinningIndex(uint256 _length) public returns (uint256) {
        uint256 randomIndex = uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce))
        ) % _length;
        randNonce++;
        return randomIndex;
    }

    // Override required by solidity
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return bytes4(this.onERC721Received.selector);
    }
}
