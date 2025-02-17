# Token Launcher
The token launcher is a ***factory contract***. This contract allows users to deploy a new contract (i.e. a token contract)  by just making a simple call. The contract can store different contracts in its 'memory', therefore you can deploy several different contracts using it, you just have to upload them first. 

The uploading is done by the owner of the contract.

## Deploying and initializing the contract
To deploy the contract refer to [NEAR SDK](https://docs.near.org/develop/deploy) guide on how to install *near cli, rust, etc.*. 

### Required tools
You need:

1.  GIT:  [https://git-scm.com/](https://git-scm.com/)
2.  NEAR CLI:  [https://github.com/near/near-cli#Installation](https://github.com/near/near-cli#Installation)
3.  Go:  [https://go.dev/doc/install](https://go.dev/doc/install)
4.  Install the nearkey tool:  
```
  go install github.com/aurora-is-near/near-api-go/nearkey
```
  
5.  Install the nearcall tool (only if you are deploying the whitelist and factory contracts):  
```
go install github.com/aurora-is-near/near-api-go
```  
 This tool allows you to call contract methods with arguments that are too long for the near cli.

6.  Rust (only if you are deploying the factory contract or a new file to it's 'memory'):  
```
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```  
```
rustup target add wasm32-unknown-unknown
```

To deploy the contact you do the following using near cli:
```
near deploy --wasmFile out/token_launcher.wasm --accountId factory_contract_name.testnet
```
Considering that your contract is already deployed, you have to initialize it - the initialization function takes only one parameter:
```
pub  fn  new(owner: AccountId)
```

To initialize the contract, you perform the following call:
```
near call factory_name.testnet new '{"owner": "owner_account.testnet"}’
```
Replace `owner_account.testnet` with the owner account that you are using.

## Saving a new contract on the factory

### Loading token contract into the contract factory.

The contract factory needs actual contracts that it can deploy:

1.  In your repository navigate to the contracts folder:  
    `cd ../contracts`
2.  Build the contract:  
    `yarn build:contract`
3.  The compiled contract is located in ../out/token_contract.wasm.  
    `cd ../out/`
4.  Deploying the contract into the factory requires the nearcall tool installed before - this is not the near cli:  
```
~/go/bin/nearcall -account owner_account.testnet -contract factory_name.testnet -method store -args out/token_contract.wasm
```
   This will return an "Argument hash" that is required for later, and success/failure information of the deployment call.  
    Make the argument hash globally available:  
    `$ export CONTRACTHASH=HxT6MrNC7...`
5.  Register the contract hash, so you can call it using its name, and not a hash:  
    ```near call factory_name.testnet register_contract '{"contract_name":"token","contract_hash":"'${CONTRACTHASH}'","init_fn_name":"new","contract_cost": 10, "init_fn_params":"args"}'
    ```
The  `"contract_name"` parameter takes the name of that contract, you can call it however you want - i.e.  for the token contract, it will be called `"token"`
The `"contract_cost"` parameter takes the cost in yocto NEAR that will be charged to deploy that contract - remember that 1 NEAR token is equivalent to 10^24 yocto. Also, the cost of deployment does not include the storage cost that the user will have to pay to deploy the new contract. The contract_cost can be 0, but the storage will never be, due to the NEAR blockchain cost of storage.
 The `"init_fn_name"` takes the name of the initialization function on the contract that you are deploying - usually, it's called `"new"`. 
 The `"init_fn_params"` takes a string, with the format of the initialize function parameters, but, you can also pass just `"args"` since those parameters are there just for reference.

You can verify the previous call by:
``` 
near call factory_name.testnet view_binary'{"contract_name":"token"}' 
```
The result of this call should be a lot of weird data: That's the loaded contract code.

The prerequisites for actually deploying a token contract are now in place.
 
## Deploying a contract using the factory 

To deploy a contract, we recommend first that you verify the cost of deploying that contact. The cost of deployment is composed by the storage cost of the blockchain + the fee that was atributed before with the `"contract_cost"` parameter.

To do that, you can perform the following call (for the contract named 'token'):
``` 
near call factory_name.testnet view_necessary_deposit_for_deployment'{"contract_name":"token"}' 
```
That will give you the cost for the deployment of said contract.

Now, to deploy a token contract using the factory, you can perform the following call:

```
near call factory_name.testnet deploy_new_contract '{ "contract_to_be_deployed": "token", "deploy_prefix":"my_token", "args":"{owner_id: token_contract_owner.near, total_supply: 100000000000000, metadata: { spec: ft-1.0.0, name: myToken, symbol: MTC, decimals: 24} }" }' --accountId any_account.testnet --deposit 30
```

For the `"contract_to_be_deployed"` parameter, you should pass the name of the contract that was defined before at the `"contract_name"` parameter.

The `"deploy_prefix"`  is the prefix of the name of the account that the contract will be deployed. In the example above, the final contract address will be `my_token.factory_name.testnet` remember that this name cannot contain more than 64 characters, including the `.testnet`.

For the args, you should pass a JSON with the arguments of the initialization function. For the token contract, you can refer to NEAR's NEP-141 standard to understand more of those parameters. 

The `--deposit 30` parameter should be, at least, the amount of NEAR that was returned when you called `view_necessary_deposit_for_deployment`. 

That's it - you have finalized your deployment.
 