# Lý thuyết – Staking Contract

## 1. Staking là gì
Người dùng **khóa (stake)** token vào contract, để càng lâu càng nhận **thưởng (reward)**.
Như gửi tiết kiệm: gửi nhiều + lâu → lãi nhiều.

## 2. Công thức thưởng theo thời gian
```
reward = số_token_stake × rewardRate × thời_gian_đã_stake
```
- Đo thời gian bằng `block.timestamp` (giây).
- Mỗi giây trôi qua, người stake tích thêm thưởng.

```solidity
function earned(address u) public view returns (uint256) {
    uint256 pending = stakedBalance[u] * rewardRate * (block.timestamp - lastUpdateTime[u]);
    return rewards[u] + pending;   // đã chốt + đang tích
}
```

## 3. ⭐ Mẫu "settle trước khi đổi" — modifier updateReward
Trước khi đổi `stakedBalance` (stake/withdraw) hoặc trả thưởng, phải **chốt sổ** phần thưởng đã tích, rồi reset mốc thời gian:
```solidity
modifier updateReward(address u) {
    rewards[u] = earned(u);            // chốt phần thưởng tới hiện tại
    lastUpdateTime[u] = block.timestamp;  // reset mốc thời gian
    _;
}
```
- Gắn vào **cả 3 hàm** stake / withdraw / claimReward.
- Nếu KHÔNG có: khi user stake thêm, toàn bộ số dư mới bị tính thưởng cho cả khoảng thời gian quá khứ → **sai (thưởng lố)**.
> Cùng tinh thần CEI: cập nhật sổ sách cho đúng TRƯỚC khi xử lý.

## 4. Gọi token ngoài qua interface
```solidity
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

IERC20 public stakingToken;
stakingToken = IERC20(_tokenAddress);   // ép địa chỉ -> kiểu IERC20
stakingToken.transferFrom(msg.sender, address(this), amount);  // ra lệnh cho token
```
- `interface` = "bản mô tả các hàm" của contract khác, để mình gọi nó.
- `address(this)` = địa chỉ chính contract Staking (nơi giữ token stake).

## 5. Pull pattern — vì sao cần approve trước
- `stake` dùng `transferFrom` → contract **tự rút** token từ ví user.
- Nên user **bắt buộc** `approve(Staking, amount)` trên stakingToken TRƯỚC, nếu không revert.
- Đây đúng cơ chế approve/allowance/transferFrom của ERC-20.

## 6. Reentrancy trong claimReward
```solidity
function claimReward() external updateReward(msg.sender) {
    uint256 reward = rewards[msg.sender];
    require(reward > 0, "No reward");
    rewards[msg.sender] = 0;                 // chốt về 0 TRƯỚC (effects)
    rewardToken.transfer(msg.sender, reward); // gửi SAU (interaction)
}
```
- Đặt `rewards = 0` trước khi `transfer` → chống rút thưởng nhiều lần (CEI).

## 7. Lưu ý thực tế (đơn giản hóa trong bài)
- Công thức chưa scale `1e18` → số có thể rất lớn; production thường chia tỉ lệ.
- Nên kiểm tra giá trị trả về của `transfer`/`transferFrom` hoặc dùng `SafeERC20` (OpenZeppelin).
- Mô hình per-user này đơn giản; production lớn dùng "reward-per-token" toàn cục (Synthetix StakingRewards).

## Nguồn tham khảo
- Solidity Docs — Interfaces: https://docs.soliditylang.org/en/latest/contracts.html#interfaces
- Solidity by Example — Staking Rewards: https://solidity-by-example.org/defi/staking-rewards/
- OpenZeppelin — SafeERC20: https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#SafeERC20
- Synthetix StakingRewards (mẫu chuẩn công nghiệp): https://github.com/Synthetixio/synthetix/blob/v2.101.3/contracts/StakingRewards.sol
- ethereum.org — Staking: https://ethereum.org/en/staking/
