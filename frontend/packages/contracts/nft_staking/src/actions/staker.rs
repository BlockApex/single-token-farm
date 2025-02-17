use crate::{
  actions::token_router::NFTRoutePayload,
  constants::{COMPENSATE_GAS, FT_TRANSFER_GAS, NFT_TRANSFER_GAS},
  events,
  ext_interfaces::{ext_fungible_token, ext_non_fungible_token, ext_self},
  models::{StakedNFT, StakingProgram},
  types::{FungibleTokenID, NFTCollection, NonFungibleTokenID, SerializableFungibleTokenBalance},
  Contract, ContractExt,
};
use near_sdk::{
  assert_one_yocto, env, is_promise_success,
  json_types::{U128, U64},
  near_bindgen, AccountId, Promise, PromiseOrValue,
};

impl StakingProgram {
  #[inline]
  fn assert_is_token_owner(&self, caller_id: &AccountId, token_id: &NonFungibleTokenID) {
    assert!(
      self
        .nfts_by_owner
        .get(&caller_id)
        .map(|nfts| nfts.contains(&token_id.1))
        .unwrap_or(false),
      "Only the token's owner may operate it."
    );
  }
}

impl Contract {
  pub fn stake(&mut self, payload: NFTRoutePayload) {
    let initial_storage = env::storage_usage();
    let token_id = payload.token_id;
    let owner_id = payload.sender_id; // payload.previous_owner_id;
    let collection = payload.collection;

    let mut staking_program = self.staking_programs.get(&collection).unwrap();
    let staked_nft = staking_program.stake_nft(token_id, owner_id.clone());
    self.staking_programs.insert(&collection, &staking_program);

    self.track_storage_usage(&owner_id, initial_storage);

    events::stake_nft(&staked_nft.into());
  }
}

#[near_bindgen]
impl Contract {
  #[private]
  pub fn compensate_unstake(
    &mut self,
    token_id: NonFungibleTokenID,
    owner_id: AccountId,
    staked_timestamp: U64,
    balance: SerializableFungibleTokenBalance,
  ) {
    if is_promise_success() {
      events::unstake_nft(&token_id, balance);
      return;
    }

    let initial_storage = env::storage_usage();
    let collection = token_id.0.clone();

    let staked_nft = StakedNFT::new(token_id, owner_id.clone(), staked_timestamp.0);
    let mut staking_program = self.staking_programs.get(&collection).unwrap();
    staking_program.insert_staked_nft(&staked_nft);

    self.staking_programs.insert(&collection, &staking_program);
    self.track_storage_usage(&owner_id, initial_storage);
  }

  #[payable]
  pub fn unstake(&mut self, token_id: NonFungibleTokenID) -> Promise {
    assert_one_yocto();

    let initial_storage = env::storage_usage();
    let caller_id = env::predecessor_account_id();
    let collection = token_id.0.clone();
    let mut staking_program = self.staking_programs.get(&collection).unwrap();
    staking_program.assert_is_token_owner(&caller_id, &token_id);

    let balance = staking_program.inner_withdraw(&token_id);

    let staked_nft = staking_program.unstake_nft(&token_id, &caller_id);
    self.staking_programs.insert(&collection, &staking_program);

    self.track_storage_usage(&caller_id, initial_storage);

    match collection.clone() {
      NFTCollection::NFTContract { account_id } => ext_non_fungible_token::ext(account_id)
        .with_static_gas(NFT_TRANSFER_GAS)
        .with_attached_deposit(1)
        .nft_transfer(caller_id.clone(), token_id.1.clone(), None, None)
        .then(
          ext_self::ext(env::current_account_id())
            .with_static_gas(COMPENSATE_GAS)
            .compensate_unstake(
              staked_nft.token_id,
              staked_nft.owner_id,
              U64(staked_nft.staked_timestamp),
              balance.into(),
            ),
        ),
    }
  }

  #[private]
  pub fn compensate_withdraw_reward(
    &mut self,
    collection: NFTCollection,
    token_id: FungibleTokenID,
    owner_id: AccountId,
    amount: U128,
  ) {
    if is_promise_success() {
      events::withdraw_reward(collection, owner_id, token_id, amount);
      return;
    }

    let initial_storage = env::storage_usage();
    let mut staking_program = self.staking_programs.get(&collection).unwrap();

    staking_program.outer_deposit(&owner_id, &token_id, amount.0);

    self.staking_programs.insert(&collection, &staking_program);
    self.track_storage_usage(&owner_id, initial_storage);
  }

  #[payable]
  pub fn withdraw_reward(
    &mut self,
    collection: NFTCollection,
    token_id: FungibleTokenID,
    amount: Option<U128>,
  ) -> PromiseOrValue<()> {
    assert_one_yocto();

    let initial_storage = env::storage_usage();
    let caller_id = env::predecessor_account_id();
    let mut staking_program = self.staking_programs.get(&collection).unwrap();

    let requested_amount = amount.map(|x| x.0);
    let withdrawn_amount = staking_program.outer_withdraw(&caller_id, &token_id, requested_amount);

    self
      .staking_programs
      .insert(&collection, &staking_program)
      .unwrap();
    self.track_storage_usage(&caller_id, initial_storage);

    if withdrawn_amount > 0 {
      PromiseOrValue::Promise(ext_fungible_token::ext(token_id.clone())
      .with_static_gas(FT_TRANSFER_GAS)
      .with_attached_deposit(1)
      .ft_transfer(caller_id.clone(), U128(withdrawn_amount), None)
      .then(
        ext_self::ext(env::current_account_id())
          .with_static_gas(COMPENSATE_GAS)
          .compensate_withdraw_reward(collection, token_id, caller_id, U128(withdrawn_amount)),
      ))
    } else {
      PromiseOrValue::Value(())
    }
    
  }

  #[payable]
  pub fn claim_reward(
    &mut self,
    collection: NFTCollection,
    token_id: NonFungibleTokenID,
  ) -> SerializableFungibleTokenBalance {
    assert_one_yocto();

    let initial_storage = env::storage_usage();
    let caller_id = env::predecessor_account_id();
    let mut staking_program = self.staking_programs.get(&collection).unwrap();
    staking_program.assert_is_token_owner(&caller_id, &token_id);

    let balance = staking_program.inner_withdraw(&token_id);

    self.staking_programs.insert(&collection, &staking_program);

    self.track_storage_usage(&caller_id, initial_storage);

    balance.into()
  }
}
