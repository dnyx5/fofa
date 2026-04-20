# FOFA — Setup Guide

## Quick Start (Frontend + Backend on Vercel)

The app is already configured to deploy on Vercel. Just push to GitHub and it auto-deploys.

```bash
npm install
npm run dev
```

Open http://localhost:5173 — click "Join as a Fan" to navigate to `#portal`.

## DID Passport Features

When a user registers, the backend automatically:

1. Generates an **Ethereum wallet** (address + private key) using ethers.js
2. Creates a **DID** (Decentralised Identifier) in the format `did:fofa:0xABC...`
3. Returns the DID and wallet address in the user profile

### Interaction Types

| Type | Points | Loyalty Dimension |
|------|--------|-------------------|
| Match Attendance | 50 | Passion |
| Merch Purchase | 30 | Engagement |
| Social Media | 10 | Community |

### API Endpoints

**Auth:**
- `POST /api/auth/register` — Register + generate DID
- `POST /api/auth/login` — Login

**Profile:**
- `GET /api/user/profile` — Get profile + passport data
- `PUT /api/user/profile` — Update profile

**Passport (on-chain interactions):**
- `POST /api/passport/interact` — Record an interaction (match, merch, social)
- `GET /api/passport/interactions` — List all interactions
- `GET /api/passport/summary` — Passport summary with badge counts

**Legacy loyalty:**
- `POST /api/loyalty/activity` — Log generic activity
- `GET /api/loyalty/scores` — Get loyalty scores
- `GET /api/loyalty/activities` — List activities

## Smart Contract (Optional — for real on-chain deployment)

The Solidity contract is at `contracts/FOFAPassport.sol`. It provides:

- DID registration tied to Ethereum addresses
- On-chain interaction logging (match attendance, merch, social media)
- Points tracking per user
- View functions for verification

### Deploy to local Hardhat node

```bash
# Terminal 1: Start local Ethereum node
npm run node

# Terminal 2: Deploy contract
npm run compile
npm run deploy:local
```

### Deploy to Sepolia testnet

1. Add your config to `hardhat.config.cjs`:
   ```js
   sepolia: {
     url: process.env.SEPOLIA_RPC_URL,
     accounts: [process.env.DEPLOYER_PRIVATE_KEY],
   }
   ```

2. Run:
   ```bash
   npx hardhat run scripts/deploy.cjs --network sepolia --config hardhat.config.cjs
   ```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `fofa-prod-secret-key-change-this` | JWT signing secret |
| `VITE_API_URL` | `https://fofa-xi.vercel.app/api` | Backend API base URL |
| `FOFA_CONTRACT_ADDRESS` | — | Deployed contract address (optional) |
| `SEPOLIA_RPC_URL` | — | Sepolia RPC endpoint (optional) |
| `DEPLOYER_PRIVATE_KEY` | — | Deployer wallet key (optional) |
