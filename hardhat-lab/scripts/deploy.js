const hre = require("hardhat");

async function main() {
  const initialSupply = hre.ethers.parseUnits("1000", 18); // 1000 token

  const Token = await hre.ethers.getContractFactory("MyToken");
  const token = await Token.deploy("My Token", "MTK", initialSupply);
  await token.waitForDeployment();

  const addr = await token.getAddress();
  console.log("MyToken deployed to:", addr);
  console.log("Owner:", (await hre.ethers.getSigners())[0].address);
  console.log("Total supply:", (await token.totalSupply()).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
