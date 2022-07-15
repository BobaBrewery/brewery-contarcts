const { BigNumber } = require("ethers");
const hre = require("hardhat")
const { ethers } = hre;
const { getSavedContractAddresses } = require('../../../utils')

async function main() {
  const accounts = await ethers.getSigners();

  console.log("address:")
  for (const account of accounts) {
    console.log(account.address);
  }
  const deployer = accounts[0]
  // const alice = accounts[1]
  const bob = accounts[1]

  const contracts = getSavedContractAddresses()[hre.network.name];
  const nft_address = contracts["MedievalNFT"]
  console.log("nft:", nft_address)

  const nft_instance = await ethers.getContractAt("MedievalNFT", nft_address);
  await nft_instance.mint(deployer.address, 100, { gasLimit: 20000000 });
  await nft_instance.mint(deployer.address, 100, { gasLimit: 20000000 });
  await nft_instance.mint(deployer.address, 100, { gasLimit: 20000000 });
  await nft_instance.mint(deployer.address, 100, { gasLimit: 20000000 });
  await nft_instance.mint(deployer.address, 100, { gasLimit: 20000000 });
  console.log("deployer nft:", await nft_instance.balanceOf(deployer.address))

  const usdt_address = contracts["MOCK-TOKEN"]
  const usdt = await ethers.getContractAt("BreToken", usdt_address);
  await usdt.transfer(bob.address, BigNumber.from("10000000000000000000000"))

  console.log("bob usdt: ", await usdt.balanceOf(bob.address))

}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
