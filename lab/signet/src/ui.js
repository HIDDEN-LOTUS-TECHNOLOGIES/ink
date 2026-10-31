import {
  FAUCETS, MAX_BODY, NETWORK_NAME, POSTAGE,
  assertFeeRate, assertSignetAddress, buildCommit, buildReveal, createKey,
  keyFromHex, planFromRecovery, preparePlan, recoveryFile, signetUrl, textBody,
} from './inscribe.js';

const STORE = 'ink-signet-funding-v1';
const $ = (s) => document.querySelector(s);
const sats = (n) => `${n.toString()} sats`;

let funding = null;
let plan = null;
let revealKey = null;
let built = null;
let downloaded = false;

function log(msg) {
  const el = $('#log');
  el.textContent = msg;
  el.hidden = !msg;
}

function setBusy(on) {
  document.body.classList.toggle('busy', on);
}

function loadFunding() {
  const saved = localStorage.getItem(STORE);
  if (saved) {
    try { return keyFromHex(saved); } catch { /* replace a corrupt key */ }
  }
  const key = createKey();
  localStorage.setItem(STORE, key.hex);
  return key;
}

function showFunding() {
  $('#addr').textContent = funding.address;
  $('#dest').value = $('#dest').value || funding.address;
  for (const a of document.querySelectorAll('[data-faucet]')) {
    const url = new URL(a.dataset.faucet);
    url.searchParams.set('address', funding.address);
    a.href = url.toString();
  }
}

function contentFromForm() {
  const file = $('#file').files && $('#file').files[0];
  if (file) {
    if (file.size > MAX_BODY) throw new Error(`File is ${file.size} bytes. The limit is ${MAX_BODY} bytes.`);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read the file.'));
      reader.onload = () => resolve({
        body: new Uint8Array(reader.result),
        contentType: file.type || 'application/octet-stream',
        label: file.name,
      });
      reader.readAsArrayBuffer(file);
    });
  }
  const text = $('#text').value;
  if (!text) throw new Error('Choose a file or type some text.');
  return Promise.resolve({ body: textBody(text), contentType: 'text/plain;charset=utf-8', label: 'typed text' });
}

