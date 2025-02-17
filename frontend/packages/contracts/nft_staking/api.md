# Contract Methods API

This document explains how to call each method in the contract for administrative use by JUMP's owners, guardians and collection owners. These are the methods responsible for creating and funding nft staking listings and setting general administrative parameters to the contract.

In case you're using the ledger, append --useLedgerKey to each command

# Contract routines

The main contract routine is to create new NFT Staking programs and fund them with tokens so that users can stake and receive rewards.

The steps in the process are the following:
1. Owner adds guardians (`add_guardian`)
2. Owner sets contract tokens (`add_contract_token`) which are the official reward tokens provided by JUMP DeFi
3. Owner deposits contract tokens to the contract's treasury (`deposit_contract_treasury`)
4. Guardian creates nft Staking program (`create_staking_program`)
5. Owner internally transfers tokens to staking program and then to distribution (`transfer`)
6. Collection owner deposits reward tokens to contract (`deposit_to_collection`)
7. Collection owner internally transfers reward tokens to distribution (`transfer`) 

## Owner methods
The owner is responsible for 5 functions in the contract: (1) adding guardians, (2) removing guardians, (3) adding contract-wide reward tokens, (4) removing contract-wide reward tokens and (5) withdrawing from the contract treasury

1. add_guardian

    This method adds a new account as a guardian in the contract.

    *Method name*: `add_guardian`

    *Method params*:

        guardian: AccountId -> Address of the new guardian

    ```shell
    near call <contractAddress> "add_guardian" '{"guardian": "<guardian>"}' --accountId <ownerAccountId> --depositYocto 1
    ```

2. remove_guardian

    This method adds a new account as a guardian in the contract.

    *Method name*: `remove_guardian`

    *Method params*:

        guardian: AccountId -> Address of guardian to be removed

    ```shell
    near call <contractAddress> "remove_guardian" '{"guardian": "<guardian>"}' --accountId <ownerAccountId> --depositYocto 1
    ```

3. add_contract_token

    The contract distributes 2 kinds of reards to users - program tokens, which are supplied by the collection owners and contract tokens, which are supplied by JUMP DeFi and partners. This is a method to add a new token as a reward supplied by JUMP DeFi.

    *Method name*: `add_contract_token`

    *Method params*:

        token_id: AccountId -> Address of contract for NEP-141 token
    ```shell
    near call <contractAddress> "add_contract_token" '{"token_id": "<token_id>"}' --accountId <ownerAccountId> --depositYocto 1
    ```

4. remove_contract_token

    The contract distributes 2 kinds of reards to users - program tokens, which are supplied by the collection owners and contract tokens, which are supplied by JUMP DeFi and partners. This is a method to remove a token from the list of rewars supplied by JUMP DeFi.

    ***Only call this method after removing the token balances from every single staking program that still holds it, otherwise funds will be locked.

    *Method name*: `remove_contract_token`

    *Method params*:

        token_id: AccountId -> Address of contract for NEP-141 token
    ```shell
    near call <contractAddress> "remove_contract_token" '{"token_id": "<token_id>"}' --accountId <ownerAccountId> --depositYocto 1
    ```

5. withdraw_contract_treasury

    Withdraws tokens deposited to the contract treasury (contract tokens).

    *Method name*: `withdraw_contract_treasury`

    *Method params*:

        token_id: AccountId -> Address of contract for NEP-141 token
        amount: U128 -> Quantity of tokens to withdraw (with decimals)

    ```shell
    near call <contractAddress> "withdraw_contract_treasury" '{"token_id": "<token_id>", "amount": "<amount>"}' --accountId <ownerAccountId> --depositYocto 1
    ```

