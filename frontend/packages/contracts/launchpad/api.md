# Contract Methods API

This document explains how to call each method in the contract for administrative use by JUMP's owners, guardians and project owners. These are the methods responsible for creating and funding listings and setting general administrative parameters to the contract.

In case you're using the ledger, append --useLedgerKey to each command

# Contract routines

The contract contains 2 different routines: (1) creating new listings, (2) withdrawing fees

*Creating new listings*
1. Owner assigns account as guardian (`assign_guardian`)
2. Project owner registers in the contract and authorizes the creation of a listing for them (`toggle_authorize_listing_creation`)
3. Guardian creates listing with all relevant information (`create_new_listing`)
4. Project owner funds the listing by depositing the required project tokens (`fund_listing`)
5. If it is a Private sale, project owner can add or remove people from whitelist (`alter_investor_private_sale_whitelist`)
6. After sale is over, project owner ca withdraw raised funds and any leftover project tokens (`withdraw_tokens_project`)

*withdrawing fees*
1. Owner checks all available token ids to withdraw and performs an individual withdraw for each of them (`retrieve_treasury_funds`)


## Owner methods
The owner can perform 4 different actions that are private to their account:

1. assign_guardian

    This method adds a new account as a guardian in the contract.

    *Method name*: `assign_guardian`

    *Method params*:

        new_guardian: AccountId -> Address of the new guardian

    ```shell
    near call <contractAddress> "assign_guardian" '{"new_guardian": "<new_guardian>"}' --accountId <ownerAccountId> --depositYocto 1
    ```

2. remove_guardian

    This method adds a new account as a guardian in the contract.

    *Method name*: `remove_guardian`

    *Method params*:

        remove_guardian: AccountId -> Address of guardian to be removed

    ```shell
    near call <contractAddress> "remove_guardian" '{"remove_guardian": "<remove_guardian>"}' --accountId <ownerAccountId> --depositYocto 1
    ```

3. retrieve_treasury_funds

    This method is used to retrieve all fees collect by the contract. To call this method you must provide token_index param. That is because the contract can receive fees in many different token types and each of them is stored under a specific index since NEAR does not allow enough gas to withdraw all of them at once.

    *Method name*: `retrieve_treasury_funds`

    *Method params*:

        token_index: U64 -> Index of token in internal treasury structure

    ```shell
    near call <contractAddress> "retrieve_treasury_funds" '{"token_index": "<token_index>"}' --accountId <ownerAccountId> --depositYocto 1
    ```

    To figure out which token_indexes are valid, call:
    ```shell
    near view <contractAddress> "view_contract_treasury_length"
    ```
    The return value is going to be the maximum index value that has tokens in it. Call retrieve_treasury_funds multiple times, all the way until token_index is equal to the retunr value of the view call.

4. update_settings

    This method allows the owner to change the contract's configurations

    *Method name*: `update_settings`

    *Method params*:

        new_settings: ContractSettings -> Configuration JSON containing:
        pub struct ContractSettings {
            membership_token: AccountId -> token that must be staked to climb lauchpad tiers - this cannot be changed
            token_lock_period: U64 -> duration of timelock for staked tokens after investing (in nanoseconds),
            tiers_minimum_tokens: Vec<U128> -> array of necessary tokens staked for each tier (must be same length as tiers_entitled_allocations)
            tiers_entitled_allocations: Vec<U64> -> quantity of allocations to which each tier is entitled in sale phase 1 (must be same length as tiers_minimum_tokens)
            allowance_phase_2: U64 -> number of allocations to which every user is entitled in phase 2 - if you want that to be infinite, simply input a very high number
            partner_dex: AccountId -> Account of JUMP DEX,
        }

    ```shell
    near call <contractAddress> "update_settings" '{"new_settings": {"membership_token": "<membership_token>", "token_lock_period": "<token_lock_period>", "tiers_minimum_tokens": ["<tier_1_tokens>", "<tier_2_tokens>", ...], "tiers_entitled_allocations": ["<tier_1_allocations>", "<tier_2_allocations>", ...], "allowance_phase_2": "<allowance_phase_2>", "partner_dex": "<partner_dex>"} }' --accountId <ownerAccountId> --depositYocto 1
    ```

