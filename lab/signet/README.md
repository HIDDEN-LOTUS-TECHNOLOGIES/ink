# Signet inscribe lab

This page builds and broadcasts a Bitcoin inscription without an ord node and without a wallet extension. It is hard-coded to **signet**. Signet coins have no value. Mainnet addresses (`bc1`, `1`, `3`) and any non-signet endpoint are refused.

The page is not linked from the INK home page.

## What runs where

Everything except the three public API calls runs in the browser. The libraries are pinned copies of [micro-ordinals](https://github.com/paulmillr/micro-ordinals) 0.4.0 and [@scure/btc-signer](https://github.com/paulmillr/scure-btc-signer) 2.2.0 (Paul Miller), bundled into `app.js`. Versions are locked in `package-lock.json`.

No ord node is contacted. There is no Bitcoin Core, no electrum server, and no wallet extension.

| Step | Who does it |
|---|---|
| Throwaway key, WIF, funding address | Browser, `@scure/btc-signer` |
| Inscription envelope and taproot commit address | Browser, `micro-ordinals` `p2tr_ord_reveal` |
| Commit and reveal transactions, signatures | Browser, `@scure/btc-signer` |
| Fee suggestion | `GET https://mempool.space/signet/api/v1/fees/recommended` |
| Funding UTXOs | `GET https://mempool.space/signet/api/address/<address>/utxo` |
| Broadcast | `POST https://mempool.space/signet/api/tx` with the raw hex |
| Confirmation | `GET https://mempool.space/signet/api/tx/<txid>/status` |

The commit transaction pays the taproot commit address from the throwaway key. The reveal transaction spends that output on the script path and sends 546 sats to the destination. The inscription id is `<reveal txid>i0`.

Download the recovery JSON before the commit is built. It contains the reveal key (WIF and hex), the funding key, the reveal script, the commit address, and `network: "signet"`. Recover stuck reveal loads that file, reads the commit address UTXO from mempool.space, and rebuilds or rebroadcasts only the reveal.

## Faucets

The funding address is a signet `tb1q…` address. Fund it from [signetfaucet.com](https://signetfaucet.com/) or [alt.signetfaucet.com](https://alt.signetfaucet.com/). Then return to this page.
