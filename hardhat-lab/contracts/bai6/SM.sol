// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// TODO 1: import ERC20, ERC20Burnable, Ownable từ OpenZeppelin
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// TODO 2: contract MyTokenOZ is ERC20, ERC20Burnable, Ownable {
//   (đặt tên MyTokenOZ để không trùng với contracts/bai6/MyToken.sol)
contract MyTokenOZ is ERC20, ERC20Burnable, Ownable {

    // TODO 3: constructor(uint256 _initialSupply)
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
}
