# Bài 4.2 – ERC-20 với OpenZeppelin (import & kế thừa)

## 🎯 Mục tiêu
- Dùng `import` để mang thư viện ngoài vào.
- Kế thừa (`is`) từ contract có sẵn.
- Constructor chaining (truyền tham số cho constructor cha).
- Hiểu `override` / `virtual` / `super`.
- So sánh với bản tự viết ở bài 4.

## 📄 Đề bài
Viết lại token `MyToken` bằng OpenZeppelin — ít code hơn nhưng đầy đủ tính năng như bài 4.3.

### Yêu cầu
1. Import các module OpenZeppelin:
   - `@openzeppelin/contracts/token/ERC20/ERC20.sol`
   - `@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol`
   - `@openzeppelin/contracts/access/Ownable.sol`
2. Khai báo `contract MyToken is ERC20, ERC20Burnable, Ownable`.
3. Constructor:
   - `constructor(uint256 _initialSupply)`
   - Chaining: `ERC20("My Token", "MTK")` và `Ownable(msg.sender)`.
   - Trong thân: `_mint(msg.sender, _initialSupply);`
4. Hàm `mint(address _to, uint256 _amount) public onlyOwner`:
   - Gọi `_mint(_to, _amount);`  (KHÔNG cần viết lại logic — `_mint` đã có sẵn).
5. *(burn KHÔNG cần viết — `ERC20Burnable` đã cung cấp `burn()` và `burnFrom()`.)*

### (Tùy chọn — luyện override) Đổi decimals
- Override `decimals()` để trả về `6` (giống USDC) thay vì mặc định 18.
```solidity
function decimals() public pure override returns (uint8) { return 6; }
```

### Câu hỏi tư duy (comment trong SM.sol)
> 1. Vì sao chỉ cần `is ERC20` là đã có `transfer`/`approve`/... mà không viết dòng nào?
> 2. `_mint` (có gạch dưới) khác gì hàm `mint` bạn tự viết? Vì sao `_mint` là `internal`?
> 3. So với bài 4 (tự viết ~60 dòng), bản này ngắn hơn nhiều — đánh đổi gì để có sự gọn gàng đó?

## 💡 Gợi ý trên Remix
- Dán code vào Remix, import OpenZeppelin sẽ tự tải (cần mạng).
- Compiler chọn `0.8.20` trở lên (OpenZeppelin v5 yêu cầu).
- Lưu ý phiên bản: OpenZeppelin **v5** yêu cầu `Ownable(initialOwner)` trong constructor. Nếu gặp lỗi constructor, kiểm tra version.
- Test: deploy → `mint` bằng owner (OK) → đổi account `mint` (revert) → `burn` token của mình (OK).

## ✅ Tiêu chí hoàn thành
- [ ] Import đúng 3 module
- [ ] Kế thừa `is ERC20, ERC20Burnable, Ownable`
- [ ] Constructor chaining đúng (ERC20 + Ownable)
- [ ] `mint` onlyOwner gọi `_mint`
- [ ] Compile & deploy thành công trên Remix
- [ ] (Tùy chọn) override `decimals`
- [ ] Trả lời 3 câu hỏi tư duy
