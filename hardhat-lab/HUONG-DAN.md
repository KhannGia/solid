# Hướng dẫn sử dụng Hardhat (chi tiết)

## TỔNG QUAN VÒNG ĐỜI
```
Tạo project → Viết contract → Compile → Viết test → Test → Deploy → Tương tác → Verify
   (1 lần)      (contracts/)              (test/)            (scripts/)
```

---

## BƯỚC 1 — Tạo project (chỉ làm 1 lần)

### Cách A: tự dựng
```bash
mkdir my-project && cd my-project
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### Cách B: dùng wizard
```bash
npx hardhat init        # chọn "Create a JavaScript project"
```

> `hardhat-toolbox` gói gọn: ethers, chai matchers, gas reporter, coverage, verify...

---

## BƯỚC 2 — Cấu hình (hardhat.config.js)
```js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    hardhat: {},
    localhost: { url: "http://127.0.0.1:8545" },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  etherscan: { apiKey: process.env.ETHERSCAN_API_KEY },
};
```
| Mục | Vai trò |
|---|---|
| `solidity` | phiên bản compiler + tối ưu hóa |
| `networks` | khai báo các mạng deploy được |
| `etherscan` | khóa API để verify contract |

---

## BƯỚC 3 — Viết contract (contracts/)
- Mỗi file `.sol` đặt trong `contracts/`.
- `pragma` phải khớp `version` trong config.
- Import OpenZeppelin được nếu đã `npm install @openzeppelin/contracts`.

---

## BƯỚC 4 — Compile
```bash
npx hardhat compile          # compile (chỉ khi có thay đổi)
npx hardhat compile --force  # ép compile lại tất cả
npx hardhat clean            # xóa artifacts/cache
```
Kết quả → `artifacts/contracts/MyToken.sol/MyToken.json` chứa **ABI** + **bytecode**.
"Nothing to compile" = code chưa đổi (bình thường, không phải lỗi).

---

## BƯỚC 5 — Viết & chạy test (test/)

### Khung file test
```js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken", function () {
  let token, owner, alice;

  beforeEach(async function () {                 // chạy trước MỖI it()
    [owner, alice] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("MyToken");
    token = await Factory.deploy("My Token", "MTK", 1000n);
    await token.waitForDeployment();
  });

  it("mô tả kỳ vọng", async function () {
    expect(await token.name()).to.equal("My Token");
  });
});
```

### Assertion hay dùng
| Cú pháp | Kiểm tra |
|---|---|
| `expect(x).to.equal(y)` | bằng nhau |
| `expect(tx).to.be.revertedWith("msg")` | revert đúng lý do |
| `expect(tx).to.emit(c, "Event").withArgs(...)` | phát đúng event |
| `token.connect(alice).fn()` | gọi hàm bằng tài khoản khác |

### Lệnh
```bash
npx hardhat test                      # chạy hết
npx hardhat test test/MyToken.test.js # chạy 1 file
REPORT_GAS=true npx hardhat test      # kèm báo cáo gas
npx hardhat coverage                  # đo % code được test
```

---

## BƯỚC 6 — Deploy

### Script (scripts/deploy.js)
```js
const hre = require("hardhat");
async function main() {
  const Factory = await hre.ethers.getContractFactory("MyToken");
  const token = await Factory.deploy("My Token", "MTK", hre.ethers.parseUnits("1000", 18));
  await token.waitForDeployment();
  console.log("Deployed to:", await token.getAddress());
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
```

### 3 cấp độ deploy
| Mục tiêu | Lệnh | Đặc điểm |
|---|---|---|
| Mạng ảo tạm | `npx hardhat run scripts/deploy.js` | sinh ra rồi mất ngay |
| Node local | `npx hardhat node` rồi `... run scripts/deploy.js --network localhost` | chain local bền, 20 ví 10000 ETH |
| Testnet thật | `npx hardhat run scripts/deploy.js --network sepolia` | cần ETH testnet + RPC + private key |

### Node local (2 terminal)
```
Terminal 1:  npx hardhat node
Terminal 2:  npx hardhat run scripts/deploy.js --network localhost
```

---

## BƯỚC 7 — Tương tác (console)
```bash
npx hardhat console --network localhost
```
```js
const t = await ethers.getContractAt("MyToken", "0xĐỊA_CHỈ");
await t.totalSupply();
await t.transfer("0x...", 1000n);
```

---

## BƯỚC 8 — Deploy testnet Sepolia
1. Tạo `.env` (KHÔNG commit):
   ```
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/KHOA
   PRIVATE_KEY=khoa_bi_mat_vi
   ETHERSCAN_API_KEY=khoa_etherscan
   ```
2. RPC URL: đăng ký Alchemy/Infura (miễn phí).
3. ETH testnet: dùng "Sepolia faucet".
4. Deploy: `npx hardhat run scripts/deploy.js --network sepolia`
5. Verify:
   ```bash
   npx hardhat verify --network sepolia 0xĐỊA_CHỈ "My Token" "MTK" "1000000000000000000000"
   ```

> ⚠️ TUYỆT ĐỐI không commit `PRIVATE_KEY`. Dùng ví riêng cho testnet.

---

## QUY TRÌNH HẰNG NGÀY
```
1. Sửa contract trong contracts/
2. npx hardhat test          ← vòng lặp chính: sửa → test → sửa
3. npx hardhat run scripts/deploy.js --network localhost
4. (khi sẵn sàng) deploy + verify lên testnet
```

---

## LỖI THƯỜNG GẶP
| Lỗi | Nguyên nhân / xử lý |
|---|---|
| `Nothing to compile` | Không phải lỗi — code chưa đổi |
| `HH8: invalid account` | `PRIVATE_KEY` trong `.env` sai/thiếu |
| `insufficient funds` | Ví testnet hết ETH → xin faucet |
| `cannot estimate gas` | Hàm sẽ revert — kiểm tra logic/tham số |
| Test treo lâu | Quên `await` ở lời gọi async |

---

## Nguồn tham khảo
- Hardhat Docs (chính thức): https://hardhat.org/docs
- Hardhat — Testing contracts: https://hardhat.org/hardhat-runner/docs/guides/test-contracts
- Hardhat — Deploying: https://hardhat.org/hardhat-runner/docs/guides/deploying
- Hardhat — Verifying: https://hardhat.org/hardhat-runner/docs/guides/verifying
- Ethers v6 Docs: https://docs.ethers.org/v6/
- Chai Matchers (Hardhat): https://hardhat.org/hardhat-chai-matchers/docs/overview
- Sepolia Faucet (Alchemy): https://www.alchemy.com/faucets/ethereum-sepolia
