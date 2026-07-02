const hre = require("hardhat");

// Deploy SimpleAMM (bài 9) + 2 token cho pool.
// Chạy local:   npm run deploy:amm
// Chạy Sepolia: npm run deploy:amm:sepolia
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const net = hre.network.name;
  console.log(`\n🌐 Mạng: ${net}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  const bal = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Số dư: ${hre.ethers.formatEther(bal)} ETH\n`);

  const supply = hre.ethers.parseUnits("1000000", 18); // 1,000,000 mỗi token

  // 1) Deploy 2 token
  const Token = await hre.ethers.getContractFactory("MyToken");

  const tokenA = await Token.deploy("Token A", "TKA", supply);
  await tokenA.waitForDeployment();
  console.log("✅ Token A (TKA):", await tokenA.getAddress());

  const tokenB = await Token.deploy("Token B", "TKB", supply);
  await tokenB.waitForDeployment();
  console.log("✅ Token B (TKB):", await tokenB.getAddress());

  // 2) Deploy AMM với 2 địa chỉ token
  const AMM = await hre.ethers.getContractFactory("SimpleAMM");
  const amm = await AMM.deploy(await tokenA.getAddress(), await tokenB.getAddress());
  await amm.waitForDeployment();
  console.log("✅ SimpleAMM     :", await amm.getAddress());

  console.log("\n📋 Tóm tắt — lưu lại các địa chỉ này:");
  console.log(JSON.stringify({
    network: net,
    tokenA: await tokenA.getAddress(),
    tokenB: await tokenB.getAddress(),
    amm: await amm.getAddress(),
  }, null, 2));

  // Gợi ý verify (nếu deploy lên Sepolia)
  if (net === "sepolia") {
    console.log("\n🔎 Verify AMM trên Etherscan (sau ~1 phút):");
    console.log(`npx hardhat verify --network sepolia ${await amm.getAddress()} ${await tokenA.getAddress()} ${await tokenB.getAddress()}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
