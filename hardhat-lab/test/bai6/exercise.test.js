const { expect } = require("chai");
const { ethers } = require("hardhat");

// ============================================================
//  BÀI TẬP: VIẾT THÊM TEST CHO MyToken
//  Mỗi it() có expect.fail("TODO") -> chạy sẽ FAIL.
//  Nhiệm vụ: thay phần TODO bằng test thật cho tới khi PASS.
//
//  Chạy riêng file này:
//    npx hardhat test test/exercise.test.js
// ============================================================

describe("MyToken - Bài tập viết test", function () {
  let token, owner, alice, bob;
  const SUPPLY = ethers.parseUnits("1000", 18);

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("MyToken");
    token = await Factory.deploy("My Token", "MTK", SUPPLY);
    await token.waitForDeployment();
  });

  // --- NHÓM 1: EVENTS ---

  it("1. approve phát event Approval đúng tham số", async function () {
    // Gợi ý: token.approve(alice, amt) phải emit "Approval" withArgs(owner, alice, amt)
    const amt = ethers.parseUnits("100", 18);
    await expect(token.approve(alice.address, amt))
      .to.emit(token, "Approval")
      .withArgs(owner.address, alice.address, amt);
  });

  it("2. mint phát event Transfer từ address(0)", async function () {
    // Gợi ý: owner mint cho alice -> emit "Transfer" withArgs(ethers.ZeroAddress, alice, amt)
    const amt = ethers.parseUnits("100", 18);
    await expect(token.mint(alice.address, amt))
      .to.emit(token, "Transfer")
      .withArgs(ethers.ZeroAddress, alice.address, amt);
  });

  it("3. burn phát event Transfer về address(0)", async function () {
    // Gợi ý: owner burn -> emit "Transfer" withArgs(owner, ethers.ZeroAddress, amt)
    const amt = ethers.parseUnits("100", 18);
    await expect(token.burn(amt))
      .to.emit(token, "Transfer")
      .withArgs(owner.address, ethers.ZeroAddress, amt);
  });

  // --- NHÓM 2: REVERT ---

  it("4. transfer tới address(0) phải revert 'Invalid address'", async function () {
    // Gợi ý: token.transfer(ethers.ZeroAddress, amt) -> to.be.revertedWith("Invalid address")
    expect.fail("TODO: viết test");
  });

  it("5. burn quá số dư phải revert 'Insufficient balance'", async function () {
    // Gợi ý: alice (chưa có token) burn 1 token -> revert
    expect.fail("TODO: viết test");
  });

  // --- NHÓM 3: TRẠNG THÁI / SỐ DƯ ---

  it("6. transferFrom trừ đúng số dư của _from", async function () {
    // Gợi ý: approve alice, alice transferFrom(owner -> bob);
    //        kiểm tra balanceOf(owner) == SUPPLY - amt  VÀ  balanceOf(bob) == amt
    expect.fail("TODO: viết test");
  });

  it("7. nhiều lần transfer cộng dồn đúng số dư", async function () {
    // Gợi ý: transfer cho alice 2 lần (100 + 50) -> balanceOf(alice) == 150
    expect.fail("TODO: viết test");
  });

  // --- BONUS (nâng cao) ---

  it("8. (bonus) transfer trả về true", async function () {
    // Gợi ý: hàm đổi state trả về tx, KHÔNG phải bool.
    //        Dùng staticCall để đọc giá trị trả về mà không gửi giao dịch:
    //        const ok = await token.transfer.staticCall(alice.address, amt);
    //        expect(ok).to.equal(true);
    expect.fail("TODO: viết test");
  });
});
