# Signet inscribe lab

This page builds and broadcasts a Bitcoin inscription without an ord node. It is hard-coded to **signet**. Signet coins have no value. Mainnet addresses (`bc1`, `1`, `3`), mainnet wallet networks, and any non-signet endpoint are refused.

The page is not linked from the INK home page.

The file picker accepts text, HTML, CSS, SVG, PNG, JPEG, GIF, WebP, JSON, PDF, audio (MP3, WAV, OGG), and video (MP4, WebM). Bodies are limited to 390 KB, the usual room in one Bitcoin transaction. Typed text is inscribed as `text/plain;charset=utf-8`. When a browser leaves the file type empty, the extension is used; an unknown extension becomes `application/octet-stream`.

## What runs where

Everything except the public API calls and the wallet prompt runs in the browser. The libraries are pinned copies of [micro-ordinals](https://github.com/paulmillr/micro-ordinals) 0.4.0, [@scure/btc-signer](https://github.com/paulmillr/scure-btc-signer) 2.2.0 (Paul Miller), and [@sats-connect/core](https://www.npmjs.com/package/@sats-connect/core) 0.19.0, bundled into `app.js`. Versions are locked in `package-lock.json`.

No ord node is contacted. There is no Bitcoin Core and no electrum server.

| Step | Who does it |
|---|---|
| Throwaway key, WIF, funding address | Browser, `@scure/btc-signer` |
| Inscription envelope and taproot commit address | Browser, `micro-ordinals` `p2tr_ord_reveal` |
| Commit and reveal transactions | Browser, `@scure/btc-signer` |
| Throwaway-key signatures | Browser, `@scure/btc-signer` |
| Wallet commit signature | Xverse, UniSat, or Fordefi through `@sats-connect/core`, then the page finalizes |
| Fee suggestion | `GET https://mempool.space/signet/api/v1/fees/recommended` |
| Funding UTXOs | `GET https://mempool.space/signet/api/address/<address>/utxo` |
| Broadcast | `POST https://mempool.space/signet/api/tx` with the raw hex |
| Confirmation | `GET https://mempool.space/signet/api/tx/<txid>/status` |

The commit transaction pays the taproot commit address. With a throwaway key, the page signs that commit itself. With a wallet, the page builds an unsigned PSBT from the payment address, skips outputs whose creating transaction reveals an inscription on vout 0, asks the wallet to sign without broadcasting, then finalizes and checks the amount, script, and fee. The reveal transaction spends that output on the script path and sends 546 sats to the destination. For a connected wallet the destination defaults to the ordinals address. The inscription id is `<reveal txid>i0`.

Download the recovery JSON before the commit is signed. It contains the reveal key (WIF and hex), the reveal script, the commit address, and `network: "signet"`. The throwaway path also stores that funding key. The wallet path does not. Recover stuck reveal loads that file, reads the commit address UTXO from mempool.space, and rebuilds or rebroadcasts only the reveal.

Wallet support is listed in [WALLETS.md](./WALLETS.md).

## Faucets

The funding address is a signet `tb1q…` address. Fund it from [signetfaucet.com](https://signetfaucet.com/) or [alt.signetfaucet.com](https://alt.signetfaucet.com/). Then return to this page.
