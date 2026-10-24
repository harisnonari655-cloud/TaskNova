import React from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, FileCheck, Wallet, ArrowUpRight, Lock, Clock, HelpCircle } from 'lucide-react';
import { Task } from '../types';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  onOpenAuth: () => void;
  onSelectTask: (task: Task) => void;
  featuredTasks: Task[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenAuth,
  onSelectTask,
  featuredTasks,
}) => {
  return (
    <div className="space-y-24 pb-20">
      {/* HERO SECTION */}
      <section className="relative pt-12 md:pt-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headline and Actions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-sky-400 uppercase">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Legitimate Microtask & Verification Marketplace</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.15]" style={{ textWrap: 'balance' }}>
                Every microtask is client-funded. Every reward is ledger-backed.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                TaskNova connects Pakistani businesses needing verifiable digital microtasks with skilled remote contributors. Unfunded tasks are never published, submissions undergo documented evaluation, and approved rewards credit directly to an immutable ledger.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onNavigate('browse')}
                  className="px-6 py-3.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all shadow-lg shadow-sky-600/25 flex items-center gap-2 shrink-0"
                >
                  <span>Browse Available Tasks</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onOpenAuth}
                  className="px-6 py-3.5 text-sm font-semibold text-slate-200 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                >
                  Create Client or Worker Account
                </button>
              </div>

              {/* Honest Quantitative & Operational Disclosures */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-6 text-xs text-slate-400">
                <div>
                  <div className="font-bold text-white text-base font-mono tabular-nums">100%</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Pre-Funded Budgets</div>
                </div>
                <div>
                  <div className="font-bold text-white text-base font-mono tabular-nums">0 Paisa</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Hidden Worker Fees</div>
                </div>
                <div>
                  <div className="font-bold text-white text-base font-mono tabular-nums">Manual</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">External Bank Payouts</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual from generate_image */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 aspect-16/10">
                <img
                  src="/src/assets/images/tasknova_marketplace_hero_1792863138406.jpg"
                  alt="TaskNova financial and digital task verification center"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 text-xs text-slate-200 bg-slate-950/85 backdrop-blur-md p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span>Independent admin receipt verification</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">PKR Currency Rail</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS: 4 CONCRETE STAGES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2">Operational Integrity</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How the TaskNova Marketplace Operates
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            No algorithmically inflated metrics or phantom budgets. Every rupee must be verified in the bank desk before any microtask can go live.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-sky-950/80 border border-sky-800/50 flex items-center justify-center text-sky-400 font-bold">
              01
            </div>
            <h3 className="text-base font-semibold text-white">Client Funds Budget</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clients submit tasks with clear requirements, max slots, and reward per slot. They report payment via JazzCash, Easypaisa, or bank deposit.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-sky-950/80 border border-sky-800/50 flex items-center justify-center text-sky-400 font-bold">
              02
            </div>
            <h3 className="text-base font-semibold text-white">Admin Verifies Payment</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Administrators independently check the official bank statement for the exact reference. Only verified funds activate the task slots.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-sky-950/80 border border-sky-800/50 flex items-center justify-center text-sky-400 font-bold">
              03
            </div>
            <h3 className="text-base font-semibold text-white">Evidence & Review</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Workers complete assignments and upload required proof. Reviewers approve compliant work with documented notes or reject with specific feedback.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-sky-950/80 border border-sky-800/50 flex items-center justify-center text-sky-400 font-bold">
              04
            </div>
            <h3 className="text-base font-semibold text-white">Manual Payout Execution</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Workers request withdrawal. Funds are reserved in the immutable ledger. Admins manually disburse payouts via bank rail and record reconciliation refs.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED ACTIVE TASKS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1">Live Opportunities</div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Active Verified Tasks</h2>
            <p className="text-xs text-slate-400 mt-1">
              Currently funded tasks accepting worker submissions with guaranteed slot budgets.
            </p>
          </div>
          <button
            onClick={() => onNavigate('browse')}
            className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 shrink-0"
          >
            <span>View All Tasks ({featuredTasks.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredTasks.slice(0, 3).map(task => {
            const rewardPKR = (task.reward_per_slot_minor / 100).toFixed(2);
            const remainingSlots = Math.max(0, task.max_slots - task.approved_slots);
            const percentFilled = Math.round((task.approved_slots / task.max_slots) * 100);

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span className="capitalize">{task.category.replace('_', ' ')}</span>
                    <span className="text-slate-500">·</span>
                    <span>~{task.estimated_minutes} mins</span>
                    <span className="text-slate-500">·</span>
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

                  {/* Progress bar */}
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
      </section>

      {/* SUPPORTED MICROTASK CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 lg:p-12">
          <div className="max-w-2xl mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
              Supported Work Categories
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              We strictly forbid low-quality social engagement spam, fake reviews, or malicious clicking. TaskNova hosts lawful, substantive digital microtasks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="font-semibold text-white text-sm">Data Categorization & Tagging</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Classifying catalog products, taxonomies, attributes, and structured datasets for e-commerce and search systems.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="font-semibold text-white text-sm">Urdu & English Audio Transcription</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Converting spoken customer support recordings and field voice notes into accurate verbatim text transcripts.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="font-semibold text-white text-sm">Software Usability Testing</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluating Pakistani websites, payment checkouts, and mobile views to report UI friction, missing buttons, or lag.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="font-semibold text-white text-sm">Fact Checking & Source Audits</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Verifying company contact details, business registry listings, and public citations against official directories.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="font-semibold text-white text-sm">Content Moderation & Review</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Screening user-generated community content, images, and listings for policy compliance and quality standards.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="font-semibold text-white text-sm">Local Demographic Surveys</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Participating in structured consumer research surveys with verified identity and single-response integrity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-400">Clear explanations regarding marketplace rules, budgets, and withdrawals.</p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
            <h4 className="text-sm font-semibold text-slate-200">Are earnings guaranteed on TaskNova?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              No. TaskNova never guarantees earnings. Tasks are available subject to client demand, open slot capacity, and acceptance criteria. Submitting work that does not satisfy client instructions will be rejected with documented feedback.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
            <h4 className="text-sm font-semibold text-slate-200">How do clients fund their tasks?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clients create a draft task and calculate their total payout liability (Slots × Reward). They transfer funds via JazzCash, Easypaisa, or direct bank transfer, and report the transaction reference. A human platform admin reconciles the bank desk before the task is enabled for workers.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
            <h4 className="text-sm font-semibold text-slate-200">How are worker withdrawals processed?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              When a worker requests a withdrawal (minimum PKR 100), the funds are reserved in the immutable ledger. A platform administrator manually executes the payout through the verified corporate JazzCash, Easypaisa, or bank portal and enters the authentic transaction reference into the system reconciliation record.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
            <h4 className="text-sm font-semibold text-slate-200">What if my submission is unfairly rejected?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every rejected submission must state an explicit reason. Workers can submit a formal appeal through their submissions dashboard. Administrators review the original criteria and evidence to ensure fair determinations.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-sky-950/60 to-slate-900 border border-sky-800/40 rounded-2xl p-8 sm:p-12 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ textWrap: 'balance' }}>
            Ready to participate in an honest, verified task economy?
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Create an account in seconds. Test the full lifecycle as a Worker submitting assignments or as a Client funding verified task slots.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={onOpenAuth}
              className="px-6 py-3 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors shadow-md shadow-sky-600/20"
            >
              Get Started Now
            </button>
            <button
              onClick={() => onNavigate('browse')}
              className="px-6 py-3 text-sm font-semibold text-slate-200 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Browse Public Tasks
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
