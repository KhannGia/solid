# Bài 9 – AMM / DEX (Constant Product, kiểu Uniswap V2)

## 🎯 Mục tiêu
- Hiểu **sàn phi tập trung** hoạt động bằng **công thức toán** thay vì sổ lệnh (order book).
- Cài đặt **hằng số tích `x · y = k`** cho swap.
- Cấp **LP token (shares)** cho người góp thanh khoản; rút lại theo tỉ lệ.
- Áp 3 lá chắn bảo mật cốt lõi: **reserve nội bộ**, **CEI**, **slippage (minAmountOut)**.

## 🧠 Ý tưởng cốt lõi
Pool giữ 2 token. Tích 2 lượng dự trữ luôn ≈ hằng số `k`:
```
reserve0 · reserve1 = k
```
- **Swap**: bỏ token A vào → reserve A tăng → reserve B phải giảm để giữ k → bạn nhận phần B giảm đi.
- **Giá** không do ai đặt, mà = tỉ lệ dự trữ: `giá token0 (tính theo token1) = reserve1 / reserve0`.
- Mua càng nhiều → đẩy giá càng cao (price impact). Đây là **slippage**.

## 📄 Đề bài
Viết contract `SimpleAMM` cho cặp `token0 / token1`.

### State cần khai báo (TODO 1)
```solidity
IERC20 public token0;
IERC20 public token1;
uint256 public reserve0;        // ⚠ DÙNG BIẾN RIÊNG, KHÔNG dùng balanceOf
uint256 public reserve1;
uint256 public totalLiquidity;                  // tổng LP shares
mapping(address => uint256) public liquidity;   // LP shares mỗi người
```

### Constructor
`constructor(address _token0, address _token1)` — ép kiểu `IERC20(...)` cho 2 token.

### Hàm helper (ĐÃ CHO SẴN trong SM.sol)
- `getAmountOut(amountIn, reserveIn, reserveOut)` — tính lượng nhận theo công thức có phí 0.3%.
- `sqrt(y)`, `min(a,b)` — tiện ích toán.

### Hàm cần viết
1. **`addLiquidity(uint256 amount0, uint256 amount1) returns (uint256 shares)`**
   - require cả 2 > 0.
   - Nếu `totalLiquidity == 0` (lần đầu): `shares = sqrt(amount0 * amount1)`.
   - Ngược lại: `shares = min(amount0 * totalLiquidity / reserve0, amount1 * totalLiquidity / reserve1)`.
   - require `shares > 0`.
   - **EFFECTS trước**: cộng `liquidity[msg.sender]`, `totalLiquidity`, `reserve0`, `reserve1`.
   - **INTERACTIONS sau**: `token0.transferFrom(...)`, `token1.transferFrom(...)`.

2. **`removeLiquidity(uint256 shares) returns (uint256 amount0, uint256 amount1)`**
   - require `shares > 0` và `liquidity[msg.sender] >= shares`.
   - `amount0 = shares * reserve0 / totalLiquidity;`  `amount1 = shares * reserve1 / totalLiquidity;`
   - **EFFECTS**: trừ shares + reserve.
   - **INTERACTIONS**: `transfer` trả 2 token.

3. **`swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) returns (uint256 amountOut)`**
   - require `tokenIn` là token0 hoặc token1; `amountIn > 0`.
   - Xác định `(reserveIn, reserveOut)` theo chiều swap.
   - `amountOut = getAmountOut(amountIn, reserveIn, reserveOut);`
   - require `amountOut >= minAmountOut`  ("Slippage exceeded").  ← lá chắn slippage
   - **EFFECTS**: cập nhật reserve (reserveIn += amountIn; reserveOut -= amountOut).
   - **INTERACTIONS**: `transferFrom` kéo tokenIn vào; `transfer` gửi tokenOut ra.

### Câu hỏi tư duy (trả lời dạng comment trong SM.sol)
> 1. Vì sao dùng biến `reserve0/reserve1` riêng mà KHÔNG dùng `token0.balanceOf(address(this))` cho phép toán shares? (gợi ý: donation/inflation attack)
> 2. Vì sao `swap` cần tham số `minAmountOut`? Ai lợi nếu không có nó? (gợi ý: sandwich/front-run)
> 3. Vì sao cập nhật `reserve` TRƯỚC khi `transfer`? (gợi ý: CEI / reentrancy)
> 4. Swap lượng lớn so với reserve thì tỉ giá nhận được tốt hay tệ? Vì sao? (gợi ý: đường cong x·y=k)

## ✅ Tiêu chí hoàn thành
- [ ] State đúng (reserve dùng biến riêng)
- [ ] `addLiquidity`: lần đầu sqrt, sau đó min theo tỉ lệ; EFFECTS trước INTERACTIONS
- [ ] `removeLiquidity`: rút theo tỉ lệ shares
- [ ] `swap`: dùng getAmountOut, có check `minAmountOut`, cập nhật reserve trước khi transfer
- [ ] Trả lời 4 câu hỏi tư duy

## 💡 Gợi ý kiểm thử
1. Deploy 2 token ERC-20 (MyToken bài 4), mint cho mình.
2. Deploy `SimpleAMM(token0, token1)`.
3. `approve` AMM cho cả 2 token → `addLiquidity(1000, 1000)` → nhận shares.
4. `getAmountOut(100, 1000, 1000)` xem nhận bao nhiêu (≈ 90 do phí + price impact).
5. `swap(token0, 100, minOut)` → kiểm reserve đổi, ví nhận token1.
6. `removeLiquidity(shares)` → lấy lại 2 token (có thể lệch tỉ lệ do đã swap = impermanent loss).
