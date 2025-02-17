# Launchpad Contract

Contract to handle Jump DeFi's Token Launchpad.

This contract allows projects to raise capital by selling their NEP-141 tokens to the general public. 

Only Jump DeFi's team can create a token sale on behalf of a project, allowing a screening before any project gets launched on the contract.

This document explains the architecture of the contract and the business logic considered in the process. The first sections deal with the business logic, the last section walks the user through all contract methods that can be called.

## Main Features

The launchpad contains a set of requirements that are explained below. A more business centric explanation for the following concepts can be found in the Jump DeFi whitepaper.

### Membership and tickets

Traditionally launchpad applications have 2 kinds of problems: (i) either no one wants to buy the tokens for a given project or (ii) everyone wants to buy them and there is no opportunity for everyone.

To solve these problems, specially (ii), the contrat implements the concept of membership levels and allocations (also referred to as tickets).

Whenever a sale is created, the total amount of tokens for sale must be defined together with the size of each token allocation. V.g. 1 million tokens for sale in allocations of 1 thousand - This would mean each investor can only purchase multiples of 1 thousand.

Each user is only allowed to buy a certain quantity of allocations. This is defined through their membership level. V.g. Level 1 members can buy 10 allocations per listing, whereas level 3 could buy 30 - in practice these numbers can all be set by the Jump DeFi team to be whichever they like.

To become a member of the launchpad and be entitled to purchase token allocations, the user must stake xJUMP into the launchpad contract. The Jump DeFi team can decide how many tokens must be staked to reach each membership level and how many allocations each level is entitle to.
  
**Even though I am referring to xJUMP as the token to be staked, the contract allows any NEP-141 token to be selected as the stake token.

Every sale is conducted in 2 phases. During the first phase, only members can buy allocations. If the tokens don't sell out, a second sale phase is started, in which everyone is entitled to a spefic quantity of allocations defined by the Jump DeFi team.
  
### Vesting schedules
  
One of the main problems with crypto projects receiving early investment through private rounds is the possibility that those early investors will dump the tokens in the market as soon as possible to realize their profits. This behavior is observed in both small private investors and huge venture capital firms.

To offset this problem, the launchpad contract supports a very flexible vesting scheme that allows the project to define when the investors will be able to claim their purchased tokens.

There are 3 token steps in the vesting process: (1) initial release, (2) cliff release and (3) final release.

(1) initial release refers to the amount of tokens that the investor can withdraw immediatelly after the sale phase ends.

(2) cliff release refers to a very specific VC/startup terminology. The project chooses a cliff start timestamp and a cliff end timestamp. The cliff release is distributed linearly during the time between the cliff start timestamp and cliff end timestamp.

(3) final release refers to the amount of tokens that can be claimed after cliff end timestamp.

The project can select how many percent of the tokens are released in each phase and also select the cliff start timestamp and cliff end timestamp

### Private Sales

The membership and allocations scheme described above applies to all public sales. However, the launchpad also allows the possibility of private sales.

Private sales are meant to be used by Venture Capitalists and other private investors that want to leverage the Launchpad infrastructure to invest in projects. They can benefit by having a stable smart contract where they can deposit their funds to and a safe vesting contract to hold their purchased tokens before the vesting schedule allows their withdraw.

In this listings, the project owner grants allocations arbitrarily to whichever wallet addresses they want. Only selected wallets can purchase allocations during phase 1 of the sale.

### IDO (Initial Dex Offering)

Another big issue faced by investors of early stage projects is the possibility of the invested project never gaining traction and the founders abandoning it. In this case, all tokens bought would be illiquid and worthless.

To solve this issue, the launchpad allows a predetermined amount of the raised capital to be commited to an IDO in the JUMP DEX. A share of all raised investment remains locked in the contract, together with project tokens deposited by the project owner.

On a specific date, selected in the creation of the sale, the launchpad contract will trigger the IDO for the project in the JUMP DEX. This will lead to the token becoming liquid and investors being able to trade it.

## Contract Permissions

There are 4 different permissioning levels within the contract:

1. Owner -> Highest permission
2. Guardian -> Delegated by owner, may create new launchpad sales
3. Project owner -> The person responsible for a specific project whose tokens are listed in the launchpad
4. Regular user/investor -> Investor that wants to buy tokens through the launchpad

## Token sale phases

Each token sale goes through a lifecycle composed of the following steps:

1. Waiting period -> During this phase the sale is already created and visible on the website/contract but no one can buy tokens yet


2. Sale phase 1 -> During this phase, only launchpad members can buy tokens, according to the amount of tickets they own - if all tokens are sold, jump to (4)


3. Sale phase 2 -> During this phase anyone can buy tokens, up to a specific amount of tickets defined by the Jump DeFi team - if all tokens are sold, jump to (4)


4. Vesting phase -> After the sale, users can only claim their purchased project tokens according to the vesting schedule defined for the sale.  
4.1 Immediatelly after the sale ends, investors are entitle to fraction_instant_release  
4.2 fraction_cliff_release becomes available for investors to claim gradually between the timestamps cliff_timestamp and end_cliff_timestamp  
4.3 The rest of the purchased tokens become available for claims after end_cliff_timestamp

## Creation of a token sale

The token sale is created by following the steps:

1. Owner or guardian must create the sale and assign an account as the project owner
2. The project owner must deposit the NEP-141 tokens that are to be sold through the launchpad. While the tokens are not deposited the sale will not appear in the website and if the sale start date is reached without having deposited the tokens, the sale is cancelled.

