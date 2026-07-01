// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
//  BÀI 10 – LENDING / BORROWING (vay có thế chấp, Aave/Compound mini)
//  Điền các phần TODO. Helper collateralValue/maxBorrow/healthFactor
//  đã cho sẵn ở cuối — chỉ gọi, không cần viết.
// ============================================================

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SimpleLending {
    // Luật chơi (cho sẵn)
    uint256 public constant LTV = 75;                   // vay tối đa 75% giá trị thế chấp
    uint256 public constant LIQUIDATION_THRESHOLD = 80; // vượt 80% -> bị thanh lý
    uint256 public constant LIQUIDATION_BONUS = 10;     // thưởng người thanh lý +10%
    uint256 public constant PRECISION = 1e18;

    // --- TODO 1: STATE ---
    // IERC20 public collateralToken;
    // IERC20 public borrowToken;
    // uint256 public price;     // 1 collateral = ? borrow (scaled 1e18) — oracle mô phỏng
    // address public owner;
    // mapping(address => uint256) public collateralBalance;
    // mapping(address => uint256) public debt;
    IERC20 public collateralToken;
    IERC20 public borrowToken;
    uint256 public price;
    address public owner;
    mapping(address => uint256) public collateralBalance;
    mapping(address => uint256) public debt;

    // --- TODO 2: constructor(_collateralToken, _borrowToken, _initialPrice) ---
    // ép kiểu IERC20 cho 2 token; price = _initialPrice; owner = msg.sender
    constructor(IERC20 _collateralToken, IERC20 _borrowToken, uint256 _initialPrice)
    {
        collateralToken = _collateralToken;
        borrowToken = _borrowToken;
        price = _initialPrice;
        owner = msg.sender;
    }

    // --- TODO 3: setPrice(uint256 newPrice) external  (chỉ owner) ---
    function setPrice(uint256 newPrice) external {
        require(msg.sender == owner, "Only owner can set price");
        price = newPrice;
    }

    // --- TODO 4: deposit(uint256 amount) external ---
    // require amount > 0; EFFECTS collateralBalance += amount;
    // INTERACTIONS collateralToken.transferFrom(msg.sender, address(this), amount);
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        collateralBalance[msg.sender] += amount;
        collateralToken.transferFrom(msg.sender, address(this), amount);
    }

    // --- TODO 5: borrow(uint256 amount) external ---
    // require amount > 0;
    // require debt[msg.sender] + amount <= maxBorrow(msg.sender) ("Exceeds borrow limit");
    // EFFECTS debt += amount; INTERACTIONS borrowToken.transfer(msg.sender, amount);
    function borrow(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(debt[msg.sender] + amount <= maxBorrow(msg.sender), "Exceeds borrow limit");
        debt[msg.sender] += amount;
        borrowToken.transfer(msg.sender, amount);
    }

    // --- TODO 6: repay(uint256 amount) external ---
    function repay(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(debt[msg.sender] >= amount, "Repay amount exceeds debt");
        debt[msg.sender] -= amount;
        borrowToken.transferFrom(msg.sender, address(this), amount);
    }


    // --- TODO 7: withdraw(uint256 amount) external ---
    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(collateralBalance[msg.sender] >= amount, "Withdraw amount exceeds collateral balance");
        //check if the user will be healthy after withdrawal
        uint256 newCollateralBalance = collateralBalance[msg.sender] - amount;
        uint256 newCollateralValue = newCollateralBalance * price / PRECISION;
        uint256 newMaxBorrow = newCollateralValue * LTV / 100;
        require(debt[msg.sender] <= newMaxBorrow, "Withdrawal would make position unhealthy");
        collateralBalance[msg.sender] -= amount;
        collateralToken.transfer(msg.sender, amount);
    }


    // --- TODO 8: liquidate(address user) external ---  ⭐
    // require healthFactor(user) < PRECISION ("Position is healthy");
    // uint256 debtToCover = debt[user];
    // uint256 collateralToSeize = (debtToCover * PRECISION / price) * (100 + LIQUIDATION_BONUS) / 100;
    // EFFECTS: debt[user] = 0; collateralBalance[user] -= collateralToSeize;
    // INTERACTIONS: borrowToken.transferFrom(msg.sender, address(this), debtToCover);
    //               collateralToken.transfer(msg.sender, collateralToSeize);


    // ===== HELPER ĐÃ CHO SẴN — không cần sửa =====

    // Giá trị thế chấp quy ra borrowToken
    function collateralValue(address user) public view returns (uint256) {
        return collateralBalance[user] * price / PRECISION;
    }

    // Hạn mức vay tối đa = giá trị thế chấp × LTV%
    function maxBorrow(address user) public view returns (uint256) {
        return collateralValue(user) * LTV / 100;
    }

    // Health Factor (scaled 1e18). >= 1e18 là an toàn.
    function healthFactor(address user) public view returns (uint256) {
        if (debt[user] == 0) return type(uint256).max;
        return collateralValue(user) * LIQUIDATION_THRESHOLD * PRECISION / (debt[user] * 100);
    }

    // ===== Câu hỏi tư duy (trả lời ngay dưới đây dạng comment) =====
    // 1. Vì sao phải thế chấp NHIỀU HƠN số vay? => ...
    // 2. HF < 1 nghĩa là gì? Ai lợi khi đi thanh lý? => ...
    // 3. Vì sao người thanh lý được thưởng bonus? => ...
    // 4. Nếu price lấy từ giá spot AMM, kẻ tấn công thao túng để làm gì? => ...
}
