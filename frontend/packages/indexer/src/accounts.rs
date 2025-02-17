use std::marker::PhantomData;

use serde::Deserialize;

use crate::events::{
    launchpad::LaunchpadEvent, nft_staking::NftStakingEvent, x_token::XTokenEvent, Event, EventId,
};
use crate::statement_store::StatementStore;

#[derive(Eq, Hash, PartialEq)]
pub struct EventEmitterAccount<T: Event> {
    account_id: &'static str,
    event_type: PhantomData<T>,
}

impl<'a, T: Event + Deserialize<'a>> EventEmitterAccount<T> {
    pub fn new(account_id: &'static str) -> Self {
        EventEmitterAccount::<T> {
            account_id,
            event_type: PhantomData,
        }
    }

    pub fn parse_event(&self, event_json_string: &'a str) -> Result<T, serde_json::Error> {
        serde_json::from_str::<T>(event_json_string)
    }

    pub fn is(&self, account_id: &str) -> bool {
        self.account_id == account_id
    }
}

pub enum ContractAccount {
    Launchpad(EventEmitterAccount<LaunchpadEvent>),
    NftStaking(EventEmitterAccount<NftStakingEvent>),
    XToken(EventEmitterAccount<XTokenEvent>),
}

impl ContractAccount {
    pub fn init_accounts(
        launchpad_contract_account_id: &'static str,
        nft_staking_contract_account_id: &'static str,
        x_token_contract_account_id: &'static str,
    ) -> [Self; 3] {
        [
            ContractAccount::Launchpad(EventEmitterAccount::<LaunchpadEvent>::new(
                launchpad_contract_account_id,
            )),
            ContractAccount::NftStaking(EventEmitterAccount::<NftStakingEvent>::new(
                nft_staking_contract_account_id,
            )),
            ContractAccount::XToken(EventEmitterAccount::<XTokenEvent>::new(
                x_token_contract_account_id,
            )),
        ]
    }

    pub fn is(&self, account_id: &str) -> bool {
        match &self {
            Self::Launchpad(account) => account.is(account_id),
            Self::NftStaking(account) => account.is(account_id),
            Self::XToken(account) => account.is(account_id),
        }
    }

    pub async fn process_event(
        &self,
        event_id: EventId,
        event_json_string: &str,
        store: &mut StatementStore,
    ) {
        match &self {
            Self::Launchpad(account) => {
                let event = account.parse_event(event_json_string);
                if let Ok(event) = event {
                    store.process_event(event_id, event).await;
                }
            }
            Self::NftStaking(account) => {
                let event = account.parse_event(event_json_string);
                if let Ok(event) = event {
                    store.process_event(event_id, event).await;
                }
            }
            Self::XToken(account) => {
                let event = account.parse_event(event_json_string);
                if let Ok(event) = event {
                    store.process_event(event_id, event).await;
                }
            }
        }
    }
}