## Guardian methods
Guardians are responsible for 2 actions within the contract: creating and cancelling listings

1. create_new_listing

    This method creates a new listing (sale) to be offered in the launchpad with all its settings. A listing must always be created with an associated project_owner, that must have authorized the creation of the listing though the `toggle_authorize_listing_creation` method.

    *Method name*: `create_new_listing`

    *Method params*:

        listing_data: ListingData -> Configuration object: 
        struct ListingData {
            project_owner: AccountId -> Account of the projects owner, a person from the project itself that is going to receive all raised funds after the sale,

            project_token: AccountId -> Contract address for the project's token that is going to be sold,

            price_token: AccountId -> Contract address for the token that is going to be used to raise - normally a stablecoin such as usdc,

            listing_type: ListingType -> "Public" for a public sale or "Private" for a private sale (only wallets whitelisted by the project_owner can join),

            open_sale_1_timestamp_seconds: U64 -> Timestamp for the start of the sale (phase 1). Must be input using unix universal timestamp, can be converted here: https://www.epochconverter.com/,

            open_sale_2_timestamp_seconds: U64> Timestamp for the start of the sale (phase 2 - first come first serve phase). Must be input using unix universal timestamp, can be converted here: https://www.epochconverter.com/,

            final_sale_2_timestamp_seconds: U64 -> Timestamp to end the sale if not sold out. Must be input using unix universal timestamp, can be converted here: https://www.epochconverter.com/ (if sale sells out, it ends at the moment the last tokens are sold),

            liquidity_pool_timestamp_seconds: U64 -> Timestamp to create liquidity pool in JUMP dex using funds from raise. Must be input using unix universal timestamp, can be converted here: https://www.epochconverter.com/. (Not working until jump dex goes live),

            total_amount_sale_project_tokens: U128 -> Total quantity of project tokens that is going to be sold in the listing (must be inputed with decimal places),

            token_allocation_size: U128 -> Size of each batch of project tokens being sold (must be inputed with decimal places),

            token_allocation_price: U128 -> Cost of each batch of tokens being sold (must be inputed with decimal places),

            liquidity_pool_project_tokens: U128 -> Quantity of project tokens to be commited to the creation of the liquidity pool after the sale. (Not working until jump dex goes live, input 0),

            liquidity_pool_price_tokens: U128 -> Quantity of price tokens to be commited to the creation of the liquidity pool after the sale. (Not working until jump dex goes live, input 0),

            fraction_instant_release: U128 -> % of purchased tokens that the investor is going to be able to withdraw after the sale ends (base is 10000, so to select 20% user has to input 2000),

            fraction_cliff_release: U128 -> % of purchased tokens that the investor is going to be able to withdraw *"DURING"* the cliff period (base is 10000, so to select 20% user has to input 2000),

            cliff_timestamp_seconds: U64 -> Quantity of seconds after the sale ends, during which the investor gains no access to new vested tokens. 

            end_cliff_timestamp_seconds: U64 -> Quantity of seconds after the sale ends when investor gains access to all vested tokens - must be greater than or equal to cliff_timestamp_seconds,

            fee_price_tokens: U128 -> % of raised funds taken as a fee for the launchpad (base is 10000, so to select 20% user has to input 2000),
            
            fee_liquidity_tokens: U128 ->  % of pledged liquidity pool tokens taken as a fee for the launchpad - applies both to price and project tokens commited to the liquidity pool (base is 10000, so to select 20% user has to input 2000),
        }

    ```shell
    near call <contractAddress> "create_new_listing" '{"listing_data": { "project_owner": "<project_owner>", "project_token": "<project_token>", "price_token": "<price_token>", "listing_type": "<listing_type>", "open_sale_1_timestamp_seconds": "<open_sale_1_timestamp_seconds>", "open_sale_2_timestamp_seconds": "<open_sale_2_timestamp_seconds>", "final_sale_2_timestamp_seconds": "<final_sale_2_timestamp_seconds>", "liquidity_pool_timestamp_seconds": "<liquidity_pool_timestamp_seconds>", "total_amount_sale_project_tokens": "<total_amount_sale_project_tokens>", "token_allocation_size": "<token_allocation_size>", "token_allocation_price": "<token_allocation_price>", "liquidity_pool_project_tokens": "<liquidity_pool_project_tokens>", "liquidity_pool_price_tokens": "<liquidity_pool_price_tokens>", "fraction_instant_release": "<fraction_instant_release>", "fraction_cliff_release": "<fraction_cliff_release>", "cliff_timestamp_seconds": "<cliff_timestamp_seconds>", "end_cliff_timestamp_seconds": "<end_cliff_timestamp_seconds>", "fee_price_tokens": "<fee_price_tokens>", "fee_liquidity_tokens": "<fee_liquidity_tokens>" } }' --accountId <guardianAccountId> --depositYocto 1 
    ```



