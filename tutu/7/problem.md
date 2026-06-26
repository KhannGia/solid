# Bài 7 – Staking Contract

## 🎯 Mục tiêu
- Tương tác với ERC-20 ngoài qua `interface` (`transferFrom`, `transfer`).
- Tính thưởng theo thời gian bằng `block.timestamp`.
- Áp dụng mẫu "settle trước khi đổi" qua `modifier updateReward`.
- Hiểu pull pattern: người dùng phải `approve` trước khi stake.

## 📄 Đề bài
Viết contract `Staking`: người dùng khóa `stakingToken`, nhận thưởng bằng `rewardToken` theo thời gian.

### State
1. `IERC20 public stakingToken;`
2. `IERC20 public rewardToken;`
3. `uint256 public rewardRate;`  // thưởng mỗi token mỗi giây (đã đơn giản hóa)
4. `mapping(address => uint256) public stakedBalance;`  // số đang stake
5. `mapping(address => uint256) public rewards;`        // thưởng đã chốt
6. `mapping(address => uint256) public lastUpdateTime;` // mốc thời gian gần nhất

### Constructor
`constructor(address _stakingToken, address _rewardToken, uint256 _rewardRate)` — gán 3 biến (ép kiểu `IERC20(...)` cho 2 địa chỉ token).

### Hàm cần viết
1. `earned(address _user) public view returns (uint256)`
   - `pending = stakedBalance[_user] * rewardRate * (block.timestamp - lastUpdateTime[_user])`
   - return `rewards[_user] + pending`
2. `modifier updateReward(address _user)`
   - `rewards[_user] = earned(_user);`
   - `lastUpdateTime[_user] = block.timestamp;`
   - `_;`
3. `stake(uint256 _amount) external updateReward(msg.sender)`
   - require `_amount > 0`.
   - `stakedBalance[msg.sender] += _amount;`
   - `stakingToken.transferFrom(msg.sender, address(this), _amount);`
4. `withdraw(uint256 _amount) external updateReward(msg.sender)`
   - require đủ số đang stake.
   - `stakedBalance[msg.sender] -= _amount;`
   - `stakingToken.transfer(msg.sender, _amount);`
5. `claimReward() external updateReward(msg.sender)`
   - `uint256 reward = rewards[msg.sender];`
   - require `reward > 0`.
   - `rewards[msg.sender] = 0;`  (chốt về 0 TRƯỚC khi gửi)
   - `rewardToken.transfer(msg.sender, reward);`

### Câu hỏi tư duy (comment trong SM.sol)
> 1. Vì sao `stake` cần `transferFrom` (không phải `transfer`)? Người dùng phải làm gì trước khi stake?
> 2. Nếu KHÔNG có `updateReward` chạy trước khi đổi `stakedBalance`, phần thưởng bị tính sai thế nào?
> 3. Vì sao đặt `rewards[msg.sender] = 0` TRƯỚC khi `rewardToken.transfer`? (gợi ý: reentrancy)

## 💡 Gợi ý test trên Remix
1. Deploy 2 token ERC-20 (dùng MyToken bài 4): một làm staking, một làm reward.
2. Deploy `Staking` với 2 địa chỉ token + rewardRate nhỏ (vd 1).
3. Nạp `rewardToken` vào contract Staking (transfer thẳng cho địa chỉ Staking) để có hồ thưởng.
4. User `approve(Staking, amount)` trên stakingToken → rồi `stake(amount)`.
5. Đợi vài block / vài giây → gọi `earned(user)` xem thưởng tăng.
6. `claimReward()` → nhận rewardToken; `withdraw()` → lấy lại stakingToken.

## ✅ Tiêu chí hoàn thành
- [ ] `interface IERC20` + 6 state đúng
- [ ] `earned` tính đúng công thức
- [ ] `updateReward` chốt sổ + reset thời gian, gắn vào 3 hàm
- [ ] `stake` dùng transferFrom, `withdraw` trả lại token
- [ ] `claimReward` chốt rewards về 0 trước khi gửi
- [ ] Trả lời 3 câu hỏi tư duy
