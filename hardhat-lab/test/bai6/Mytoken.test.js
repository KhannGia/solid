const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken", function () {
  let token, owner, alice, bob;
  const SUPPLY = ethers.parseUnits("1000", 18); // 1000 token (18 decimals)

  // Chạy trước MỖI test: deploy contract mới + lấy 3 tài khoản thử
  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("MyToken");
    token = await Token.deploy("My Token", "MTK", SUPPLY);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("đặt đúng name, symbol, decimals", async function () {
      expect(await token.name()).to.equal("My Token");
      expect(await token.symbol()).to.equal("MTK");
      expect(await token.decimals()).to.equal(18);
    });

    it("cấp toàn bộ cung ban đầu cho owner", async function () {
      expect(await token.totalSupply()).to.equal(SUPPLY);
      expect(await token.balanceOf(owner.address)).to.equal(SUPPLY);
    });
  });

  describe("transfer", function () {
    it("chuyển token thành công", async function () {
      const amt = ethers.parseUnits("100", 18);
      await token.transfer(alice.address, amt);
      expect(await token.balanceOf(alice.address)).to.equal(amt);
    });

    it("revert khi thiếu số dư", async function () {
      const amt = ethers.parseUnits("1", 18);
      // alice chưa có token nào -> phải revert
      await expect(
        token.connect(alice).transfer(bob.address, amt)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("phát event Transfer đúng tham số", async function () {
      const amt = ethers.parseUnits("50", 18);
      await expect(token.transfer(alice.address, amt))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, alice.address, amt);
    });
  });

  describe("approve & transferFrom", function () {
    it("transferFrom trong hạn mức + trừ allowance", async function () {
      const amt = ethers.parseUnits("100", 18);
      await token.approve(alice.address, amt);
      await token.connect(alice).transferFrom(owner.address, bob.address, amt);
      expect(await token.balanceOf(bob.address)).to.equal(amt);
      expect(await token.allowance(owner.address, alice.address)).to.equal(0);
    });

    it("revert khi vượt hạn mức", async function () {
      const amt = ethers.parseUnits("100", 18);
      await expect(
        token.connect(alice).transferFrom(owner.address, bob.address, amt)
      ).to.be.revertedWith("Allowance exceeded");
    });
  });

  describe("mint & burn", function () {
    it("owner mint được, tăng cung", async function () {
      const amt = ethers.parseUnits("500", 18);
      await token.mint(alice.address, amt);
      expect(await token.balanceOf(alice.address)).to.equal(amt);
      expect(await token.totalSupply()).to.equal(SUPPLY + amt);
    });

    it("người không phải owner mint -> revert", async function () {
      const amt = ethers.parseUnits("500", 18);
      await expect(
        token.connect(alice).mint(alice.address, amt)
      ).to.be.revertedWith("Not owner");
    });

    it("burn giảm số dư & tổng cung", async function () {
      const amt = ethers.parseUnits("200", 18);
      await token.burn(amt);
      expect(await token.balanceOf(owner.address)).to.equal(SUPPLY - amt);
      expect(await token.totalSupply()).to.equal(SUPPLY - amt);
    });
  });
});
