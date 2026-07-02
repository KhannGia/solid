const hre = require("hardhat");

// Tương tác với SimpleAMM đã deploy trên Sepolia:
// approve -> addLiquidity -> swap -> đọc reserve.
// Cần 3 địa chỉ trong .env: AMM_ADDRESS, TOKENA_ADDRESS, TOKENB_ADDRESS
//
// Chạy: npm run interact:amm:sepolia
async function main() {
  const { AMM_ADDRESS, TOKENA_ADDRESS, TOKENB_ADDRESS } = process.env;
  if (!AMM_ADDRESS || !TOKENA_ADDRESS || !TOKENB_ADDRESS) {
    throw new Error("Thiếu AMM_ADDRESS / TOKENA_ADDRESS / TOKENB_ADDRESS trong .env");
  }

  const [signer] = await hre.ethers.getSigners();
  const net = hre.network.name;
  const explorer = net === "sepolia" ? "https://sepolia.etherscan.io/tx/" : "";
  console.log(`\n🌐 Mạng: ${net}\n👤 Ví: ${signer.address}\n`);

  const fmt = (x) => hre.ethers.formatUnits(x, 18);
  const amt = (n) => hre.ethers.parseUnits(n, 18);
  const log = async (label, tx) => {
    console.log(`⏳ ${label}... tx: ${explorer}${tx.hash}`);
    await tx.wait(); // đợi block xác nhận
    console.log(`   ✅ xong`);
  };

  // Gắn vào contract đã deploy
  const tokenA = await hre.ethers.getContractAt("MyToken", TOKENA_ADDRESS);
  const tokenB = await hre.ethers.getContractAt("MyToken", TOKENB_ADDRESS);
  const amm = await hre.ethers.getContractAt("SimpleAMM", AMM_ADDRESS);

  // --- READ (miễn phí) ---
  console.log("📖 Reserve trước:", fmt(await amm.reserve0()), "/", fmt(await amm.reserve1()));

  // --- WRITE 1 & 2: approve cho AMM ---
  // Approve DƯ (100000) để đủ cho cả addLiquidity LẪN swap sau đó.
  // (transferFrom tiêu dần allowance; approve sát nút sẽ hết hạn mức cho swap.)
  await log("approve Token A", await tokenA.approve(AMM_ADDRESS, amt("100000")));
  await log("approve Token B", await tokenB.approve(AMM_ADDRESS, amt("100000")));

  // --- WRITE 3: addLiquidity ---
  await log("addLiquidity(1000, 1000)", await amm.addLiquidity(amt("1000"), amt("1000")));
  console.log("📖 Reserve sau add:", fmt(await amm.reserve0()), "/", fmt(await amm.reserve1()));

  // --- WRITE 4: swap 10 Token A -> Token B ---
  const expectedOut = await amm.getAmountOut(amt("10"), await amm.reserve0(), await amm.reserve1());
  console.log("🔮 Kỳ vọng nhận:", fmt(expectedOut), "Token B");
  await log("swap 10 Token A", await amm.swap(TOKENA_ADDRESS, amt("10"), 0));
  console.log("📖 Reserve sau swap:", fmt(await amm.reserve0()), "/", fmt(await amm.reserve1()));

  console.log("\n🎉 Hoàn tất chuỗi giao dịch trên", net);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
