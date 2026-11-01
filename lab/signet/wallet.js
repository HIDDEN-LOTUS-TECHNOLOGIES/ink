// Signet wallet adapter. Reusable by later toolkit pages.
// Vendored @sats-connect/core talks to Xverse, UniSat, and Fordefi.
// UniSat cannot sign a PSBT through that adapter without broadcasting, so
// broadcast:false goes straight to window.unisat.signPsbt.

import {
  AddressPurpose,
  BaseAdapter,
  BitcoinNetworkType,
  DefaultAdaptersInfo,
  defaultAdapters,
} from '@sats-connect/core';
import { assertSignetAddress } from './src/inscribe.js';

export const SIGNET = BitcoinNetworkType.Signet;
const UNISAT_ID = DefaultAdaptersInfo.unisat.id;
const NO_BROADCAST = /signing without broadcasting is not supported/i;

export function listWallets(win = globalThis) {
  const defaults = Object.values(DefaultAdaptersInfo).map((info) => ({
    id: info.id,
    name: info.name,
    installed: Boolean(providerAt(win, info.id)),
    source: 'sats-connect',
  }));
  const known = new Set(defaults.map((w) => w.id));
  const extra = (win.btc_providers || [])
    .filter((p) => p && p.id && !known.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.name || p.id,
      installed: Boolean(providerAt(win, p.id)),
      source: 'btc_providers',
    }));
  return [...defaults, ...extra];
}

function providerAt(win, id) {
  return String(id).split('.').reduce((acc, part) => acc?.[part], win);
}

function adapterFor(id) {
  const Ctor = defaultAdapters[id];
  return Ctor ? new Ctor() : new BaseAdapter(id);
}

function pubkeyHex(address, publicKey) {
  let s = String(publicKey || '').replace(/^0x/, '').toLowerCase();
  if (!/^[0-9a-f]*$/.test(s) || s.length % 2) return '';
  const taproot = String(address || '').toLowerCase().startsWith('tb1p');
  if (taproot && s.length === 66 && (s.startsWith('02') || s.startsWith('03'))) s = s.slice(2);
  return s;
}

function sessionFromAddresses(addresses, network, providerId) {
  const payment = addresses.find((a) => a.purpose === AddressPurpose.Payment || a.purpose === 'payment');
  const ordinals = addresses.find((a) => a.purpose === AddressPurpose.Ordinals || a.purpose === 'ordinals') || payment;
  if (!payment) throw new Error('The wallet did not share a payment address.');
  if (network && network !== SIGNET && network !== 'Signet') {
    throw new Error(`Wallet is on ${network}, not Signet. In the wallet, open the network menu and choose Signet, then connect again.`);
  }
  for (const addr of [payment.address, ordinals.address]) assertSignetAddress(addr);
  return {
    paymentAddress: payment.address,
    paymentPubkey: pubkeyHex(payment.address, payment.publicKey),
    ordinalsAddress: ordinals.address,
    ordinalsPubkey: pubkeyHex(ordinals.address, ordinals.publicKey),
    network: 'Signet',
    providerId,
  };
}

async function connectUnisat(win) {
  const unisat = win.unisat;
  if (!unisat?.requestAccounts) throw new Error('UniSat is not installed.');
  let chain;
  try {
    chain = await unisat.switchChain('BITCOIN_SIGNET');
  } catch (err) {
    throw new Error(`UniSat did not switch to Bitcoin Signet. Open UniSat and choose Bitcoin Signet, then connect again. ${err.message || ''}`.trim());
  }
  if (chain?.enum !== 'BITCOIN_SIGNET') {
    throw new Error('UniSat is not on Bitcoin Signet. Open UniSat and choose Bitcoin Signet, then connect again.');
  }
  const accounts = await unisat.requestAccounts();
  const publicKey = await unisat.getPublicKey();
  const address = accounts?.[0];
  return sessionFromAddresses([
    { address, publicKey, purpose: 'payment' },
    { address, publicKey, purpose: 'ordinals' },
  ], 'Signet', UNISAT_ID);
}

function base64ToHex(b64) {
  const raw = atob(b64);
  let hex = '';
  for (let i = 0; i < raw.length; i++) hex += raw.charCodeAt(i).toString(16).padStart(2, '0');
  return hex;
}

function hexToBase64(hex) {
  const clean = String(hex).replace(/^0x/, '').trim();
  if (clean.startsWith('cHNidP')) return clean;
  let raw = '';
  for (let i = 0; i < clean.length; i += 2) raw += String.fromCharCode(Number.parseInt(clean.slice(i, i + 2), 16));
  return btoa(raw);
}

async function signUnisat(win, psbtBase64, inputsToSign) {
  if (!win.unisat?.signPsbt) throw new Error('UniSat is not installed.');
  const signedHex = await win.unisat.signPsbt(base64ToHex(psbtBase64), {
    autoFinalized: false,
    toSignInputs: inputsToSign.map((input) => {
      const row = { index: input.index };
      if (input.address) row.address = input.address;
      if (input.publicKey) row.publicKey = input.publicKey;
      return row;
    }),
  });
  return hexToBase64(signedHex);
}

export function createWallet(options = {}) {
  const win = options.win || globalThis;
  let adapter = null;
  let connected = null;

  return {
    list: () => listWallets(win),
    connected: () => connected,
    async connect(providerId) {
      if (providerId === UNISAT_ID) {
        connected = await connectUnisat(win);
        adapter = null;
        return connected;
      }
      adapter = options.makeAdapter ? options.makeAdapter(providerId) : adapterFor(providerId);
      const response = await adapter.request('wallet_connect', {
        addresses: [AddressPurpose.Payment, AddressPurpose.Ordinals],
        network: 'Signet',
        message: 'INK signet lab',
      });
      if (!response || response.status === 'error') {
        throw new Error(response?.error?.message || 'Wallet connect failed.');
      }
      const result = response.result;
      const network = result.network?.bitcoin?.name;
      connected = sessionFromAddresses(result.addresses || [], network, providerId);
      return connected;
    },
    async signPsbt(psbtBase64, inputsToSign, { broadcast = false } = {}) {
      if (broadcast !== false) throw new Error('This page never asks a wallet to broadcast.');
      if (!connected) throw new Error('Connect a signet wallet first.');
      if (connected.providerId === UNISAT_ID) return signUnisat(win, psbtBase64, inputsToSign);
      const signInputs = {};
      for (const input of inputsToSign) {
        (signInputs[input.address] ||= []).push(input.index);
      }
      try {
        const response = await adapter.request('signPsbt', { psbt: psbtBase64, signInputs, broadcast: false });
        if (!response || response.status === 'error') {
          const message = response?.error?.message || 'Wallet refused to sign.';
          if (NO_BROADCAST.test(message)) return signUnisat(win, psbtBase64, inputsToSign);
          throw new Error(message);
        }
        return response.result.psbt;
      } catch (err) {
        if (NO_BROADCAST.test(err.message || '')) return signUnisat(win, psbtBase64, inputsToSign);
        throw err;
      }
    },
    async disconnect() {
      try { await adapter?.request('wallet_disconnect', null); } catch { /* already gone */ }
      adapter = null;
      connected = null;
    },
  };
}
