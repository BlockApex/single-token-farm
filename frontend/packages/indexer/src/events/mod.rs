use postgres_types::ToSql;

mod convert;
pub mod launchpad;
pub mod nft_staking;
pub mod x_token;

pub trait Event {
    fn kind(&self) -> &'static str;
    fn raw_statements(&self) -> &'static [&'static str];
    fn parameters(&self) -> Vec<Vec<Box<dyn ToSql + Sync + '_>>>;
}

pub type EventId = (u64, usize);
