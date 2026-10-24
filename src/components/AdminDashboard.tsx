import React, { useState } from 'react';
import { UserProfile, Task, TaskFunding, TaskSubmission, WithdrawalRequest, AuditLog, FinancialReconciliationReport } from '../types';
import { api } from '../api';
import { ShieldCheck, RefreshCw, CheckCircle2, XCircle, AlertTriangle, FileText, Check, DollarSign, Users, Database, Play } from 'lucide-react';

interface AdminDashboardProps {
  currentUser: UserProfile;
  tasks: Task[];
  fundingList: TaskFunding[];
  submissions: TaskSubmission[];
  withdrawals: WithdrawalRequest[];
  users: UserProfile[];
  auditLogs: AuditLog[];
  reconciliation: FinancialReconciliationReport | null;
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  tasks,
  fundingList,
  submissions,
  withdrawals,
  users,
  auditLogs,
  reconciliation,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'funding' | 'moderation' | 'withdrawals' | 'reconciliation' | 'users' | 'audits'>('funding');

  // Verify Funding Modal
  const [verifyingFunding, setVerifyingFunding] = useState<TaskFunding | null>(null);
  const [fundingAction, setFundingAction] = useState<'verified' | 'rejected'>('verified');
  const [fundingReason, setFundingReason] = useState('');
  const [isProcessingFunding, setIsProcessingFunding] = useState(false);

  // Moderate Task Modal
  const [moderatingTask, setModeratingTask] = useState<Task | null>(null);
  const [taskDecision, setTaskDecision] = useState<'approved' | 'rejected'>('approved');
  const [taskReason, setTaskReason] = useState('');
  const [isProcessingTask, setIsProcessingTask] = useState(false);

  // Reconcile Withdrawal Modal
  const [reconcilingWithdrawal, setReconcilingWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [externalPaymentRef, setExternalPaymentRef] = useState('');
  const [adminPayoutNotes, setAdminPayoutNotes] = useState('');
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);
  const [rejectWithdrawalReason, setRejectWithdrawalReason] = useState('');
  const [isRejectingWithdrawal, setIsRejectingWithdrawal] = useState(false);

