# Lý thuyết – Mint, Burn, Ownable & immutable

## 1. Ownable — phân quyền chủ sở hữu
Mẫu cho một địa chỉ `owner` có đặc quyền riêng (mint, đổi cấu hình...).
```solidity
address public owner;

constructor(...) { owner = msg.sender; }   // người deploy = chủ

modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
}

function transferOwnership(address _newOwner) public onlyOwner {
    require(_newOwner != address(0), "Zero address");
    owner = _newOwner;
}
```

## 2. mint — tạo token mới (PHẢI onlyOwner)
```solidity
function mint(address _to, uint256 _amount) public onlyOwner {
    require(_to != address(0), "Zero address");
    totalSupply += _amount;
    balanceOf[_to] += _amount;
    emit Transfer(address(0), _to, _amount);  // mint = chuyển từ address(0)
}
```

## 3. burn — đốt token (KHÔNG cần onlyOwner)
```solidity
function burn(uint256 _amount) public {
    require(balanceOf[msg.sender] >= _amount, "Insufficient balance");
    balanceOf[msg.sender] -= _amount;
    totalSupply -= _amount;
    emit Transfer(msg.sender, address(0), _amount);  // burn = chuyển về address(0)
}
```

## 4. Vì sao mint cần onlyOwner mà burn thì không
| | Tác động | Cần owner? |
|---|---|---|
| `mint` | Tạo token từ hư vô → làm loãng giá trị mọi holder | ✅ Bắt buộc (không thì in vô hạn) |
| `burn` | Phá hủy token **của chính người gọi** → không hại ai | ❌ Không cần |

## 5. Đối xứng mint ↔ burn
| | totalSupply | balance | event Transfer |
|---|---|---|---|
| **mint** | `+= amount` | người nhận `+=` | `(address(0) → to)` |
| **burn** | `-= amount` | người đốt `-=` | `(from → address(0))` |

> `transfer` KHÔNG đổi `totalSupply` (chỉ dịch chuyển). Chỉ mint/burn mới thay đổi tổng cung.
> Ví dụ: từ 0, mint 100 → transfer 30 → burn 20 ⇒ totalSupply = **80**.

## 6. Capped supply (giới hạn cung tối đa)
```solidity
uint256 public immutable maxSupply;
constructor(..., uint256 _maxSupply) { maxSupply = _maxSupply; }

function mint(address _to, uint256 _amount) public onlyOwner {
    require(totalSupply + _amount <= maxSupply, "Exceeds max supply");
    ...
}
```

## 7. immutable vì sao rẻ hơn storage
| | storage thường | `immutable` | `constant` |
|---|---|---|---|
| Lưu ở | Storage (on-chain) | **Bytecode** | **Bytecode** |
| Opcode đọc | `SLOAD` | `PUSH` | `PUSH` |
| Gas đọc | ~2.100 (cold)/100 (warm) | **~3** | **~3** |
| Gán giá trị | nhiều lần | **1 lần, trong constructor** | lúc viết code (compile-time) |
| Kiểu hỗ trợ | mọi kiểu | chỉ value types | chỉ value types |

- `immutable` rẻ vì giá trị được **khắc thẳng vào bytecode** khi deploy → đọc không chạm storage.
- Storage đắt vì là dữ liệu **mọi node phải lưu vĩnh viễn** (cơ chế warm/cold của EIP-2929).
- Quy tắc chọn:
  - Biết khi viết code, cố định → `constant`
  - Biết lúc deploy, cố định → `immutable`
  - Thay đổi trong vòng đời → `storage`

## Nguồn tham khảo
- Solidity Docs — Constant & Immutable State Variables: https://docs.soliditylang.org/en/latest/contracts.html#constant-and-immutable-state-variables
- OpenZeppelin — Ownable: https://docs.openzeppelin.com/contracts/5.x/api/access#Ownable
- OpenZeppelin — ERC20Burnable: https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#ERC20Burnable
- OpenZeppelin — ERC20Capped: https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#ERC20Capped
- ethereum.org — ERC-20 (mint/burn qua event Transfer): https://ethereum.org/en/developers/docs/standards/tokens/erc-20/
- EIP-2929 — Gas cost cho SLOAD/cold-warm access: https://eips.ethereum.org/EIPS/eip-2929
