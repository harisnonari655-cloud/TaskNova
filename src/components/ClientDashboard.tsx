import React, { useState } from 'react';
import { UserProfile, Task, TaskFunding, TaskSubmission } from '../types';
import { api } from '../api';
import { Plus, CreditCard, CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';

interface ClientDashboardProps {
  currentUser: UserProfile;
  tasks: Task[];
  submissions: TaskSubmission[];
  fundingHistory: TaskFunding[];
  onRefresh: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  currentUser,
  tasks,
  submissions,
  fundingHistory,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'submissions' | 'funding'>('tasks');

  // Create Task Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Task['category']>('data_categorization');
  const [instructions, setInstructions] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [evidenceType, setEvidenceType] = useState<Task['evidence_type']>('text_and_url');
  const [rewardPerSlotPKR, setRewardPerSlotPKR] = useState('50');
  const [maxSlots, setMaxSlots] = useState('20');
  const [estimatedMinutes, setEstimatedMinutes] = useState('15');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Funding Deposit Modal
  const [fundingTask, setFundingTask] = useState<Task | null>(null);
  const [fundingMethod, setFundingMethod] = useState<'easypaisa' | 'jazzcash' | 'bank_transfer'>('bank_transfer');
  const [paymentRef, setPaymentRef] = useState('');
  const [fundingNotes, setFundingNotes] = useState('');
  const [isFunding, setIsFunding] = useState(false);
  const [fundingError, setFundingError] = useState<string | null>(null);
  const [fundingSuccess, setFundingSuccess] = useState(false);

  // Review Submission Modal
  const [reviewingSub, setReviewingSub] = useState<TaskSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Filter tasks created by this client
  const myTasks = tasks.filter(t => t.client_id === currentUser.id);

  // Calculate stats
  const totalSlotsCount = myTasks.reduce((acc, t) => acc + t.max_slots, 0);
  const totalApprovedSlots = myTasks.reduce((acc, t) => acc + t.approved_slots, 0);
  const totalFundedMinor = myTasks.reduce((acc, t) => acc + t.funded_budget_minor, 0);
  const pendingSubmissionsCount = submissions.filter(s => s.status === 'pending').length;

  const calculatedRequiredBudgetPKR = (
    (parseFloat(rewardPerSlotPKR || '0') * parseInt(maxSlots || '0', 10)) || 0
  ).toFixed(2);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const rewardMinor = Math.round(parseFloat(rewardPerSlotPKR) * 100);
    const slots = parseInt(maxSlots, 10);
    if (isNaN(rewardMinor) || rewardMinor <= 0) {
      setCreateError('Reward per slot must be greater than zero.');
      return;
    }
    if (isNaN(slots) || slots <= 0) {
      setCreateError('Maximum slots must be greater than zero.');
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);
      await api.createTask({
        title: title.trim(),
        description: description.trim(),
        category,
        instructions: instructions.trim(),
        acceptance_criteria: acceptanceCriteria.trim(),
        evidence_type: evidenceType,
        reward_per_slot_minor: rewardMinor,
        max_slots: slots,
        estimated_minutes: parseInt(estimatedMinutes, 10) || 15,
      });

      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setInstructions('');
      setAcceptanceCriteria('');
      onRefresh();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create task');
    } finally {
      setIsCreating(false);
    }
  };

  const handleReportFunding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundingTask) return;
    if (!paymentRef.trim()) {
      setFundingError('Payment reference number is required.');
      return;
    }

    try {
      setIsFunding(true);
      setFundingError(null);
      await api.reportFunding(fundingTask.id, {
        amount_minor: fundingTask.total_required_budget_minor,
        method: fundingMethod,
        payment_reference: paymentRef.trim(),
        proof_notes: fundingNotes.trim(),
      });

      setFundingSuccess(true);
      onRefresh();
      setTimeout(() => {
        setFundingSuccess(false);
        setFundingTask(null);
        setPaymentRef('');
        setFundingNotes('');
      }, 2000);
    } catch (err: any) {
      setFundingError(err.message || 'Failed to submit funding report');
    } finally {
      setIsFunding(false);
    }
  };

  const handleReviewSubmission = async (decision: 'approved' | 'rejected') => {
    if (!reviewingSub) return;
    if (decision === 'rejected' && !rejectionReason.trim()) {
      setReviewError('You must specify a clear reason when rejecting work.');
      return;
    }

    try {
      setIsReviewing(true);
      setReviewError(null);
      await api.reviewSubmission(reviewingSub.id, decision, rejectionReason.trim());
      setReviewingSub(null);
      setRejectionReason('');
      onRefresh();
    } catch (err: any) {
      setReviewError(err.message || 'Failed to review submission');
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Client Operations Desk</h1>
          <p className="text-xs text-slate-400 mt-1">
            Author microtasks, fund guaranteed budgets, and review submitted evidence.
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
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-sky-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Task</span>
          </button>
        </div>
      </div>

      {/* METRIC STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Total Verified Budget</div>
          <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
            PKR {(totalFundedMinor / 100).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Allocated to active tasks</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Submissions Awaiting Review</div>
          <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
            {pendingSubmissionsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Requires your evaluation</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Approved Slots</div>
          <div className="text-xl font-bold font-mono text-sky-400 tabular-nums">
            {totalApprovedSlots} / {totalSlotsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Total slots delivered</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Created Tasks</div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {myTasks.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across all categories</div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'tasks' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          My Tasks ({myTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'submissions' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Submissions to Review ({submissions.length})
        </button>
        <button
          onClick={() => setActiveTab('funding')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'funding' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Funding History ({fundingHistory.length})
        </button>
      </div>

      {/* TAB 1: MY TASKS */}
      {activeTab === 'tasks' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Created Tasks</h3>
            <span className="text-xs text-slate-400">All tasks require verified funding to activate</span>
          </div>

          {myTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              You haven't created any tasks yet.{' '}
              <button onClick={() => setShowCreateModal(true)} className="text-sky-400 underline ml-1">
                Create your first task
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-medium">Task Title</th>
                    <th className="py-3 px-4 font-medium">Category</th>
                    <th className="py-3 px-4 font-medium">Reward/Slot</th>
                    <th className="py-3 px-4 font-medium">Slots (Done/Total)</th>
                    <th className="py-3 px-4 font-medium">Funded Pool</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {myTasks.map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{t.title}</div>
                        <div className="text-[11px] font-mono text-slate-500">ID: {t.id}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 capitalize">
                        {t.category.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-400 tabular-nums">
                        PKR {(t.reward_per_slot_minor / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 tabular-nums">
                        {t.approved_slots} / {t.max_slots}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 tabular-nums">
                        PKR {(t.funded_budget_minor / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-mono uppercase text-[11px] font-semibold ${
                          t.status === 'active' ? 'text-emerald-400' :
                          t.status === 'completed' ? 'text-sky-400' :
                          t.status === 'approved_unfunded' ? 'text-amber-400' :
                          t.status === 'pending_moderation' ? 'text-purple-400' : 'text-slate-400'
                        }`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {t.status === 'approved_unfunded' && (
                          <button
                            onClick={() => {
                              setFundingTask(t);
                              setPaymentRef('');
                              setFundingNotes('');
                              setFundingError(null);
                            }}
                            className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded transition-colors"
                          >
                            Fund Task
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

      {/* TAB 2: SUBMISSIONS TO REVIEW */}
      {activeTab === 'submissions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Submissions on Your Tasks</h3>
            <span className="text-xs text-slate-400">{submissions.length} total</span>
          </div>

          {submissions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No worker submissions received yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-medium">Task</th>
                    <th className="py-3 px-4 font-medium">Worker</th>
                    <th className="py-3 px-4 font-medium">Submitted</th>
                    <th className="py-3 px-4 font-medium">Reward</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {submissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{sub.task_title}</div>
                        <div className="text-[11px] font-mono text-slate-500">Sub ID: {sub.id}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{sub.worker_name}</td>
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
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(sub.status === 'pending' || sub.status === 'appealed') && (
                          <button
                            onClick={() => {
                              setReviewingSub(sub);
                              setRejectionReason('');
                              setReviewError(null);
                            }}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded text-xs font-medium transition-colors"
                          >
                            Review Work
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

      {/* TAB 3: FUNDING HISTORY */}
      {activeTab === 'funding' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Deposit Reports & Verification Status</h3>
            <span className="text-xs text-slate-400">Independently reconciled by Platform Admin</span>
          </div>

          {fundingHistory.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No funding deposits reported yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-medium">Task</th>
                    <th className="py-3 px-4 font-medium">Method</th>
                    <th className="py-3 px-4 font-medium">Payment Reference</th>
                    <th className="py-3 px-4 font-medium">Amount</th>
                    <th className="py-3 px-4 font-medium">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {fundingHistory.map(f => (
                    <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-200">{f.task_title}</td>
                      <td className="py-3 px-4 capitalize text-slate-400">{f.method.replace('_', ' ')}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{f.payment_reference}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-200 tabular-nums">
                        PKR {(f.amount_minor / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-mono uppercase text-[11px] font-semibold ${
                          f.status === 'verified' ? 'text-emerald-400' :
                          f.status === 'rejected' ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {f.status === 'verified' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {f.status}
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

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Create Microtask</h3>
                <p className="text-[11px] text-slate-400">All tasks undergo administrative quality moderation before publication.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              {createError && (
                <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-xs text-rose-300">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Categorize 15 fashion apparel SKU listings"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="data_categorization">Data Categorization</option>
                    <option value="transcription">Audio Transcription</option>
                    <option value="usability_testing">Usability Testing</option>
                    <option value="fact_checking">Fact Checking</option>
                    <option value="content_moderation">Content Moderation</option>
                    <option value="digital_survey">Digital Survey</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Evidence Format</label>
                  <select
                    value={evidenceType}
                    onChange={e => setEvidenceType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="text_and_url">Text & External URL</option>
                    <option value="file_upload">File Upload (Screenshot/PDF)</option>
                    <option value="code_snippet">Code Snippet</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Reward/Slot (PKR) *</label>
                  <input
                    type="number"
                    step="1"
                    min="5"
                    value={rewardPerSlotPKR}
                    onChange={e => setRewardPerSlotPKR(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Max Slots *</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={maxSlots}
                    onChange={e => setMaxSlots(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Est. Minutes</label>
                  <input
                    type="number"
                    min="1"
                    value={estimatedMinutes}
                    onChange={e => setEstimatedMinutes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Calculated Maximum Liability Box */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Pre-Funded Budget Liability (Slots × Reward):</span>
                <span className="font-mono font-bold text-sky-400 text-sm">
                  PKR {calculatedRequiredBudgetPKR}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task Description *</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="High-level summary of what the contributor is expected to accomplish..."
                  rows={2}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Step-by-Step Instructions *</label>
                <textarea
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="1. Open link...\n2. Check column C...\n3. Record finding..."
                  rows={3}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Acceptance Criteria *</label>
                <textarea
                  value={acceptanceCriteria}
                  onChange={e => setAcceptanceCriteria(e.target.value)}
                  placeholder="Specific conditions required for approving submission (e.g. 100% accurate classification, zero blanks)..."
                  rows={2}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg"
                >
                  {isCreating ? 'Submitting...' : 'Submit for Moderation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FUND TASK DEPOSIT MODAL */}
      {fundingTask && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Fund Task: {fundingTask.title}</h3>
              <button onClick={() => setFundingTask(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {fundingSuccess ? (
              <div className="p-6 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-semibold text-white">Payment Report Queued</h4>
                <p className="text-xs text-slate-300">
                  Platform administration will reconcile your bank transaction reference with our corporate account. Upon verification, the task will automatically be activated!
                </p>
              </div>
            ) : (
              <form onSubmit={handleReportFunding} className="space-y-4">
                {fundingError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-xs text-rose-300">
                    {fundingError}
                  </div>
                )}

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-400">Required Budget Amount:</span>
                  <span className="font-mono font-bold text-sky-400 text-sm">
                    PKR {(fundingTask.total_required_budget_minor / 100).toFixed(2)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select Payment Rail</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['bank_transfer', 'easypaisa', 'jazzcash'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFundingMethod(m)}
                        className={`py-2 px-3 text-xs font-medium rounded-lg border capitalize transition-colors ${
                          fundingMethod === m
                            ? 'bg-sky-600/20 border-sky-500 text-sky-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {m.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Authentic Bank / Wallet Payment Reference Number *
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    placeholder="e.g. HBL-FT-99201481 or EP-98440192"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Payment Notes / Sending Account Title
                  </label>
                  <input
                    type="text"
                    value={fundingNotes}
                    onChange={e => setFundingNotes(e.target.value)}
                    placeholder="e.g. Transferred from Apex Corporate Account"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                  />
                </div>

                <div className="text-[11px] text-slate-500">
                  Screenshots are supplementary; admins verify funds directly in bank statements before unlocking worker slots.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFundingTask(null)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isFunding}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg"
                  >
                    {isFunding ? 'Submitting...' : 'Report Payment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* REVIEW SUBMISSION MODAL */}
      {reviewingSub && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Review Work: {reviewingSub.task_title}</h3>
              <button onClick={() => setReviewingSub(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {reviewError && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-xs text-rose-300">
                {reviewError}
              </div>
            )}

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
              <div>
                <div className="text-slate-500">Contributor:</div>
                <div className="text-slate-200 font-medium">{reviewingSub.worker_name}</div>
              </div>

              <div>
                <div className="text-slate-500">Submitted Notes & Evidence:</div>
                <div className="text-slate-200 whitespace-pre-line mt-1 bg-slate-900 p-3 rounded-lg border border-slate-800">
                  {reviewingSub.evidence_notes}
                </div>
              </div>

              {reviewingSub.evidence_links && (
                <div>
                  <div className="text-slate-500">Deliverable URL:</div>
                  <a
                    href={reviewingSub.evidence_links}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 underline break-all"
                  >
                    {reviewingSub.evidence_links}
                  </a>
                </div>
              )}

              {reviewingSub.evidence_file_name && (
                <div>
                  <div className="text-slate-500">Attached File:</div>
                  <div className="text-slate-300 font-mono">{reviewingSub.evidence_file_name}</div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Rejection Reason (Required if rejecting work)
              </label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Explain what was missing or incorrect so the contributor can understand or appeal..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setReviewingSub(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={() => handleReviewSubmission('rejected')}
                  className="px-4 py-2 bg-rose-600/20 border border-rose-500/40 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>Reject Submission</span>
                </button>

                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={() => handleReviewSubmission('approved')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Approve & Credit Reward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
