import React, { useState } from 'react';
import { Shield, FileText, Lock, AlertCircle, X } from 'lucide-react';

interface LegalPoliciesModalProps {
  initialPolicy?: string;
  onClose: () => void;
}

export const LegalPoliciesModal: React.FC<LegalPoliciesModalProps> = ({
  initialPolicy = 'terms',
  onClose,
}) => {
  const [activePolicy, setActivePolicy] = useState<string>(initialPolicy);

  const policies: Record<string, { title: string; content: React.ReactNode }> = {
    terms: {
      title: 'Terms of Service (Operational Draft)',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-lg text-amber-300 text-[11px]">
            Notice: This document is an initial draft establishing marketplace rules. It must be reviewed by legal counsel licensed in the relevant jurisdiction prior to commercial deployment.
          </div>
          <h4 className="font-semibold text-white text-sm">1. Nature of the Marketplace</h4>
          <p>
            TaskNova operates as a technology coordination marketplace connecting digital clients with independent microtask contributors. TaskNova is not an employer, bank, or regulated escrow institution. All work submitted is performed independently by registered users.
          </p>
          <h4 className="font-semibold text-white text-sm">2. No Guaranteed Income</h4>
          <p>
            Participation on TaskNova is voluntary. There is no guarantee of task availability, ongoing volume, or specific earnings. Completing a task does not guarantee approval; work must meet documented client acceptance criteria to earn wallet ledger rewards.
          </p>
          <h4 className="font-semibold text-white text-sm">3. Pre-Funded Budgets and Capacity</h4>
          <p>
            Tasks are activated strictly after incoming client budget funding is independently verified by platform administration. Tasks automatically close when their funded slot capacity is fulfilled.
          </p>
          <h4 className="font-semibold text-white text-sm">4. Account Integrity</h4>
          <p>
            Users agree to submit truthful information, avoid automated scripts, and never fabricate evidence. Multi-account abuse, credential sharing, or submission spam will result in immediate suspension.
          </p>
        </div>
      ),
    },
    privacy: {
      title: 'Privacy Policy & Payout Data Protection',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <h4 className="font-semibold text-white text-sm">1. Data Collected</h4>
          <p>
            We collect account credentials (email, hashed password, name), payment destination details (masked phone/account numbers, account titles), work evidence submissions, and audit trail logs.
          </p>
          <h4 className="font-semibold text-white text-sm">2. Handling of Sensitive Payout Details</h4>
          <p>
            Payout details (Easypaisa/JazzCash account numbers and bank titles) are masked in standard user interfaces and accessible strictly by authorized administrators during external disbursement reconciliation. Payout credentials are never sold or shared with advertisers.
          </p>
          <h4 className="font-semibold text-white text-sm">3. Private Storage of Evidence</h4>
          <p>
            Uploaded task evidence is restricted via server-side authorization checks and expiring signed references. Other contributors cannot inspect your submitted files.
          </p>
        </div>
      ),
    },
    'task-rules': {
      title: 'Task Rules & Acceptance Policy',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <h4 className="font-semibold text-white text-sm">1. Lawful Microtask Scope</h4>
          <p>
            Only lawful, substantive digital tasks are permitted on TaskNova. Tasks involving social media manipulation (fake likes, follower farming, fake reviews), credential harvesting, or CAPTCHA bypass are strictly prohibited.
          </p>
          <h4 className="font-semibold text-white text-sm">2. Clear Instructions and Criteria</h4>
          <p>
            Clients must state specific, objective acceptance criteria before publishing. Clients may not retroactively modify instructions or lower reward rates after worker submissions have begun.
          </p>
          <h4 className="font-semibold text-white text-sm">3. Mandatory Rejection Reasons</h4>
          <p>
            Reviewers cannot reject work without specifying actionable reasoning based on the published criteria. Workers retain the right to file an administrative appeal.
          </p>
        </div>
      ),
    },
    withdrawals: {
      title: 'Withdrawal & Manual Payout Policy',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <h4 className="font-semibold text-white text-sm">1. Manual Processing Model</h4>
          <p>
            TaskNova does not claim automated instantaneous payout integration. Payouts are manually reviewed and executed outside the website by administrators via verified banking rails (JazzCash, Easypaisa, or direct bank transfer).
          </p>
          <h4 className="font-semibold text-white text-sm">2. Atomic Fund Reservation</h4>
          <p>
            Upon submitting a withdrawal request (minimum PKR 100.00), the requested amount is atomically debited from your available balance and credited to your reserved ledger balance. This prevents double-spending while awaiting verification.
          </p>
          <h4 className="font-semibold text-white text-sm">3. Independent Reconciliation</h4>
          <p>
            A withdrawal is marked completed only after the administrator executes the payment and records the authentic transaction reference. If an invalid destination is supplied, the reservation is atomically released back to your available balance.
          </p>
        </div>
      ),
    },
    funding: {
      title: 'Client Funding & Refund Policy',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <h4 className="font-semibold text-white text-sm">1. Pre-Payment Verification</h4>
          <p>
            Client tasks cannot be published without 100% pre-funded budget backing (Reward × Slots). Screenshots are not conclusive proof; platform administrators verify funds in the bank ledger before allocating task budgets.
          </p>
          <h4 className="font-semibold text-white text-sm">2. Unused Task Funds</h4>
          <p>
            If a client closes a task before all slots are approved, the remaining unspent budget remains credited to the client account and can be reallocated to future tasks or refunded following administrative verification.
          </p>
        </div>
      ),
    },
    disputes: {
      title: 'Dispute & Appeal Policy',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <h4 className="font-semibold text-white text-sm">1. Objective Review Process</h4>
          <p>
            Workers who believe their work was rejected unfairly may submit an appeal. A platform administrator reviews the submission against the client instructions.
          </p>
          <h4 className="font-semibold text-white text-sm">2. Determinations</h4>
          <p>
            If the work satisfies the published acceptance criteria, the administrator will reverse the rejection and credit the worker ledger. If the rejection was justified, the contributor receives clear guidance on how to avoid similar errors.
          </p>
        </div>
      ),
    },
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-white text-base">Platform Legal & Transparency Center</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Policy Switcher Bar */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-950/40">
          {Object.entries(policies).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setActivePolicy(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                activePolicy === key
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.title.split('(')[0].trim()}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <h2 className="text-lg font-bold text-white tracking-tight">
            {policies[activePolicy]?.title}
          </h2>
          {policies[activePolicy]?.content}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] text-slate-500">
          <span>TaskNova Policy Version 2026.1 (Operational Draft)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
