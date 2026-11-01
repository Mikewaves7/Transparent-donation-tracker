# ClearLedger — Stellar Transparent Donation Tracker

A React + TypeScript donation transparency dashboard built on Stellar. It reads public payment operations from Stellar Horizon and supports native XLM donations through Freighter.

## Features
- Connect a Freighter wallet and read its native XLM balance (Testnet).
- Set any Stellar public account as the receiving donation wallet.
- Fetch up to 100 recent native XLM payments to that account directly from Horizon.
- Calculate donation totals from successful on-chain payment records.
- Search donors, memo text and transaction hashes.
- Open each payment in Stellar Expert for independent verification.
- Submit XLM donations with an optional public memo after Freighter approval.
- Responsive dashboard built with React, TypeScript, Vite and Lucide icons.

## Run locally
```bash
npm install
npm run dev
```

Build:
```bash
npm run build
```

## Stellar network
This starter is configured for **Stellar Testnet**:
- Horizon: https://horizon-testnet.stellar.org
- Explorer: https://stellar.expert/explorer/testnet
- Friendbot: https://friendbot.stellar.org/

Install the Freighter browser extension, switch it to Testnet, and fund a test account with Friendbot. The receiving address must be a funded/active Stellar account.

## Important transparency notes
- The tracker reads the public Stellar ledger; it does not custody donations.
- The dashboard currently tracks native XLM payment operations only. It excludes issued assets, path payments and other operation types.
- It shows the latest 100 payments returned by Horizon, not a complete paginated lifetime history.
- The displayed total is the sum of those returned records.
- The app cannot identify a donor's real-world identity; it displays the sending public key.
- A memo is public and should not contain private or sensitive information.
- Testnet XLM has no monetary value. Do not use this prototype to solicit or hold real funds.
- The dashboard's receiving address preference is stored in the browser's local storage. The donation records themselves are fetched from Stellar.

## Deploy to GitHub Pages
The included workflow builds the TypeScript app and deploys the `dist` directory. In repository Settings → Pages, set **Source** to **GitHub Actions**.
