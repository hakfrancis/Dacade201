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
        Closed,
        Filled
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

    mapping(uint256 => Pot) private allPot;

    event PotCreated(string name, address indexed creator);

    constructor(address _nftContractAddress) {
        nftContract = IERC721(_nftContractAddress);
    }

    // Function to help create a new pot
    function createPot(string calldata _potName, uint256 _size) public {
        require(bytes(_potName).length > 0, "Empty pot name");
        require(
            _size >= 3 && _size <= 10,
            "Pot size must be greater than 2 but not more than 10"
        );
        uint256 potId = potCounter.current();
        potCounter.increment();

        Pot storage newPot = allPot[potId];
        newPot.name = _potName;
        newPot.size = _size;
        newPot.creator = msg.sender;

        emit PotCreated(_potName, msg.sender);
    }

    /** @dev Functino to stake token into a pot
     @notice The transaction will revert if any of the following conditions are met:
        1. The NFT does not exists
        2. The caller of the function is not the NFT's owner or approved operator
    */
    function stake(uint256 _potId, uint256 _tokenId) public {
        Pot storage pot = allPot[_potId];
        require(pot.status != Status.Filled, "Pot is currently filled");
        require(pot.tokens.length < pot.size, "Pot already filled up");
        nftContract.safeTransferFrom(msg.sender, address(this), _tokenId);
        pot.tokens.push(_tokenId);
        pot.stakers.push(msg.sender);
        pot.status = Status.Open;

        // last staker shakes the pot
        if (pot.tokens.length == pot.size) {
            uint256 winnerIndex = uint256(
                keccak256(
                    abi.encodePacked(block.timestamp, msg.sender, randNonce)
                )
            ) % pot.tokens.length;
            randNonce++;
            pot.winner = pot.stakers[winnerIndex];
            pot.status = Status.Filled;
        }
    }

    /**
     * @dev allow a pot's current winner or creator to transfer NFTs won to the pot's winner
     */
    function transferNFTsWon(uint256 _potId) external {
        Pot storage pot = allPot[_potId];
        require(
            pot.status == Status.Filled,
            "There are no winner that has been selected yet for this pot"
        );
        require(
            pot.winner == msg.sender || pot.creator == msg.sender,
            "Unauthorized caller"
        );
        address winner = pot.winner;
        // Transfer all tokens in pot to winner
        for (uint256 i = 0; i < pot.tokens.length; ) {
            nftContract.safeTransferFrom(address(this), winner, pot.tokens[i]);
            unchecked {
                i++;
            }
        }
        delete pot.tokens;
        delete pot.stakers;
        delete pot.winner;
        pot.status = Status.Closed;
    }

    /// @return details of a single pot
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
