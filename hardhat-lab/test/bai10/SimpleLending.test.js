const { expect } = require("chai");
const { ethers } = require("hardhat");

// ============================================================
//  BÀI TẬP: VIẾT TEST CHO SimpleLending (Lending/Borrowing)
//  - 2 test đầu ĐÃ VIẾT SẴN (deposit / borrow trong hạn mức).
//  - Các TODO: thay expect.fail(...) bằng test thật tới khi PASS.
//
//  Chạy riêng file này:
//    npm test --prefix /home/khangia/Cyclone/AC/hardhat-lab -- test/bai10/SimpleLending.test.js
//
//  LUẬT (trong contract): LTV=75%, LIQUIDATION_THRESHOLD=80%, BONUS=10%, price scaled 1e18.
// ============================================================

describe("SimpleLending", function () {
  let lending, collateral, borrow, owner, alice, bob;

  const SUPPLY = ethers.parseUnits("1000000", 18);
  const PRICE = ethers.parseUnits("1", 18);        // 1 collateral = 1 borrow
  const amt = (n) => ethers.parseUnits(n, 18);     // helper: "1000" -> 1000e18

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    // alice = người đi vay ; bob = người thanh lý

    const Token = await ethers.getContractFactory("MyToken");
    collateral = await Token.deploy("Collateral", "COL", SUPPLY); // token thế chấp
    borrow = await Token.deploy("Borrow", "BOR", SUPPLY);         // token cho vay
    await collateral.waitForDeployment();
    await borrow.waitForDeployment();

    const Lending = await ethers.getContractFactory("SimpleLending");
    lending = await Lending.deploy(collateral.target, borrow.target, PRICE);
    await lending.waitForDeployment();

    // Bơm thanh khoản borrowToken vào contract để có cái mà cho vay
    await borrow.transfer(lending.target, amt("500000"));

    // alice: cấp collateral để thế chấp + approve (deposit & repay)
    await collateral.transfer(alice.address, amt("10000"));
    await collateral.connect(alice).approve(lending.target, SUPPLY);
    await borrow.connect(alice).approve(lending.target, SUPPLY);

    // bob: cấp borrowToken để đi thanh lý + approve
    await borrow.transfer(bob.address, amt("10000"));
    await borrow.connect(bob).approve(lending.target, SUPPLY);
  });

  // ===== ĐÃ VIẾT SẴN: tham khảo =====

  it("deposit: cập nhật collateralBalance + kéo token vào contract", async function () {
    await lending.connect(alice).deposit(amt("1000"));
    expect(await lending.collateralBalance(alice.address)).to.equal(amt("1000"));
    expect(await collateral.balanceOf(lending.target)).to.equal(amt("1000"));
  });

  it("borrow trong hạn mức: debt tăng + alice nhận borrowToken", async function () {
    await lending.connect(alice).deposit(amt("1000")); // collateralValue=1000 -> maxBorrow=750
    await lending.connect(alice).borrow(amt("500"));    // 500 <= 750 -> OK
    expect(await lending.debt(alice.address)).to.equal(amt("500"));
    expect(await borrow.balanceOf(alice.address)).to.equal(amt("500"));
  });

  // ===== TODO: TỰ VIẾT (thay expect.fail bằng test thật) =====

  it("TODO 1: borrow vượt hạn mức -> revert 'Exceeds borrow limit'", async function () {
    // deposit 1000 (maxBorrow=750) rồi thử borrow 800 (> 750)
    // -> await expect(...).to.be.revertedWith("Exceeds borrow limit")
    const tx = async () => {
      await lending.connect(alice).deposit(amt("1000"));
      await lending.connect(alice).borrow(amt("800"));
    }
    await expect(tx()).to.be.revertedWith("Exceeds borrow limit");
  });

  it("TODO 2: setPrice bởi người KHÔNG phải owner -> revert 'Only owner can set price'", async function () {
    // lending.connect(alice).setPrice(...) -> revertedWith("Only owner can set price")
    const tx = async () => {
      await lending.connect(alice).setPrice(amt("0.5"));
    }
    await expect(tx()).to.be.revertedWith("Only owner can set price");
  });

  it("TODO 3: repay giảm debt đúng lượng", async function () {
    // deposit 1000; borrow 500; repay 200 -> debt(alice) == 300
    await lending.connect(alice).deposit(amt("1000"));
    await lending.connect(alice).borrow(amt("500"));
    await lending.connect(alice).repay(amt("200"));
    expect(await lending.debt(alice.address)).to.equal(amt("300"));
  });

  it("TODO 4: withdraw khi vẫn khỏe -> collateralBalance giảm đúng", async function () {
    // deposit 1000; KHÔNG vay; withdraw 400 -> collateralBalance(alice) == 600
    await lending.connect(alice).deposit(amt("1000"));
    await lending.connect(alice).withdraw(amt("400"));
    expect(await lending.collateralBalance(alice.address)).to.equal(amt("600"));
  });

  it("TODO 5: withdraw quá nhiều làm vị thế unhealthy -> revert", async function () {
    // deposit 1000; borrow 700; thử withdraw 500
    // (rút xong còn 500 -> maxBorrow=375 < nợ 700) -> revertedWith("Withdrawal would make position unhealthy")
    const tx = async () => {
      await lending.connect(alice).deposit(amt("1000"));
      await lending.connect(alice).borrow(amt("700"));
      await lending.connect(alice).withdraw(amt("500"));
    }
    await expect(tx()).to.be.revertedWith("Withdrawal would make position unhealthy");
  });

  it("TODO 6: liquidate khi giá rớt -> debt về 0, bob nhận collateral ⭐", async function () {
    // 1) alice deposit 1000; borrow 700   (HF > 1 ở giá 1.0)
    // 2) owner setPrice( amt("0.8") )      -> collateralValue=800, HF=0.914 < 1
    // 3) bob liquidate(alice.address)
    // 4) kiểm: debt(alice) == 0
    //          collateralBalance(alice) giảm (bị seize ~962.5)
    //          borrow.balanceOf(bob) giảm 700 (bob trả nợ hộ)
    //          collateral.balanceOf(bob) tăng (nhận collateral seize)
    expect.fail("chưa viết");
  });
});
