const hre = require("hardhat");

async function main() {
  const NftContract = await hre.ethers.getContractFactory("NftContract");
  const _contract = await NftContract.deploy();
  await _contract.deployed();
  console.log("NFT Contract deployed to:", _contract.address);
  storeContractData(_contract);

  const StakersContract = await hre.ethers.getContractFactory("StakersContract");
  const s_contract = await StakersContract.deploy(_contract.address);
  await s_contract.deployed();
  console.log("Stakers Contract deployed to:", s_contract.address);
  storeSContractData(s_contract);
}

function storeContractData(contract) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../src/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + "/NftContract-address.json",
    JSON.stringify({ NftContract: contract.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync("NftContract");

  fs.writeFileSync(
    contractsDir + "/NftContract.json",
    JSON.stringify(contractArtifact, null, 2)
  );
}

function storeSContractData(contract) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../src/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + "/Stakers-address.json",
    JSON.stringify({ Stakers: contract.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync("StakersContract");

  fs.writeFileSync(
    contractsDir + "/Stakers.json",
    JSON.stringify(contractArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });