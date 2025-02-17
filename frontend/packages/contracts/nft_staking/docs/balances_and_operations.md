# Balances and Operations

In a financial application it's very important to be careful with assets. Even more so in a decentralized setting, where little manual intervention is possible. We have devised a scheme of internal balances that enables the NFT Staking Contract to operate autonomously without losing track of which funds belong to each protocol participant (which is unacceptable). In the interest of elucidating both future maintainers and stakeholders about the project's previous technical decisions, we will describe the motivation behind each balance, as well as which operations are allowed, by each operator, betweem them.

![Intricate diagram detailing the contracts treasuries and funds. Boxes denote balances and arrows the transactions between them](./balances_and_operations_diagram.svg)

## Balances
### Distribution Funds

The core functionality of the contract revolves around the *Distribution Funds*. There's one for each staking program, and it's the pool of tokens that will be distributed as rewards to stakers.

### Contract Treasury

Holds the bulk of contract tokens, which can then be routed to individual staking programs. Only the owner can withdraw from it, but anyone can deposit (partners, for example).

### Collection Treasury

Holds both program and contract tokens to be distributed. 

### Staked NFT Balance

Where most of the distributed tokens will initially go to.

### Staker Balance

Receives funds from *Staked NFT Balances* associated with the staker's NFTs. It exists for technical reasons better described in the [inner and outer withdrawals section](#inner_withdraw-and-outer_withdraw). There's one for each pair of staker and staking program. Could be refactored later so there's only one per staker.

### Beneficiary Funds
It solely exists to hold leftover funds when a staking program gets fully distributed.

## Operations
### `distribute`

Distributes rewards from the program's *Distribution Funds* pool to each *Staked NFT Balance*.

If during distribution the remaining funds are lower than the round's reward, the funds will go to the program's *Beneficiary Funds*.

It's lazily executed whenever an update to a staked NFT happens (staking, unstaking or claiming rewards). Technically the NFTs' balances are only effectively updated when the rewards are claimed, and `distribute` only updates the RPS, but that's only an implementation detail, as the difference between the farm's RPS and a NFT RPS is sufficient to determine how many tokens its balance should have.

### `inner_withdraw` and `outer_withdraw`

The existence of these transactions is purely for a technical reason. When combined they allow a staker to withdraw their rewards. While `inner_withdraw` transfers a *Staked NFT Balance* to the respective *Staker Balance*, `outer_withdraw` allows the staker to withdraw a specific fungible token from their *Staker Balance* to their *Staker Wallet*.

As the Near API allows for batch calls, this won't be noticed by the user in the frontend. However CLI users need to be aware of these details.

There are two motivations behind this separation:
1. It allows for the `unstake` procedure to only issue a single cross-contract call, which is the `nft_transfer`, while `ft_transfer` will only happen when the staker withdraws their balance. This reduces error handling complexity substantially.
2. It enables the contract to scale appropriately when batching multiple `unstake` calls together. If to unstake each NFT the contract transfered its balance directly to the *Staker Wallet*, it would result in `O(m * n)` cross-contract calls, where `m` is the number of NFTs and `n` the number of FTs. This implementation achieves the same effect in `O(m + n)` cross-contract calls instead.

### `transfer_funds`

Handles transfers between internal balances. Does not deal with withdrawals.

Routes the transfer to the corresponding function based on a `TransferOperation` value, of the following (self-describing) variants:
- `ContractToCollection`
- `CollectionToContract`
- `CollectionToDistribution`
- `BeneficiaryToCollection`

### `ft_transfer`

In order to deposit fungible tokens to be distribtued by the contract, it's necessary to issue a `ft_transfer` call to the respective fungible token's contract. The FT Contract will then call `ft_on_transfer` on the NFT Staking Contract, which will deal with the transfer based on its parameters.

Notably the `msg` parameter specifies the kind of deposit. The contract will then route the call to the corresponding function. Currently there's only a `Deposit` route, which receives a `DepositOperation` value, of the following (self-describing) variants:
- `ContractTreasury`
- `CollectionTreasury`

### `withdraw`

Denotes an operation that withdraws funds from a treasury to a wallet.

## Contract API Calls

The diagram show only abstract operations, which are incorporated inside functions the users may call. The following list shows which functions on the contract's public interface perform which operations:

- `claim_reward`: calls `inner_withdraw` without unstaking the NFT
- `unstake`: calls `inner_withdraw`, unstakes the NFT and transfers it back to the staker
- `withdraw_rewards`: calls `outer_withdraw` to transfer the funds in *Staker Balance* to the *Staker Wallet*
- `ft_on_transfer`: routes the deposit to the corresponding function (see [the `ft_transfer` section](#ft_transfer))
- `withdraw_collection_treasury`: withdraws funds from *Collection Treasury* to *Collection Owner Wallet*
- `withdraw_contract_treasury`: withdraws funds from *Contract Treasury* to *Owner Wallet*
- `transfer`: calls `transfer_funds`

## Operators, Contract and Program Tokens
The authorization logic behind internal balances transfers is based on the concept of contract and program tokens.

Contract tokens are common to every staking program, and are in custody of the owner. Program tokens are specific to each staking program, and are in custody of the collection owner.

In the context of a balance operation that could be performed by either the owner or  collection owner (on their respective tokens), these actors are called _operators_. Most of the operation logic is the same when performed by either kind of operator, except which tokens they are authorized to operate on.

### Updating Contract Tokens

When initializing the contract, it's required to provide a list of contract tokens. The contract does allows for the contract tokens to be updated by the owner. That being said, thsere are a lot of caveats when performing such updates, so this decision must be well thought-out.

When a Guardian creates a Staking Program, it's asserted that the chosen program token is not a current contract token. However, if a new contract token is to be added to the treasury, a complex situation arises. It is possible for a new contract token to be the program token for some previously created program. In this context, the authorization rules make the token's role as a program token to superseed its role as a contract one. Thus, for this Staking Program and this specific token, only the collection owner will be authorized to operate on it. The authorization logic for a balance operation is the following:

1. Is the token the program token? If so, only the collection owner is authorized
2. Is the token a contract token? If so, only the owner is authorized
3. Otherwise, no one is authorized

When removing a contract token, another such complicated situation may occur. We do assert that the contract treasury balance for the token to be removed is empty. But for technical reasons, it's not viable to assert that this is also the case for all the collection treasuries. It's recommended to withdraw the contract from all possible balances (e.g. collection treasuries, beneficiary funds) before removing a contract token. Still, the distribution funds cannot be withdrawn, so it is possible that even after that, some tokens remain in the contract. There shouldn't be many, considering they will all be distributed to stakers (which are oblivious to token authorization rules) or end up in the beneficiary funds (which tends to be very small).

If for some reason the owner wants to withdraw a previous contract token's remaining balance, it is possible, they just need to add it again. Note that even though it is possible that some staking program has it as its program token (and thus the owner has no authorization over it on the respective collection treasury), its balance does not belong to the owner anyways, as the program was created after its deletion from the contract tokens set (so the funds didn't come from the contract treasury). And regarding programs created before the removal, as they do not have this token as their program token, the owner will regain their ability to operate on it.
