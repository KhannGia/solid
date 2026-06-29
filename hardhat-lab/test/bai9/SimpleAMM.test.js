const { expect } = require("chai");
const { ethers } = require("hardhat");

// ============================================================
//  BÀI TẬP: VIẾT TEST CHO SimpleAMM (Constant Product AMM)
//  - 2 test đầu ĐÃ VIẾT SẴN (state sau addLiquidity / toán getAmountOut).
//  - Các TODO: thay expect.fail(...) bằng test thật tới khi PASS.
//
//  Chạy riêng file này:
//    npm test --prefix /home/khangia/Cyclone/AC/hardhat-lab -- test/bai9/SimpleAMM.test.js
// ============================================================

describe("SimpleAMM (Constant Product)", function () {
  let amm, tokenA, tokenB, owner, alice;

  const SUPPLY = ethers.parseUnits("1000000", 18); // tổng cung mỗi token
  const INIT = ethers.parseUnits("1000", 18);      // thanh khoản ban đầu mỗi bên

  beforeEach(async function () {
    [owner, alice] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MyToken");
    tokenA = await Token.deploy("Token A", "TKA", SUPPLY); // owner giữ toàn bộ
    tokenB = await Token.deploy("Token B", "TKB", SUPPLY);
    await tokenA.waitForDeployment();
    await tokenB.waitForDeployment();

    const AMM = await ethers.getContractFactory("SimpleAMM");
    amm = await AMM.deploy(tokenA.target, tokenB.target); // token0=A, token1=B
    await amm.waitForDeployment();

    // owner cho AMM quyền rút token để addLiquidity / swap
    await tokenA.approve(amm.target, SUPPLY);
    await tokenB.approve(amm.target, SUPPLY);

    // cấp token cho alice (người trade) + alice approve AMM
    await tokenA.transfer(alice.address, ethers.parseUnits("1000", 18));
    await tokenB.transfer(alice.address, ethers.parseUnits("1000", 18));
    await tokenA.connect(alice).approve(amm.target, SUPPLY);
    await tokenB.connect(alice).approve(amm.target, SUPPLY);
  });

  // ===== ĐÃ VIẾT SẴN: tham khảo =====

  it("addLiquidity lần đầu: set reserves + shares = sqrt(a*b)", async function () {
    await amm.addLiquidity(INIT, INIT);
    expect(await amm.reserve0()).to.equal(INIT);
    expect(await amm.reserve1()).to.equal(INIT);
    // sqrt(INIT*INIT) == INIT  -> lần đầu góp đều nhau, shares = đúng lượng góp
    expect(await amm.totalLiquidity()).to.equal(INIT);
    expect(await amm.liquidity(owner.address)).to.equal(INIT);
  });

  it("getAmountOut: đúng công thức phí 0.3%", async function () {
    // pool 1000/1000, bỏ 100 vào: 100*997=99700; num=99700*1000; den=1000*1000+99700
    // = 99,700,000 / 1,099,700 = 90 (làm tròn xuống)
    expect(await amm.getAmountOut(100, 1000, 1000)).to.equal(90);
  });

  // ===== TODO: TỰ VIẾT =====

  it("TODO 1: swap token0->token1 cập nhật reserve & alice nhận token1", async function () {
    // 1) owner addLiquidity(INIT, INIT)
    // 2) tính kỳ vọng: const out = await amm.getAmountOut(amtIn, INIT, INIT)
    // 3) alice swap: amm.connect(alice).swap(tokenA.target, amtIn, 0)
    // 4) kiểm: reserve0 == INIT + amtIn; reserve1 == INIT - out;
    //          balanceOf alice trên tokenB tăng đúng 'out'
    await amm.addLiquidity(INIT, INIT);
    const amtIn = ethers.parseUnits("10", 18);
    const out = await amm.getAmountOut(amtIn, INIT, INIT);
    await amm.connect(alice).swap(tokenA.target, amtIn, 0);
    expect(await amm.reserve0()).to.equal(INIT + amtIn);
    expect(await amm.reserve1()).to.equal(INIT - out);
    expect(await tokenB.balanceOf(alice.address)).to.equal(
      ethers.parseUnits("1000", 18) + out
    );

  });

  it("TODO 2: swap revert khi minAmountOut quá cao (Slippage exceeded)", async function () {
    // addLiquidity trước; alice swap amtIn nhỏ nhưng minAmountOut đặt rất cao
    // -> to.be.revertedWith("Slippage exceeded")
    await amm.addLiquidity(INIT, INIT);
    const amtIn = ethers.parseUnits("10", 18);
    const minAmountOut = ethers.parseUnits("100", 18); // quá cao
    await expect(
      amm.connect(alice).swap(tokenA.target, amtIn, minAmountOut)
    ).to.be.revertedWith("Slippage exceeded");
  });

  it("TODO 3: swap revert khi token không thuộc pool (Invalid token)", async function () {
    // addLiquidity trước; gọi swap với 1 địa chỉ lạ (vd alice.address) làm tokenIn
    // -> to.be.revertedWith("Invalid token")
    await amm.addLiquidity(INIT, INIT);
    const amtIn = ethers.parseUnits("10", 18);
    await expect(
      amm.connect(alice).swap(alice.address, amtIn, 0)
    ).to.be.revertedWith("Invalid token");
  });

  it("TODO 4: removeLiquidity trả token & reset pool về 0", async function () {
    // owner addLiquidity(INIT, INIT) -> shares = INIT
    // owner removeLiquidity(INIT)
    // kiểm: reserve0 == 0, reserve1 == 0, totalLiquidity == 0, liquidity(owner) == 0
    await amm.addLiquidity(INIT, INIT);
    await amm.removeLiquidity(INIT);
    expect(await amm.reserve0()).to.equal(0);
    expect(await amm.reserve1()).to.equal(0);
    expect(await amm.totalLiquidity()).to.equal(0);
    expect(await amm.liquidity(owner.address)).to.equal(0);
  });

  it("TODO 5: sau swap, tích k = reserve0*reserve1 KHÔNG giảm (phí làm tăng)", async function () {
    // addLiquidity; kBefore = reserve0 * reserve1 (bigint);
    // alice swap; kAfter = reserve0 * reserve1;
    // expect(kAfter).to.be.greaterThanOrEqual(kBefore)
    await amm.addLiquidity(INIT, INIT);
    const kBefore = (await amm.reserve0()) * (await amm.reserve1());
    const amtIn = ethers.parseUnits("10", 18);
    await amm.connect(alice).swap(tokenA.target, amtIn, 0);
    const kAfter = (await amm.reserve0()) * (await amm.reserve1());
    expect(kAfter).to.be.greaterThanOrEqual(kBefore);
  });

  it("TODO 6: addLiquidity lần 2 (đúng tỉ lệ) cộng dồn shares", async function () {
    // addLiquidity(INIT, INIT) -> total = INIT
    // addLiquidity(INIT, INIT) lần 2 -> nhận thêm INIT shares
    // kiểm: totalLiquidity == 2*INIT; liquidity(owner) == 2*INIT
    await amm.addLiquidity(INIT, INIT);
    await amm.addLiquidity(INIT, INIT);
    expect(await amm.totalLiquidity()).to.equal(2n * INIT);
    expect(await amm.liquidity(owner.address)).to.equal(2n * INIT);

  });
});