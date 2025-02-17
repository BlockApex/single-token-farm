use std::collections::{HashSet, HashMap};

use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::json_types::U128;
use near_sdk::{env, near_bindgen, ext_contract, AccountId, PanicOnDefault, Promise, Gas};

use near_contract_standards::non_fungible_token::Token;

const GAS_FOR_FT_TRANSFER: Gas = Gas(120_000_000_000_000);

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
  pub owner: AccountId,
  pub fungible_tokens: HashMap<AccountId, U128>,
  pub non_fungible_tokens: HashSet<AccountId>,
}

#[ext_contract(ext_fungible_token)]
pub trait FunglibleToken {
  fn storage_deposit(account_id: Option<AccountId>, registration_only: Option<bool>);
  fn ft_transfer(receiver_id: AccountId, amount: U128, memo: Option<String>);
}

#[ext_contract(ext_non_fungible_token)]
pub trait NonFunglibleToken {
  fn nft_mint(&mut self, receiver_id: Option<AccountId>) -> Token;
}

#[near_bindgen]
impl Contract {
  #[init]
  pub fn new(owner: AccountId) -> Self {
    assert!(!env::state_exists(), "Already initialized");
    Self {
      owner,
      fungible_tokens: HashMap::new(),
      non_fungible_tokens: HashSet::new(),
    }
  }

  #[allow(unused_variables)]
  pub fn ft_on_transfer(&mut self, sender_id: AccountId, amount: U128, msg: String) -> U128 {
    assert_eq!(sender_id, self.owner);
    let token = env::predecessor_account_id();
    let current_balance = self.fungible_tokens.get(&token).unwrap_or(&U128(0)).0;
    let new_balance = U128(current_balance + amount.0);
    self.fungible_tokens.insert(token, new_balance);
    U128(0)
  }

  #[payable]
  pub fn ft_faucet(&mut self, token: AccountId, amount: U128) -> Promise {
    let amount = amount.0;
    let account = env::predecessor_account_id();
    let token_balance = self.fungible_tokens.get(&token).unwrap_or(&U128(0)).0;
    let new_balance = U128(token_balance - amount);
    self.fungible_tokens.insert(token.clone(), new_balance);

    ext_fungible_token::ext(token.clone())
      .with_static_gas(GAS_FOR_FT_TRANSFER)
      .with_attached_deposit(env::attached_deposit() - 1)
      .storage_deposit(Some(account.clone()), Some(true))
      .then(
        ext_fungible_token::ext(token)
          .with_static_gas(GAS_FOR_FT_TRANSFER)
          .with_attached_deposit(1)
          .ft_transfer(account, U128(amount), None),
      )
  }

  pub fn nft_register(&mut self, account_id: AccountId) {
    assert_eq!(env::predecessor_account_id(), self.owner);
    self.non_fungible_tokens.insert(account_id);
  }

  #[payable]
  pub fn nft_faucet(&mut self, collection: AccountId) -> Promise {
    ext_non_fungible_token::ext(collection)
      .with_static_gas(GAS_FOR_FT_TRANSFER)
      .with_attached_deposit(env::attached_deposit())
      .nft_mint(Some(env::predecessor_account_id()))
  }

  pub fn view_tokens(&self) -> HashSet<AccountId> {
    self.fungible_tokens.keys().cloned().collect()
  }

  pub fn view_nfts(&self) -> HashSet<AccountId> {
    self.non_fungible_tokens.clone()
  }
}