2. cancel_listing

    This method cancels a previously created listing before the sale start.

    *Method name*: `cancel_listing`

    *Method params*:

        listing_id: U64 -> Internal listing ID

    ```shell
    near call <contractAddress> "cancel_listing" '{"listing_id": "<listing_id>"}' --accountId <guardianAccountId> --depositYocto 1
    ```

## Project owner methods
The project owner is responsible for (1) authorizing the creation of a listing, (2) funding the listing with the project tokens, (3) adding users to the whitelist if it is a private sale and (4) withdrawing the raised tokens after the sale ends.

1. toggle_authorize_listing_creation

    This method allows/disallows (toggle functionality, defaul is disallow) a guardian to create a listing using this account as its project_owner. This authorization must be given because the storage costs of the listing are paid by the project owner.

    *Method name*: `toggle_authorize_listing_creation`

    ```shell
    near call <contractAddress> "toggle_authorize_listing_creation" --accountId <projectOwnerAccountId> --depositYocto 1
    ```

2. alter_investor_private_sale_whitelist

    Private sales only. This method alters the current authorized allocations (tickets) that a user has in the listing.

    *Method name*: `alter_investor_private_sale_whitelist`

    *Method params*:

        listing_id: AccountId -> Internal listing id
        account_id: AccountId -> Address of user to alter
        allocations: U64 -> new quantity of allocations to allow user to buy, can be greater or smaller than previous amount

    ```shell
    near call <contractAddress> "alter_investor_private_sale_whitelist" '{"listing_id": "<listing_id>", "account_id": "<account_id>", "allocations": "<allocations>"}' --accountId <projectOwnerAccountId> --depositYocto 1
    ```

3. withdraw_tokens_project

    This method withdraws all raised price tokens and all leftover project tokens (if any) after the sale ends. All funds are sent to the project_owner's wallet, they must be registered in the tokens' contracts to be able to receive the funds.

    *Method name*: `withdraw_tokens_project`

    *Method params*:

        listing_id: U64 -> listing internal index

    ```shell
    near call <contractAddress> "withdraw_tokens_project" '{"listing_id": "<listing_id>"}' --accountId <projectOwnerAccountId> --depositYocto 1
    ```

4. fund_listing

    This method has to be called through `ft_transfer_call` on the project token's contract. It deposits the funds that are going to be sold in the open sale and committed to the launch of the liquidity pool in the JUMP DEX.

    *Method name*: `ft_transfer_call`

    *Method params*:

        receiver_id: AccountId -> Address of Launchpad contract 
        amount: U128 -> Amount of tokens to transfer
        msg: String -> { "type": "FundListing", "listing_id": "<listing_id>" }

    ```shell
    near call <tokenContractAddress> "ft_transfer_call" '{"receiver_id": "<launchpadAddress>", "amount": "<amount>", "msg": "{ \"type\": \"FundListing\", \"listing_id\": \"<listing_id>\" }" }' --accountId <ownerAccountId> --depositYocto 1
    ```
