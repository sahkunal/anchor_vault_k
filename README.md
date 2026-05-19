# Anchor Vault

A Solana smart contract built with Anchor that implements a secure vault system. Users can create personal vaults to deposit, withdraw, and manage SOL with an optional maximum deposit cap.

## Features

- Initialize a personal vault with an optional max deposit amount
- Deposit SOL into your vault (enforces max cap if set)
- Withdraw SOL from your vault
- Close your vault and recover all rent + funds
- Full event emission for all instructions

## Program ID

```
J7WXWVRDufJgboFhX26dnEsi9mr3dyY6Ch293kHfeKbG
```

## Project Structure

```
anchor_vault_k/
├── programs/
│   └── anchor_vault_k/
│       └── src/
│           ├── lib.rs               # Program entrypoint
│           ├── constants.rs         # Seeds and constants
│           ├── error.rs             # Custom error codes
│           ├── events.rs            # Event definitions
│           ├── helpers.rs           # Shared transfer logic
│           ├── state/
│           │   └── vault_state.rs   # VaultState account struct
│           └── instructions/
│               ├── initialize.rs    # Initialize vault
│               ├── deposit.rs       # Deposit SOL
│               ├── withdraw.rs      # Withdraw SOL
│               └── close.rs        # Close vault
├── tests/
│   ├── utils.ts                     # Test helpers and setup
│   ├── vault_with_max_amount.ts     # Tests for capped vault
│   └── vault_without_max_amount.ts  # Tests for uncapped vault
├── Anchor.toml
├── Cargo.toml
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Instructions

### `initialize(max_amount: Option<u64>)`
Creates a new vault for the signer. Optionally set a maximum deposit cap in lamports.

### `deposit(amount: u64)`
Deposits SOL into the vault. If a max cap is set, the total balance after deposit must not exceed it.

### `withdraw(amount: u64)`
Withdraws SOL from the vault back to the user. Requires sufficient balance.

### `close()`
Closes the vault, transfers all remaining SOL back to the user, and recovers rent from the state account.

## Accounts

### `VaultState`
| Field | Type | Description |
|---|---|---|
| `vault_bump` | `u8` | Bump seed for the vault PDA |
| `state_bump` | `u8` | Bump seed for the state PDA |
| `max_amount` | `Option<u64>` | Optional deposit cap in lamports |

### PDAs
- **Vault State**: `["state", user_pubkey]`
- **Vault**: `["vault", vault_state_pubkey]`

## Error Codes

| Error | Description |
|---|---|
| `InvalidAmount` | Amount must be greater than zero |
| `MathOverflow` | Arithmetic overflow on balance calculation |
| `DepositExceedsMax` | Deposit would exceed the vault's max amount |
| `InsufficientFunds` | Vault balance is less than requested withdrawal |

## Prerequisites

- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) `>= 2.x`
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) `>= 1.x`
- [Node.js](https://nodejs.org/) `>= 18`
- [Yarn](https://yarnpkg.com/)

## Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd anchor_vault_k

# Install JS dependencies
yarn install

# Build the program
anchor build
```

## Running Tests

### TypeScript Integration Tests (Vitest)

Start a local validator first (in a separate terminal):

```bash
solana-test-validator
```

Then run:

```bash
anchor test --skip-local-validator
```

### Rust Unit Tests (LiteSVM) — coming soon

```bash
anchor run testlitesvm
```

## Development Notes

- Always run `anchor test` from the Linux filesystem (not `/mnt/c/`) if using WSL
- Set your Solana CLI to localnet before testing:
  ```bash
  solana config set --url localhost
  ```
- After making program changes, run `anchor build` before testing

## License

MIT
