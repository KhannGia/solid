import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://eth-sepolia.public.blastapi.io");

  const abi = [
    ""
  ];
  const contractAddress = "0x3B740628071C7D3e8C5FD29092a18b4e789bc8F1"; // Replace with your contract address
  const contract = new ethers.Contract(contractAddress, abi, provider);

  /**
   * Get the current balance of deployer
   */
}

main().catch(console.error);
