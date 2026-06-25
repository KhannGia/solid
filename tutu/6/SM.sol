// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// TODO 1: import ERC20, ERC20Burnable, Ownable từ OpenZeppelin
// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// TODO 2: contract MyToken is ERC20, ERC20Burnable, Ownable {
contract MyToken is ERC20, ERC20Burnable, Ownable {

    // TODO 3: constructor(uint256 _initialSupply)
    //   - chaining: ERC20("My Token", "MTK") Ownable(msg.sender)
    //   - thân: _mint(msg.sender, _initialSupply);
    constructor(uint256 _initialSupply) ERC20("My Token", "MTK") Ownable(msg.sender) {
        _mint(msg.sender, _initialSupply);
    }
    // TODO 4: mint(address _to, uint256 _amount) public onlyOwner { _mint(_to, _amount); }
    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }
    // TODO 5 (tùy chọn): override decimals() trả về 6
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
    // Câu hỏi tư duy:
    // 1. Vì sao chỉ cần `is ERC20` là đã có transfer/approve/...? => Kế thừa: MyToken thừa hưởng toàn bộ hàm + state của ERC20. Các hàm đó tồn tại trong MyToken y như bạn tự viết, chỉ là code nằm ở contract cha.
    // 2. _mint khác mint bạn tự viết thế nào? Vì sao _mint là internal? => _mint là hàm lõi có sẵn của ERC20: tăng totalSupply, cộng số dư, emit Transfer(address(0),...). Nó để internal cố ý — để bên ngoài không gọi trực tiếp được (nếu public thì ai cũng mint). Bạn bọc nó bằng hàm mint public + onlyOwner để tự quyết định ai được phép mint. Thư viện lo "làm thế nào", bạn lo "ai được làm".
    // 3. Bản này ngắn hơn nhiều — đánh đổi gì để có sự gọn gàng? => Đổi lại sự gọn gàng + an toàn (đã audit): bạn phụ thuộc thư viện ngoài (phải tin & kiểm phiên bản), bytecode lớn hơn, kém minh bạch (logic ẩn trong contract cha), và phải học quy ước của thư viện (như cái bẫy v5 vừa rồi).
}
