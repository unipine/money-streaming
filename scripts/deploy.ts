import '@nomiclabs/hardhat-ethers'
import { ethers } from 'hardhat'

async function main() {
  const signers = await ethers.getSigners()
  const factory = await ethers.getContractFactory("Payment", signers[0])

  console.log(' > Deploying Payment...')

  const contract = await factory.deploy()

  await contract.deployed()

  console.log(' > Payment deployed to: ', contract.address)

  saveContractAddress(contract.address, signers[0].address)
}

function saveContractAddress(address: string, owner: string) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../contracts/Payment.sol";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + "/Address.json",
    JSON.stringify({ address, owner }, undefined, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
