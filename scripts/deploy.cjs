const hre = require("hardhat");

async function main() {
  console.log("Deploying FOFAPassport...");

  const FOFAPassport = await hre.ethers.getContractFactory("FOFAPassport");
  const passport = await FOFAPassport.deploy();

  await passport.waitForDeployment();
  const address = await passport.getAddress();

  console.log(`FOFAPassport deployed to: ${address}`);
  console.log("");
  console.log("Add this to your .env:");
  console.log(`FOFA_CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
