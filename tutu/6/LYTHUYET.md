# Lý thuyết – ERC-20 với OpenZeppelin (import & kế thừa)

## 1. Vì sao dùng thư viện thay vì tự viết
- **Đã audit** bởi cộng đồng lớn → ít lỗ hổng.
- **Ít code** → ít chỗ sai.
- **Chuẩn hóa** → dev khác đọc hiểu ngay.

> Tự viết để HIỂU; dùng OpenZeppelin khi LÀM THẬT.

## 2. import — mang code ngoài vào
```solidity
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
```
- Trên Remix: đường dẫn `@openzeppelin/...` tự được tải.
- Trên Hardhat: cần `npm install @openzeppelin/contracts`.

## 3. Kế thừa (Inheritance) — `is`
```solidity
contract MyToken is ERC20, ERC20Burnable, Ownable { ... }
```
- Thừa hưởng toàn bộ hàm + state của cha (transfer, approve, _mint, owner, onlyOwner...).
- Kế thừa nhiều contract → ngăn bằng dấu phẩy.
- **Thứ tự**: liệt kê từ "gốc nhất" tới "dẫn xuất nhất" (ERC20 trước ERC20Burnable).

## 4. Constructor chaining — gọi constructor cha
Đặt ở **header** (giữa danh sách tham số và dấu `{`), KHÔNG đặt trong thân:
```solidity
constructor(uint256 _initialSupply)
    ERC20("My Token", "MTK")     // cha 1
    Ownable(msg.sender)          // cha 2 (OZ v5 bắt buộc truyền owner)
{
    _mint(msg.sender, _initialSupply);  // thân: code của mình
}
```
- Các lời gọi cha ngăn nhau bằng **dấu cách**, không phải `;`.

## 5. override / virtual / super
```solidity
function decimals() public view override returns (uint8) {
    return 6;  // đổi mặc định 18 -> 6 (như USDC)
}
```
| Từ khóa | Ý nghĩa |
|---|---|
| `virtual` (ở cha) | "hàm này cho phép con ghi đè" |
| `override` (ở con) | "tôi đang ghi đè hàm cha" |
| `super.foo()` | gọi lại phiên bản của cha bên trong con |

## 6. `_mint` vs `mint`
- `_mint` (gạch dưới): hàm **internal** lõi của ERC20 — tăng cung, cộng số dư, emit Transfer.
- Để `internal` cố ý → ngoài không gọi trực tiếp được.
- Bạn bọc bằng `mint` **public + onlyOwner** để quyết định AI được mint.
> Thư viện lo "làm thế nào"; bạn lo "ai được làm".

## 7. Bẫy phiên bản v4 vs v5
- OZ **v5**: `Ownable` có constructor nhận `address initialOwner` → phải `Ownable(msg.sender)`.
- OZ **v4**: `Ownable()` không tham số (tự lấy `msg.sender`).
- Compiler ≥ `0.8.20` cho OZ v5.

## 8. So sánh tự viết vs OpenZeppelin
| | Tự viết (bài 4) | OpenZeppelin |
|---|---|---|
| Số dòng | ~60 | ~10 |
| transfer/approve/burn | viết tay | có sẵn |
| Bảo mật | tự chịu | đã audit |
| Đánh đổi | minh bạch, không phụ thuộc | phụ thuộc thư viện, bytecode lớn hơn |

## Nguồn tham khảo
- OpenZeppelin Contracts Docs: https://docs.openzeppelin.com/contracts/5.x/
- OpenZeppelin — ERC20: https://docs.openzeppelin.com/contracts/5.x/erc20
- OpenZeppelin — Access Control (Ownable): https://docs.openzeppelin.com/contracts/5.x/access-control
- OpenZeppelin Contracts Wizard (tạo nhanh): https://wizard.openzeppelin.com/
- Solidity Docs — Inheritance: https://docs.soliditylang.org/en/latest/contracts.html#inheritance
- Solidity Docs — Using `import`: https://docs.soliditylang.org/en/latest/layout-of-source-files.html#importing-other-source-files
