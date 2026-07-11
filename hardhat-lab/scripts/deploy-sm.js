const hre = require("hardhat");

async function main() {
  // SM.sol override decimals() = 6 => dùng 6 chứ không phải 18
  const initialSupply = hre.ethers.parseUnits("1000", 6); // 1000 MTK

  // Dùng tên đầy đủ cho contract MyTokenOZ trong SM.sol (bản OpenZeppelin)
  const Token = await hre.ethers.getContractFactory("contracts/bai6/SM.sol:MyTokenOZ");
  const token = await Token.deploy(initialSupply);
  await token.waitForDeployment();

  const addr = await token.getAddress();
  const [deployer] = await hre.ethers.getSigners();
  console.log("SM (MyTokenOZ) deployed to:", addr);
  console.log("Owner:", deployer.address);
  console.log("Decimals:", (await token.decimals()).toString());
  console.log("Total supply:", (await token.totalSupply()).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
