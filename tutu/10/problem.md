# Bài 10 – Lending / Borrowing (vay có thế chấp, kiểu Aave/Compound mini)

## 🎯 Mục tiêu
- Hiểu **vay phải thế chấp DƯ** (over-collateralization) và **LTV** (Loan-to-Value).
- Tính **Health Factor (HF)** — thước đo "vị thế còn an toàn không".
- Cài đặt **thanh lý (liquidation)**: khi HF < 1, ai cũng được trả nợ hộ + cướp tài sản thế chấp kèm thưởng.
- Thấy vì sao **giá phải từ oracle** và rủi ro khi oracle bị thao túng (nối với bài AMM).

## 🧠 Ý tưởng cốt lõi
Bạn KHÔNG bán tài sản, mà **khóa nó làm thế chấp** để vay tài sản khác:
```
Gửi 100 COLL (giá 2) = giá trị 200 BORROW
→ được vay tối đa LTV 75% = 150 BORROW
```
Vì giá **biến động**, phải thế chấp dư để có "đệm". Nếu giá thế chấp tụt → khoản vay hóa rủi ro → **bị thanh lý**.

## 📐 3 hằng số luật chơi (cho sẵn)
| Hằng số | Giá trị | Ý nghĩa |
|---|---|---|
| `LTV` | 75 | vay tối đa 75% giá trị thế chấp |
| `LIQUIDATION_THRESHOLD` | 80 | vượt 80% → bị thanh lý |
| `LIQUIDATION_BONUS` | 10 | người thanh lý nhận +10% thế chấp làm thưởng |
| `PRECISION` | 1e18 | để tính HF & giá dạng phân số |

## ❤️ Health Factor (cho sẵn — đọc kỹ)
```
HF = collateralValue × LIQUIDATION_THRESHOLD × PRECISION / (debt × 100)
```
- `HF ≥ 1` (tức ≥ `1e18`): **an toàn**.
- `HF < 1`: **bị thanh lý**.
- `debt == 0`: HF = vô cực (an toàn tuyệt đối).

### Ví dụ số (price scaled 1e18)
Gửi 100 COLL, price = 2e18 → `collateralValue = 100 × 2 = 200`.
Vay 100 BORROW. `HF = 200 × 80 × 1e18 / (100 × 100) = 1.6e18` → **1.6, an toàn**.
Giá tụt còn 1.2e18 → value = 120. `HF = 120 × 80 / (100 × 100) = 0.96` → **< 1, bị thanh lý!**

## 📄 Đề bài
Viết contract `SimpleLending` cho cặp `collateralToken / borrowToken`.

### State cần khai báo (TODO 1)
```solidity
IERC20 public collateralToken;
IERC20 public borrowToken;
uint256 public price;     // giá 1 collateral = ? borrow (scaled 1e18) — mô phỏng oracle
address public owner;
mapping(address => uint256) public collateralBalance; // đã gửi
mapping(address => uint256) public debt;              // đang nợ
```

### Hàm cần viết
1. **`constructor(_collateralToken, _borrowToken, _initialPrice)`** — ép kiểu IERC20, gán `price`, `owner = msg.sender`.

2. **`setPrice(uint256 newPrice) external` (chỉ owner)** — cập nhật `price`. (mô phỏng oracle; production dùng Chainlink)

3. **`deposit(uint256 amount) external`**
   - require `amount > 0`.
   - EFFECTS: `collateralBalance[msg.sender] += amount`.
   - INTERACTIONS: `collateralToken.transferFrom(msg.sender, address(this), amount)`.

4. **`borrow(uint256 amount) external`**
   - require `amount > 0`.
   - require `debt[msg.sender] + amount <= maxBorrow(msg.sender)`  ("Exceeds borrow limit").
   - EFFECTS: `debt[msg.sender] += amount`.
   - INTERACTIONS: `borrowToken.transfer(msg.sender, amount)`.

5. **`repay(uint256 amount) external`**
   - require `amount > 0 && amount <= debt[msg.sender]`.
   - EFFECTS: `debt[msg.sender] -= amount`.
   - INTERACTIONS: `borrowToken.transferFrom(msg.sender, address(this), amount)`.

6. **`withdraw(uint256 amount) external`**
   - require `collateralBalance[msg.sender] >= amount`.
   - EFFECTS: `collateralBalance[msg.sender] -= amount`.
   - require `healthFactor(msg.sender) >= PRECISION`  ("Would be unsafe")  ← kiểm SAU khi trừ.
   - INTERACTIONS: `collateralToken.transfer(msg.sender, amount)`.

7. **`liquidate(address user) external`**  ⭐
   - require `healthFactor(user) < PRECISION`  ("Position is healthy").
   - `uint256 debtToCover = debt[user];`  // trả toàn bộ nợ
   - `uint256 collateralToSeize = (debtToCover * PRECISION / price) * (100 + LIQUIDATION_BONUS) / 100;`
   - EFFECTS: `debt[user] = 0;`  `collateralBalance[user] -= collateralToSeize;`
   - INTERACTIONS: `borrowToken.transferFrom(msg.sender, address(this), debtToCover);`
                   `collateralToken.transfer(msg.sender, collateralToSeize);`

### Câu hỏi tư duy (comment trong SM.sol)
> 1. Vì sao phải thế chấp NHIỀU HƠN số vay (over-collateralization)?
> 2. HF < 1 nghĩa là gì? Ai được lợi khi đi thanh lý người khác?
> 3. Vì sao người thanh lý được thưởng `LIQUIDATION_BONUS`? (gợi ý: động lực giữ giao thức không vỡ nợ)
> 4. Nếu `price` lấy từ giá spot của một pool AMM, kẻ tấn công thao túng giá để làm gì? (gợi ý: oracle manipulation)

## ✅ Tiêu chí hoàn thành
- [ ] State + constructor + setPrice
- [ ] deposit / borrow (check maxBorrow) / repay / withdraw (check HF sau khi trừ)
- [ ] liquidate: chỉ khi HF < 1, tịch thu kèm bonus, CEI đúng
- [ ] Trả lời 4 câu hỏi tư duy

## 💡 Gợi ý kiểm thử
1. Deploy 2 token (MyToken bài 4) làm COLL & BORROW.
2. Deploy `SimpleLending(COLL, BORROW, 2e18)`.
3. **Nạp BORROW vào contract** (transfer thẳng) để có quỹ cho vay.
4. User `approve` + `deposit(100 COLL)` → `borrow(100 BORROW)` → kiểm HF ≈ 1.6.
5. owner `setPrice(1.2e18)` (giá tụt) → HF < 1.
6. Người khác `approve` BORROW + `liquidate(user)` → nhận COLL kèm bonus; debt user về 0.
