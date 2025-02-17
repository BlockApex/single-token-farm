use crate::*;
use crate::listing::{ListingStatus};
use crate::ext_interface::{ext_dex, ext_self};

const DEX_INTERACTION_GAS: Gas = Gas(200 * Gas::ONE_TERA.0);
const DEX_CALLBACK_GAS: Gas = Gas(50 * Gas::ONE_TERA.0);

const LOCK_PERIOD: u64 = 60_000_000_000;

#[near_bindgen]
impl Contract {
  #[payable]
  pub fn launch_on_dex(&mut self, listing_id: U64) -> Promise {
    panic!("Jump Dex integration not yet available");
    let timestamp = env::block_timestamp();
    let mut listing = self.internal_get_listing(listing_id.0);
    assert!(listing.dex_lock_time <= timestamp, "{}", ERR_403);
    listing.update_treasury_after_sale();
    listing.dex_lock_time = timestamp + LOCK_PERIOD;
    match listing.status {
      ListingStatus::Unfunded | ListingStatus::Funded => panic!("{}", ERR_404),
      ListingStatus::Cancelled => panic!("{}", ERR_406),
      ListingStatus::LiquidityPoolFinalized => panic!("{}", ERR_405),

      ListingStatus::SaleFinalized => {
        // send call to create liquidity pool
        let deposit = env::attached_deposit();
        let promise = ext_dex::ext(self.contract_settings.partner_dex.clone())
          .with_static_gas(DEX_INTERACTION_GAS)
          .with_attached_deposit(deposit)
          .add_simple_pool(
            vec![
              listing.project_token.ft_get_account_id(),
              listing.price_token.ft_get_account_id(),
            ],
            1,
          )
          .then(
            ext_self::ext(env::current_account_id())
              .with_static_gas(DEX_CALLBACK_GAS)
              .callback_dex_launch_create_pool(listing_id, U128(deposit)),
          );
        self.internal_update_listing(listing_id.0, listing);
        promise
      }
      ListingStatus::PoolCreated => {
        // send call to deposit project token
        let deposit = listing.withdraw_liquidity_project_token();
        let launchpad_fee = (deposit * listing.fee_liquidity_tokens) / FRACTION_BASE;
        let liquid_deposit = deposit - launchpad_fee;
        let promise = listing
          .project_token
          .transfer_token_call(
            self.contract_settings.partner_dex.clone(),
            liquid_deposit,
            String::new(),
          )
          .then(
            ext_self::ext(env::current_account_id())
              .with_static_gas(DEX_CALLBACK_GAS)
              .callback_dex_deposit_project_token(listing_id, U128(deposit), U128(launchpad_fee)),
          );
        self.internal_update_listing(listing_id.0, listing);
        promise
      }
      ListingStatus::PoolProjectTokenSent => {
        // send call to deposit project token
        let deposit = listing.withdraw_liquidity_price_token();
        let launchpad_fee = (deposit * listing.fee_liquidity_tokens) / FRACTION_BASE;
        let liquid_deposit = deposit - launchpad_fee;
        let promise = listing
          .price_token
          .transfer_token_call(
            self.contract_settings.partner_dex.clone(),
            liquid_deposit,
            String::new(),
          )
          .then(
            ext_self::ext(env::current_account_id())
              .with_static_gas(DEX_CALLBACK_GAS)
              .callback_dex_deposit_price_token(listing_id, U128(deposit), U128(launchpad_fee)),
          );
        self.internal_update_listing(listing_id.0, listing);
        promise
      }
      ListingStatus::PoolPriceTokenSent => {
        // send call to add liquidity
        let deposit = env::attached_deposit();
        let promise = ext_dex::ext(self.contract_settings.partner_dex.clone())
          .with_static_gas(DEX_INTERACTION_GAS)
          .with_attached_deposit(deposit)
          .add_liquidity(
            listing.dex_id.unwrap(),
            vec![
              U128(listing.dex_project_tokens.unwrap()),
              U128(listing.dex_price_tokens.unwrap()),
            ],
            None,
          )
          .then(
            ext_self::ext(env::current_account_id())
              .with_static_gas(DEX_CALLBACK_GAS)
              .callback_dex_add_liquidity(listing_id, U128(deposit)),
          );
        self.internal_update_listing(listing_id.0, listing);
        promise
      }
    }
  }
}
