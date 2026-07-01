#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Vec,
};

/// A single contribution record stored on-chain.
#[contracttype]
#[derive(Clone)]
pub struct ContributionRecord {
    pub sender: Address,
    pub amount_stroops: i128,
    pub timestamp: u64,
}

/// The IponPay smart contract.
/// Stores a list of contribution records in instance storage and emits events.
#[contract]
pub struct IponPayContract;

#[contractimpl]
impl IponPayContract {
    /// Record a new contribution on-chain.
    /// Requires the sender to authorize this call.
    pub fn record_contribution(
        env: Env,
        sender: Address,
        amount_stroops: i128,
        timestamp: u64,
    ) {
        sender.require_auth();

        let key = symbol_short!("records");

        let mut records: Vec<ContributionRecord> = env
            .storage()
            .instance()
            .get(&key)
            .unwrap_or(Vec::new(&env));

        records.push_back(ContributionRecord {
            sender: sender.clone(),
            amount_stroops,
            timestamp,
        });

        env.storage().instance().set(&key, &records);

        // Emit an event so indexers can track contributions
        env.events().publish(
            (symbol_short!("contrib"), sender),
            (amount_stroops, timestamp),
        );
    }

    /// Retrieve all stored contribution records.
    pub fn get_contributions(env: Env) -> Vec<ContributionRecord> {
        env.storage()
            .instance()
            .get(&symbol_short!("records"))
            .unwrap_or(Vec::new(&env))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_record_and_retrieve() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(IponPayContract, ());
        let client = IponPayContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let amount: i128 = 100_000_000; // 10 XLM in stroops
        let timestamp: u64 = 1_700_000_000;

        client.record_contribution(&sender, &amount, &timestamp);

        let records = client.get_contributions();
        assert_eq!(records.len(), 1);
        assert_eq!(records.get(0).unwrap().amount_stroops, amount);
        assert_eq!(records.get(0).unwrap().timestamp, timestamp);
    }

    #[test]
    fn test_multiple_contributions() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(IponPayContract, ());
        let client = IponPayContractClient::new(&env, &contract_id);

        let sender1 = Address::generate(&env);
        let sender2 = Address::generate(&env);

        client.record_contribution(&sender1, &100_000_000_i128, &1_700_000_001_u64);
        client.record_contribution(&sender2, &100_000_000_i128, &1_700_000_002_u64);

        let records = client.get_contributions();
        assert_eq!(records.len(), 2);
    }
}
