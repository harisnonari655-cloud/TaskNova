import React from 'react';

interface FooterProps {
  onOpenPolicy: (policyKey: string) => void;
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPolicy, onNavigate }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-sky-600 flex items-center justify-center text-white font-bold text-xs">
                TN
              </div>
              <span className="font-bold text-slate-200 text-sm tracking-tight">TaskNova</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              A transparent microtask marketplace. Tasks are client-funded, submissions undergo documented review, and rewards are tracked via an immutable ledger.
            </p>
          </div>

          <div>
            <div className="font-semibold text-slate-200 mb-3 text-xs tracking-wider uppercase">Marketplace</div>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('browse')} className="hover:text-white transition-colors">
                  Browse Active Tasks
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('worker')} className="hover:text-white transition-colors">
                  Worker Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('client')} className="hover:text-white transition-colors">
                  Client Task Creation
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin')} className="hover:text-white transition-colors">
                  Administrative Moderation
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-slate-200 mb-3 text-xs tracking-wider uppercase">Compliance & Policies</div>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onOpenPolicy('terms')} className="hover:text-white transition-colors">
                  Terms of Service (Draft)
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy('privacy')} className="hover:text-white transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy('task-rules')} className="hover:text-white transition-colors">
                  Task Rules & Acceptance Policy
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy('withdrawals')} className="hover:text-white transition-colors">
                  Withdrawal & Payout Policy
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy('funding')} className="hover:text-white transition-colors">
                  Client Funding & Refund Policy
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy('disputes')} className="hover:text-white transition-colors">
                  Dispute & Appeal Policy
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-slate-200 mb-3 text-xs tracking-wider uppercase">Operational Transparency</div>
            <p className="text-slate-400 leading-relaxed text-xs mb-3">
              No guaranteed earnings. Payouts are manually verified and executed outside the platform via Easypaisa, JazzCash, or Bank Transfer after admin review.
            </p>
            <div className="text-[11px] text-slate-500">
              Platform Currency: Pakistani Rupee (PKR · Paisa)
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} TaskNova Marketplace. All rights reserved.
          </div>
          <div>
            Draft operational policies requiring local regulatory review before public release.
          </div>
        </div>
      </div>
    </footer>
  );
};
