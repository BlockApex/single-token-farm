/// Contract errors
pub const ERR_001: &str = "ERR_001: Only owner can call this method";
pub const ERR_002: &str = "ERR_002: Only owner or guardian can call this method";
pub const ERR_003: &str = "ERR_003: listing_id does not exist";
pub const ERR_004: &str = "ERR_004: investor is not registered";
pub const ERR_005: &str = "ERR_005: Guardian already registered";
pub const ERR_006: &str = "ERR_006: Account not registered as guardian";
pub const ERR_007: &str = "ERR_007: Token not registered in treasury";
pub const ERR_008: &str = "ERR_008: Attempted to withdraw from treasury with underflow";
pub const ERR_009: &str = "ERR_009: Cannot withdraw from empty treasury";
pub const ERR_010: &str = "ERR_010: Appointed listing owner is not registered";

/// Listing errors
pub const ERR_101: &str = "ERR_101: Can only cancel funded listings before their start date";
pub const ERR_102: &str = "ERR_102: Only the project owner can call this method";
pub const ERR_103: &str = "ERR_103: Can only withdraw funds after sale is finalized";
pub const ERR_104: &str = "ERR_104: Transferred token doesn't match listing token type";
pub const ERR_105: &str = "ERR_105: Transferred quantity doesn't match listing requirement";
pub const ERR_106: &str = "ERR_106: Listing is not in sale phase";
pub const ERR_107: &str = "ERR_107: Only private listings have whitelists";
pub const ERR_108: &str = "ERR_108: Provided timestamp data is not sequential";
pub const ERR_109: &str = "ERR_109: Allocations must be a exact divisor of total project tokens";
pub const ERR_110: &str = "ERR_110: fraction_instant_release must be <= FRACTION_BASE";
pub const ERR_111: &str = "ERR_111: Dex launch price cannot be smaller than presale";
pub const ERR_112: &str =
  "ERR_112: Cannot allocate more price tokens to dex launch than received fom presale";
pub const ERR_113: &str = "ERR_113: Listing can only be funded once";
pub const ERR_114: &str = "ERR_114: Cannot fund listing after sale start time";
pub const ERR_115: &str = "ERR_115: Intended project_owner did not authorize listing creation";

/// Investor errors
pub const ERR_201: &str = "ERR_201: Storage deposit insufficient for this transaction";
pub const ERR_202: &str = "ERR_202: Storage deposited was less than minimum deposit";
pub const ERR_203: &str =
  "ERR_203: Cannot delete investor account, pending investment allocations to withdraw";
pub const ERR_204: &str = "ERR_204: Membership can only be validated through the membership_token";
pub const ERR_205: &str = "ERR_205: Requested membership level does not exist";
pub const ERR_206: &str = "ERR_206: Not enough tokens deposited for this membership level";
pub const ERR_207: &str =
  "ERR_207: Cannot downgrade membership level with increase_membership_tier call";
pub const ERR_208: &str = "ERR_208: Not enough membership tokens to withdraw";
pub const ERR_209: &str = "ERR_209: Cannot withdraw membership tokens before lock period";
pub const ERR_210: &str = "ERR_210: Listing owner accounts can never be unregistered";
pub const ERR_211: &str = "ERR_211: No allowance for purchase size";

/// Action errors
pub const ERR_301: &str =
  "ERR_301: Could not parse String from msg. Not compliant with CallType format";
pub const ERR_302: &str = "ERR_302: No allocations available to withdraw";

/// Dex integration errors
pub const ERR_401: &str = "ERR_401: Inconsistent state after call";
pub const ERR_402: &str = "ERR_402: Callback value could not be parsed";
pub const ERR_403: &str = "ERR_403: Transaction concurrency lock enforced, wait for lock realease";
pub const ERR_404: &str = "ERR_404: Listing not ready yet for dex deployment";
pub const ERR_405: &str = "ERR_405: Listing dex deployment already done";
pub const ERR_406: &str = "ERR_406: Listing was cancelled, cannot dex deploy";
