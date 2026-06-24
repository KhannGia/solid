// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyToken {
    // ===== ERC-20 nền (đã hoàn thiện ở bài 4) =====
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // TODO 1a: thêm biến address public owner;
    address public owner;
    // TODO 1b (tùy chọn): uint256 public immutable maxSupply;
    uint256 public immutable maxSupply;
    constructor(string memory _name, string memory _symbol, uint256 _initialSupply, uint256 _maxSupply) {
        name = _name;
        symbol = _symbol;
        decimals = 18;
        totalSupply = _initialSupply;
        balanceOf[msg.sender] = _initialSupply;
        emit Transfer(address(0), msg.sender, _initialSupply);
        // TODO 1c: owner = msg.sender;
        owner = msg.sender;
        // TODO 1d (tùy chọn): maxSupply = _maxSupply; (thêm tham số vào constructor)
        maxSupply = _maxSupply;
    }

    // TODO 2: modifier onlyOwner()
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    function _transfer(address _from, address _to, uint256 _amount) internal {
        require(_to != address(0), "Invalid address");
        require(balanceOf[_from] >= _amount, "Insufficient balance");
        balanceOf[_from] -= _amount;
        balanceOf[_to] += _amount;
        emit Transfer(_from, _to, _amount);
    }

    function transfer(address _to, uint256 _amount) public returns (bool) {
        _transfer(msg.sender, _to, _amount);
        return true;
    }

    function approve(address _spender, uint256 _amount) public returns (bool) {
        allowance[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _amount) public returns (bool) {
        require(allowance[_from][msg.sender] >= _amount, "Allowance exceeded");
        allowance[_from][msg.sender] -= _amount;
        _transfer(_from, _to, _amount);
        return true;
    }

    // ===== PHẦN BẠN VIẾT: Ownable + mint + burn =====

    // TODO 3: transferOwnership(address _newOwner) public onlyOwner
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
    // TODO 4: mint(address _to, uint256 _amount) public onlyOwner
    //         - require _to != address(0)
    //         - (tùy chọn) require totalSupply + _amount <= maxSupply
    //         - totalSupply += _amount; balanceOf[_to] += _amount;
    //         - emit Transfer(address(0), _to, _amount)
    function mint(address _to, uint256 _amount) public onlyOwner {
        require(_to != address(0), "Invalid address");
        require(totalSupply + _amount <= maxSupply, "Exceeds max supply");
        totalSupply += _amount;
        balanceOf[_to] += _amount;
        emit Transfer(address(0), _to, _amount);
    }
    // TODO 5: burn(uint256 _amount) public 
    //         - require đủ số dư
    //         - balanceOf[msg.sender] -= _amount; totalSupply -= _amount;
    //         - emit Transfer(msg.sender, address(0), _amount)
    function burn(uint256 _amount) public {
        require(balanceOf[msg.sender] >= _amount, "Insufficient balance");
        balanceOf[msg.sender] -= _amount;
        totalSupply -= _amount;
        emit Transfer(msg.sender, address(0), _amount);
    }
    // Câu hỏi tư duy:
    // 1. Vì sao mint cần onlyOwner còn burn thì không? =>  mint tạo token từ hư vô, nếu ai cũng mint được thì in vô hạn → token mất giá trị/niềm tin. Burn chỉ phá token của chính người gọi, không hại ai → không cần hạn chế.
    // 2. totalSupply sau: mint 100 -> transfer 30 -> burn 20 (bắt đầu từ 0)? => Vì: mint 100 → cung=100; transfer 30 không đổi cung (chỉ dịch chuyển); burn 20 → cung=80.
    // 3. Vì sao dùng immutable cho maxSupply? => Giá trị khắc vào bytecode, đọc ~3 gas (PUSH) thay vì ~2.100 gas (SLOAD) như storage; maxSupply chỉ set một lần lúc deploy và không bao giờ đổi → hợp hoàn hảo. Không dùng constant được vì giá trị chỉ biết lúc deploy (qua constructor).
}
