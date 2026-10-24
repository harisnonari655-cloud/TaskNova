import React, { useState } from 'react';
import { UserProfile, WalletAccount, TaskSubmission, LedgerEntry, WithdrawalRequest } from '../types';
import { api } from '../api';
import { Wallet, ArrowDownRight, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Send, Shield, FileText } from 'lucide-react';

interface WorkerDashboardProps {
  currentUser: UserProfile;
  wallet: WalletAccount | null;
  submissions: TaskSubmission[];
  ledger: LedgerEntry[];
  withdrawals: WithdrawalRequest[];
  onRefresh: () => void;
  onNavigate: (view: string) => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  currentUser,
  wallet,
  submissions,
  ledger,
  withdrawals,
  onRefresh,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'ledger' | 'withdrawals'>('overview');
  
  // Withdrawal Request Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmountPKR, setWithdrawAmountPKR] = useState('100');
  const [withdrawMethod, setWithdrawMethod] = useState<'easypaisa' | 'jazzcash' | 'bank_transfer'>('easypaisa');
  const [accountNumber, setAccountNumber] = useState(currentUser.payout_account_number || '');
  const [accountTitle, setAccountTitle] = useState(currentUser.payout_account_title || currentUser.full_name);
  const [bankName, setBankName] = useState(currentUser.payout_bank_name || '');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Appeal Modal State
  const [appealingSub, setAppealingSub] = useState<TaskSubmission | null>(null);
  const [appealNotes, setAppealNotes] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);

  const availablePKR = ((wallet?.available_minor || 0) / 100).toFixed(2);
  const pendingPKR = ((wallet?.pending_minor || 0) / 100).toFixed(2);
  const reservedPKR = ((wallet?.reserved_minor || 0) / 100).toFixed(2);
  const withdrawnPKR = ((wallet?.withdrawn_minor || 0) / 100).toFixed(2);
  const totalEarnedPKR = ((wallet?.total_earned_minor || 0) / 100).toFixed(2);

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmountPKR);
    if (isNaN(amountNum) || amountNum < 100) {
      setWithdrawError('Minimum withdrawal amount is PKR 100.00.');
      return;
    }
    const amountMinor = Math.round(amountNum * 100);
    if (wallet && amountMinor > wallet.available_minor) {
      setWithdrawError(`Insufficient balance. You currently have PKR ${availablePKR} available.`);
      return;
    }

    try {
      setIsSubmittingWithdraw(true);
      setWithdrawError(null);
      await api.requestWithdrawal({
        amount_minor: amountMinor,
        method: withdrawMethod,
        account_number: accountNumber.trim(),
        account_title: accountTitle.trim(),
        bank_name: withdrawMethod === 'bank_transfer' ? bankName.trim() : undefined,
      });

      setWithdrawSuccess(true);
      onRefresh();
      setTimeout(() => {
        setWithdrawSuccess(false);
        setShowWithdrawModal(false);
      }, 2000);
    } catch (err: any) {
      setWithdrawError(err.message || 'Failed to submit withdrawal request.');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealingSub) return;
    if (!appealNotes.trim()) {
      setAppealError('Please state why you believe your work satisfies the acceptance criteria.');
      return;
    }

    try {
      setIsSubmittingAppeal(true);
      setAppealError(null);
      await api.appealSubmission(appealingSub.id, appealNotes.trim());
      setAppealingSub(null);
      setAppealNotes('');
      onRefresh();
    } catch (err: any) {
      setAppealError(err.message || 'Failed to submit appeal.');
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Worker Workspace</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your submissions, ledger wallet balance, and manual withdrawal requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-sky-600/20"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Request Withdrawal</span>
          </button>
        </div>
      </div>

      {/* METRIC STRIP (Single Elevation, Tabular Numerals) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Available for Payout</div>
          <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
            PKR {availablePKR}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Ready to withdraw</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Pending Approval</div>
          <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
            PKR {pendingPKR}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Under client review</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Reserved for Payout</div>
          <div className="text-xl font-bold font-mono text-sky-400 tabular-nums">
            PKR {reservedPKR}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Locked in review queue</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Completed Payouts</div>
          <div className="text-xl font-bold font-mono text-slate-200 tabular-nums">
            PKR {withdrawnPKR}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Reconciled via bank</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl col-span-2 lg:col-span-1">
          <div className="text-xs text-slate-400 mb-1">All-Time Earned</div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            PKR {totalEarnedPKR}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Ledger verified</div>
        </div>
      </div>

      {/* DASHBOARD TABS */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'submissions'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          My Submissions ({submissions.length})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'ledger'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Immutable Wallet Ledger ({ledger.length})
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'withdrawals'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Withdrawal Requests ({withdrawals.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Submissions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Recent Task Submissions</h3>
              <button
                onClick={() => setActiveTab('submissions')}
                className="text-xs text-sky-400 hover:text-sky-300"
              >
                View all
              </button>
            </div>

            {submissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                You haven't submitted any tasks yet.{' '}
                <button onClick={() => onNavigate('browse')} className="text-sky-400 underline ml-1">
                  Browse tasks
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.slice(0, 4).map(sub => (
                  <div key={sub.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-slate-200 truncate max-w-xs">{sub.task_title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {new Date(sub.created_at).toLocaleDateString()} · ID: {sub.id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-sky-400 tabular-nums">
                        PKR {(sub.reward_amount_minor / 100).toFixed(2)}
                      </div>
                      <span className={`text-[11px] font-mono capitalize ${
                        sub.status === 'approved' ? 'text-emerald-400' :
                        sub.status === 'rejected' ? 'text-rose-400' : 'text-amber-400'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Ledger Audit Trail */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Recent Ledger Events</h3>
              <button
                onClick={() => setActiveTab('ledger')}
                className="text-xs text-sky-400 hover:text-sky-300"
              >
                Full audit
              </button>
            </div>

            {ledger.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No ledger transactions recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {ledger.slice(0, 4).map(entry => (
                  <div key={entry.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-slate-200 capitalize">
                        {entry.transaction_type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                        {entry.notes}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold tabular-nums ${
                        entry.direction === 'credit' ? 'text-emerald-400' : 'text-slate-300'
                      }`}>
                        {entry.direction === 'credit' ? '+' : '-'}PKR {(entry.amount_minor / 100).toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Bal: PKR {(entry.balance_after_minor / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY SUBMISSIONS */}
      {activeTab === 'submissions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">All Task Submissions</h3>
            <span className="text-xs text-slate-400">{submissions.length} total records</span>
          </div>

          {submissions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No task submissions yet. Complete tasks in the catalog to earn ledger rewards.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-medium">Task</th>
                    <th className="py-3 px-4 font-medium">Date</th>
                    <th className="py-3 px-4 font-medium">Reward</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Review Notes</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {submissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{sub.task_title}</div>
                        <div className="text-[11px] font-mono text-slate-500">ID: {sub.id}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-400 tabular-nums">
                        PKR {(sub.reward_amount_minor / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-mono uppercase text-[11px] font-semibold ${
                          sub.status === 'approved' ? 'text-emerald-400' :
                          sub.status === 'rejected' ? 'text-rose-400' :
                          sub.status === 'appealed' ? 'text-purple-400' : 'text-amber-400'
                        }`}>
                          {sub.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {sub.status === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                          {sub.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                          <span>{sub.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                        {sub.rejection_reason || sub.evidence_notes}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {sub.status === 'rejected' && (
                          <button
                            onClick={() => {
                              setAppealingSub(sub);
                              setAppealNotes('');
                              setAppealError(null);
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-sky-400 rounded transition-colors"
                          >
                            Appeal
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: IMMUTABLE WALLET LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white text-sm">Immutable Transaction Ledger</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Every entry is authoritative, append-only, and tied to a unique idempotency key.
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-400">
              Zero Discrepancies
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-medium">Ledger ID</th>
                  <th className="py-3 px-4 font-medium">Date & Time</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium">Amount</th>
                  <th className="py-3 px-4 font-medium">Balance After</th>
                  <th className="py-3 px-4 font-medium">Audit Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {ledger.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {entry.id}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200 capitalize">
                      {entry.transaction_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold tabular-nums">
                      <span className={entry.direction === 'credit' ? 'text-emerald-400' : 'text-slate-300'}>
                        {entry.direction === 'credit' ? '+' : '-'}PKR {(entry.amount_minor / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-200 tabular-nums">
                      PKR {(entry.balance_after_minor / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-sm truncate" title={entry.notes}>
                      {entry.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: WITHDRAWAL REQUESTS */}
      {activeTab === 'withdrawals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white text-sm">Withdrawal Request History</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Manual admin verification and external bank payout process.
              </p>
            </div>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              New Request
            </button>
          </div>

          {withdrawals.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No withdrawal requests recorded. You can request a payout once your available balance is at least PKR 100.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-medium">Request ID</th>
                    <th className="py-3 px-4 font-medium">Requested Date</th>
                    <th className="py-3 px-4 font-medium">Method</th>
                    <th className="py-3 px-4 font-medium">Account Details</th>
                    <th className="py-3 px-4 font-medium">Amount</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {withdrawals.map(req => (
                    <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">{req.id}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200 capitalize">
                        {req.method.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div>{req.account_title}</div>
                        <div className="text-[11px] font-mono text-slate-500">{req.account_number_masked}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-100 tabular-nums">
                        PKR {(req.amount_minor / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-mono uppercase text-[11px] font-semibold ${
                          req.status === 'completed' ? 'text-emerald-400' :
                          req.status === 'rejected' ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {req.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {req.status === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                          {req.status === 'pending_review' && <Clock className="w-3.5 h-3.5" />}
                          <span>{req.status.replace('_', ' ')}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* WITHDRAWAL REQUEST MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Request Manual Withdrawal</h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {withdrawSuccess ? (
              <div className="p-6 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-semibold text-white">Withdrawal Request Queued</h4>
                <p className="text-xs text-slate-300">
                  Funds have been atomically reserved in the ledger. A platform administrator will manually process the external payout after independent verification.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                {withdrawError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{withdrawError}</span>
                  </div>
                )}

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-400">Available Wallet Balance:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">PKR {availablePKR}</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Withdrawal Amount (PKR) <span className="text-slate-500">· Min PKR 100</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="100"
                    max={wallet ? wallet.available_minor / 100 : 100}
                    value={withdrawAmountPKR}
                    onChange={e => setWithdrawAmountPKR(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easypaisa', 'jazzcash', 'bank_transfer'] as const).map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setWithdrawMethod(method)}
                        className={`py-2 px-3 text-xs font-medium rounded-lg border capitalize transition-colors ${
                          withdrawMethod === method
                            ? 'bg-sky-600/20 border-sky-500 text-sky-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {method.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Account / Phone Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    placeholder="03001234567 or IBAN"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Account Title</label>
                  <input
                    type="text"
                    value={accountTitle}
                    onChange={e => setAccountTitle(e.target.value)}
                    placeholder="Full Name as on Account"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                {withdrawMethod === 'bank_transfer' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      placeholder="e.g. HBL, Meezan Bank, MCB"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
                    />
                  </div>
                )}

                <div className="text-[11px] text-slate-500 leading-relaxed">
                  Payouts are verified and disbursed outside the website directly to your provided account. Please double-check details before submission.
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingWithdraw}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {isSubmittingWithdraw ? 'Processing...' : 'Confirm Reservation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* APPEAL MODAL */}
      {appealingSub && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">Appeal Rejection: {appealingSub.task_title}</h3>
            
            {appealError && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-xs text-rose-300">
                {appealError}
              </div>
            )}

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400">
              <span className="font-semibold text-rose-400">Original Rejection Reason: </span>
              {appealingSub.rejection_reason}
            </div>

            <form onSubmit={handleAppealSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Appeal Explanation & Additional Context
                </label>
                <textarea
                  value={appealNotes}
                  onChange={e => setAppealNotes(e.target.value)}
                  rows={4}
                  placeholder="Explain why your submission satisfies the acceptance criteria..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAppealingSub(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAppeal}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg"
                >
                  {isSubmittingAppeal ? 'Submitting...' : 'Submit Appeal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
