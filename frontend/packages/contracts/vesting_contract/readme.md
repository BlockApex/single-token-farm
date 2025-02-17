# Vesting contract

This contract is responsible for holding Jump tokens that belong to early investors in Jump DeFi throughout their vesting periods.


The contract revolves arround 2 main concepts: (1) schemas and (2) investments.

1. A schema is a vesting setup - meant to represent one round of investment raising, that contains certain vesting rules. A schema contains multiple different investments inside it.

2. An investment is a specific amount of tokens that belongs to a certain wallet (investor). The investor can withdraw the tokens from this investment according to the vesting schedule defined in the schema.


## Schema specifications

All vestings work in 3 different phases:
1. Initial phase
2. Cliff phase
3. Final phase

The total amount of vested tokens is divided into 3 parts:
1. Initial release
2. Cliff release
3. Final release


The vesting workflow looks like this
1. Before initial phase

    Before the official start of the initial phase, the investor can withdraw no tokens

2. Initial phase

    After the start of the initial phase, the investor is entitled to withdraw the initial release

3. Cliff phase

    Once the cliff phase starts, the investor gradually gains access to the cliff release. 

    The percentage of time of the cliff phase that has already passed is used in a formula to calculate how many percent of the cliff release the investor can withdraw. At the end of the cliff period, the investor can withdraw the entire cliff release.

    Currently the contract only supports a linear cliff formula, meaning that if 20% of the cliff period has passed, the investor can withdraw 20% of the cliff release. In the future other formulas might be supported such as logarithmic or exponential.

4. Final phase

    After the end of the cliff phase, the investor gains access to the entire cliff release and the final release. At this point the vesting has ended and the investor can withdraw all tokens.


# User interface

The owner will perform 3 main actions in the contract: (1) initialize the contract, (2) create schemas, (3) add investments to schemas.

Investors will tipically only withdraw tokens from their investments as they become available

1. initialization

    This method must be called after deploying the contract to enable it to operate.

    *Method name*: `new`

    *Method params*:

        owner: AccountId -> Address of the account that will control the contract as its owner 

        token_contract: AccountId -> Address of the contract of the NEP-141 project token

    ```shell
    near call <vestingContractAddress> "new" '{"owner": "<ownerAccountId>", "token_contract": "<token_contract_address>", --accountId <ownerAccountId> 
    ```

2. create schema

    To create a schema, you must actually transfer the tokens that will be distributed through the schema to the contract using `ft_transfer_call` and pass specific parameters:

    *Method name*: `ft_transfer_call`

    *Method params*:

        receiver_id: String -> Address of vesting contract,

        amount: String -> Quantity of tokens that will be distributed through the schema

        memo: Option<String> -> Optional message to log in the blockchain

        msg: String -> "{
            category: String -> name of the schema
            initial_release: U128 - > How many percent of the investment are released immediatelly (base 10_000)
            cliff_release: U128 - > How many percent of the investment are released during the cliff period (base 10_000)
            final_release: U128 - > How many percent of the investment are released after the end of the cliff period (base 10_000)
            initial_timestamp: U64 - > Timestamp when the schema vesting period starts (releases initial_release)
            cliff_delta: U64 - > Time delta after initial_timestamp that composes cliff (after initial_timestamp + cliff_delta, cliff_release starts to be released )
            final_delta: U64 - > Time delta after (initial_timestamp + cliff_delta) after which all tokens are going to be released (vesting ends)
            curve_type: String -> Formula for the continuous release of tokens during the cliff period (currently only supports "Linear", which is a linear equation)
            discrete_period: U64 - > Minimum timedelta considered to calculate changes in released tokens, recommended to use low number, such as 10

        }"
    ```shell
    near call <baseTokenAddress> "new" '{"receiver_id": "<vestingContractAddress>", "amount": "<amount_to_distribute_in_schema>", "memo": "<memo>", "msg": "{msg_object}" }' --accountId <ownerAccountId> --depositYocto 1
    ```

    If you wish to see details for a specific schema created:
    ```shell
    near view <vestingContractAddress> "view_schema" '{"schema_category": "<schema_name>"}'
    ```

    If you wish to see all created schemas:
    ```shell
    near view <vestingContractAddress> "view_all_schemas"
    ```

3. create investment

    The owner can create an investment inside a schema by calling `create_investment`. The only restriction is that you cannot create a total investment value that surpasses the token amount deposited to create the schema.

    *Method name*: `create_investment`

    *Method params*:
        category: String -> name of the schema
        account: AccountId -> investor account
        total_value: U128 -> total quantity of tokens to be granted to investor
        date_in: Option<U64> -> if provided overrides standard schema initial_timestamp,
    ```shell
    near call <vestingContractAddress> "create_investment" '{"category": "<schema_name>", "account": "<investor_account>", "total_value": "<total_value>", "date_in": "<initial_timestamp or null>" }' --accountId <ownerAccountId> --depositYocto 1
    ```

4. withdraw tokens

    The investor can withdraw released tokens at any moment by calling `withdraw_your_investments`.

    *Method name*: `withdraw_your_investments`

    *Method params*:
        value_to_withdraw: U128 -> quantity of tokens to withdraw,
        category: String -> schema name,
    ```shell
    near call <vestingContractAddress> "withdraw_your_investments" '{"value_to_withdraw": "<value wished>", "category": "<scehma_name>",}' --accountId <investorAccountId> --depositYocto 1
    ```

    If the investor wishes to know how many tokens are already realeased, they can do so by calling:
    ```shell
    near view <vestingContractAddress> "view_investment" '{"investment_id": "<schema_name>@<investor_account>"}'
    ```