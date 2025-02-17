const nearAPI = require("near-api-js");
const { BN } = require("near-workspaces");
const fs = require("fs");

const {
  registerContracts,
  deployToken,
  parseAccountName,
  increaseTimeStamp,
} = require("./utils");

async function tokenLauncherSetup(execution_data) {
  console.log("Start tokenLauncher setup");

  let { connAccountMap } = execution_data;

  // store normal token contract
  const deployTokenResponse = await connAccountMap.ownerAccount.functionCall({
    contractId: connAccountMap.tokenLauncher.accountId,
    methodName: "store",
    args: fs.readFileSync("../../out/token_contract.wasm"),
    attachedDeposit: new BN(nearAPI.utils.format.parseNearAmount("30")),
    gas: new BN("300000000000000"),
  });

  await connAccountMap.ownerAccount.functionCall({
    contractId: connAccountMap.tokenLauncher.accountId,
    methodName: "register_contract",
    args: {
      contract_name: "token",
      contract_hash:
        nearAPI.providers.getTransactionLastResult(deployTokenResponse),
      contract_cost: nearAPI.utils.format.parseNearAmount("10"),
      init_cost: nearAPI.utils.format.parseNearAmount("2"),
      init_fn_name: "new",
      init_fn_params: JSON.stringify({
        owner_id: "AccountId",
        total_supply: "U128",
        metadata: "FungibleTokenMetadata",
      }),
    },
    attachedDeposit: new BN(nearAPI.utils.format.parseNearAmount("0.25")),
    gas: new BN("300000000000000"),
  });

  // store mintable token contract
  const deployMintableResponse = await connAccountMap.ownerAccount.functionCall(
    {
      contractId: connAccountMap.tokenLauncher.accountId,
      methodName: "store",
      args: fs.readFileSync("../../out/mintable_token_contract.wasm"),
      attachedDeposit: new BN(nearAPI.utils.format.parseNearAmount("30")),
      gas: new BN("300000000000000"),
    }
  );

  await connAccountMap.ownerAccount.functionCall({
    contractId: connAccountMap.tokenLauncher.accountId,
    methodName: "register_contract",
    args: {
      contract_name: "mintable_token",
      contract_hash: nearAPI.providers.getTransactionLastResult(
        deployMintableResponse
      ),
      contract_cost: nearAPI.utils.format.parseNearAmount("10"),
      init_cost: nearAPI.utils.format.parseNearAmount("2"),
      init_fn_name: "new",
      init_fn_params: JSON.stringify({
        owner_id: "AccountId",
        init_supply: "U128",
        metadata: "FungibleTokenMetadata",
      }),
    },
    attachedDeposit: new BN(nearAPI.utils.format.parseNearAmount("0.25")),
    gas: new BN("300000000000000"),
  });
}

module.exports = { tokenLauncherSetup };
