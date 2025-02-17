# Locked token contract

This contract is meant as a way to airdrop/reward Jump DeFi users with the Jump token while tying them to a vesting schedule. This means that even though the user has received tokens, they can only trade/transfer them after a predetermined vesting period.

The contract implements this logic by wrapping the underlying JUMP token and issuing a LockedJUMP token. When a user receives a transfer of lockedJUMP, a vesting period is started in their behalf, as the vesting progresses, they can burn lockedJUMP and get normal JUMP in return.


## Wrapping logic

The idea behind the contract is that the JUMP DeFi team is able to create lockedJUMP tokens by wrapping regular tokens and them airdrop or reward users using the lockedJUMP tokens.

To achieve that functionality, the contract utilizes three different permission levels: (1) owner, (2) minters and (3) regular users.


The owner can add and remove other accounts as minters, can alter the contract's configuration and can send received fees from fast passes to the xJUMP contract (more on that in the further sections). 


Minters are meant as the highest permission level in the contract, only minters can deposit JUMP into the contract to create mint new lockedJUMP tokens. Also, after minting lockedJUMP, only minters can transfer lockedJUMP tokens, in case a regular user receives lockedJUMP and tries to transfer them using `ft_transfer` or `ft_transfer_call` the transactions will panic.


Regular users cannot mint lockedJUMP, they can only receive it when a minter transfers the tokens to them. At the moment a regular user receives any amount of lockedJUMP, a vesting schedule is immediatelly created to track the lockedJUMP and allow the user to burn them to recover regular JUMP as the vesting period progresses.


## Vesting schedules

After a regular user receives a transfer of lockedJUMP, a vesting schedule is immediately created to track the amount of locked tokens received with the following parameters:

```rust
pub struct Vesting {
  // account that owns vesting tokens
  pub beneficiary: AccountId,
  // quantity of tokens in vesting program
  pub locked_value: U128,
  // timestamp of when vesting started
  pub start_timestamp: U64,
  // time that must pass after start_timestamp for vesting to be completed
  pub vesting_duration: U64,
  // whether fastpass was already bought
  pub fast_pass: bool,
  // how many tokens where already withdrawn
  pub withdrawn_tokens: U128,
}
```
`locked_value` stores the total amount of lockedJUMP received in that trasnfer.

`start_timestamp` stores the timestamp when the user received the lockedJUMP transfer.

`vesting_duration` stores the amount of time that must be waited until the user can burn all lockedJUMP and receive the wrapped regular JUMP tokens.


The vesting happens at a continuous rate, at any time, the user can withdraw the tokens that have already vested.
Vested tokens are calculated by this formula:
```
vested_tokens = locked_value * ( (current_timestamp - start_timestamp) / vesting duration )
```

## Fast pass

The contract also incorporates the possiblity of having the user pay a fee in JUMP tokens to reduce the `vesting_duration` of the vesting schedule.
The price of such fast pass is defined as a percentage of the `locked_value` for the vesting schedule (JUMP DeFi will initially set it to 5%) and the reduction of the `vesting_duration` is defined as a denominator (initially set to 2, meaning that the duration will be reduced in half).

All fees paid for fast passes are redirected to the xJUMP contract as rewards.

# User interface

The owner will perform 4 main actions in the contract: (1) initialize the contract, (2) add or remove minters, (3) send funds to xJUMP contract and (4) change the contracts configuration.

Minters will (5) mint lockedJUMP and (6) transfer lockedJUMP to regular users.

Regular users will (7) burn lockedJUMP to withdraw JUMP and (8) buy fast passes.

The contract also implements the entire NEP-141 and NEP-145 interfaces and behaves as a normal fungible token in this regard (with the exception that only minters can call `ft_transfer` and `ft_transfer_call`).

