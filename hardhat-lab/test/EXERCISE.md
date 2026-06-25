# Bài tập – Viết thêm test cho MyToken (Hardhat)

## 🎯 Mục tiêu
- Quen các mẫu assertion: event, revert, số dư, `connect()`, `staticCall`.
- Hiểu vòng lặp TDD: chạy thấy đỏ (fail) → viết → xanh (pass).

## 📄 Nhiệm vụ
Mở `test/exercise.test.js`. Mỗi `it()` đang gọi `expect.fail("TODO")` nên sẽ **fail**.
Thay phần TODO bằng test thật cho 8 trường hợp:

| # | Test | Mẫu chính cần dùng |
|---|------|--------------------|
| 1 | `approve` phát event `Approval` | `.to.emit(...).withArgs(...)` |
| 2 | `mint` phát `Transfer` từ `address(0)` | `ethers.ZeroAddress` |
| 3 | `burn` phát `Transfer` về `address(0)` | `ethers.ZeroAddress` |
| 4 | `transfer` tới `address(0)` revert | `.to.be.revertedWith(...)` |
| 5 | `burn` quá số dư revert | `connect(alice)` + revert |
| 6 | `transferFrom` trừ đúng số dư `_from` | kiểm tra 2 balance |
| 7 | nhiều transfer cộng dồn | gọi 2 lần + `equal` |
| 8 | (bonus) `transfer` trả về `true` | `token.transfer.staticCall(...)` |

## ▶️ Cách chạy
```bash
# chạy riêng file bài tập
npx hardhat test test/exercise.test.js

# hoặc chạy tất cả
npx hardhat test
```

## 💡 Gợi ý cú pháp
```js
const amt = ethers.parseUnits("100", 18);

// Event:
await expect(token.approve(alice.address, amt))
  .to.emit(token, "Approval")
  .withArgs(owner.address, alice.address, amt);

// Revert:
await expect(token.transfer(ethers.ZeroAddress, amt))
  .to.be.revertedWith("Invalid address");

// Gọi bằng tài khoản khác:
await token.connect(alice).burn(amt);

// Số dư:
expect(await token.balanceOf(bob.address)).to.equal(amt);

// Giá trị trả về (không gửi tx):
const ok = await token.transfer.staticCall(alice.address, amt);
```

## ✅ Tiêu chí hoàn thành
- [ ] Cả 8 test PASS (không còn `expect.fail`)
- [ ] Hiểu vì sao dùng `staticCall` cho giá trị trả về (câu 8)
- [ ] Chạy `npx hardhat test` -> tổng cộng 18 test pass (10 cũ + 8 mới)
