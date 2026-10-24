import React, { useState } from 'react';
import { UserProfile, SupportTicket } from '../types';
import { api } from '../api';
import { MessageSquare, Plus, CheckCircle2, Clock, Send, HelpCircle, ShieldAlert } from 'lucide-react';

interface SupportDisputesProps {
  currentUser: UserProfile | null;
  tickets: SupportTicket[];
  onRefresh: () => void;
  onOpenAuth: () => void;
}

export const SupportDisputes: React.FC<SupportDisputesProps> = ({
  currentUser,
  tickets,
  onRefresh,
  onOpenAuth,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admin reply state
  const [replyingTicket, setReplyingTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await api.createSupportTicket({
        subject: subject.trim(),
        category,
        message: message.trim(),
      });
      setShowCreateModal(false);
      setSubject('');
      setMessage('');
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create support ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTicket || !replyText.trim()) return;

    try {
      setIsReplying(true);
      await api.replySupportTicket(replyingTicket.id, {
        reply: replyText.trim(),
        status: 'resolved',
      });
      setReplyingTicket(null);
      setReplyText('');
      onRefresh();
    } catch (err: any) {
      alert('Failed to send reply: ' + err.message);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Support Desk & Dispute Resolution</h1>
          <p className="text-xs text-slate-400 mt-1">
            Submit questions regarding payments, reviews, or appeal contested microtask evaluations.
          </p>
        </div>

        <button
          onClick={() => {
            if (!currentUser) onOpenAuth();
            else setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Open Support Ticket</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden space-y-4">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm">
            {currentUser?.role === 'admin' ? 'All Platform Tickets' : 'Your Support Tickets'}
          </h3>
          <span className="text-xs text-slate-400">{tickets.length} total</span>
        </div>

        {tickets.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-3">
            <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <p>No active support tickets found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {tickets.map(ticket => (
              <div key={ticket.id} className="p-5 hover:bg-slate-800/20 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{ticket.subject}</span>
                    <span className="text-slate-500">·</span>
                    <span className="capitalize text-slate-400">{ticket.category.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-500 text-[11px]">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                    <span className={`inline-flex items-center gap-1 font-mono uppercase text-[11px] font-semibold ${
                      ticket.status === 'resolved' ? 'text-emerald-400' :
                      ticket.status === 'open' ? 'text-amber-400' : 'text-sky-400'
                    }`}>
                      {ticket.status === 'resolved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {ticket.status === 'open' && <Clock className="w-3.5 h-3.5" />}
                      <span>{ticket.status}</span>
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-500 mb-1">
                    Submitted by: {ticket.user_name}
                  </div>
                  {ticket.message}
                </div>

                {ticket.admin_reply && (
                  <div className="text-xs text-sky-200 leading-relaxed bg-sky-950/30 p-3 rounded-lg border border-sky-900/50 space-y-1">
                    <div className="text-[11px] font-semibold text-sky-400">
                      Support Team Response:
                    </div>
                    <div>{ticket.admin_reply}</div>
                  </div>
                )}

                {currentUser?.role === 'admin' && !ticket.admin_reply && (
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => setReplyingTicket(ticket)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-medium rounded transition-colors"
                    >
                      Reply to Ticket
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">New Support or Dispute Ticket</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Question regarding Task #tsk_001 submission"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="general">General Support</option>
                  <option value="task_review">Task Review & Evaluation</option>
                  <option value="payment">Funding & Withdrawals</option>
                  <option value="dispute">Submission Dispute</option>
                  <option value="account">Account & Security</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Detailed Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Provide complete facts, reference IDs, and context..."
                  rows={4}
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
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN REPLY MODAL */}
      {replyingTicket && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Reply to Ticket: {replyingTicket.subject}</h3>
              <button onClick={() => setReplyingTicket(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300">
              {replyingTicket.message}
            </div>

            <form onSubmit={handleAdminReply} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Official Response</label>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={4}
                  placeholder="Type clear instructions or determination..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyingTicket(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReplying}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg"
                >
                  {isReplying ? 'Sending...' : 'Send Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