1. initialization

    This method must be called after deploying the contract to enable it to operate.

    *Method name*: `new`

    *Method params*:

        locked_token_name: String -> Official name of the lockedToken, ideally should be locked{name of base token}

        locked_token_symbol: String -> Official symbol/ticker for the token, ideally should be L{ticker of base token}

        locked_token_icon: String -> Official icon of the lockedToken that shows up in wallets and other applications, should use data:link SVG format

        locked_token_decimals: u8 -> Quantity of decimal houses supported by the xToken, ideally should be equal to base token

        contract_config: ContractConfig -> Configuration object: 
        pub struct ContractConfig {
            // contract owner
            pub owner_id: AccountId,
            // address of underlying NEP-141 token
            pub base_token: AccountId,
            // period of vesting duration, in nanoseconds
            pub vesting_duration: U64,
            // cost of fast pass, in % of total amount, base 10_000
            pub fast_pass_cost: U128,
            // how much does the fastpass accelerate the schedule - divides vesting_duration by it
            pub fast_pass_acceleration: U64,
            // who receives tokens paid for fast pass (xJUMP address)
            pub fast_pass_beneficiary: AccountId,
            }

    ```shell
    near call <lockedTokenContractAddress> "new" '{"locked_token_name": "<locked_token_name>", "locked_token_symbol": "<locked_token_symbol>", "locked_token_icon": "<locked_token_icon>", "locked_token_decimals": "<locked_token_decimals>", "contract_config": "<contract_config>"} --accountId <ownerAccountId> 
    ```

2. Add or remove minters

    To add a minter:

    *Method name*: `add_minter`

    *Method params*:

        new_minter: AccountId -> Address of new minter

    ```shell
    near call <lockedTokenContractAddress> "add_minter" '{"new_minter": "<new_minter_address>"}' --accountId <ownerAccountId> --depositYocto 1
    ```


    To remove a minter:

    *Method name*: `remove_minter`

    *Method params*:

        remove_minter: AccountId -> Address of minter to be removed

    ```shell
    near call <lockedTokenContractAddress> "remove_minter" '{"remove_minter": "<remove_minter_address>"}' --accountId <ownerAccountId> --depositYocto 1
    ```

    To check the minters already registered, call:
    ```shell
    near view <lockedTokenContractAddress> "view_minters" '{"initial_id": "<index_start_pagination>", "size": "<index_end_pagination>"}'
    ```
    This is a paginated call as the total number of minters might grow indefinitely and end up consuming all gas for the view call, throwing an error. Start with index_start_pagination=0 and index_end_pagination=10 to see the first ten registered minters and go increasing both indexes by 10 at each call.

    To check the total amount of minters:
    ```shell
    near view <lockedTokenContractAddress> "view_minters_len"
    ```
    
3. Send funds to xJUMP contract

    To send all fast pass fees received by the contract to the xJUMP contract, it is only needed for the owner to call the mthod:

    *Method name*: `send_pending_tokens_to_xtoken`

    ```shell
    near call <lockedTokenContractAddress> "send_pending_tokens_to_xtoken" --accountId <ownerAccountId> --depositYocto 1
    ```

4. Change contract configurations

    Only the owner can call this method for security reasons, but the owner must still be very carefull as changes the settings of the contract during production might lead to unforseen bugs. Never change the `base_token` param unless you're sure what you're doing

    *Method name*: `alter_config`

    *Method params*:

        new_config: ContractConfig -> Configuration object: 
        pub struct ContractConfig {
            // contract owner
            pub owner_id: AccountId,
            // address of underlying NEP-141 token
            pub base_token: AccountId,
            // period of vesting duration, in nanoseconds
            pub vesting_duration: U64,
            // cost of fast pass, in % of total amount, base 10_000
            pub fast_pass_cost: U128,
            // how much does the fastpass accelerate the schedule - divides vesting_duration by it
            pub fast_pass_acceleration: U64,
            // who receives tokens paid for fast pass (xJUMP address)
            pub fast_pass_beneficiary: AccountId,
            }

    ```shell
    near call <lockedTokenContractAddress> "alter_config" '{"new_config": "<value new_config>"}' --accountId <ownerAccountId> --depositYocto 1
    ```

   To check the current config:
    ```shell
    near view <lockedTokenContractAddress> "view_contract_data"
    ```

