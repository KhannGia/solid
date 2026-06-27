# Bài 8 – NFT (ERC-721) tự viết from scratch

## 🎯 Mục tiêu
- Hiểu khác biệt cốt lõi **ERC-721 (NFT)** vs **ERC-20 (token thường)**.
- Mỗi token có **ID riêng (tokenId)** và **một chủ duy nhất** — không chia nhỏ.
- Cài đặt 2 mức ủy quyền: **approve 1 token** và **setApprovalForAll (cả bộ sưu tập)**.
- Phát đúng 3 event chuẩn: `Transfer`, `Approval`, `ApprovalForAll`.

## 🔑 Ý tưởng then chốt
| | ERC-20 | ERC-721 (NFT) |
|---|---|---|
| Bản chất | fungible (đồng nhất) | non-fungible (độc nhất) |
| Sổ sách | `balanceOf[addr] = số lượng` | `ownerOf[tokenId] = 1 chủ` |
| 1 đơn vị | chia nhỏ được (decimals) | nguyên cục, không chia |
| Chuyển | chuyển *số lượng* | chuyển *từng ID* |

> ERC-20 hỏi "địa chỉ này có **bao nhiêu** token?".
> ERC-721 hỏi "token **số 7** đang thuộc về **ai**?".

## 📄 Đề bài
Viết contract `MyNFT` (ERC-721 rút gọn, tự viết tay).

### State cần khai báo
1. `string public name;`
2. `string public symbol;`
3. `mapping(uint256 => address) public ownerOf;`        // tokenId → chủ
4. `mapping(address => uint256) public balanceOf;`       // chủ → số NFT đang giữ
5. `mapping(uint256 => address) public getApproved;`     // tokenId → người được duyệt 1 token
6. `mapping(address => mapping(address => bool)) public isApprovedForAll;` // chủ → operator → bool
7. `uint256 public nextTokenId;`                          // ID kế tiếp sẽ mint (bắt đầu 0)
8. `address public contractOwner;`                        // người được mint

### Events (đặt đúng tham số `indexed`)
```solidity
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
```

### Hàm cần viết
1. `constructor(string memory _name, string memory _symbol)`
   - gán `name`, `symbol`, `contractOwner = msg.sender`.

2. `mint(address to) external` (chỉ `contractOwner`)
   - require `to != address(0)`.
   - `uint256 tokenId = nextTokenId;` rồi `nextTokenId++;`
   - `ownerOf[tokenId] = to;`  `balanceOf[to] += 1;`
   - emit `Transfer(address(0), to, tokenId)`  // mint = chuyển từ address(0)

3. `approve(address to, uint256 tokenId) external`
   - `address owner = ownerOf[tokenId];`
   - require người gọi là chủ **hoặc** operator: `msg.sender == owner || isApprovedForAll[owner][msg.sender]`.
   - `getApproved[tokenId] = to;`  emit `Approval(owner, to, tokenId)`.

4. `setApprovalForAll(address operator, bool approved) external`
   - `isApprovedForAll[msg.sender][operator] = approved;`
   - emit `ApprovalForAll(msg.sender, operator, approved)`.

5. `transferFrom(address from, address to, uint256 tokenId) external`
   - require `ownerOf[tokenId] == from`  ("Not owner").
   - require `to != address(0)`              ("Invalid address").
   - require người gọi có quyền: là `from`, hoặc `getApproved[tokenId] == msg.sender`, hoặc `isApprovedForAll[from][msg.sender]`  ("Not authorized").
   - `balanceOf[from] -= 1;`  `balanceOf[to] += 1;`
   - `ownerOf[tokenId] = to;`
   - `delete getApproved[tokenId];`  // xóa duyệt cũ của token này
   - emit `Transfer(from, to, tokenId)`.

### Câu hỏi tư duy (viết câu trả lời dạng comment trong SM.sol)
> 1. Vì sao ERC-721 không cần `decimals` còn ERC-20 thì cần?
> 2. Khác nhau giữa `approve(to, tokenId)` và `setApprovalForAll(operator, true)` — khi nào dùng cái nào?
> 3. Vì sao trong `transferFrom` phải `delete getApproved[tokenId]` sau khi chuyển? (gợi ý: chủ mới)

## ✅ Tiêu chí hoàn thành
- [ ] 8 state + 3 event đúng `indexed`
- [ ] `mint` chỉ contractOwner, emit Transfer từ `address(0)`
- [ ] `approve` kiểm tra quyền chủ/operator
- [ ] `setApprovalForAll` emit đúng
- [ ] `transferFrom` kiểm 3 điều kiện + xóa approval + cập nhật balance/owner
- [ ] Trả lời 3 câu hỏi tư duy

## 💡 Gợi ý kiểm thử (Remix hoặc Hardhat)
1. Deploy `MyNFT("My NFT", "MNFT")`.
2. `mint(addrA)` 3 lần → `ownerOf(0/1/2)` = addrA, `balanceOf(addrA)` = 3.
3. addrA `approve(addrB, 1)` → addrB `transferFrom(addrA, addrC, 1)` chạy được.
4. addrA `setApprovalForAll(addrB, true)` → addrB chuyển được mọi token của addrA.
5. Thử `transferFrom` token không sở hữu / không được duyệt → phải revert.
