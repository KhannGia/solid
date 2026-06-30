# Lý thuyết – Lending / Borrowing (vay có thế chấp)

## 1. Mô hình cho vay phi tập trung
Không có ngân hàng xét duyệt. Thay vào đó: **muốn vay thì phải khóa tài sản thế chấp DƯ giá trị**.
- Người **cho vay** gửi token vào pool → nhận lãi.
- Người **vay** gửi thế chấp → rút token khác ra, trả lãi.
- Mọi thứ do **code + giá** quyết định, không cần tin nhau.

> Khác ngân hàng: không cần danh tính/điểm tín dụng. "Tín dụng" = tài sản bạn khóa lại.

## 2. ⭐ Over-collateralization & LTV
Vì giá crypto **biến động mạnh**, bạn phải thế chấp **nhiều hơn** số vay:
```
LTV (Loan-to-Value) = 75%  →  thế chấp 200 chỉ vay tối đa 150
```
Phần dư (200 vs 150) là **đệm an toàn**: nếu giá thế chấp tụt, vẫn còn chỗ để bảo vệ người cho vay.

## 3. ❤️ Health Factor (HF) — thước đo sống còn
```
HF = collateralValue × LIQUIDATION_THRESHOLD × PRECISION / (debt × 100)
```
| HF | Ý nghĩa |
|---|---|
| `≥ 1e18` (≥ 1) | An toàn |
| `< 1e18` (< 1) | **Bị thanh lý** |
| `debt == 0` | Vô cực — không nợ thì không rủi ro |

- `LTV` (75%) = **lúc vay** được phép tới đâu.
- `LIQUIDATION_THRESHOLD` (80%) = **lúc nào bắt đầu nguy hiểm**. Có khoảng đệm 75→80 để người vay kịp phản ứng.

### Ví dụ số
Gửi 100 COLL, price = 2 → value 200. Vay 100.
`HF = 200×80 / (100×100) = 1.6` → an toàn.
Giá tụt còn 1.2 → value 120. `HF = 120×80 / (100×100) = 0.96` → **< 1, thanh lý được**.

## 4. ⭐ Liquidation (thanh lý) — cơ chế tự bảo vệ
Khi HF < 1, **bất kỳ ai** (liquidator) cũng được:
1. **Trả nợ hộ** người vay (nộp borrowToken).
2. **Tịch thu tài sản thế chấp** của họ, **kèm thưởng** (LIQUIDATION_BONUS 10%).
```
collateralToSeize = (debtToCover / price) × (100 + BONUS)/100
```
- Người vay mất tài sản (bị phạt vì để vị thế rủi ro).
- Liquidator có lời (nhận thế chấp rẻ hơn giá thị trường 10%).
- Giao thức **không bị vỡ nợ** vì khoản vay xấu được dọn ngay.

> Bonus chính là **động lực kinh tế**: nhờ nó luôn có người sẵn sàng dọn nợ xấu, giữ giao thức luôn đủ tài sản (solvent). Không có bonus → không ai thèm thanh lý → nợ xấu chất đống → vỡ nợ.

## 5. Lãi suất (interest) — khái niệm (bài này lược bớt)
Thực tế người vay trả **lãi theo thời gian**, lãi tích cho người cho vay:
```
nợ tăng dần theo thời gian: debt = principal × (1 + rate)^time
```
- Lãi suất thường **động**: pool dùng nhiều (utilization cao) → lãi cao → hút thêm người gửi.
- Cùng cơ chế "tích theo `block.timestamp`" như bài Staking. Bài 10 bỏ lãi để tập trung vào collateral/HF/thanh lý.

## 6. 🔐 Bảo mật Lending — các bẫy chính

### a) ⚠️ Oracle manipulation (rủi ro số 1 của lending)
`price` quyết định HF và hạn mức vay. Nếu lấy **giá spot từ một pool AMM**, kẻ tấn công dùng **flash loan**:
1. Bơm giá collateral lên cao (mua mạnh trong pool).
2. `collateralValue` phình to → vay sạch borrowToken.
3. Giá về bình thường → giao thức ôm nợ xấu, mất tiền.
→ Production **bắt buộc** dùng oracle chống thao túng: **Chainlink** hoặc **TWAP** (giá trung bình theo thời gian), không bao giờ dùng giá spot 1 khối.

### b) Reentrancy → CEI + nonReentrant
`withdraw`, `liquidate` gọi `transfer` ra token ngoài → cập nhật state TRƯỚC. Production thêm `ReentrancyGuard` + `SafeERC20`.

### c) Bad debt (nợ xấu)
Nếu giá tụt **quá nhanh** trước khi kịp thanh lý → `debt > collateralValue` → thanh lý không đủ bù → giao thức lỗ. Phòng bằng: đệm LTV thận trọng, thanh lý kịp thời, quỹ dự phòng.

### d) Liquidation cản trở / không sinh lời
Nếu bonus < phí gas hoặc thị trường kẹt → không ai thanh lý → nợ xấu. Tham số kinh tế phải chỉnh đúng.

### Checklist
- [ ] Giá từ oracle chống thao túng (Chainlink/TWAP), KHÔNG dùng spot
- [ ] CEI + nonReentrant + SafeERC20
- [ ] LTV < LIQUIDATION_THRESHOLD (có đệm)
- [ ] Bonus đủ hấp dẫn để luôn có người thanh lý
- [ ] Xử lý bad debt / làm tròn

## 7. Bài này đã đơn giản hóa gì
- **Không có lãi suất** (debt cố định tới khi trả).
- **Oracle = biến `price` owner set** (mô phỏng) thay vì Chainlink.
- Thanh lý **toàn bộ nợ** một lần (Aave cho thanh lý từng phần, tối đa 50%).
- Chưa có nonReentrant/SafeERC20, chưa xử lý bad debt khi `collateralToSeize > collateralBalance`.

## Nguồn tham khảo
- Aave V3 Docs: https://docs.aave.com/developers/
- Compound III (Comet): https://docs.compound.finance/
- Aave – Liquidations: https://docs.aave.com/faq/liquidations
- Chainlink Price Feeds: https://docs.chain.link/data-feeds
- Solidity by Example – (DeFi patterns): https://solidity-by-example.org/
- Bài học oracle manipulation (Rekt): https://rekt.news/
