# Auxiliary contracts audit review

This document comments on the audit report from BlockApex, discussing every issue, identifed bugs, proposed changes and fixes implemented in the code.

This document refers to audit on commit hash ddb92dda6eb779ac854471eeda817abeacfc054e

## 3. Inadequate implementation leads to loss of rewards (xJUMP)
### Acknowledged

The issue is acknowledged, however the staking contract will be discontinued as the team opted to go along only with the xJUMP model for token staking.

The staking contract has been excluded from the repository.

## 4. Insufficient Access Controls on NFT Minting (nft_contract)
### Acknowledged

Issue refers to testnet only contract, no need to implement

## 5. Users will not be able to withdraw their locked tokens even after they are unlocked (locked_token)
### Implemented

The auditors point out that there is an insufficient gas amount being passed to cross contract calls. The contract has been updated to pass 120 Tgas to `ft_tranfer` and 50 Tgas to the attached callback.


## 12. Inadequate function parameters (vesting_contract)
### Acknowledged

The auditors point out the the optional parameter `date_in` in the `create_investment` public method might allow users to actually bypass the intended cliff period in a vesting.

However, this is the intended behavior, as the method can only be called by the owner, they must have the autonomy to actually select the date in which the investor entered the investment agreemnte.

The main reason for the behavior is that, in practice, many investor already put funds into Jump DeFi, even before the contracts were deployed as they were early investors. Therefore, their vesting schemas have already been started and must be faithfully reproduced, which might require the owner to set a previous start_date.


## 15. Inadequate validation on AccountId (mintable token)

The auditors pointed out that token_contract.rs, vesting_contract.rs and modified_contract_standards.rs do not ensure that account ids are valid when processing them. This might lead to assets becoming irrecoverable by typing and frontend errors.

All contracts have been modified to validate the account ids being inputed by the user.

## 18. Optimization in withdraw (locked_token)

The auditors highlight that in case the user has no tokens to be released and calls `withdraw_locked_tokens`, there is no need to send a `ft_transfer` promise with the value of 0. Instead the method could simply return an empty PromiseOrValue enum and save the user's gas fees.

This optimization has been implemented.