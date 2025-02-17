use crate::{
  constants::{COMPENSATE_GAS, FT_TRANSFER_GAS},
  ext_interfaces::{ext_fungible_token, ext_self},
  funds::deposit::DepositOperation,
  types::*,
  Contract, ContractExt,
};

use near_sdk::{assert_one_yocto, env, json_types::U128, near_bindgen, Promise};

#[near_bindgen]
impl Contract {
  #[payable]
  pub fn withdraw_collection_treasury(
    &mut self,
    collection: NFTCollection,
    token_id: FungibleTokenID,
    amount: Option<U128>,
  ) -> Promise {
    assert_one_yocto();
    let account_id = env::predecessor_account_id();

    let mut staking_program = self.staking_programs.get(&collection).unwrap();
    staking_program.only_collection_owner(&account_id);
    staking_program.only_program_token(&token_id);

    let withdrawn_amount =
      U128(staking_program.withdraw_collection_treasury(token_id.clone(), amount.map(|x| x.0)));

    ext_fungible_token::ext(token_id.clone())
      .with_static_gas(FT_TRANSFER_GAS)
      .with_attached_deposit(1)
      .ft_transfer(account_id.clone(), withdrawn_amount, None)
      .then(
        ext_self::ext(env::current_account_id())
          .with_static_gas(COMPENSATE_GAS)
          .compensate_withdraw_treasury(
            DepositOperation::CollectionTreasury { collection },
            token_id,
            withdrawn_amount,
          ),
      )
  }
}
