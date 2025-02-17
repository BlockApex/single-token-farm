const { BN, KeyPair } = require("near-workspaces");
const fs = require("fs");

function storeData(data, path) {
  try {
    fs.writeFileSync(path, JSON.stringify(data));
  } catch (err) {
    console.error(err);
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function createAccount(account_id, execution_data) {
  const keyPair = KeyPair.fromRandom("ed25519");
  const publicKey = keyPair.publicKey;
  await execution_data.keyStore.setKey(
    execution_data.config.networkId,
    account_id,
    keyPair
  );
  try {
    await execution_data.accountCreator.createAccount(account_id, publicKey);
    return await execution_data.near.account(account_id);
  } catch (err) {
    if (
      err.toString().includes("TooManyRequestsError:") ||
      err.toString().includes("Error: Server Error") ||
      err
        .toString()
        .includes(
          "The server encountered a temporary error and could not complete your request.<p>Please try again in"
        )
    ) {
      await sleep(1000 * 60 * 1);
      return await createAccount(account_id, execution_data);
    } else {
      throw err;
    }
  }
}

async function registerContracts(users, contracts) {
  let promises = [];
  for (let user of users) {
    for (let contract of contracts) {
      promises.push(
        user.functionCall({
          contractId: contract.accountId,
          methodName: "storage_deposit",
          args: {
            account_id: user.accountId,
            registration_only: false,
          },
          gas: new BN("300000000000000"),
          attachedDeposit: new BN("1500000000000000000000000"),
        })
      );
    }
  }
  await Promise.all(promises);
}

async function deployToken(
  newTokenName,
  total_supply,
  metadata,
  execution_data
) {
  const tokenContract = fs.readFileSync("../../out/token_contract.wasm");
  newTokenName = parseAccountName(newTokenName);
  const tokenName =
    execution_data.accountMap.prefix + newTokenName + ".testnet";
  const account = await createAccount(tokenName, execution_data);
  await account.deployContract(tokenContract);
  await account.functionCall({
    contractId: account.accountId,
    methodName: "new",
    args: {
      owner_id: execution_data.connAccountMap.ownerAccount.accountId,
      total_supply,
      metadata,
    },
  });
  execution_data.connAccountMap[newTokenName] = account;
  execution_data.accountMap[newTokenName] = account.accountId;
}

async function deployNft(newNftName, metadata, execution_data) {
  newNftName = parseAccountName(newNftName);
  const tokenContract = fs.readFileSync("../../out/nft_contract.wasm");
  const tokenName = execution_data.accountMap.prefix + newNftName + ".testnet";
  const account = await createAccount(tokenName, execution_data);
  await account.deployContract(tokenContract);
  await account.functionCall({
    contractId: account.accountId,
    methodName: "new",
    args: {
      owner_id: execution_data.connAccountMap.ownerAccount.accountId,
      metadata,
    },
  });
  execution_data.connAccountMap[newNftName] = account;
  execution_data.accountMap[newNftName] = account.accountId;
}

function generateRandom(min = 0, max = 100) {
  // find diff
  let difference = max - min;

  // generate random number
  let rand = Math.random();

  // multiply with difference
  rand = Math.floor(rand * difference);

  // add with min value
  rand = rand + min;

  return rand;
}

function parseAccountName(name) {
  name = name.toLowerCase();
  name = name.replace(/[^a-z0-9]/gi, "");
  name = name.substring(0, 15);
  return name;
}

function increaseTimeStamp(nowTimestamp, daysIncrease) {
  let newTime = parseInt(nowTimestamp) + daysIncrease * 60 * 60 * 24;
  return newTime.toString();
}

module.exports = {
  storeData,
  createAccount,
  registerContracts,
  deployToken,
  deployNft,
  generateRandom,
  parseAccountName,
  increaseTimeStamp,
};
