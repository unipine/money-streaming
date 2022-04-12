// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

// import ReentrancyGuard.sol for preventing re-entrancy attack when withdrawing
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Payment is ReentrancyGuard {
    struct UserData {
        uint256 shares;
        uint256 lastWithdrawTime;
    }

    string public name;
    address private owner;
    uint256 public benefitAmount;
    uint256 public streamingTime;
    uint256 public totalShares;

    mapping(address => UserData) users;

    event DepositBenefitAmount(uint256 amount);
    event AddNewShares(address indexed user, uint256 count);
    event Withdraw(
        address indexed user,
        uint256 totalAmount,
        uint256 possibleAmount,
        uint256 currentWithdrawTime,
        uint256 lastWithdrawTime
    );

    constructor() {
        name = "ETH & ERC20 Payments";
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Payment: Unauthorized");
        _;
    }

    /**
     * @dev Send allowed amount of Ether to user.
     *      User can withdraw Ether calculated in his own shares for total shares.
     */
    function withdraw() external {
        // user's shares should be existed
        require(users[msg.sender].shares > 0, "Payment: No share");

        UserData memory user = users[msg.sender];
        uint256 totalAmount;
        uint256 possibleAmount;

        // calculate the benefit amount for user
        unchecked {
            totalAmount = (benefitAmount * user.shares) / totalShares;
            possibleAmount = (totalAmount * (block.timestamp - user.lastWithdrawTime)) / streamingTime;
        }

        // transfer Ether
        payable(msg.sender).transfer(possibleAmount);

        // trigger withdraw event
        emit Withdraw(msg.sender, totalAmount, possibleAmount, block.timestamp, user.lastWithdrawTime);
    }

    /**
     * @dev Returns user's data
     */
    function getShareData() external view returns (uint256 shares, uint256 lastWithdrawTime) {
        return (users[msg.sender].shares, users[msg.sender].lastWithdrawTime);
    }

    /**
     * @dev Deposit the benefit amount for users.
     */
    function depositBenefitAmount() external payable onlyOwner {
        // benefit amount should be greater than zero
        require(msg.value > 0, "Payment: Amount can't be 0");

        // set the benefit amount
        benefitAmount = msg.value;

        // tirgger an event
        emit DepositBenefitAmount(msg.value);
    }

    /**
     * @dev Set new shares to assigned user.
     */
    function addNewShares(uint32 _shares, address _user) external onlyOwner {
        // user's address can not be 0x0 and share count should be greater than zero
        require(_user != address(0) && _shares > 0, "Payment: Invalid Sharing Input");

        // add new shares to user
        users[_user].shares = _shares;
        users[_user].lastWithdrawTime = block.timestamp;

        // add new share count to the total count
        totalShares += _shares;

        // trigger an event
        emit AddNewShares(_user, _shares);
    }

    /**
     * @dev Set streaming time
     */
    function setStreamingTime(uint256 _streamingTime) external onlyOwner {
        require(_streamingTime > 0 && _streamingTime <= 2592000, "Payment: Invalid Input");

        streamingTime = _streamingTime;
    }
}
