# Wallets on the signet lab

Pinned library: `@sats-connect/core` 0.19.0 (15 Oct 2026), locked in `package-lock.json` and bundled into `app.js`. The page asks that library for its default adapters and also lists anything already sitting in `window.btc_providers`. It does not call `getProviders()`, because that function creates `window.btc_providers = []` when the array is missing.

A real browser extension was not exercised here. The notes below are from the vendored source and from each wallet's docs.

## What 0.19.0 ships

`DefaultAdaptersInfo` in `dist/index.mjs` names three adapters:

| Name in the library | Provider id on `window` | Adapter |
|---|---|---|
| Fordefi | `FordefiProviders.UtxoProvider` | `FordefiAdapter` |
| Xverse | `XverseProviders.BitcoinProvider` | `XverseAdapter` |
| Unisat | `unisat` | `UnisatAdapter` |

`getProviderById` walks that id as a dotted path on `window`. `getProviders` returns `window.btc_providers`. Xverse's own docs still mark WBIP004 detection as upcoming ([Wallet Providers](https://docs.xverse.app/sats-connect/wallet-providers)), while this vendored build already reads the array.

`wallet_connect` takes `network` of `Mainnet`, `Testnet`, or `Signet`. This page always sends `Signet`, plus payment and ordinals address purposes. If the wallet answers with any other network, the page stops and tells the user to open the wallet's network menu and choose Signet. A `bc1`, `1`, or `3` address is refused even if the wallet claims Signet.

### Xverse

Xverse returns two addresses. The payment address is P2SH-P2WPKH (`2…`) or P2WPKH (`tb1q…`). The ordinals address is P2TR (`tb1p…`). The commit spends payment UTXOs and sends change back there. The reveal postage goes to the ordinals address. A nested-segwit input includes the P2WPKH redeem script built from the 33-byte payment key. A taproot payment input includes that key as `tapInternalKey`.

Signing uses `signPsbt` with `broadcast: false`. The page finalizes.

### UniSat

UniSat exposes one account address. This page uses it for both payment and ordinals. Connect does not go through `UnisatAdapter`: that adapter has no `wallet_connect` method. The page calls `window.unisat.switchChain('BITCOIN_SIGNET')`, then `requestAccounts` and `getPublicKey`.

`BITCOIN_SIGNET` is the signet enum in [Supported Chains](https://docs.unisat.io/developer-support/open-api-documentation/unisat-wallet/supported-chains.md). The `network` field on that chain is `testnet` because UniSat uses it for the address format, not for the chain. This page checks `enum === 'BITCOIN_SIGNET'`.

`signPsbt` is documented as `signPsbt(psbtHex, { autoFinalized, toSignInputs })` on the [UniSat Wallet API](https://docs.unisat.io/dev/unisat-developer-center/unisat-wallet). `autoFinalized: false` leaves the PSBT unsigned-final so this page can check it. In 0.19.0, `UnisatAdapter.signPsbt` already forwards `autoFinalized: broadcast`. The throw `"Signing without broadcasting is not supported by this wallet provider"` is in `sendTransfer`, not in `signPsbt`. The page still calls `window.unisat.signPsbt` directly whenever the connected provider is UniSat and `broadcast` is false, and again if any adapter returns that error. A 33-byte key on a `tb1p` address is stored as the 32-byte x-only key.

### Fordefi

Fordefi is a default adapter and uses the same `wallet_connect` / `signPsbt` path as Xverse. There is no extra fallback in this page.

## Leather, OKX, Magic Eden, Phantom

None of these four are default adapters in 0.19.0. If one of them has pushed an entry into `window.btc_providers`, the picker lists it and connect tries Sats Connect `wallet_connect` on `window[<id>]`. That only works when the object at that id speaks Sats Connect. The fallbacks below are what their docs say to call instead. This page does not call them.

### Leather

Current docs tell you to detect [`window.LeatherProvider`](https://leather.gitbook.io/developers), not `window.btc_providers`. An older in-page script did push `{ id: 'LeatherProvider', name: 'Leather' }` and was removed on 21 Feb 2025 in [leather-io/extension@70bd419](https://github.com/leather-io/extension/commit/70bd419ac3c78b9bdf1e19ddf0740e245f339636).

Fallback, from [signPsbt](https://leather.gitbook.io/developers/bitcoin-methods/signpsbt): `LeatherProvider.request('getAddresses')`, then `request('signPsbt', { hex, network: 'signet', broadcast: false })`. `broadcast` defaults to false and the response `hex` is a signed PSBT for the app to finalize. Leather's method name is `getAddresses` / `signPsbt`, not Sats Connect's `wallet_connect`.

### OKX

The OKX provider docs do not mention `window.btc_providers`. They inject `window.okxwallet.bitcoin`, `window.okxwallet.bitcoinTestnet`, and `window.okxwallet.bitcoinSignet`.

Fallback, from [Provider API (Signet)](https://web3.okx.com/onchainos/dev-docs/wallet/dapp-connect/chains/bitcoin/provider-signet) (extension 2.82.32 or newer): `okxwallet.bitcoinSignet.connect()`, then `okxwallet.bitcoinSignet.signPsbt(psbtHex, { autoFinalized: false, toSignInputs })`. `connect()` returns one `address` and one `publicKey`. The sample response on that page is a `bc1` address, so a caller still has to refuse mainnet. The mainnet object is documented at [Provider API](https://web3.okx.com/onchainos/dev-docs/wallet/dapp-connect/chains/bitcoin/provider). Using `okxwallet.bitcoin` on this page would be a mainnet signer, so the signet object is the one that matches.

### Magic Eden

[Detecting the Provider](https://docs-wallet.magiceden.io/bitcoin/detecting-the-provider) says the wallet injects `window.magicEden.bitcoin` (check `isMagicEden`) and also tries `window.BitcoinProvider`. Those pages do not mention `window.btc_providers`. The provider does speak Sats Connect methods if the app passes that object in itself: [Provider API Methods](https://docs-wallet.magiceden.io/bitcoin/provider-api-methods) and [Connecting to the Wallet](https://docs-wallet.magiceden.io/bitcoin/connecting-to-the-wallet).

Fallback: call `window.magicEden.bitcoin.request` with Sats Connect `wallet_connect` (`network: 'Signet'`) and `signPsbt` (`broadcast: false`). Their examples pass `BitcoinNetworkType.Mainnet`. This page would still refuse a mainnet address.

### Phantom

[Detect the provider](https://docs.phantom.com/bitcoin/detecting-the-provider) says to use `window.phantom.bitcoin` (`isPhantom`). The [provider API](https://docs.phantom.com/bitcoin/provider-api-reference) does not mention `window.btc_providers`. `requestAccounts()` returns payment and ordinals addresses. `signPSBT` takes a `Uint8Array` PSBT, not a Sats Connect base64 request.

[Updates](https://docs.phantom.com/updates) (week of 15 June 2026) deprecate `window.phantom.bitcoin`. The published examples use mainnet `bc1` addresses and do not document a signet switch. A fallback would be that deprecated `signPSBT` plus a signet check on the returned addresses. It is not wired.
