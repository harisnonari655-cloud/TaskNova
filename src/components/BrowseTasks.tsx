import React, { useState } from 'react';
import { Task, UserProfile, TaskSubmission } from '../types';
import { api } from '../api';
import { Search, Filter, Clock, CheckCircle2, AlertCircle, ArrowLeft, Send, Upload, FileText, Check } from 'lucide-react';

interface BrowseTasksProps {
  tasks: Task[];
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSubmissionSuccess: () => void;
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  mySubmissions: TaskSubmission[];
}

export const BrowseTasks: React.FC<BrowseTasksProps> = ({
  tasks,
  currentUser,
  onOpenAuth,
  onSubmissionSuccess,
  selectedTask,
  setSelectedTask,
  mySubmissions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Submission form state
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [evidenceLinks, setEvidenceLinks] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'data_categorization', label: 'Data Categorization' },
    { id: 'transcription', label: 'Audio Transcription' },
    { id: 'usability_testing', label: 'Usability Testing' },
    { id: 'fact_checking', label: 'Fact Checking' },
    { id: 'content_moderation', label: 'Content Moderation' },
    { id: 'digital_survey', label: 'Digital Surveys' },
  ];

  const filteredTasks = tasks.filter(task => {
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('File exceeds 5MB limit.');
      return;
    }

    // Check dangerous executable extensions
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['exe', 'sh', 'bat', 'cmd', 'js', 'vbs', 'msi'].includes(ext || '')) {
      setSubmitError('Executable and script file uploads are prohibited.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileData(reader.result as string);
    };
    reader.readAsDataURL(file);
    setSubmitError(null);
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!selectedTask) return;

    if (!evidenceNotes.trim()) {
      setSubmitError('Please provide detailed evidence notes describing how you fulfilled the requirements.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await api.submitWork({
        task_id: selectedTask.id,
        evidence_notes: evidenceNotes.trim(),
        evidence_links: evidenceLinks.trim(),
        evidence_file_name: fileName || undefined,
        evidence_file_data: fileData || undefined,
      });

      setSubmitSuccess(true);
      setEvidenceNotes('');
      setEvidenceLinks('');
      setFileName('');
      setFileData('');
      onSubmissionSuccess();
      setTimeout(() => {
        setSubmitSuccess(false);
        setSelectedTask(null);
      }, 2500);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit work');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if current user already submitted on selected task
  const existingSubmission = selectedTask && currentUser
    ? mySubmissions.find(s => s.task_id === selectedTask.id && s.worker_id === currentUser.id)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* If task is selected, show Task Detail & Submission View */}
      {selectedTask ? (
        <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Back button header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedTask(null);
                setSubmitError(null);
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Task Catalog</span>
            </button>
            <div className="text-xs text-slate-400">
              Task Reference: <span className="font-mono text-slate-300">{selectedTask.id}</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Title & Metadata */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="capitalize">{selectedTask.category.replace('_', ' ')}</span>
                <span className="text-slate-600">·</span>
                <span>Client: {selectedTask.client_name}</span>
                <span className="text-slate-600">·</span>
                <span>Est. Time: ~{selectedTask.estimated_minutes} mins</span>
                <span className="text-slate-600">·</span>
                <span className="text-emerald-400 font-mono">Verified Pre-Funded Budget</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {selectedTask.title}
              </h1>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
                <div>
                  <div className="text-slate-400">Approved Reward</div>
                  <div className="text-lg font-bold font-mono text-sky-400 tabular-nums">
                    PKR {(selectedTask.reward_per_slot_minor / 100).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Available Slots</div>
                  <div className="text-lg font-bold font-mono text-slate-200 tabular-nums">
                    {Math.max(0, selectedTask.max_slots - selectedTask.approved_slots)} / {selectedTask.max_slots}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Total Funded Pool</div>
                  <div className="text-lg font-bold font-mono text-slate-200 tabular-nums">
                    PKR {(selectedTask.funded_budget_minor / 100).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Evidence Format</div>
                  <div className="text-lg font-bold text-slate-200 capitalize">
                    {selectedTask.evidence_type.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-200">Overview</h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedTask.description}
              </p>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-200">Execution Instructions</h3>
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-300 font-normal leading-relaxed whitespace-pre-line">
                {selectedTask.instructions}
              </div>
            </div>

            {/* Acceptance Criteria */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-200">Review & Acceptance Criteria</h3>
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-300 font-normal leading-relaxed whitespace-pre-line">
                {selectedTask.acceptance_criteria}
              </div>
            </div>

            {/* SUBMISSION FORM SECTION */}
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <h3 className="text-lg font-bold text-white">Submit Work for Review</h3>

              {submitSuccess ? (
                <div className="p-6 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-white text-base">Submission Received Successfully</h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Your evidence has been queued for verification. Upon approval, PKR {(selectedTask.reward_per_slot_minor / 100).toFixed(2)} will be credited to your immutable wallet ledger.
                  </p>
                </div>
              ) : existingSubmission ? (
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-white text-sm">Your Existing Submission</div>
                    <span className="text-xs font-mono text-sky-400 uppercase font-semibold">
                      Status: {existingSubmission.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    You have already submitted work for this task on {new Date(existingSubmission.created_at).toLocaleDateString()}.
                  </p>
                  {existingSubmission.rejection_reason && (
                    <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-lg text-xs text-rose-300">
                      Reason for Rejection: {existingSubmission.rejection_reason}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmitWork} className="space-y-4">
                  {submitError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Evidence & Notes <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      value={evidenceNotes}
                      onChange={e => setEvidenceNotes(e.target.value)}
                      placeholder="Detail your work steps, findings, completed spreadsheet links, or text answers..."
                      rows={5}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      External Deliverable URL (Google Drive, Docs, GitHub, Staging link)
                    </label>
                    <input
                      type="url"
                      value={evidenceLinks}
                      onChange={e => setEvidenceLinks(e.target.value)}
                      placeholder="https://docs.google.com/..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Attach Evidence File (Screenshots, PDF, or text audit - Max 5MB)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 flex items-center gap-2 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-sky-400" />
                        <span>Choose File</span>
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.csv,.json"
                          className="hidden"
                        />
                      </label>
                      {fileName && (
                        <span className="text-xs text-sky-400 flex items-center gap-1 truncate max-w-xs">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{fileName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500">
                      Submissions are audited against client criteria. Fabricated work results in account flags.
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Submitting...' : 'Submit Evidence'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TASK BROWSER LISTING */
        <div className="space-y-6">
          {/* Header & Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Browse Microtasks</h1>
              <p className="text-xs text-slate-400 mt-1">
                Verified client-funded opportunities. No phantom tasks or unverified listings.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tasks by keyword..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Interactive Filter Tabs (functional segmented buttons) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Task Grid */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
              <Clock className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-base font-semibold text-white">No Tasks Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No active tasks match your current filter criteria. Check back shortly as clients publish new funded assignments.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map(task => {
                const rewardPKR = (task.reward_per_slot_minor / 100).toFixed(2);
                const remainingSlots = Math.max(0, task.max_slots - task.approved_slots);
                const percentFilled = Math.round((task.approved_slots / task.max_slots) * 100);

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                        <span className="capitalize">{task.category.replace('_', ' ')}</span>
                        <span className="text-slate-600">·</span>
                        <span>~{task.estimated_minutes} mins</span>
                        <span className="text-slate-600">·</span>
                        <span className="font-mono text-emerald-400 font-medium">Funded</span>
                      </div>

                      <h3 className="font-semibold text-white text-base group-hover:text-sky-400 transition-colors line-clamp-2 mb-2">
                        {task.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                        {task.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[11px] text-slate-500">Reward Per Slot</div>
                          <div className="font-mono font-bold text-sky-400 text-base tabular-nums">
                            PKR {rewardPKR}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] text-slate-500">Remaining Slots</div>
                          <div className="font-mono font-semibold text-slate-300 text-sm tabular-nums">
                            {remainingSlots} / {task.max_slots}
                          </div>
                        </div>
                      </div>

                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-sky-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${percentFilled}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
