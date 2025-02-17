use crate::*;

#[near_bindgen]
impl Contract {
  pub fn view_listing(&self, listing_id: U64) -> Option<Listing> {
    match self.listings.get(listing_id.0) {
      Some(listing) => Some(listing.into_current()),
      None => None,
    }
  }

  pub fn view_listings_quantity(&self) -> U64 {
    U64(self.listings.len())
  }

  pub fn view_investor(&self, account_id: AccountId) -> Option<Investor> {
    self.internal_get_investor(&account_id)
  }

  pub fn view_allowance_raw(&self, account_id: AccountId, listing_id: U64) -> U64 {
    let listing = self.internal_get_listing(listing_id.0);
    let allowance = listing.check_private_sale_investor_allowance(&account_id);
    U64(allowance)
  }

  pub fn view_investor_allowance(&self, account_id: AccountId, listing_id: Option<U64>) -> U64 {
    if let Some(investor) = self.internal_get_investor(&account_id) {
      match listing_id {
        Some(listing_id) => {
          let listing = self.internal_get_listing(listing_id.0);
          let current_sale_phase_opt = listing.get_current_sale_phase_no_panic();
          if let Some(current_sale_phase) = current_sale_phase_opt {
            let previous_allocations_bought = investor
              .allocation_count
              .get(&listing.listing_id)
              .unwrap_or((0, 0));
            U64(self.check_investor_allowance(
              &investor,
              &current_sale_phase,
              previous_allocations_bought.0,
              &listing,
            ))
          } else {
            U64(0)
          }
        }
        None => {
          let membership_level =
            investor.get_current_membership_level(&self.contract_settings.tiers_minimum_tokens);
          if membership_level == 0 {
            U64(0)
          } else {
            self.contract_settings.tiers_entitled_allocations[membership_level as usize - 1]
          }
        }
      }
    } else {
      U64(0)
    }
  }

  pub fn view_investor_allocation(
    &self,
    account_id: AccountId,
    listing_id: U64,
  ) -> Option<(U64, U128)> {
    match self.internal_get_investor(&account_id) {
      Some(investor) => match investor.allocation_count.get(&listing_id.0) {
        Some(alloc) => Some((U64(alloc.0), U128(alloc.1))),
        None => None,
      },
      None => None,
    }
  }

  pub fn view_vested_allocations(&self, account_id: AccountId, listing_id: U64) -> U128 {
    match self.internal_get_investor(&account_id) {
      Some(investor) => match investor.allocation_count.get(&listing_id.0) {
        Some(alloc) => {
          let listing = self.internal_get_listing(listing_id.0);
          match listing.status {
            ListingStatus::Unfunded => return U128(0),
            ListingStatus::Funded => {
              if env::block_timestamp() < listing.final_sale_2_timestamp {
                return U128(0);
              }
            }
            _ => (),
          }
          let vested = listing.calculate_vested_investor_withdraw(alloc.0, env::block_timestamp());
          U128(vested - alloc.1)
        }
        None => U128(0),
      },
      None => U128(0),
    }
  }

  pub fn view_iter_investor_listings(
    &self,
    account_id: AccountId,
    start: U64,
    pagination: U64,
  ) -> Option<Vec<U64>> {
    match self.internal_get_investor(&account_id) {
      Some(investor) => Some(
        investor
          .allocation_count
          .keys()
          .skip(start.0 as usize)
          .take(pagination.0 as usize)
          .map(|v| U64(v))
          .collect(),
      ),
      None => None,
    }
  }

  pub fn view_contract_settings(&self) -> ContractSettings {
    self.contract_settings.clone()
  }

  pub fn view_contract_owner(&self) -> AccountId {
    self.owner.clone()
  }

  pub fn view_guardians_paginated(&self, start: U64, size: U64) -> HashSet<AccountId> {
    self
      .guardians
      .iter()
      .skip(start.0 as usize)
      .take(size.0 as usize)
      .collect()
  }

  pub fn view_contract_treasury_length(&self) -> U64 {
    U64(self.treasury.len())
  }

  pub fn view_contract_treasury_balance(
    &self,
    start: U64,
    pagination: U64,
  ) -> Vec<(TokenType, U128)> {
    self
      .treasury
      .iter()
      .skip(start.0 as usize)
      .take(pagination.0 as usize)
      .map(|v| (v.0, U128(v.1)))
      .collect()
  }
}
