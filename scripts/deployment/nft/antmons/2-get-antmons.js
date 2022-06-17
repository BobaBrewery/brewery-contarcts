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
  const alice = accounts[1]
  const bob = accounts[2]

  const contracts = getSavedContractAddresses()[hre.network.name];
  const nft_address = contracts["MedievalNFT"]
  console.log("nft:", nft_address)

  const nft_instance = await ethers.getContractAt("MedievalNFT", nft_address);
  await nft_instance.mint(alice.address, 30 );
  console.log("alice nft:", await nft_instance.balanceOf(alice.address))

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
