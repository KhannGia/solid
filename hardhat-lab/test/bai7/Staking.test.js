const { expect } = require("chai");
const { ethers } = require("hardhat");
// "time" = công cụ điều khiển thời gian của mạng test Hardhat
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Staking", function () {
  let stakingToken, rewardToken, staking;
  let owner, alice;

  const REWARD_RATE = 1n;                          // thưởng / (token-wei) / giây (đơn giản hóa)
  const POOL = ethers.parseUnits("100000", 18);    // hồ thưởng nạp vào contract
  const STAKE = ethers.parseUnits("100", 18);      // alice stake 100 token

  beforeEach(async function () {
    [owner, alice] = await ethers.getSigners();

    // 1) Deploy 2 token: 1 để stake, 1 để trả thưởng
    const Token = await ethers.getContractFactory("MyToken");
    stakingToken = await Token.deploy("Staking Token", "STK", ethers.parseUnits("1000000", 18));
    rewardToken = await Token.deploy("Reward Token", "RWD", ethers.parseUnits("1000000", 18));
    await stakingToken.waitForDeployment();
    await rewardToken.waitForDeployment();

    // 2) Deploy Staking với 2 địa chỉ token + rewardRate
    const Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(
      await stakingToken.getAddress(),
      await rewardToken.getAddress(),
      REWARD_RATE
    );
    await staking.waitForDeployment();

    // 3) Nạp reward token vào contract làm hồ thưởng
    await rewardToken.transfer(await staking.getAddress(), POOL);

    // 4) Cho alice một ít staking token để thử
    await stakingToken.transfer(alice.address, ethers.parseUnits("1000", 18));
  });

  describe("stake", function () {
    it("chuyển token vào contract & ghi sổ stakedBalance", async function () {
      await stakingToken.connect(alice).approve(await staking.getAddress(), STAKE);
      await staking.connect(alice).stake(STAKE);

      expect(await staking.stakedBalance(alice.address)).to.equal(STAKE);
      expect(await stakingToken.balanceOf(await staking.getAddress())).to.equal(STAKE);
    });

    it("revert nếu CHƯA approve (pull pattern)", async function () {
      await expect(
        staking.connect(alice).stake(STAKE)
      ).to.be.revertedWith("Allowance exceeded");
    });
  });

  describe("earned — thưởng theo thời gian", function () {
    it("bằng 0 ngay sau khi stake", async function () {
      await stakingToken.connect(alice).approve(await staking.getAddress(), STAKE);
      await staking.connect(alice).stake(STAKE);
      expect(await staking.earned(alice.address)).to.equal(0);
    });

    it("tăng đúng công thức sau khi thời gian trôi", async function () {
      await stakingToken.connect(alice).approve(await staking.getAddress(), STAKE);
      await staking.connect(alice).stake(STAKE);

      await time.increase(100); // ⏩ tua nhanh 100 giây

      // thưởng = staked * rate * time = STAKE * 1 * 100
      const expected = STAKE * REWARD_RATE * 100n;
      expect(await staking.earned(alice.address)).to.equal(expected);
    });
  });

  describe("claimReward", function () {
    it("nhận reward token & reset rewards về 0", async function () {
      await stakingToken.connect(alice).approve(await staking.getAddress(), STAKE);
      await staking.connect(alice).stake(STAKE);
      await time.increase(100);

      const before = await rewardToken.balanceOf(alice.address);
      await staking.connect(alice).claimReward();
      const after = await rewardToken.balanceOf(alice.address);

      expect(after).to.be.gt(before);                       // đã nhận thưởng
      expect(await staking.rewards(alice.address)).to.equal(0);
    });
  });

  describe("withdraw", function () {
    it("trả lại staking token & xóa stakedBalance", async function () {
      await stakingToken.connect(alice).approve(await staking.getAddress(), STAKE);
      await staking.connect(alice).stake(STAKE);

      await staking.connect(alice).withdraw(STAKE);
      expect(await staking.stakedBalance(alice.address)).to.equal(0);
    });

    it("revert khi rút quá số đang stake", async function () {
      await expect(
        staking.connect(alice).withdraw(STAKE)
      ).to.be.revertedWith("Insufficient staked balance");
    });
  });
});