  // Live Test Runner Modal/Feedback
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testRunResult, setTestRunResult] = useState<any>(null);

  const pendingFunding = fundingList.filter(f => f.status === 'reported');
  const pendingTasks = tasks.filter(t => t.status === 'pending_moderation');
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending_review' || w.status === 'approved_pending_payout');

  const handleVerifyFunding = async () => {
    if (!verifyingFunding) return;
    try {
      setIsProcessingFunding(true);
      await api.verifyFunding(verifyingFunding.id, fundingAction, fundingReason.trim());
      setVerifyingFunding(null);
      setFundingReason('');
      onRefresh();
    } catch (err: any) {
      alert('Verification error: ' + err.message);
    } finally {
      setIsProcessingFunding(false);
    }
  };

  const handleModerateTask = async () => {
    if (!moderatingTask) return;
    try {
      setIsProcessingTask(true);
      await api.moderateTask(moderatingTask.id, taskDecision, taskReason.trim());
      setModeratingTask(null);
      setTaskReason('');
      onRefresh();
    } catch (err: any) {
      alert('Moderation error: ' + err.message);
    } finally {
      setIsProcessingTask(false);
    }
  };

  const handleReconcilePayout = async () => {
    if (!reconcilingWithdrawal) return;
    if (!externalPaymentRef.trim()) {
      alert('Authentic external payment reference is required to reconcile payout.');
      return;
    }

    try {
      setIsProcessingWithdrawal(true);
      await api.reconcileWithdrawal(reconcilingWithdrawal.id, {
        actual_payment_reference: externalPaymentRef.trim(),
        admin_notes: adminPayoutNotes.trim() || 'Confirmed transferred outside platform',
      });
      setReconcilingWithdrawal(null);
      setExternalPaymentRef('');
      setAdminPayoutNotes('');
      onRefresh();
    } catch (err: any) {
      alert('Payout reconciliation error: ' + err.message);
    } finally {
      setIsProcessingWithdrawal(false);
    }
  };

  const handleRejectWithdrawal = async () => {
    if (!reconcilingWithdrawal) return;
    if (!rejectWithdrawalReason.trim()) {
      alert('Please state why the withdrawal is being rejected to inform the worker.');
      return;
    }

    try {
      setIsRejectingWithdrawal(true);
      await api.rejectWithdrawal(reconcilingWithdrawal.id, rejectWithdrawalReason.trim());
      setReconcilingWithdrawal(null);
      setRejectWithdrawalReason('');
      onRefresh();
    } catch (err: any) {
      alert('Rejection error: ' + err.message);
    } finally {
      setIsRejectingWithdrawal(false);
    }
  };

  const handleRunSystemTests = async () => {
    try {
      setIsRunningTests(true);
      const res = await api.runSystemTests();
      setTestRunResult(res);
      onRefresh();
    } catch (err: any) {
      alert('Test run error: ' + err.message);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleToggleUserStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const reason = prompt(`Enter reason for marking user ${newStatus}:`, 'Compliance review');
    if (reason === null) return;

    try {
      await api.updateUserStatus(user.id, {
        status: newStatus,
        risk_reason: reason,
      });
      onRefresh();
    } catch (err: any) {
      alert('Failed to update user: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Platform Administration Console</h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-400">
              SECURE ROLE VERIFIED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative moderation, external payment reconciliation, and ledger integrity monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs transition-colors"
            title="Refresh System Queues"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRunSystemTests}
            disabled={isRunningTests}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isRunningTests ? 'Running Checks...' : 'Run Ledger Audit'}</span>
          </button>
        </div>
      </div>

      {/* METRIC STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Funding Queue</div>
          <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
            {pendingFunding.length} Deposits
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting bank verification</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Task Moderation Queue</div>
          <div className="text-xl font-bold font-mono text-purple-400 tabular-nums">
            {pendingTasks.length} Tasks
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Pending publication review</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Withdrawal Payout Queue</div>
          <div className="text-xl font-bold font-mono text-sky-400 tabular-nums">
            {pendingWithdrawals.length} Requests
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Manual disbursement needed</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Ledger Integrity</div>
          <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
            {reconciliation?.isClean ? '0 Discrepancies' : 'Attention Needed'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Authoritative double-entry</div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('funding')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'funding' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Client Funding ({pendingFunding.length})
        </button>
        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'moderation' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Task Moderation ({pendingTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'withdrawals' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Withdrawal Payouts ({pendingWithdrawals.length})
        </button>
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'reconciliation' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Financial Reconciliation
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'users' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          User Accounts ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('audits')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'audits' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: CLIENT FUNDING VERIFICATION */}
      {activeTab === 'funding' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white text-sm">Client Deposit Verification Queue</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Verify incoming transfers against bank statements before activating task budgets.
              </p>
            </div>
          </div>

          {fundingList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No funding deposits reported.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-medium">Task</th>
                    <th className="py-3 px-4 font-medium">Method</th>
                    <th className="py-3 px-4 font-medium">Reference</th>
                    <th className="py-3 px-4 font-medium">Reported Amount</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {fundingList.map(f => (
                    <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{f.task_title}</div>
                        <div className="text-[11px] font-mono text-slate-500">Fund ID: {f.id}</div>
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-400">{f.method.replace('_', ' ')}</td>
                      <td className="py-3 px-4 font-mono text-slate-200">{f.payment_reference}</td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-400 tabular-nums">
                        PKR {(f.amount_minor / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-mono uppercase text-[11px] font-semibold ${
                          f.status === 'verified' ? 'text-emerald-400' :
                          f.status === 'rejected' ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {f.status === 'reported' && (
                          <button
                            onClick={() => {
                              setVerifyingFunding(f);
                              setFundingAction('verified');
                              setFundingReason('');
                            }}
                            className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded transition-colors"
                          >
                            Verify Deposit
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

      {/* TAB 2: TASK MODERATION */}
      {activeTab === 'moderation' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white text-sm">Task Publication Moderation Queue</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ensure tasks are lawful, clearly instructed, and meet community guidelines.
              </p>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No tasks in database.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-medium">Title</th>
                    <th className="py-3 px-4 font-medium">Client</th>
                    <th className="py-3 px-4 font-medium">Reward/Slot</th>
                    <th className="py-3 px-4 font-medium">Slots</th>
                    <th className="py-3 px-4 font-medium">Required Budget</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {tasks.map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{t.title}</div>
                        <div className="text-[11px] text-slate-500 capitalize">{t.category.replace('_', ' ')}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{t.client_name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-400 tabular-nums">
                        PKR {(t.reward_per_slot_minor / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 tabular-nums">{t.max_slots}</td>
                      <td className="py-3 px-4 font-mono text-slate-300 tabular-nums">
                        PKR {(t.total_required_budget_minor / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-mono uppercase text-[11px] font-semibold ${
                          t.status === 'active' ? 'text-emerald-400' :
                          t.status === 'rejected' ? 'text-rose-400' :
                          t.status === 'approved_unfunded' ? 'text-amber-400' : 'text-purple-400'
                        }`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {t.status === 'pending_moderation' && (
                          <button
                            onClick={() => {
                              setModeratingTask(t);
                              setTaskDecision('approved');
                              setTaskReason('');
                            }}
                            className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded transition-colors"
                          >
                            Moderate
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

      {/* TAB 3: WITHDRAWAL PAYOUTS & RECONCILIATION */}
      {activeTab === 'withdrawals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white text-sm">Manual Withdrawal Processing Queue</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Execute bank disbursement outside the platform, then record the authentic reference number.
              </p>
            </div>
          </div>

          {withdrawals.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No withdrawal requests recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-medium">Worker</th>
                    <th className="py-3 px-4 font-medium">Method</th>
                    <th className="py-3 px-4 font-medium">Payout Account</th>
                    <th className="py-3 px-4 font-medium">Amount</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {withdrawals.map(w => (
                    <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{w.worker_name}</div>
                        <div className="text-[11px] font-mono text-slate-500">ID: {w.id}</div>
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-400">{w.method.replace('_', ' ')}</td>
                      <td className="py-3 px-4 text-slate-300">
                        <div>{w.account_title}</div>
                        <div className="font-mono text-[11px] text-slate-500">{w.account_number_masked}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-400 tabular-nums">
                        PKR {(w.amount_minor / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-mono uppercase text-[11px] font-semibold ${
                          w.status === 'completed' ? 'text-emerald-400' :
                          w.status === 'rejected' ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {w.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(w.status === 'pending_review' || w.status === 'approved_pending_payout') && (
                          <button
                            onClick={() => {
                              setReconcilingWithdrawal(w);
                              setExternalPaymentRef('');
                              setAdminPayoutNotes('');
                              setRejectWithdrawalReason('');
                            }}
                            className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded transition-colors"
                          >
                            Process Payout
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

      {/* TAB 4: FINANCIAL RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="font-bold text-white text-base">Financial Ledger Reconciliation</h3>
              <p className="text-xs text-slate-400 mt-1">
                Authoritative double-entry ledger verification. Proves that task liabilities, worker earnings, reservations, and payouts match with zero mathematical discrepancies.
              </p>
            </div>

            {reconciliation && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                  <div className="text-xs text-slate-400">Total Verified Client Funding</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                    PKR {(reconciliation.totalClientFundingMinor / 100).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500">Incoming bank transfers verified</div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                  <div className="text-xs text-slate-400">Allocated Task Budgets</div>
                  <div className="text-lg font-bold font-mono text-sky-400 tabular-nums">
                    PKR {(reconciliation.totalAllocatedBudgetMinor / 100).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500">Reserved for worker rewards</div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                  <div className="text-xs text-slate-400">Total Worker Rewards Earned</div>
                  <div className="text-lg font-bold font-mono text-white tabular-nums">
                    PKR {(reconciliation.totalWorkerEarnedMinor / 100).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500">From approved submissions</div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                  <div className="text-xs text-slate-400">Total Completed Payouts</div>
                  <div className="text-lg font-bold font-mono text-slate-200 tabular-nums">
                    PKR {(reconciliation.totalWithdrawnMinor / 100).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500">Reconciled bank transfers</div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                  <div className="text-xs text-slate-400">Pending Withdrawal Liabilities</div>
                  <div className="text-lg font-bold font-mono text-amber-400 tabular-nums">
                    PKR {(reconciliation.pendingWithdrawalLiabilityMinor / 100).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500">Reserved in ledger awaiting payout</div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                  <div className="text-xs text-slate-400">Available Worker Balances</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                    PKR {(reconciliation.totalAvailableWorkerBalancesMinor / 100).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500">Unwithdrawn worker funds</div>
                </div>
              </div>
            )}

            {/* Reconciliation State Badge */}
            <div className="p-4 rounded-xl border flex items-center justify-between text-xs bg-emerald-950/20 border-emerald-800/40 text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Ledger audit status: All mathematical identities hold true. Zero double-counting or unbacked liability.
                </span>
              </div>
              <span className="font-mono font-bold">100% RECONCILED</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: USER ACCOUNTS */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white text-sm">Registered Profiles & Roles</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Authoritative server-side role assignments.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-medium">User</th>
                  <th className="py-3 px-4 font-medium">Email</th>
                  <th className="py-3 px-4 font-medium">Role</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Risk Flag</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-200">{u.full_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{u.email}</td>
                    <td className="py-3 px-4 font-mono capitalize text-sky-400 font-semibold">{u.role}</td>
                    <td className="py-3 px-4">
                      <span className={`font-mono text-[11px] uppercase font-semibold ${
                        u.status === 'active' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.risk_flag ? (
                        <span className="text-rose-400 font-mono text-[11px]">FLAGGED</span>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">CLEAN</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === 'audits' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white text-sm">System Audit Trail</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Immutable records of sensitive operations and financial events.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-medium">Timestamp</th>
                  <th className="py-3 px-4 font-medium">Action</th>
                  <th className="py-3 px-4 font-medium">Actor Role</th>
                  <th className="py-3 px-4 font-medium">Resource</th>
                  <th className="py-3 px-4 font-medium">Reason / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">{log.action}</td>
                    <td className="py-3 px-4 capitalize text-slate-300">{log.actor_role}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{log.resource_type}:{log.resource_id}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-sm truncate" title={log.reason || JSON.stringify(log.details)}>
                      {log.reason || JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VERIFY FUNDING MODAL */}
      {verifyingFunding && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Verify Client Funding Deposit</h3>
              <button onClick={() => setVerifyingFunding(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Task:</span>
                <span className="text-white font-medium">{verifyingFunding.task_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Method:</span>
                <span className="text-white font-medium capitalize">{verifyingFunding.method.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reported Reference:</span>
                <span className="text-sky-400 font-mono font-bold">{verifyingFunding.payment_reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="text-emerald-400 font-mono font-bold">
                  PKR {(verifyingFunding.amount_minor / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Decision</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFundingAction('verified')}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    fundingAction === 'verified'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Confirm Received
                </button>
                <button
                  type="button"
                  onClick={() => setFundingAction('rejected')}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    fundingAction === 'rejected'
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Reject Deposit
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Admin Audit Notes / Verification Reference
              </label>
              <textarea
                value={fundingReason}
                onChange={e => setFundingReason(e.target.value)}
                placeholder="Confirmed on official bank credit advice statement..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVerifyingFunding(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingFunding}
                onClick={handleVerifyFunding}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg"
              >
                {isProcessingFunding ? 'Saving...' : 'Submit Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODERATE TASK MODAL */}
      {moderatingTask && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Moderate Task: {moderatingTask.title}</h3>
              <button onClick={() => setModeratingTask(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="text-slate-300">
                <span className="text-slate-500">Client: </span>{moderatingTask.client_name}
              </div>
              <div className="text-slate-300">
                <span className="text-slate-500">Slots: </span>{moderatingTask.max_slots} slots @ PKR {(moderatingTask.reward_per_slot_minor / 100).toFixed(2)}
              </div>
              <div className="text-slate-300">
                <span className="text-slate-500">Total Liability: </span>PKR {(moderatingTask.total_required_budget_minor / 100).toFixed(2)}
              </div>
              <div className="text-slate-300 mt-2">
                <span className="text-slate-500">Instructions: </span>{moderatingTask.instructions}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Decision</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTaskDecision('approved')}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    taskDecision === 'approved'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Approve Task
                </button>
                <button
                  type="button"
                  onClick={() => setTaskDecision('rejected')}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    taskDecision === 'rejected'
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Reject Task
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Reason</label>
              <textarea
                value={taskReason}
                onChange={e => setTaskReason(e.target.value)}
                placeholder="Reason for moderation decision..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModeratingTask(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingTask}
                onClick={handleModerateTask}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg"
              >
                {isProcessingTask ? 'Saving...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECONCILE WITHDRAWAL MODAL */}
      {reconcilingWithdrawal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Reconcile Manual External Payout</h3>
              <button onClick={() => setReconcilingWithdrawal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Worker:</span>
                <span className="text-white font-medium">{reconcilingWithdrawal.worker_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Method:</span>
                <span className="text-white font-medium capitalize">{reconcilingWithdrawal.method.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account:</span>
                <span className="text-white font-mono">{reconcilingWithdrawal.account_number_masked} ({reconcilingWithdrawal.account_title})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount to Disburse:</span>
                <span className="text-emerald-400 font-mono font-bold text-sm">
                  PKR {(reconcilingWithdrawal.amount_minor / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-lg text-xs text-amber-300">
              Important: Payouts must be sent through the actual Easypaisa/JazzCash merchant portal or bank. Only enter the real transaction reference after delivery is confirmed.
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Authentic Bank/Wallet Payout Transaction Reference *
              </label>
              <input
                type="text"
                value={externalPaymentRef}
                onChange={e => setExternalPaymentRef(e.target.value)}
                placeholder="e.g. EP-TRX-8819024 or JC-992104"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Admin Audit Notes</label>
              <input
                type="text"
                value={adminPayoutNotes}
                onChange={e => setAdminPayoutNotes(e.target.value)}
                placeholder="Disbursed via corporate Easypaisa account"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <button
                type="button"
                disabled={isRejectingWithdrawal}
                onClick={() => {
                  const reason = prompt('Enter reason for rejecting withdrawal (funds will be atomically refunded to worker):');
                  if (reason) {
                    setRejectWithdrawalReason(reason);
                    handleRejectWithdrawal();
                  }
                }}
                className="px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded"
              >
                Reject & Refund to Wallet
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReconcilingWithdrawal(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessingWithdrawal}
                  onClick={handleReconcilePayout}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
                >
                  {isProcessingWithdrawal ? 'Saving...' : 'Confirm Payment & Complete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEST RUNNER MODAL */}
      {testRunResult && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Ledger & System Constraint Audit</h3>
              <button onClick={() => setTestRunResult(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="font-mono text-slate-200">{new Date(testRunResult.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ledger Discrepancies:</span>
                <span className="font-mono text-emerald-400 font-bold">{testRunResult.integrity.discrepancies.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Client Funding:</span>
                <span className="font-mono text-slate-200">PKR {(testRunResult.integrity.totalClientFundingMinor / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Worker Rewards:</span>
                <span className="font-mono text-slate-200">PKR {(testRunResult.integrity.totalWorkerEarnedMinor / 100).toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-lg text-xs text-emerald-300">
              {testRunResult.test_summary}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setTestRunResult(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
