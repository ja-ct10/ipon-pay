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

/// A single payout record stored on-chain.
#[contracttype]
#[derive(Clone)]
pub struct PayoutRecord {
    pub recipient: Address,
    pub amount_stroops: i128,
    pub cycle_number: u32,
    pub timestamp: u64,
}

/// The IponPay smart contract.
/// Stores contribution and payout records in instance storage and emits events.
#[contract]
pub struct IponPayContract;

#[contractimpl]
impl IponPayContract {
    /// Record a new contribution on-chain.
    /// No auth required — the Horizon payment transaction already proves the sender
    /// made the contribution. This is called fire-and-forget after the Horizon payment.
    pub fn record_contribution(
        env: Env,
        sender: Address,
        amount_stroops: i128,
        timestamp: u64,
    ) {
        // No require_auth() — open recording, validated by Horizon payment proof

        let key = symbol_short!("contribs");

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

        // Emit event so Stellar Expert can index it
        env.events().publish(
            (symbol_short!("contrib"), sender),
            (amount_stroops, timestamp),
        );
    }

    /// Record a payout on-chain.
    /// Called by the pool account after sending XLM to a recipient.
    /// The pool account (caller) must authorize this call.
    pub fn record_payout(
        env: Env,
        caller: Address,
        recipient: Address,
        amount_stroops: i128,
        cycle_number: u32,
        timestamp: u64,
    ) {
        caller.require_auth();

        let key = symbol_short!("payouts");

        let mut records: Vec<PayoutRecord> = env
            .storage()
            .instance()
            .get(&key)
            .unwrap_or(Vec::new(&env));

        records.push_back(PayoutRecord {
            recipient: recipient.clone(),
            amount_stroops,
            cycle_number,
            timestamp,
        });

        env.storage().instance().set(&key, &records);

        // Emit event visible on Stellar Expert
        env.events().publish(
            (symbol_short!("payout"), recipient),
            (amount_stroops, cycle_number, timestamp),
        );
    }

    /// Retrieve all stored contribution records.
    pub fn get_contributions(env: Env) -> Vec<ContributionRecord> {
        env.storage()
            .instance()
            .get(&symbol_short!("contribs"))
            .unwrap_or(Vec::new(&env))
    }

    /// Retrieve all stored payout records.
    pub fn get_payouts(env: Env) -> Vec<PayoutRecord> {
        env.storage()
            .instance()
            .get(&symbol_short!("payouts"))
            .unwrap_or(Vec::new(&env))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_record_and_retrieve_contribution() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(IponPayContract, ());
        let client = IponPayContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        client.record_contribution(&sender, &100_000_000_i128, &1_700_000_000_u64);

        let records = client.get_contributions();
        assert_eq!(records.len(), 1);
        assert_eq!(records.get(0).unwrap().amount_stroops, 100_000_000);
    }

    #[test]
    fn test_record_and_retrieve_payout() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(IponPayContract, ());
        let client = IponPayContractClient::new(&env, &contract_id);

        let pool = Address::generate(&env);
        let recipient = Address::generate(&env);
        client.record_payout(&pool, &recipient, &200_000_000_i128, &1_u32, &1_700_000_100_u64);

        let payouts = client.get_payouts();
        assert_eq!(payouts.len(), 1);
        assert_eq!(payouts.get(0).unwrap().cycle_number, 1);
        assert_eq!(payouts.get(0).unwrap().amount_stroops, 200_000_000);
    }
}
