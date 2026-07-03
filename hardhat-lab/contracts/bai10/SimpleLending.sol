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
    // Luật
    uint256 public constant LTV = 75;                   // vay tối đa 75% giá trị thế chấp
    uint256 public constant LIQUIDATION_THRESHOLD = 80; // vượt 80% -> bị thanh lý
    uint256 public constant LIQUIDATION_BONUS = 10;     // thưởng người thanh lý +10%
    uint256 public constant PRECISION = 1e18;

    // --- TODO 1: STATE ---
    IERC20 public collateralToken;
    IERC20 public borrowToken;
    uint256 public price;
    address public owner;
    mapping(address => uint256) public collateralBalance;
    mapping(address => uint256) public debt;

    // --- TODO 2: constructor(_collateralToken, _borrowToken, _initialPrice) ---
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
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        collateralBalance[msg.sender] += amount;
        collateralToken.transferFrom(msg.sender, address(this), amount);
    }

    // --- TODO 5: borrow(uint256 amount) external ---
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
    function liquidate(address user) external {
        require(healthFactor(user) < PRECISION, "Position is healthy");
        uint256 debtToCover = debt[user];
        uint256 collateralToSeize = (debtToCover * PRECISION / price) * (100 + LIQUIDATION_BONUS) / 100;

        require(collateralBalance[user] >= collateralToSeize, "Not enough collateral to seize");
        debt[user] = 0;
        collateralBalance[user] -= collateralToSeize;
        borrowToken.transferFrom(msg.sender, address(this), debtToCover);
        collateralToken.transfer(msg.sender, collateralToSeize);
    }

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
    
    // 1. Vì sao phải thế chấp NHIỀU HƠN số vay? => để giảm rủi ro cho lender, tránh mất vốn khi giá tài sản thế chấp giảm.
    // 2. HF < 1 nghĩa là gì? Ai lợi khi đi thanh lý? => nghĩa là khi giá trị thế chấp giảm xuống dưới mức an toàn định ra, người thanh lý (liquidator) sẽ được lợi vì họ có thể mua tài sản thế chấp với giá rẻ hơn giá trị thực tế.
    // 3. Vì sao người thanh lý được thưởng bonus? => để khuyến khích người thanh lý tham gia mua lại các khoản thanh lý, giúp duy trì sự ổn định của pool và giảm rủi ro cho hệ thống.
    // 4. Nếu price lấy từ giá spot AMM, kẻ tấn công thao túng để làm gì? => Kẻ 
}
