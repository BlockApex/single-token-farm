# xToken contract

This contract is responsible for implementing the xJUMP feature in JUMP DeFi.

This is a staking model that generates a derivative token (xToken) which appreciates in value (measured in terms of the underlying token) as the owner of the contract deposits rewards into it.

There are 3 basic functionalities associated to the contract:
1. Users can stake their tokens and receive xTokens in return;
2. Users can burn their xTokens to receive tokens back;
3. The owner can deposit rewards to be evenly distributed among all current xToken holders.


## Economic model

To illustrate the working of the contract, let us think of a sample token: TOKEN.

We then create a xTOKEN pool based on this TOKEN.

1. At startup the pool is empty, containing 0 staked TOKENs. At the same time, there are currently no xTOKENs minted, so their supply is 0.

2. Anyone can, at any time, stake TOKENs in the pool, whenever a user stakes TOKENs, they receive an amount of xTOKENs in return.

3. If someone stakes 10 TOKENs at this moment, the contract is going to evaluate the current value of an xTOKEN measured in TOKENs. 
Since this is the first ever stake deposit, the value of a xTOKEN is 1 TOKEN, therefore, the contract is going to mint 10 xTOKEN to the user.

4. Any xTOKEN holder can, at any time, also burn their xTOKENs to recover their staked TOKENs.

5. If the user from (3) now decides to burn 5 xTOKENs, the contract is going to evaluate the current value of an xTOKEN measured in TOKENs.
At this point there are 10 TOKENs staked and a total of 10 xToken minted, so the value of 1 xTOKEN is (10 TOKEN / 10 xTOKEN) = 1 TOKEN.
Therefore, by burning 5 xTOKENs, the user receives 5 TOKENs back.

6. The value of 1 xTOKEN will always be >= 1 TOKEN. The value will increase whenever the contract's owner deposits more TOKENs into the pool as rewards.

7. Suppose the owner deposits 5 TOKENs as rewards in the contract.
The contract currently has 5 TOKENs left from the user plus 5 TOKENs deposited by the owner totalling 10 TOKENs.
The contract also has 5 xTOKENs minted to the user.
Now, the value of a xTOKEN is equal to (10 TOKEN / 5 xTOKEN) = 2 TOKEN.

8. That means that, from now on, every burnt xTOKEN will grant the burner 2 TOKENs. At the same time, each TOKEN staked will mint 0.5 xTOKEN to the staker.


Summarizing, xTOKEN works as a liquid staking pool. 1 xTOKEN is a share in the pool and its worth in TOKENs increases as the owner deposits more rewards. Anyone can join the pool at any time by staking TOKEN and leave the pool by burning their xTOKENs.

## Token standards

xTokens behave as a normal NEP-141 token, meaning that they show up on NEAR wallets and can be transferred to other users (granted that they are registered in storage, as outlined in NEP-145).

They can also be used inside any regular DeFi application on NEAR that supports NEP-141 tokens, meaning that they could, for instance, composed a trading pool in an AMM Decentralized Exchange or be used as the governance token in a DAO.

# User interface

Besides the NEP-141 and NEP-145 interface implemented by the contract, it is important to know its initilization method and its 3 basic staking interactions:

1. initialization

    This method must be called after deploying the contract to enable it to operate.
    *Method name*: `new`
    *Method params*:

        x_token_name: String -> Official name of the xToken, ideally should be x{name of base token}

        x_token_symbol: String -> Official symbol/ticker for the token, ideally should be x{ticker of base token}

        x_token_icon: String -> Official icon of the xToken that shows up in wallets and other applications

        x_token_decimals: u8 -> Quantity of decimal houses supported by the xToken, ideally should be equal to base token

        base_token_address: String -> account id of the NEP-141 contract for the base token
    ```shell
    near call <xTokenAddress> "new" '{"x_token_name": "<x_token_name>", "x_token_symbol": "<x_token_symbol>", "x_token_decimals": <x_token_decimals>, "base_token_address": "<base_token_address>" }' --accountId <ownerAccountId> 
    ```

2. mint xTokens

    To mint xTokens, you must actually transfer the base token to the xToken contract using `ft_transfer_call` and passing specific parameters:
    *Method name*: `ft_transfer_call`
    *Method params*:
        receiver_id: String -> Address of xToken contract,
        amount: String -> Quantity of base tokens that you want to stake
        memo: Option<String> -> Optional message to log in the blockchain
        msg: String -> "mint"
    ```shell
    near call <baseTokenAddress> "new" '{"receiver_id": "<xTokenAddress>", "amount": "<amount_to_stake>", "memo": "<memo>", "msg": "mint" }' --accountId <ownerAccountId> --depositYocto 1
    ```

3. deposit rewards

    To deposit Token rewards, you must actually transfer the base token to the xToken contract using `ft_transfer_call` and passing specific parameters:
    *Method name*: `ft_transfer_call`
    *Method params*:
        receiver_id: String -> Address of xToken contract,
        amount: String -> Quantity of base tokens that you want to reward stakers with
        memo: Option<String> -> Optional message to log in the blockchain
        msg: String -> "deposit_profit"
    ```shell
    near call <baseTokenAddress> "new" '{"receiver_id": "<xTokenAddress>", "amount": "<amount_to_reward>", "memo": "<memo>", "msg": "deposit_profit" }' --accountId <ownerAccountId> --depositYocto 1
    ```