6. deposit_contract_treasury

    This method deposits more contract tokens to the contract, to further be used as rewards. This methos is called on the token's contract, which is handled as a callback 

    *Method name*: `ft_transfer_call`

    *Method params*:

        receiver_id: AccountId -> Address of NFT Staking contract 
        amount: U128 -> Amount of tokens to transfer
        msg: String -> { "type": "Deposit", "data": { "type": "ContractTreasury" } }

    ```shell
    near call <tokenContractAddress> "ft_transfer_call" '{"receiver_id": "<nftStakingAddress>", "amount": "<amount>", "msg": "{ \"type\": \"Deposit\", \"data\": { \"type\": \"Deposit\", \"data\": { \"type\": \"ContractTreasury\" } } }" }' --accountId <ownerAccountId> --depositYocto 1
    ```

7. transfer

    This method is used by the owner to transfer tokens from the contract's treasury to a staking program's treasury and from the staking program's treasury to distribution (according to schema explained in docs folder).

    *Method name*: `transfer`

    *Method params*:

        operation: TransferOperation -> "ContractToCollection" to send funds from contract's treasury to collection's treasury OR "CollectionToDistribution" to send funds from collection's treasury to distribution OR "CollectionToContract" to retrieve funds back from collection's treasury to contract's treasury
        collection: NFTCollection -> {"type": "NFTContract", "account_id": "<NFTContractId>"}
        token_id: FungibleTokenID -> AccountId of NEP-141 token being transferred
        amount: Option<U128> -> quantity of tokens being transferred

    ```shell
    near call <nftStakingAddress> "transfer" '{"operation": "<operation>", "collection": {"type": "NFTContract", "account_id": "<NFTContractId>"}, "token_id": "<token_id>", "amount": "<amount>"}' --accountId <ownerAccountId> --depositYocto 1
    ```

8. alter_rewards

    This method is used by the owner or by the collection owner to alter the rewards per round given in a staking program. Only the owner can change the rewards given in contract tokens and only the collection owner can change the rewards given as program tokens.

    *Method name*: `alter_rewards`

    *Method params*:

        collection: NFTCollection -> {"type": "NFTContract", "account_id": "<NFTContractId>"}
        token_id: FungibleTokenID -> AccountId of NEP-141 in whose rewards you want to alter
        amount: Option<U128> -> new amount of rewards per round

    ```shell
    near call <nftStakingAddress> "alter_rewards" '{"collection": {"type": "NFTContract", "account_id": "<NFTContractId>"}, "token_id": "<token_id>", "amount": "<amount>"}' --accountId <ownerAccountId> --depositYocto 1
    ```


## Guardian methods
Guardians are responsible for creating staking programs and altering their configuration

1. create_staking_program

    This method creates a new staking program in the contract.

    *Method name*: `create_staking_program`

    *Method params*:

        payload: CreateStakingProgramPayload -> Configuration object: 
        struct CreateStakingProgramPayload {

            collection_address: AccountId -> Address of the NFT contract (NEP-171),

            collection_owner: AccountId -> Address of the account to be set as collection_owner,

            token_address: AccountId -> Address of the project's token to be used as reward,

            collection_rps: HashMap<FungibleTokenID, U128> -> Quantity of each reward token to be distributed every distribution round,

            min_staking_period: U64 -> Minimum quantity of milliseconds that NFT has to be kept staked to avoid penalty,

            early_withdraw_penalty: U128 -> Penalty in % of the reward if user unstakes NFT before min_staking_period elapses (base is 1_000_000_000_000_000_000_000, so to select 50%, use 500_000_000_000_000_000_000),

            round_interval: U64 -> amount of miliseconds between rounds (each round distributes 1 time collection_rps for each token),
            
            start_in: U64, -> amount of miliseconds until the farm starts distributing rewards
        }

    ```shell
    near call <contractAddress> "create_staking_program" '{ "payload": {"collection_address": "<collection_address>", "collection_owner": "<collection_owner>", "token_address": "<token_address>", "collection_rps": {"<projectTokenAddress>": "<projectTokenRewardsPerInterval>", "<contractTokenAddress1>": "<contractToken1RewardsPerInterval>"}, "min_staking_period": "<min_staking_period>", "early_withdraw_penalty": "<early_withdraw_penalty>", "round_interval": "<round_interval>", "start_in": "<start_in>"} }' --accountId <guardianAccountId> --depositYocto 1
    ```

