use near_sdk::{env, near_bindgen, AccountId, PanicOnDefault, Promise, PromiseOrValue};
use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::json_types::U128;
use near_sdk::collections::LazyOption;
use near_contract_standards::non_fungible_token::{NonFungibleToken, Token, TokenId};
use near_contract_standards::non_fungible_token::metadata::{
  NonFungibleTokenMetadataProvider, NFTContractMetadata, TokenMetadata,
};
use near_contract_standards::{
  impl_non_fungible_token_approval, impl_non_fungible_token_core,
  impl_non_fungible_token_enumeration,
};

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
  tokens: NonFungibleToken,
  metadata: LazyOption<NFTContractMetadata>,
  counter: u128,
  media_quantity: u128,
}

#[near_bindgen]
impl Contract {
  #[init]
  pub fn new(
    owner_id: AccountId,
    metadata: NFTContractMetadata,
    media_quantity: Option<U128>,
  ) -> Self {
    assert!(!env::state_exists(), "Already initialized");
    metadata.assert_valid();

    Contract {
      tokens: NonFungibleToken::new(b'a', owner_id, Some(b'b'), Some(b'c'), Some(b'd')),
      metadata: LazyOption::new(b'e', Some(&metadata)),
      counter: 0,
      media_quantity: media_quantity.unwrap_or(U128(200)).0,
    }
  }

  #[payable]
  pub fn nft_mint(&mut self, receiver_id: Option<AccountId>) -> Token {
    let account_id = receiver_id.unwrap_or(env::predecessor_account_id());

    let token_id = self.get_next_id();

    let metadata = TokenMetadata {
      title: Some(format!("Generic NFT {}", self.counter)),
      description: Some(format!(
        "Description of Generic NFT {} goes here",
        self.counter
      )),
      media: Some(format!(
        "{}/{}.png",
        self.metadata.get().unwrap().base_uri.unwrap().clone(),
        self.counter % self.media_quantity
      )),
      media_hash: None,
      copies: Some(self.counter as u64),
      issued_at: None,
      expires_at: None,
      starts_at: None,
      updated_at: None,
      extra: None,
      reference: None,
      reference_hash: None,
    };

    let token = self
      .tokens
      .internal_mint(token_id, account_id, Some(metadata));

    token
  }

  fn get_next_id(&mut self) -> std::string::String {
    self.counter += 1;
    let counter = self.counter;

    format!("#{}", counter)
  }
}

impl_non_fungible_token_core!(Contract, tokens);
impl_non_fungible_token_approval!(Contract, tokens);
impl_non_fungible_token_enumeration!(Contract, tokens);

#[near_bindgen]
impl NonFungibleTokenMetadataProvider for Contract {
  fn nft_metadata(&self) -> NFTContractMetadata {
    self.metadata.get().unwrap()
  }
}
