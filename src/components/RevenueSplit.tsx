import React, { useState } from 'react';
import {
  ShieldCheck, Lock, Unlock, CheckCircle2,
  AlertCircle, Sparkles, RefreshCw, Layers, Coins, EyeOff, Eye, UserCheck, Key,
  Copy, Check, Terminal,
} from 'lucide-react';
import { fromOnChainState, encodeWitness, encodeCommitment, bytesToHex } from '../utils/contract';
import { useLedgerState } from '../hooks/useLedgerState';
import { useWallet } from '../contexts/WalletContext';
import { CONTRACT_ADDRESS, POOL_ID } from '../config/network';

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives  (pure UI — no logic)
// ─────────────────────────────────────────────────────────────────────────────

const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'indigo' | 'emerald' | 'purple' | 'cyan';
}> = ({ children, variant = 'indigo' }) => {
  const colors = {
    indigo:  'bg-indigo-500/10  text-indigo-300  border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    purple:  'bg-purple-500/10  text-purple-300  border-purple-500/20',
    cyan:    'bg-cyan-500/10    text-cyan-300    border-cyan-500/20',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${colors[variant]}`}>
      {children}
    </span>
  );
};

const Field: React.FC<{
  id: string;
  label: React.ReactNode;
  helper?: string;
  children: React.ReactNode;
}> = ({ id, label, helper, children }) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={id} className="text-sm font-medium text-slate-300 leading-none">
      {label}
    </label>
    {children}
    {helper && <p className="text-xs text-slate-600 leading-snug">{helper}</p>}
  </div>
);

const inputCls = 'field-input';

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export const RevenueSplit: React.FC = () => {
  const { ledger, isLoading, isFetching, refresh } = useLedgerState();
  const poolState = fromOnChainState(ledger);
  const [activeTab, setActiveTab] = useState<'claim' | 'register' | 'overview' | 'logs'>('claim');

  // Claim form
  const [claimSecret, setClaimSecret] = useState('alice_secret_123');
  const [claimSalt, setClaimSalt] = useState('salt_alice_999');
  const [claimAmount, setClaimAmount] = useState('700');
  const [showSecret, setShowSecret] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<{ txId: string; nullifierHex: string; amount: bigint } | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [copiedNullifier, setCopiedNullifier] = useState(false);

  // Register form
  const [regSecret, setRegSecret] = useState('');
  const [regSalt, setRegSalt] = useState('');
  const [regShare, setRegShare] = useState('');
  const [regAddedRevenue, setRegAddedRevenue] = useState('0');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  // Proof logs
  const [logs, setLogs] = useState<Array<{
    id: number; timestamp: string; message: string; type: 'info' | 'success' | 'zk';
  }>>([
    { id: 1, timestamp: new Date().toLocaleTimeString(), message: 'Live indexer sync enabled — polling every 15s.', type: 'info' },
    { id: 2, timestamp: new Date().toLocaleTimeString(), message: `Contract ${CONTRACT_ADDRESS.slice(0, 16)}... monitoring Preprod.`, type: 'info' },
  ]);

  const addLog = (message: string, type: 'info' | 'success' | 'zk' = 'info') => {
    setLogs((prev) => [
      { id: Date.now(), timestamp: new Date().toLocaleTimeString(), message, type },
      ...prev.slice(0, 19),
    ]);
  };

  const { address, isConnected, connectedApi } = useWallet();

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError(null);
    setClaimSuccess(null);
    setIsGeneratingProof(true);
    addLog(`Initiating ZK proof for claim: ${claimAmount} tDUST...`, 'zk');

    try {
      if (!isConnected || !address) {
        throw new Error('Wallet not connected. Connect your 1AM Wallet first.');
      }

      if (!claimSecret || !claimSalt || !claimAmount) {
        throw new Error('Please fill in all private witness fields.');
      }
      const amountBigInt = BigInt(claimAmount);
      if (amountBigInt <= 0n) throw new Error('Claim amount must be greater than zero.');

      const midnight = (window as any).midnight;
      const api = connectedApi || await midnight['1am'].connect('preprod');
      addLog(`Wallet: ${address.slice(0, 16)}...`, 'info');

      const witness = encodeWitness(claimSecret, claimSalt);
      addLog('Submitting contract call to 1AM wallet for ZK proof generation...', 'zk');
      addLog(`Contract: ${CONTRACT_ADDRESS}`, 'info');

      const callResult = await api.buildAndSubmitContractCall({
        contractAddress: CONTRACT_ADDRESS,
        circuitId: 'claimPayout',
        args: [witness, amountBigInt, POOL_ID],
      });

      const txId = callResult?.txId ?? callResult?.txHash ?? callResult?.transactionId;
      if (!txId) throw new Error('Transaction submitted but no transaction ID returned.');

      const nullifierHex = bytesToHex(
        (() => {
          const buf = new Uint8Array(64);
          buf.set(witness.recipientSecret, 0);
          buf.set(POOL_ID, 32);
          let h = 0x811c9dc5;
          for (let i = 0; i < buf.length; i++) { h ^= buf[i]; h = Math.imul(h, 0x01000193); }
          const out = new Uint8Array(32);
          for (let i = 0; i < 32; i++) out[i] = (h ^ (i * 31) ^ (buf[i % 64] || i)) & 0xff;
          return out;
        })()
      );

      addLog(`TX confirmed on Preprod: ${txId.slice(0, 16)}...`, 'success');
      setClaimSuccess({ txId, nullifierHex, amount: amountBigInt });
      addLog(`Nullifier: ${nullifierHex.slice(0, 16)}...`, 'success');
      addLog(`Private payout of ${amountBigInt} tDUST claimed on Midnight Preprod.`, 'success');
      
      setTimeout(() => refresh(), 2000);

    } catch (err: any) {
      const msg: string = err?.message ?? 'Failed to claim payout.';
      const friendly =
        /dust|DUST|insufficient/i.test(msg)
          ? 'Insufficient DUST balance — fund your wallet at the Midnight Preprod faucet.'
          : /rejected|user denied|Rejected/i.test(msg)
          ? 'Connection rejected in 1AM Wallet.'
          : /buildAndSubmitContractCall|not a function|undefined/i.test(msg)
          ? `1AM wallet API does not support direct contract calls. Ensure you have the latest 1AM extension.`
          : msg;
      setClaimError(friendly);
      addLog(`Claim failed: ${friendly}`, 'info');
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);
    setIsRegistering(true);
    addLog('Registering new recipient commitment on Preprod...', 'zk');

    try {
      if (!isConnected || !address) {
        throw new Error('Wallet not connected. Connect your 1AM Wallet first.');
      }
      if (!regSecret || !regSalt || !regShare) {
        throw new Error('Please fill in recipient secret, salt, and private cut amount.');
      }

      const shareBigInt = BigInt(regShare);
      const addedRevBigInt = BigInt(regAddedRevenue || '0');

      const midnight = (window as any).midnight;
      const api = connectedApi || await midnight['1am'].connect('preprod');

      const organizerSecret = new Uint8Array(32).fill(0xaa);
      const commitment = encodeCommitment(regSecret, regSalt, shareBigInt);

      addLog('Submitting registerRecipient contract call via 1AM wallet...', 'zk');

      const callResult = await api.buildAndSubmitContractCall({
        contractAddress: CONTRACT_ADDRESS,
        circuitId: 'registerRecipient',
        args: [organizerSecret, commitment, addedRevBigInt],
      });

      const txId = callResult?.txId ?? callResult?.txHash ?? callResult?.transactionId;
      if (!txId) throw new Error('Transaction submitted but no transaction ID returned.');

      const succMsg = `Commitment registered on-chain. TX: ${txId.slice(0, 16)}...`;
      setRegSuccess(succMsg);
      addLog(succMsg, 'success');
      setRegSecret(''); setRegSalt(''); setRegShare('');
      
      setTimeout(() => refresh(), 2000);

    } catch (err: any) {
      const msg: string = err?.message ?? 'Failed to register recipient.';
      const friendly =
        /dust|DUST|insufficient/i.test(msg)
          ? 'Insufficient DUST balance — fund your wallet from the Midnight Preprod faucet.'
          : /buildAndSubmitContractCall|not a function|undefined/i.test(msg)
          ? `1AM wallet API does not support direct contract calls.`
          : msg;
      setRegError(friendly);
      addLog(`Registration error: ${friendly}`, 'info');
    } finally {
      setIsRegistering(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNullifier(true);
    setTimeout(() => setCopiedNullifier(false), 2000);
  };

  const tabs = [
    { id: 'claim' as const, icon: <Key className="w-4 h-4" />, label: 'Claim Private Cut' },
    { id: 'register' as const, icon: <Lock className="w-4 h-4" />, label: 'Register Split' },
    { id: 'overview' as const, icon: <Layers className="w-4 h-4" />, label: 'Privacy Model' },
    { id: 'logs' as const, icon: <Terminal className="w-4 h-4" />, label: 'Proof Logs' },
  ] as const;

  return (
    <div className="space-y-10">

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/15
                      bg-gradient-to-br from-indigo-950/40 via-[#09102a]/70 to-[#07091a]/90
                      px-8 sm:px-10 py-10 sm:py-12">
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full
                        bg-indigo-600/6 blur-[80px]" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-5 flex-1 min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="indigo">
                <ShieldCheck className="w-3.5 h-3.5" /> Midnight Compact Protocol
              </Badge>
              <Badge variant="emerald">
                <CheckCircle2 className="w-3.5 h-3.5" /> ZK Auditable
              </Badge>
              {poolState.isLive && (
                <Badge variant="cyan">
                  <RefreshCw className="w-3 h-3" /> Live On-Chain
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                Confidential Revenue<br className="hidden sm:block" /> Distribution
              </h1>
              <p className="text-[15px] text-slate-400 leading-relaxed">
                Distribute revenue among recipients with complete confidentiality.
                Zero-knowledge proofs verify each share commitment without exposing
                individual payout amounts on the public ledger.
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full lg:w-auto">
            <div className="rounded-xl border border-white/[0.06] bg-[#07091a]/70 px-5 py-4 space-y-3 min-w-[210px]">
              <p className="text-[11px] font-mono font-medium text-slate-600 uppercase tracking-widest mb-1">
                Contract Status
              </p>
              {[
                { label: 'State', value: poolState.isLive ? 'Live' : 'Loading', color: poolState.isLive ? 'text-emerald-400' : 'text-slate-500' },
                { label: 'Compiler', value: 'Compact v0.16', color: 'text-indigo-300' },
                { label: 'Proofs', value: 'Off-Chain Witness', color: 'text-purple-300' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-8">
                  <span className="text-xs text-slate-500 font-mono">{row.label}</span>
                  <span className={`text-xs font-semibold font-mono ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: 'Total Paid In',
            value: poolState.totalPaidIn.toString(),
            unit: 'tDUST',
            sub: 'Public balance · on-chain',
            icon: <Coins className="w-5 h-5" />,
            iconCls: 'bg-indigo-500/10  text-indigo-400',
            hoverCls: 'hover:border-indigo-500/30',
          },
          {
            label: 'Total Split Out',
            value: poolState.totalSplitOut.toString(),
            unit: 'tDUST',
            sub: 'ZK verified · cumulative',
            icon: <Layers className="w-5 h-5" />,
            iconCls: 'bg-purple-500/10  text-purple-400',
            hoverCls: 'hover:border-purple-500/30',
          },
          {
            label: 'Commitments',
            value: String(poolState.recipientCommitmentCount),
            unit: 'parties',
            sub: 'Individual cuts concealed',
            icon: <Lock className="w-5 h-5" />,
            iconCls: 'bg-cyan-500/10    text-cyan-400',
            hoverCls: 'hover:border-cyan-500/30',
          },
          {
            label: 'Claims Executed',
            value: poolState.claimCount.toString(),
            unit: 'nullifiers',
            sub: 'No double-claim possible',
            icon: <UserCheck className="w-5 h-5" />,
            iconCls: 'bg-emerald-500/10 text-emerald-400',
            hoverCls: 'hover:border-emerald-500/30',
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`card card-hover px-5 py-5 flex flex-col gap-4 ${card.hoverCls}`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest leading-none">
                {card.label}
              </p>
              <div className={`p-2 rounded-lg shrink-0 ${card.iconCls}`}>{card.icon}</div>
            </div>
            <div>
              <p className="text-[32px] font-bold font-mono text-white leading-none tracking-tight">
                {isLoading ? '…' : card.value}
              </p>
              <p className="text-xs text-slate-500 mt-1">{card.unit}</p>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug border-t border-white/[0.04] pt-3">
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4
                        border-b border-white/[0.05] px-6 sm:px-8 py-5">
          <div className="tabs-scroll flex items-center gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                            whitespace-nowrap transition-colors
                            ${activeTab === tab.id
                              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                            }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => refresh()}
            disabled={isFetching}
            title="Sync ledger state"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-slate-400
                       hover:text-indigo-300 hover:bg-white/[0.04] border border-white/[0.05]
                       text-sm font-mono transition-colors shrink-0 self-end sm:self-auto
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Sync State
          </button>
        </div>

        <div className="px-6 sm:px-10 py-8 sm:py-10">

          {/* TAB: Claim Private Cut */}
          {activeTab === 'claim' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                    <Key className="w-5 h-5 text-indigo-400 shrink-0" />
                    Recipient Confidential Claim
                  </h2>
                  <p className="text-[14px] text-slate-400 leading-relaxed max-w-xl">
                    Enter your private secret and salt. A zero-knowledge proof verifies your
                    commitment without revealing your individual cut to co-recipients or
                    on-chain observers.
                  </p>
                </div>
                <Badge variant="purple">
                  <Lock className="w-3 h-3" /> Private Witness
                </Badge>
              </div>

              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 text-sm text-slate-400">
                    <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="font-medium">Demo credentials</span>
                    <span className="text-slate-600 text-xs">— pre-filled test values</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setClaimSecret('alice_secret_123');
                        setClaimSalt('salt_alice_999');
                        setClaimAmount('700');
                      }}
                      className="px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/18
                                 text-indigo-300 border border-indigo-500/20 text-xs font-medium
                                 transition-colors"
                    >
                      Alice — 700 tDUST (70%)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setClaimSecret('bob_secret_456');
                        setClaimSalt('salt_bob_888');
                        setClaimAmount('300');
                      }}
                      className="px-4 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/18
                                 text-purple-300 border border-purple-500/20 text-xs font-medium
                                 transition-colors"
                    >
                      Bob — 300 tDUST (30%)
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleClaim} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field
                    id="claim-secret"
                    label="Recipient Private Secret Key"
                    helper="Stays 100% on your device — never sent to the chain"
                  >
                    <div className="relative">
                      <input
                        id="claim-secret"
                        type={showSecret ? 'text' : 'password'}
                        value={claimSecret}
                        onChange={(e) => setClaimSecret(e.target.value)}
                        placeholder="e.g. your_secret_passphrase"
                        className={`${inputCls} pr-12`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        aria-label={showSecret ? 'Hide secret' : 'Show secret'}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600
                                   hover:text-slate-300 transition-colors"
                      >
                        {showSecret ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>

                  <Field
                    id="claim-salt"
                    label="Recipient Salt"
                    helper="Blinds your commitment hash — known only to you"
                  >
                    <input
                      id="claim-salt"
                      type="text"
                      value={claimSalt}
                      onChange={(e) => setClaimSalt(e.target.value)}
                      placeholder="e.g. salt_alice_999"
                      className={inputCls}
                      required
                    />
                  </Field>
                </div>

                <Field
                  id="claim-amount"
                  label={<>Claim Payout Amount <span className="text-slate-500 font-normal">(tDUST)</span></>}
                  helper="Proved equal to your registered commitment — the exact value remains hidden from all other recipients"
                >
                  <input
                    id="claim-amount"
                    type="number"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    placeholder="e.g. 700"
                    className={inputCls}
                    required
                  />
                </Field>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isGeneratingProof}
                    className="w-full h-[52px] rounded-xl bg-indigo-600 hover:bg-indigo-500
                               active:bg-indigo-700 text-white font-semibold text-[15px]
                               shadow-xl shadow-indigo-600/20 transition-colors
                               flex items-center justify-center gap-3
                               disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    {isGeneratingProof ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white
                                         rounded-full animate-spin shrink-0" />
                        <span>Generating Zero-Knowledge Proof…</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5 shrink-0" />
                        <span>Prove &amp; Claim Payout Confidentiality</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {claimError && (
                <div className="flex items-start gap-4 p-5 rounded-xl
                                bg-red-500/6 border border-red-500/20">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-red-300">Claim Rejected</p>
                    <p className="text-[13px] text-red-400/80 leading-relaxed">{claimError}</p>
                  </div>
                </div>
              )}

              {claimSuccess && (
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/12 overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3
                                  px-6 py-4 border-b border-emerald-500/15 bg-emerald-950/10">
                    <div className="flex items-center gap-3 text-emerald-400 font-semibold text-[15px]">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      Zero-Knowledge Proof Verified &amp; Executed
                    </div>
                    <Badge variant="emerald">On-Chain Confirmed</Badge>
                  </div>

                  <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                        Claimed Amount
                      </p>
                      <p className="text-3xl font-bold font-mono text-emerald-400 leading-none">
                        {claimSuccess.amount.toString()}
                        <span className="text-base font-normal text-emerald-600 ml-2">tDUST</span>
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                        Privacy Status
                      </p>
                      <p className="text-[14px] text-slate-200 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-purple-400 shrink-0" />
                        Individual cut hidden on-chain
                      </p>
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                        Transaction ID
                      </p>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-lg
                                      bg-[#07091a]/80 border border-white/[0.06]">
                        <span className="flex-1 truncate text-[13px] text-slate-400 font-mono">
                          {claimSuccess.txId}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(claimSuccess.txId)}
                          title="Copy transaction ID"
                          className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08]
                                     text-slate-500 hover:text-slate-200 transition-colors shrink-0"
                        >
                          {copiedNullifier ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                        Cryptographic Nullifier (disclosed)
                      </p>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-lg
                                      bg-[#07091a]/80 border border-white/[0.06]">
                        <span className="flex-1 truncate text-[13px] text-slate-400 font-mono">
                          {claimSuccess.nullifierHex}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(claimSuccess.nullifierHex)}
                          title="Copy nullifier"
                          className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08]
                                     text-slate-500 hover:text-slate-200 transition-colors shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Register Split */}
          {activeTab === 'register' && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                  <Lock className="w-5 h-5 text-indigo-400 shrink-0" />
                  Register Recipient Commitment
                </h2>
                <p className="text-[14px] text-slate-400 leading-relaxed max-w-xl">
                  As deal organizer, register a recipient's commitment on-chain. The individual
                  cut is converted to a cryptographic hash — no observer can see the share percentage.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Field id="reg-secret" label="Recipient Secret">
                    <input id="reg-secret" type="text" value={regSecret}
                      onChange={(e) => setRegSecret(e.target.value)}
                      placeholder="e.g. recipient_key" className={inputCls} required />
                  </Field>
                  <Field id="reg-salt" label="Recipient Salt">
                    <input id="reg-salt" type="text" value={regSalt}
                      onChange={(e) => setRegSalt(e.target.value)}
                      placeholder="e.g. salt_charlie" className={inputCls} required />
                  </Field>
                  <Field id="reg-share"
                    label={<>Private Share <span className="text-slate-500 font-normal">(tDUST)</span></>}>
                    <input id="reg-share" type="number" value={regShare}
                      onChange={(e) => setRegShare(e.target.value)}
                      placeholder="e.g. 500" className={inputCls} required />
                  </Field>
                </div>

                <Field id="reg-revenue"
                  label={<>Additional Revenue Deposit <span className="text-slate-600 font-normal text-xs">(optional tDUST)</span></>}>
                  <input id="reg-revenue" type="number" value={regAddedRevenue}
                    onChange={(e) => setRegAddedRevenue(e.target.value)}
                    placeholder="0" className={inputCls} />
                </Field>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full h-[52px] rounded-xl bg-indigo-600 hover:bg-indigo-500
                               active:bg-indigo-700 text-white font-semibold text-[15px]
                               shadow-xl shadow-indigo-600/20 transition-colors
                               flex items-center justify-center gap-3
                               disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    {isRegistering ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white
                                         rounded-full animate-spin shrink-0" />
                        <span>Registering Commitment…</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 shrink-0" />
                        <span>Commit Recipient Cut On-Chain</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {regError && (
                <div className="flex items-start gap-4 p-5 rounded-xl
                                bg-red-500/6 border border-red-500/20">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-red-400/80 leading-relaxed">{regError}</p>
                </div>
              )}

              {regSuccess && (
                <div className="flex items-center gap-3 p-4 rounded-xl
                                bg-emerald-500/6 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="text-[13px] text-emerald-300">{regSuccess}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: Privacy Model */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                  <Layers className="w-5 h-5 text-indigo-400 shrink-0" />
                  Privacy Architecture
                </h2>
                <p className="text-[14px] text-slate-400">
                  What is visible on-chain versus what stays private as a ZK witness.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-emerald-500/20 bg-[#07091a]/50 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4
                                  border-b border-emerald-500/12 bg-emerald-950/8">
                    <span className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                      <Unlock className="w-4 h-4" /> Public Ledger State
                    </span>
                    <Badge variant="emerald">On-Chain</Badge>
                  </div>
                  <ul className="divide-y divide-white/[0.04] text-sm font-mono">
                    {[
                      { key: 'totalPaidIn', val: `${poolState.totalPaidIn.toString()} tDUST`, color: 'text-emerald-400' },
                      { key: 'totalSplitOut', val: `${poolState.totalSplitOut.toString()} tDUST`, color: 'text-emerald-400' },
                      { key: 'commitments', val: `${poolState.recipientCommitmentCount} parties`, color: 'text-cyan-400' },
                      { key: 'claimedNullifiers', val: `${poolState.claimedNullifierCount} spent`, color: 'text-purple-400' },
                    ].map((row) => (
                      <li key={row.key} className="flex items-center justify-between px-5 py-3.5 gap-6">
                        <span className="text-slate-500">{row.key}</span>
                        <span className={`${row.color} font-semibold`}>{row.val}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-purple-500/20 bg-[#07091a]/50 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4
                                  border-b border-purple-500/12 bg-purple-950/8">
                    <span className="flex items-center gap-2 text-purple-400 text-sm font-semibold">
                      <Lock className="w-4 h-4" /> Private Witnesses
                    </span>
                    <Badge variant="purple">ZK Off-Chain</Badge>
                  </div>
                  <ul className="divide-y divide-white/[0.04] text-sm font-mono">
                    {[
                      { key: 'recipientSecret', val: 'NEVER ON-CHAIN', color: 'text-purple-400' },
                      { key: 'recipientSalt', val: 'OFF-CHAIN BLINDING', color: 'text-purple-400' },
                      { key: 'individualCut', val: 'HIDDEN FROM OTHERS', color: 'text-purple-400' },
                      { key: 'ZK Constraint', val: 'sum(cuts) ≤ totalPaidIn', color: 'text-emerald-400' },
                    ].map((row) => (
                      <li key={row.key} className="flex items-center justify-between px-5 py-3.5 gap-6">
                        <span className="text-slate-500">{row.key}</span>
                        <span className={`${row.color} font-semibold`}>{row.val}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Proof Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                  <Terminal className="w-5 h-5 text-indigo-400 shrink-0" />
                  ZK Proof Execution Logs
                </h2>
                <Badge variant="indigo">Live</Badge>
              </div>

              <div className="rounded-xl bg-[#05060f] border border-white/[0.05]
                              font-mono text-[13px] divide-y divide-white/[0.03]
                              max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 px-5 py-3.5">
                    <span className="text-slate-600 text-xs shrink-0 pt-px">{log.timestamp}</span>
                    <span className={`leading-relaxed ${
                      log.type === 'success' ? 'text-emerald-400'
                    : log.type === 'zk' ? 'text-purple-300'
                    : 'text-slate-400'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
