// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
//  BÀI 8 – NFT (ERC-721) TỰ VIẾT FROM SCRATCH
//  Điền code vào các phần TODO. Đọc problem.md để biết yêu cầu.
// ============================================================

contract MyNFT {
    // --- TODO 1: STATE ---
    string public name;
    string public symbol;
    uint256 public nextTokenId;
    address public contractOwner;
    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    // --- EVENTS (đã cho sẵn, để ý 'indexed') ---
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);


    // --- TODO 2: constructor(_name, _symbol) ---
    // gán name, symbol, contractOwner = msg.sender
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        contractOwner = msg.sender;
    }

    // --- TODO 3: mint(address to) external ---
    function mint(address to) external {
        require(msg.sender == contractOwner, "Not contract owner");
        require(to != address(0), "Invalid address");
        uint256 tokenId = nextTokenId;
        nextTokenId++;
        ownerOf[tokenId] = to;
        balanceOf[to] += 1;
        emit Transfer(address(0), to, tokenId);
    }

    // --- TODO 4: approve(address to, uint256 tokenId) external ---
    function approve(address to, uint256 tokenId) external {
        address owner = ownerOf[tokenId];
        require(msg.sender == owner || isApprovedForAll[owner][msg.sender], "Not authorized");
        getApproved[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    // --- TODO 5: setApprovalForAll(address operator, bool approved) external ---
    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    // --- TODO 6: transferFrom(address from, address to, uint256 tokenId) external ---
    function transferFrom(address from, address to, uint256 tokenId) external {
        require(ownerOf[tokenId] == from, "Not owner");
        require(to != address(0), "Invalid address");
        require(
            msg.sender == from || 
            getApproved[tokenId] == msg.sender || 
            isApprovedForAll[from][msg.sender], 
            "Not authorized"
        );

        balanceOf[from] -= 1;
        balanceOf[to] += 1;
        ownerOf[tokenId] = to;
        delete getApproved[tokenId];
        emit Transfer(from, to, tokenId);
    }

    // ===== Câu hỏi tư duy (trả lời ngay dưới đây dạng comment) =====
    // 1. Vì sao ERC-721 không cần decimals còn ERC-20 thì cần? => vì ERC-721 là token non-fungible (NFT) nên mỗi token không thể chia nhỏ được, trong khi ERC-20 là token fungible có thể chia nhỏ 
    // 2. Khác nhau approve(to, tokenId) vs setApprovalForAll(operator, true)? => approve chỉ cho phép 1 địa chỉ được phép chuyển 1 token cụ thể, còn setApprovalForAll cho phép 1 địa chỉ được phép chuyển tất cả các token của chủ sở hữu
    // 3. Vì sao transferFrom phải delete getApproved[tokenId] sau khi chuyển? => vì nếu không xóa thì địa chỉ được approve vẫn có thể chuyển token đó ngay cả khi chủ sở hữu đã chuyển token dẫn tới việc mất quyền
}
