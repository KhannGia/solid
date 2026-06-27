# Lý thuyết – NFT (ERC-721)

## 1. NFT là gì
**NFT = Non-Fungible Token = token không thể thay thế.**
Mỗi token là **độc nhất**, có **ID riêng** và **một chủ duy nhất**.
Ví dụ: 1 tấm vé số ghế A5 khác hẳn ghế B7 — không "đổi ngang" như tiền.

| | ERC-20 (fungible) | ERC-721 (non-fungible) |
|---|---|---|
| Câu hỏi cốt lõi | địa chỉ này có **bao nhiêu**? | token **số mấy** thuộc về **ai**? |
| Sổ sách chính | `balanceOf[addr] = số lượng` | `ownerOf[tokenId] = 1 địa chỉ` |
| Chia nhỏ | có (`decimals`) | KHÔNG — nguyên cục |
| Ứng dụng | tiền, điểm, cổ phần | tranh số, vật phẩm game, vé, sổ đỏ |

## 2. Bộ sổ sách của ERC-721
```solidity
mapping(uint256 => address) ownerOf;     // tokenId -> chủ  (sổ CHÍNH)
mapping(address => uint256) balanceOf;   // chủ -> đếm số NFT đang giữ (tiện tra cứu)
```
- `ownerOf` là **nguồn sự thật**: ai sở hữu token nào.
- `balanceOf` chỉ là **bộ đếm** đi kèm — mỗi lần mint/transfer phải cập nhật cho khớp.

## 3. Mint = chuyển từ address(0)
Giống ERC-20, "tạo mới" được biểu diễn bằng Transfer từ địa chỉ 0:
```solidity
ownerOf[tokenId] = to;
balanceOf[to] += 1;
emit Transfer(address(0), to, tokenId);   // address(0) = "từ hư không"
```
Mỗi NFT thường có **ID tăng dần** (`nextTokenId++`) để không trùng.

## 4. ⭐ Hai mức ủy quyền (điểm khác ERC-20)
ERC-20 chỉ có `approve(spender, amount)`. ERC-721 có **2 mức**:

| Hàm | Phạm vi | Dùng khi |
|---|---|---|
| `approve(to, tokenId)` | **1 token cụ thể** | bán/đưa đúng 1 NFT cho ai đó |
| `setApprovalForAll(operator, true)` | **TẤT CẢ** NFT của bạn | cho sàn (OpenSea...) quyền quản cả bộ sưu tập |

```solidity
mapping(uint256 => address) getApproved;                 // duyệt từng token
mapping(address => mapping(address => bool)) isApprovedForAll; // duyệt toàn bộ
```
→ Khi sàn giúp bạn bán, bạn `setApprovalForAll(sàn, true)` một lần thay vì approve từng token.

## 5. Ai được phép chuyển? (kiểm tra trong transferFrom)
Người gọi `transferFrom` hợp lệ nếu là **một trong ba**:
```solidity
msg.sender == from                       // chính chủ
|| getApproved[tokenId] == msg.sender    // được duyệt riêng token này
|| isApprovedForAll[from][msg.sender]    // được duyệt toàn bộ
```

## 6. ⭐ Vì sao xóa approval sau khi chuyển
```solidity
ownerOf[tokenId] = to;
delete getApproved[tokenId];   // QUAN TRỌNG
```
- `getApproved` gắn với **chủ cũ**. Khi token đổi chủ, quyền duyệt cũ phải **hết hiệu lực**.
- Nếu không xóa: người được chủ cũ duyệt vẫn có thể "giật" lại token từ chủ mới → lỗ hổng.

## 7. Khác biệt event so với ERC-20
- `Transfer`/`Approval` của ERC-721 đánh `indexed` cho **tokenId** (ERC-20 thì để `value` không indexed).
- Thêm event `ApprovalForAll(owner, operator, approved)` — không có ở ERC-20.

## 8. tokenURI & metadata (mở rộng — chưa làm trong bài)
NFT thật trỏ tới **metadata** (ảnh, tên, thuộc tính) qua `tokenURI(tokenId)` → 1 link JSON (thường trên IPFS). Hình ảnh KHÔNG nằm on-chain; chỉ ID + link nằm on-chain.

## 9. Thực tế: dùng OpenZeppelin
Như ERC-20, sản phẩm thật kế thừa `ERC721` của OpenZeppelin (đã audit) thay vì tự viết:
```solidity
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
contract MyNFT is ERC721 {
    constructor() ERC721("My NFT", "MNFT") {}
    function mint(address to, uint256 id) external { _mint(to, id); }
}
```
Bài này tự viết để **hiểu ruột gan**; làm thật thì dùng thư viện.

## Nguồn tham khảo
- EIP-721 (chuẩn gốc): https://eips.ethereum.org/EIPS/eip-721
- OpenZeppelin – ERC721: https://docs.openzeppelin.com/contracts/5.x/erc721
- OpenZeppelin – ERC721 API: https://docs.openzeppelin.com/contracts/5.x/api/token/erc721
- Solidity by Example – ERC721: https://solidity-by-example.org/app/erc721/
- ethereum.org – NFT standard: https://ethereum.org/en/developers/docs/standards/tokens/erc-721/
- Metadata/tokenURI (ERC721Metadata): https://eips.ethereum.org/EIPS/eip-721#specification
