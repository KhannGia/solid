const { expect } = require("chai");
const { ethers } = require("hardhat");

// ============================================================
//  BÀI TẬP: VIẾT TEST CHO MyNFT (ERC-721)
//  - 3 test đầu ĐÃ VIẾT SẴN làm mẫu (state / event).
//  - Các test TODO: thay expect.fail(...) bằng test thật tới khi PASS.
//
//  Chạy riêng file này:
//    npm test --prefix /home/khangia/Cyclone/AC/hardhat-lab -- test/bai8/MyNFT.test.js
// ============================================================

describe("MyNFT (ERC-721)", function () {
  let nft, owner, alice, bob, carol;

  beforeEach(async function () {
    [owner, alice, bob, carol] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("MyNFT");
    nft = await Factory.deploy("My NFT", "MNFT"); // owner = contractOwner
    await nft.waitForDeployment();
  });

  // ===== ĐÃ VIẾT SẴN: tham khảo cú pháp =====

  it("deploy: name, symbol, nextTokenId đúng", async function () {
    expect(await nft.name()).to.equal("My NFT");
    expect(await nft.symbol()).to.equal("MNFT");
    expect(await nft.nextTokenId()).to.equal(0);
  });

  it("mint: cập nhật ownerOf, balanceOf, nextTokenId", async function () {
    await nft.mint(alice.address);
    expect(await nft.ownerOf(0)).to.equal(alice.address);
    expect(await nft.balanceOf(alice.address)).to.equal(1);
    expect(await nft.nextTokenId()).to.equal(1);
  });

  it("mint: emit Transfer từ address(0)", async function () {
    await expect(nft.mint(alice.address))
      .to.emit(nft, "Transfer")
      .withArgs(ethers.ZeroAddress, alice.address, 0); // tokenId = 0
  });

  // ===== TODO: TỰ VIẾT (xóa expect.fail, viết test thật) =====

  it("TODO 1: alice (không phải contractOwner) mint -> revert 'Not contract owner'", async function () {
    // Gợi ý: nft.connect(alice).mint(alice.address) -> to.be.revertedWith("...")
    await expect(nft.connect(alice).mint(alice.address)).to.be.revertedWith("Not contract owner");
  });

  it("TODO 2: mint tới address(0) -> revert 'Invalid address'", async function () {
    // Gợi ý: nft.mint(ethers.ZeroAddress)
    await expect(nft.mint(ethers.ZeroAddress)).to.be.revertedWith("Invalid address");
  });

  it("TODO 3: approve + transferFrom đổi chủ token", async function () {
    // 1) owner mint token 0 cho alice
    // 2) alice approve bob cho token 0:  nft.connect(alice).approve(bob.address, 0)
    // 3) bob chuyển:  nft.connect(bob).transferFrom(alice.address, carol.address, 0)
    // 4) kiểm: ownerOf(0) == carol, balanceOf(alice) == 0, balanceOf(carol) == 1
    await nft.mint(alice.address);
    await nft.connect(alice).approve(bob.address, 0);
    await nft.connect(bob).transferFrom(alice.address, carol.address, 0);

    expect(await nft.ownerOf(0)).to.equal(carol.address);
    expect(await nft.balanceOf(alice.address)).to.equal(0);
    expect(await nft.balanceOf(carol.address)).to.equal(1);
  });

  it("TODO 4: approve emit Approval đúng tham số", async function () {
    // mint cho alice trước; rồi alice approve bob token 0
    // -> emit "Approval" withArgs(alice, bob, 0)
    await nft.mint(alice.address);
    await expect(nft.connect(alice).approve(bob.address, 0)).to.emit(nft, "Approval").withArgs(alice.address, bob.address, 0);
  });

  it("TODO 5: người không được duyệt transferFrom -> revert 'Not authorized'", async function () {
    // mint cho alice; bob (không được approve) thử transferFrom(alice -> carol, 0)
    await nft.mint(alice.address);
    await expect(nft.connect(bob).transferFrom(alice.address, carol.address, 0)).to.be.revertedWith("Not authorized");
  });

  it("TODO 6: setApprovalForAll cho phép operator chuyển mọi token", async function () {
    // mint 2 token (0,1) cho alice; alice setApprovalForAll(bob, true)
    // bob chuyển CẢ token 0 và 1 cho carol -> ownerOf(0)==carol, ownerOf(1)==carol
    await nft.mint(alice.address);
    await nft.mint(alice.address);
    await nft.connect(alice).setApprovalForAll(bob.address, true);
    await nft.connect(bob).transferFrom(alice.address, carol.address, 0);
    await nft.connect(bob).transferFrom(alice.address, carol.address, 1);

    expect(await nft.ownerOf(0)).to.equal(carol.address);
    expect(await nft.ownerOf(1)).to.equal(carol.address);
  });

  it("TODO 7: sau transferFrom, getApproved(tokenId) bị xóa về address(0)", async function () {
    // mint cho alice; alice approve bob token 0; bob transferFrom(alice -> carol, 0)
    // -> getApproved(0) phải == ethers.ZeroAddress
    await nft.mint(alice.address);
    await nft.connect(alice).approve(bob.address, 0);
    await nft.connect(bob).transferFrom(alice.address, carol.address, 0);

    expect(await nft.getApproved(0)).to.equal(ethers.ZeroAddress);
  });
});
