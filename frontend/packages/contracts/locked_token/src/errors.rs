/// general functions
pub const ERR_001: &str = "ERR_001: Account not registered";
pub const ERR_002: &str = "ERR_002: Only authorized applications can perform this action";
pub const ERR_003: &str = "ERR_003: Only owner can perform this action";
pub const ERR_004: &str = "ERR_004: Only base token is accepted";
pub const ERR_005: &str = "ERR_005: Can only mint locked tokens to registered minters";
pub const ERR_006: &str = "ERR_006: Msg could not be parsed";

/// vesting functions
pub const ERR_101: &str = "ERR_101: Vesting id does not exist";
pub const ERR_102: &str = "ERR_102: Deposited tokens not enough to cover fast pass cost";
pub const ERR_103: &str = "ERR_103: Can only buy fast pass once for each vesting schedule";
pub const ERR_104: &str = "ERR_104: Vesting schedule already finalized";

/// storage functions
pub const ERR_201: &str = "ERR_201: Insuficient storage deposit";
pub const ERR_202: &str = "ERR_202: Must deposit at least the minimum amount to register";
pub const ERR_203: &str =
  "ERR_203: Must withdraw all pending vestings to cancel or use force option";
