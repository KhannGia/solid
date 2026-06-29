# Lý thuyết – AMM / DEX (Constant Product, Uniswap V2)

## 1. AMM là gì — khác sàn truyền thống ở đâu
- **Order book (sàn CEX/truyền thống)**: cần người mua khớp lệnh người bán. Không ai bán → không mua được.
- **AMM (Automated Market Maker)**: không cần đối tác. Bạn giao dịch với **một bể thanh khoản (pool)**, giá do **công thức toán** quyết định.
> Không có "người bán" — chỉ có pool và công thức. Ai cũng swap được bất kỳ lúc nào.

## 2. ⭐ Hằng số tích x · y = k
Pool giữ 2 token với dự trữ `reserve0`, `reserve1`. Quy tắc:
```
reserve0 · reserve1 = k   (giữ ~ không đổi khi swap)
```
Swap = di chuyển trên đường cong này:
- Bỏ token0 vào → `reserve0` tăng → để giữ `k`, `reserve1` phải giảm → phần `reserve1` giảm chính là token bạn nhận.

### Ví dụ số (bỏ phí cho dễ)
Pool: `reserve0 = 100`, `reserve1 = 100` → `k = 10.000`.
Bạn swap **10 token0** vào:
```
reserve0 mới = 110
reserve1 mới = k / 110 = 90,909...
amountOut = 100 − 90,909 = 9,09 token1
```
→ Bỏ 10 vào chỉ nhận **9,09** ra (không phải 10). Phần hụt = **price impact**.

## 3. Giá hình thành thế nào
```
giá token0 (theo token1) = reserve1 / reserve0
```
- Mua token0 → reserve0 giảm, reserve1 tăng → giá token0 **tăng**. Pool tự điều chỉnh giá.
- Không ai "đặt giá" — giá là hệ quả của tỉ lệ dự trữ.

## 4. Slippage & price impact
- **Lệnh càng lớn so với pool → tỉ giá càng tệ** (đường cong dốc lên).
- Swap 10 trên pool 100 → mất ~9% giá. Swap 10 trên pool 1.000.000 → gần như không lệch.
> Pool càng sâu (nhiều thanh khoản) → trượt giá càng ít. Đó là lý do thanh khoản quan trọng.

## 5. Công thức swap có phí (Uniswap V2 = 0.3%)
```solidity
amountInWithFee = amountIn * 997;                  // giữ lại 0.3% làm phí
amountOut = (reserveOut * amountInWithFee)
          / (reserveIn * 1000 + amountInWithFee);
```
- Phí 0.3% **ở lại trong pool** → làm `k` nhích lên → **thưởng cho người cấp thanh khoản (LP)**.

## 6. LP token (shares) — chứng nhận phần góp
- Góp thanh khoản → nhận **shares** tỉ lệ với phần đóng góp.
- Lần đầu: `shares = sqrt(amount0 * amount1)` (trung bình nhân — chống thao túng giá khởi tạo).
- Sau đó: `shares = min(amount0·total/reserve0, amount1·total/reserve1)` — phải góp **đúng tỉ lệ** hiện tại.
- Rút: `amountX = shares · reserveX / totalLiquidity` — lấy lại phần của mình **kèm phí đã tích**.
> Thực tế Uniswap LP token là một **ERC-20 chuyển nhượng được**; bài này dùng mapping nội bộ cho gọn.

## 7. Impermanent loss (lỗ tạm thời)
- Khi giá 2 token lệch nhau, giá trị phần LP rút ra có thể **thấp hơn** so với chỉ "giữ token trong ví".
- Gọi là *impermanent* vì nếu giá quay lại như cũ thì hết lỗ. Phí giao dịch là phần bù lại.

---

## 8. 🔐 Bảo mật AMM — các bẫy kinh điển (RẤT QUAN TRỌNG)

### a) Donation / inflation attack → DÙNG RESERVE NỘI BỘ
Nếu tính shares bằng `token.balanceOf(address(this))`, kẻ tấn công **gửi thẳng token vào contract** (ngoài hàm) để bơm mẫu số, làm sai phép chia shares → cướp phần của người vào sau.
```solidity
// ❌ NGUY HIỂM
shares = amount * totalSupply / token.balanceOf(address(this));
// ✅ AN TOÀN: theo dõi reserve bằng biến nội bộ, cập nhật thủ công
uint256 public reserve0;
reserve0 += amount0;
```
→ Đây là lý do bài bắt buộc dùng `reserve0/reserve1` riêng.

### b) Reentrancy → CEI + (production) nonReentrant + SafeERC20
Cập nhật **state (reserve) TRƯỚC**, gọi token **(transfer) SAU**. Token "lạ" có thể gọi ngược lại contract giữa chừng.
```solidity
reserve0 += amountIn;   // effects
reserve1 -= amountOut;
IERC20(tokenIn).transferFrom(...);  // interactions
tokenOut.transfer(...);
```
Production thêm `ReentrancyGuard` (`nonReentrant`) và `SafeERC20` (xử lý token trả về không chuẩn).

### c) Slippage / sandwich → BẮT BUỘC minAmountOut + deadline
Không có `minAmountOut`, bot **sandwich**: mua trước bạn để đẩy giá, để bạn nhận ít, rồi bán lại ăn chênh.
```solidity
require(amountOut >= minAmountOut, "Slippage exceeded");
require(block.timestamp <= deadline, "Expired");  // production thêm deadline
```

### d) Oracle manipulation → KHÔNG dùng giá spot làm oracle
`reserve1/reserve0` là **giá tức thời**, bị **flash loan** bẻ cong trong 1 giao dịch. Giao thức khác KHÔNG nên đọc giá spot của pool làm oracle → dùng **TWAP** (giá trung bình theo thời gian).

### e) Khác
- **Admin controls**: hàm đổi phí/pause phải `onlyOwner` (nên `Ownable2Step`); có nút **pause** khẩn cấp.
- **Safe math**: phép nhân reserve lớn dễ tràn → production dùng `mulDiv` (FullMath). Solidity ≥0.8 đã chặn overflow nhưng vẫn revert; `mulDiv` giữ được độ chính xác.

### Checklist nhanh
- [ ] reserve nội bộ, không dựa `balanceOf` cho shares
- [ ] CEI + nonReentrant + SafeERC20
- [ ] swap có `minAmountOut` + `deadline`
- [ ] không dùng giá spot làm oracle (dùng TWAP)
- [ ] admin có access control + pause
- [ ] reserve math an toàn (mulDiv)

## 9. Bài này đã đơn giản hóa gì
- LP shares là mapping nội bộ (không phải ERC-20 chuyển nhượng được).
- Chưa có `deadline`, `nonReentrant`, `SafeERC20`, oracle TWAP, phí có thể chỉnh.
- Mục tiêu: hiểu **x·y=k + shares + 3 lá chắn cốt lõi**; production dùng code Uniswap đã audit.

## Nguồn tham khảo
- Uniswap V2 Whitepaper: https://uniswap.org/whitepaper.pdf
- Uniswap V2 core – UniswapV2Pair.sol: https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Pair.sol
- Solidity by Example – Constant Product AMM: https://solidity-by-example.org/defi/constant-product-amm/
- Uniswap Docs – How AMMs work: https://docs.uniswap.org/concepts/protocol/swaps
- OpenZeppelin – ReentrancyGuard & SafeERC20: https://docs.openzeppelin.com/contracts/5.x/api/utils#ReentrancyGuard
- Impermanent loss giải thích: https://academy.binance.com/en/articles/impermanent-loss-explained