5. Mint lockedJUMP

    To mint lockedJUMP one must actually transfer regular JUMP to the lockedJUMP contract with specific configurations. Anyone can actually call this method, but only minters can be set as the receivers of the lockedTokens:

    *Method name*: `ft_transfer_call`

    *Method params*:

        receiver_id: AccountId -> address of the lockedJUMP contract

        amount: U128 -> amount of JUMP to lock in the lockedJUMP contract

        memo: Option<String> -> optional param for message to be logged in the blockchain

        msg: { type: "Mint", account_id: AccountId } -> Reference to who should receive the minted lockedJUMP tokens (must be a registered minter in the contract)

    ```shell
    near call <regularTokenContractAddress> "ft_transfer_call" '{"receiver_id": "<lockedTokenContractAddress>", "amount": "<amount_to_lock>", "memo": "<memo or null>", "msg": {"type": "Mint", "account_id": "<minter_to_receivee_locked_tokens>"}}' --accountId <userAccountId> --depositYocto 1
    ```

6. transfer lockedJUMP to regular users

    To transfer tokens to a regular user and thus create a vesting schedule for them, the minter must call `ft_transfer`. Note that if a regular user (non minter) tries to call such method, the transaction will panic. Also notice that the recipient must be register in the contract's storage, if they are not, you must register them before transferring (according to NEP-145 interface).

    *Method name*: `ft_transfer`

    *Method params*:

        receiver_id: AccountId -> address of user that will receive tokens

        amount: U128 -> amount of lockedJUMP to transfer

        memo: Option<String> -> optional param for message to be logged in the blockchain

    ```shell
    near call <lockedTokenContractAddress> "ft_transfer" '{"receiver_id": "<receiver_id>", "amount": "<amount_to_transfer>", "memo": "<memo or null>"}' --accountId <ownerAccountId> --depositYocto 1
    ```

7. burn lockedJUMP to claim JUMP

    The same user can receive multiple different transfers of lockedJUMP. Each time the user receives a transfer, a new vesting schedule is created for the tokens received. They are each assigned a sequential index, starting from 0. To claim the tokens, all that the user has to do is specify from wich vesting they want to claim.

    *Method name*: `withdraw_locked_tokens`

    *Method params*:

        vesting_id: U64 -> index of the vesting schedule to withdraw from

    ```shell
    near call <lockedTokenContractAddress> "withdraw_locked_tokens" '{"vesting_id": "<vesting_id>"}' --accountId <userAccountId> --depositYocto 1
    ```

    To check all vestings for a given user, call:
    ```shell
    near view <lockedTokenContractAddress> "view_vesting_paginated" '{"account_id": "<user_to_view_vestings>", "initial_id": "<index_start_pagination>", "size": "<index_end_pagination>"}'
    ```
    This is a paginated call as the total number of minters might grow indefinitely and end up consuming all gas for the view call, throwing an error. Start with index_start_pagination=0 and index_end_pagination=10 to see the first ten registered minters and go increasing both indexes by 10 at each call.

    To check the total amount of vestings:
    ```shell
    near view <lockedTokenContractAddress> "view_vesting_vector_len" '{"account_id": "<user_to_view_vestings>"}'
    ```

8. But fast pass

    To buy a fast pass one must actually transfer regular JUMP to the lockedJUMP contract with specific configurations. The amount of tokens sent must be greater to or equal to the cost of the fast pass for the given vesting (if greater than, contract will reimburse difference):

    *Method name*: `ft_transfer_call`

    *Method params*:

        receiver_id: AccountId -> address of the lockedJUMP contract

        amount: U128 -> amount of JUMP to send to pay for fast pass (must be greater than or equal to cost)

        memo: Option<String> -> optional param for message to be logged in the blockchain

        msg: { "type": "BuyFastPass", "account_id": AccountId, "vesting_index": U64 } -> Reference to the account that owns the vesting schedule and the id of the vesting schedule

    ```shell
    near call <regularTokenContractAddress> "ft_transfer_call" '{"receiver_id": "<lockedTokenContractAddress>", "amount": "<amount_to_pay>", "memo": "<memo or null>", "msg": {"type": "BuyFastPass", "account_id": "<owner_of_vesting_schedule>", "vesting_index": "<vesting_index>"}}' --accountId <userAccountId> --depositYocto 1
    ```

    To check all your vesting schedules, refer to view calls in (7).