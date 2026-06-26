// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ===== Interface cho sẵn: để Staking gọi token ERC-20 ngoài =====
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Staking {
    // stakingToken, rewardToken (IERC20), rewardRate (uint256)
    IERC20 public stakingToken;
    IERC20 public rewardToken;
    uint256 public rewardRate;
    // TODO 2: mapping stakedBalance, rewards, lastUpdateTime
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public lastUpdateTime;
    // TODO 3: constructor(_stakingToken, _rewardToken, _rewardRate)
    //         - ép kiểu IERC20(...) cho 2 token
    constructor(address _stakingToken, address _rewardToken, uint256 _rewardRate) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
    }
    // TODO 4: earned(address _user) public view returns (uint256)
    //         pending = stakedBalance * rewardRate * (block.timestamp - lastUpdateTime)
    //         return rewards[_user] + pending
    function earned(address _user) public view returns (uint256) {
        uint256 pending = stakedBalance[_user] * rewardRate * (block.timestamp - lastUpdateTime[_user]);
        return rewards[_user] + pending;
    }
    // TODO 5: modifier updateReward(address _user)
    //         rewards[_user] = earned(_user); lastUpdateTime[_user] = block.timestamp; _;
    modifier updateReward(address _user) {
        rewards[_user] = earned(_user);
        lastUpdateTime[_user] = block.timestamp;
        _;
    }
    // TODO 6: stake(uint256 _amount) external updateReward(msg.sender)
    //         - require _amount > 0
    //         - stakedBalance += _amount
    //         - stakingToken.transferFrom(msg.sender, address(this), _amount)
    function stake(uint256 _amount) external updateReward(msg.sender) {
        require(_amount > 0, "Amount must be greater than 0");
        stakedBalance[msg.sender] += _amount;
        stakingToken.transferFrom(msg.sender, address(this), _amount);
    }
    // TODO 7: withdraw(uint256 _amount) external updateReward(msg.sender)
    //         - require đủ số stake
    //         - stakedBalance -= _amount
    //         - stakingToken.transfer(msg.sender, _amount)
    function withdraw(uint256 _amount) external updateReward(msg.sender) {
        require(stakedBalance[msg.sender] >= _amount, "Insufficient staked balance");
        stakedBalance[msg.sender] -= _amount;
        stakingToken.transfer(msg.sender, _amount);
    }
    // TODO 8: claimReward() external updateReward(msg.sender)
    //         - reward = rewards[msg.sender]; require reward > 0
    //         - rewards[msg.sender] = 0; rewardToken.transfer(msg.sender, reward)
    function claimReward() external updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        rewards[msg.sender] = 0;
        rewardToken.transfer(msg.sender, reward);
    }
    
    // Câu hỏi tư duy:
    // 1. Vì sao stake cần transferFrom? Người dùng phải làm gì trước? => ...
    // 2. Không có updateReward thì thưởng sai thế nào? => ...
    // 3. Vì sao rewards = 0 TRƯỚC khi transfer? => ...
}