function downloadJson(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function fetchFees() {
  const url = signetUrl('/signet/api/v1/fees/recommended');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fee API ${res.status}`);
  const data = await res.json();
  const rate = Number(data.halfHourFee || data.fastestFee || data.minimumFee);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('Fee API returned no rate.');
  $('#fee').value = String(rate);
  $('#feeNote').textContent = `Prefilled from mempool.space signet (half hour ${rate} sat/vB).`;
}

async function onPrepare() {
  setBusy(true);
  log('');
  try {
    const content = await contentFromForm();
    const dest = assertSignetAddress($('#dest').value);
    const feeRate = assertFeeRate($('#fee').value);
    revealKey = createKey();
    plan = preparePlan({
      body: content.body,
      contentType: content.contentType,
      revealPriv: revealKey.priv,
      dest,
      feeRate,
    });
    downloaded = false;
    built = null;
    $('#commitAddr').textContent = plan.commitAddress;
    $('#need').textContent = `Commit output ${sats(plan.commitValue)} (postage ${sats(plan.postage)} + reveal fee ${sats(plan.revealFee)}). You also need a commit fee, so fund more than that.`;
    $('#prepareBox').hidden = false;
    $('#buildBox').hidden = true;
    $('#broadcastBox').hidden = true;
    $('#buildBtn').disabled = true;
    log(`Envelope ready for ${content.label} (${content.body.length} bytes, ${content.contentType}). Download the recovery file before building the commit.`);
  } catch (err) {
    log(err.message || String(err));
  } finally {
    setBusy(false);
  }
}

function onDownload() {
  if (!plan) return;
  downloadJson(`ink-signet-recovery-${plan.commitAddress.slice(0, 12)}.json`, recoveryFile(plan, funding));
  downloaded = true;
  $('#buildBtn').disabled = false;
  log('Recovery file downloaded. You can build the commit now.');
}

async function onBuild() {
  if (!plan || !downloaded) return;
  setBusy(true);
  log('');
  try {
    const url = signetUrl(`/signet/api/address/${funding.address}/utxo`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`UTXO lookup failed (${res.status}).`);
    const utxos = await res.json();
    const commit = buildCommit({ funding, utxos, plan });
    const reveal = buildReveal({ plan, commitTxid: commit.txid, commitVout: 0, commitValue: plan.commitValue });
    built = { commit, reveal };
    $('#commitHex').value = commit.hex;
    $('#revealHex').value = reveal.hex;
    $('#feeLine').textContent = [
      `Commit ${commit.bytes} bytes, ${commit.vbytes} vB, fee ${sats(commit.fee)}`,
      `Reveal ${reveal.bytes} bytes, ${reveal.vbytes} vB, fee ${sats(reveal.fee)}`,
      `Postage ${sats(plan.postage)} to ${plan.destination}`,
      changeLine(commit.change),
    ].join('\n');
    $('#buildBox').hidden = false;
    log('Signed locally. Nothing has been broadcast yet.');
  } catch (err) {
    log(err.message || String(err));
  } finally {
    setBusy(false);
  }
}

function changeLine(change) {
  return change > 0n ? `Change ${sats(change)} back to the funding address.` : 'No change output.';
}

async function broadcast(raw) {
  const res = await fetch(signetUrl('/signet/api/tx'), {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: raw,
  });
  const text = (await res.text()).trim();
  if (!res.ok) throw new Error(text || `Broadcast failed (${res.status}).`);
  if (!/^[0-9a-f]{64}$/i.test(text)) throw new Error(text || 'Unexpected broadcast response.');
  return text;
}

async function onBroadcast() {
  if (!built) return;
  setBusy(true);
  try {
    const commitId = await broadcast(built.commit.hex);
    log('Commit is in the mempool. Waiting until it is visible, then broadcasting the reveal.');
    await waitSeen(commitId);
    const revealId = await broadcast(built.reveal.hex);
    showResult(commitId, revealId);
    pollBoth(commitId, revealId);
  } catch (err) {
    log(err.message || String(err));
  } finally {
    setBusy(false);
  }
}

function explorer(txid) {
  return `https://mempool.space/signet/tx/${txid}`;
}

function showResult(commitId, revealId) {
  $('#broadcastBox').hidden = false;
  $('#commitLink').href = explorer(commitId);
  $('#commitLink').textContent = commitId;
  $('#revealLink').href = explorer(revealId);
  $('#revealLink').textContent = revealId;
  $('#insc').textContent = `${revealId}i0`;
}

async function waitSeen(txid) {
  for (let i = 0; i < 20; i++) {
    const res = await fetch(signetUrl(`/signet/api/tx/${txid}/status`));
    if (res.ok) return;
    await sleep(2000);
  }
  throw new Error('Commit was broadcast but mempool.space has not seen it yet. Use Recover stuck reveal after it shows up.');
}

async function pollBoth(commitId, revealId) {
  const status = $('#confirm');
  for (let i = 0; i < 60; i++) {
    const [c, r] = await Promise.all([txStatus(commitId), txStatus(revealId)]);
    status.textContent = `Commit ${c}. Reveal ${r}.`;
    if (c === 'confirmed' && r === 'confirmed') return;
    await sleep(10000);
  }
  status.textContent += ' Still waiting. Signet blocks can be slow. The explorer links stay valid.';
}

async function txStatus(txid) {
  const res = await fetch(signetUrl(`/signet/api/tx/${txid}/status`));
  if (!res.ok) return 'not seen yet';
  const data = await res.json();
  return data.confirmed ? `confirmed in block ${data.block_height}` : 'in mempool';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function onRecover(ev) {
  const file = ev.target.files && ev.target.files[0];
  ev.target.value = '';
  if (!file) return;
  setBusy(true);
  log('');
  try {
    const rec = JSON.parse(await file.text());
    if (rec.network !== NETWORK_NAME) throw new Error('Recovery file is not for signet.');
    const { plan: restored } = planFromRecovery(rec);
    const res = await fetch(signetUrl(`/signet/api/address/${restored.commitAddress}/utxo`));
    if (!res.ok) throw new Error(`Could not load commit UTXOs (${res.status}).`);
    const utxos = await res.json();
    if (!utxos.length) throw new Error('No coins are sitting on the commit address. The commit may not be broadcast yet.');
    const utxo = utxos.find((u) => BigInt(u.value) === BigInt(rec.commitValue)) || utxos[0];
    const reveal = buildReveal({
      plan: restored,
      commitTxid: utxo.txid,
      commitVout: utxo.vout,
      commitValue: BigInt(utxo.value),
    });
    if (reveal.fee <= 0n) throw new Error('Reveal fee is not covered by the commit output.');
    $('#recoverHex').value = reveal.hex;
    $('#recoverMeta').textContent = `Reveal ${reveal.txid}, ${reveal.vbytes} vB, fee ${sats(reveal.fee)}, postage ${sats(reveal.tx.getOutput(0).amount)}.`;
    $('#recoverBox').hidden = false;
    $('#rebroadcast').onclick = async () => {
      setBusy(true);
      try {
        const id = await broadcast(reveal.hex);
        log(`Reveal rebroadcast. ${id}`);
        $('#recoverLink').hidden = false;
        $('#recoverLink').href = explorer(id);
        $('#recoverLink').textContent = id;
        pollBoth(utxo.txid, id);
      } catch (err) {
        log(err.message || String(err));
      } finally {
        setBusy(false);
      }
    };
    log('Reveal rebuilt from the recovery file. Nothing has been broadcast yet.');
  } catch (err) {
    log(err.message || String(err));
  } finally {
    setBusy(false);
  }
}

function resetPlan() {
  plan = null;
  built = null;
  downloaded = false;
  $('#prepareBox').hidden = true;
  $('#buildBox').hidden = true;
  $('#broadcastBox').hidden = true;
  $('#buildBtn').disabled = true;
}

$('#newKey').onclick = () => {
  if (!confirm('Replace the throwaway signet key in this browser? Coins on the old address will not move with it.')) return;
  funding = createKey();
  localStorage.setItem(STORE, funding.hex);
  $('#dest').value = funding.address;
  showFunding();
  resetPlan();
  log('New throwaway signet key. Fund the new address. The old key is no longer stored here.');
};

$('#prepare').onclick = () => { onPrepare(); };
$('#download').onclick = () => { onDownload(); };
$('#buildBtn').onclick = () => { onBuild(); };
$('#broadcast').onclick = () => { onBroadcast(); };
$('#recoverFile').addEventListener('change', onRecover);
$('#file').addEventListener('change', resetPlan);
$('#text').addEventListener('input', resetPlan);
$('#dest').addEventListener('change', resetPlan);
$('#fee').addEventListener('change', resetPlan);

funding = loadFunding();
showFunding();
fetchFees().catch((err) => {
  $('#fee').value = '1';
  $('#feeNote').textContent = `Could not read the fee API (${err.message}). Defaulted to 1 sat/vB.`;
});
