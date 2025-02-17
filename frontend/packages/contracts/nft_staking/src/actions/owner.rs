use crate::{
  constants::{COMPENSATE_GAS, FT_TRANSFER_GAS},
  errors::ERR_INSUFFICIENT_CONTRACT_TREASURY,
  ext_interfaces::{ext_fungible_token, ext_self},
  funds::deposit::DepositOperation,
  Contract, ContractExt, FungibleTokenID,
};
use near_sdk::{assert_one_yocto, env, json_types::U128, near_bindgen, AccountId, Promise};

#[near_bindgen]
impl Contract {
  #[payable]
  pub fn withdraw_contract_treasury(&mut self, token_id: FungibleTokenID, amount: U128) -> Promise {
    let caller_id = env::predecessor_account_id();

    assert_one_yocto();
    self.only_owner(&caller_id);
    self.only_contract_tokens(&token_id);

    let balance = self.contract_treasury.entry(token_id.clone()).or_insert(0);
    assert!(*balance >= amount.0, "{ERR_INSUFFICIENT_CONTRACT_TREASURY}");
    *balance -= amount.0;

    ext_fungible_token::ext(token_id.clone())
      .with_static_gas(FT_TRANSFER_GAS)
      .with_attached_deposit(1)
      .ft_transfer(caller_id, amount, None)
      .then(
        ext_self::ext(env::current_account_id())
          .with_static_gas(COMPENSATE_GAS)
          .compensate_withdraw_treasury(DepositOperation::ContractTreasury, token_id, amount),
      )
  }

  #[payable]
  pub fn add_guardian(&mut self, guardian: AccountId) {
    assert_one_yocto();
    self.only_owner(&env::predecessor_account_id());

    self.guardians.insert(&guardian);
  }

  #[payable]
  pub fn remove_guardian(&mut self, guardian: AccountId) {
    assert_one_yocto();
    self.only_owner(&env::predecessor_account_id());

    self.guardians.remove(&guardian);
  }

  #[payable]
  pub fn add_contract_token(&mut self, token_id: FungibleTokenID) {
    assert_one_yocto();
    self.only_owner(&env::predecessor_account_id());

    /*
     *   This is an intentional technical debt. Currently there's no way to delete a staking program, so
     * if we were to block the addition of a new contract token while it was being used as a program token,
     * it would result in the impossibility of ever using any token which was at any point in time a program token,
     * as a contract token.
     *
     *    It's likely this whole edge-case will remain irrelevant forever, as there's little reason to make a token
     * a contract token, even more so a program token, as it likely isn't even owned by the contract owner.
     *
     *   Note that in the current contract behavior, what happens is that the collection owner authorization always
     * has precedence over the guardians/owner. Meaning, if for some reason, in a given staking program, a program token
     * is also a contract token, its role as a program token superseeds its role as a contract token, and only the
     * collection owner may operate on it. We found this to be a reasonable trade-off with little downsides to an unlikely
     * problem with a costly solution.
     */
    // TODO: create an index of program tokens and assert it's a non-program token

    self.contract_treasury.insert(token_id, 0);
  }

  #[payable]
  pub fn remove_contract_token(&mut self, token_id: FungibleTokenID) {
    assert_one_yocto();
    let caller_id = env::predecessor_account_id();
    self.only_owner(&caller_id);

    let remaining_balance = self.contract_treasury.get(&token_id).unwrap();
    assert_eq!(
      remaining_balance,
      &0,
      "Cannot remove token from contract treasury, there still remains a balance of {}. Be sure to also withdraw the balance from all collection treasuries.",
      remaining_balance
    );

    self.contract_treasury.remove(&token_id);
  }
}