2. alter_staking_period

    Alters the minimum staking period for the listing.

    *Method name*: `alter_staking_period`

    *Method params*:

        collection: NFTCollection -> Address of contract for NEP-171 NFT
        new_period: u64 -> New minimum staking period in milliseconds

    ```shell
    near call <contractAddress> "alter_staking_period" '{"collection": {"type": "NFTContract", "account_id": "<NFTContractId>"}, "new_period": "<new_period>"}' --accountId <guardianAccountId> --depositYocto 1
    ```


3. alter_staking_period

    Alters the minimum staking period for the listing.

    *Method name*: `alter_withdraw_penalty`

    *Method params*:

        collection: NFTCollection -> Address of contract for NEP-171 NFT
        new_penalty: U128 -> New % penalty for early withdrawals (base 1_000_000_000_000_000_000_000)

    ```shell
    near call <contractAddress> "alter_withdraw_penalty" '{"collection": {"type": "NFTContract", "account_id": "<NFTContractId>"}, "new_penalty": "<new_penalty>"}' --accountId <guardianAccountId> --depositYocto 1
    ```

## Collection owner methods
There are 3 actions that must be performed by collection owners: (1) depositing reward tokens to contract treasury, (2) transferring reward tokens from contract tresury to distribution and (3) changing rewards given.

1. deposit_to_collection

    Deposits tokens to the collection treasury. This method only accepts transfers of the collection token

    *Method name*: `ft_transfer_call`

    *Method params*:

        receiver_id: AccountId -> NFT Staking contract account
        amount: U128 -> Quantity of tokens to deposit
        memo: Option<String> -> Optional string to log
        msg: String -> {"type": "CollectionTreasury", "collection": {"type": "NFTContract", "account_id": "<NFTContractAccountId>"} }

    ```shell
    near call <rewardTokenAddress> "ft_transfer_call" '{"receiver_id": "<contractAccount>", "amount": "<quantityToDeposit>", "msg": "{  \"type\": \"Deposit\", \"data\": { \"type\": \"CollectionTreasury\", \"collection\": {\"type\": \"NFTContract\", \"account_id\": \"<NFTContractAccountId>\"} } }" }' --accountId <collectionOwnerAccountId> --depositYocto 1
    ```

2. transfer

    This method is used by the collection owner to transfer tokens from the collection's treasury to distribution (according to schema explained in docs folder).

    *Method name*: `transfer`

    *Method params*:

        operation: TransferOperation -> "CollectionToDistribution"
        collection: NFTCollection -> {"type": "NFTContract", "account_id": "<NFTContractId>"}
        token_id: FungibleTokenID -> AccountId of NEP-141 token being transferred
        amount: Option<U128> -> quantity of tokens being transferred

    ```shell
    near call <nftStakingAddress> "transfer" '{"operation": "<operation>", "collection": {"type": "NFTContract", "account_id": "<NFTContractId>"}, "token_id": "<token_id>", "amount": "<amount>"}' --accountId <collectionOwnerAccountId> --depositYocto 1
    ```

3. alter_rewards

    This method is used by the owner or by the collection owner to alter the rewards per round given in a staking program. Only the owner can change the rewards given in contract tokens and only the collection owner can change the rewards given as program tokens.

    *Method name*: `alter_rewards`

    *Method params*:

        collection: NFTCollection -> {"type": "NFTContract", "account_id": "<NFTContractId>"}
        token_id: FungibleTokenID -> AccountId of NEP-141 in whose rewards you want to alter
        amount: Option<U128> -> new amount of rewards per round

    ```shell
    near call <nftStakingAddress> "alter_rewards" '{"collection": {"type": "NFTContract", "account_id": "<NFTContractId>"}, "token_id": "<token_id>", "amount": "<amount>"}' --accountId <collectionOwnerAccountId> --depositYocto 1
    ```