use crate::*;
use events::event_new_contract_saved;

/// Store a new contract, caller must pay the storage costs.
/// Returns base58 of the hash of the stored contract.
/// User must register the contract
#[no_mangle]
pub extern "C" fn store() {
  env::setup_panic_hook();

  // Get contract from state
  let mut contract: Contract = near_sdk::env::state_read().unwrap();
  // Assure the owner is calling the function
  contract.only_owner();

  let prev_storage = env::storage_usage();

  // Store the contract and get its hash
  let contract_hash = store_contract();

  let contract_size: u128 = (env::storage_usage() - prev_storage) as u128;

  let storage_cost = (env::storage_usage() - prev_storage) as u128 * env::storage_byte_cost();

  assert!(
    storage_cost <= env::attached_deposit(),
    "Must at least deposit {}",
    storage_cost,
  );

  // Get state again, bc it changed with store_contract()
  contract = near_sdk::env::state_read().unwrap();

  // Save contract hash and storage cost into memory
  // Must use contract size, because 'env::storage_byte_cost()' might be different when contract is deployed
  contract
    .storage_cost
    .insert(&contract_hash, &U128(contract_size));
  near_sdk::env::state_write(&contract);

  event_new_contract_saved(U128(storage_cost), contract_hash);
}

/// Stores a contract wasm file on trie, returns storage hash
fn store_contract() -> Base58CryptoHash {
  unsafe {
    // Load input into register 0.
    sys::input(0);
    // Compute sha256 hash of register 0 and store in 1.
    sys::sha256(u64::MAX as _, 0 as _, 1);
    // Check if such blob already stored.
    assert_eq!(
      sys::storage_has_key(u64::MAX as _, 1 as _),
      0,
      "ERR_ALREADY_EXISTS"
    );
    // Store value of register 0 into key = register 1.
    sys::storage_write(u64::MAX as _, 1 as _, u64::MAX as _, 0 as _, 2);
    // Load register 1 into blob_hash.
    let blob_hash = [0u8; 32];
    sys::read_register(1, blob_hash.as_ptr() as _);
    // Contract address (hash) on memory
    let contract_hash = Base58CryptoHash::from(blob_hash.clone());
    // Return from function value of register 1.
    let blob_hash_str = near_sdk::serde_json::to_string(&contract_hash)
      .unwrap()
      .into_bytes();
    sys::value_return(blob_hash_str.len() as _, blob_hash_str.as_ptr() as _);
    contract_hash
  }
}
