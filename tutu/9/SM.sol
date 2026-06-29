// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
//  BÀI 9 – CONSTANT PRODUCT AMM (kiểu Uniswap V2)
//  Điền các phần TODO. Đọc problem.md để biết công thức.
//  Helper getAmountOut / sqrt / min đã cho sẵn ở cuối file.
// ============================================================

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SimpleAMM {
    // --- TODO 1: STATE ---
    IERC20 public token0;
    IERC20 public token1;
    uint256 public reserve0;
    uint256 public reserve1;
    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidity;

    // --- TODO 2: constructor(_token0, _token1) ---
    constructor(address _token0, address _token1) {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }

    // --- TODO 3: addLiquidity(amount0, amount1) returns (uint256 shares) ---
    function addLiquidity(uint256 amount0, uint256 amount1) external returns (uint256 shares) {
        require(amount0 > 0 && amount1 > 0, "Amounts must be greater than zero");

        if (totalLiquidity == 0) {
            shares = sqrt(amount0 * amount1);
        } else {
            shares = min(amount0 * totalLiquidity / reserve0, amount1 * totalLiquidity / reserve1);
        }

        require(shares > 0, "Shares must be greater than zero");

        liquidity[msg.sender] += shares;
        totalLiquidity += shares;
        reserve0 += amount0;
        reserve1 += amount1;

        require(token0.transferFrom(msg.sender, address(this), amount0), "Transfer of token0 failed");
        require(token1.transferFrom(msg.sender, address(this), amount1), "Transfer of token1 failed");
    }

    // --- TODO 4: removeLiquidity(shares) returns (uint256 amount0, uint256 amount1) ---
    function removeLiquidity(uint256 shares) external returns (uint256 amount0, uint256 amount1) {
        require(shares > 0 && liquidity[msg.sender] >= shares, "Not enough liquidity");

        amount0 = shares * reserve0 / totalLiquidity;
        amount1 = shares * reserve1 / totalLiquidity;

        require(amount0 > 0 && amount1 > 0, "Amounts must be greater than zero");

        liquidity[msg.sender] -= shares;
        totalLiquidity -= shares;
        reserve0 -= amount0;
        reserve1 -= amount1;

        require(token0.transfer(msg.sender, amount0), "Transfer of token0 failed");
        require(token1.transfer(msg.sender, amount1), "Transfer of token1 failed");
    }

    // --- TODO 5: swap(tokenIn, amountIn, minAmountOut) returns (uint256 amountOut) ---
    function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) external
    returns (uint256 amountOut) {
        require(tokenIn == address(token0) || tokenIn == address(token1), "Invalid token");
        require(amountIn > 0, "Amount in must be greater than zero");

        bool isToken0 = tokenIn == address(token0);
        (uint256 reserveIn, uint256 reserveOut) = isToken0 ? (reserve0, reserve1) : (reserve1, reserve0);

        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= minAmountOut, "Slippage exceeded");

        // Update reserves before transferring to prevent reentrancy issues
        if (isToken0) {
            reserve0 += amountIn;
            reserve1 -= amountOut;
        } else {
            reserve1 += amountIn;
            reserve0 -= amountOut;
        }

        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Transfer of tokenIn failed");
        IERC20 tokenOut = isToken0 ? token1 : token0;
        require(tokenOut.transfer(msg.sender, amountOut), "Transfer of tokenOut failed");
    }

    // ===== HELPER ĐÃ CHO SẴN — không cần sửa =====

    // Công thức Uniswap V2: phí 0.3% (nhân 997/1000)
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        public pure returns (uint256)
    {
        require(amountIn > 0, "Insufficient input");
        require(reserveIn > 0 && reserveOut > 0, "No liquidity");
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        return numerator / denominator;
    }

    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) { z = x; x = (y / x + x) / 2; }
        } else if (y != 0) {
            z = 1;
        }
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    // ===== Câu hỏi tư duy (trả lời ngay dưới đây dạng comment) =====
    // 1. Vì sao dùng reserve0/reserve1 riêng, KHÔNG dùng balanceOf? => ...
    // 2. Vì sao swap cần minAmountOut? Ai lợi nếu thiếu? => ...
    // 3. Vì sao cập nhật reserve TRƯỚC khi transfer? => ...
    // 4. Swap lượng lớn so với reserve thì tỉ giá tốt hay tệ? Vì sao? => ...
}
