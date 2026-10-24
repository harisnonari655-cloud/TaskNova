import React, { useState } from 'react';
import { UserProfile } from '../types';
import { api } from '../api';
import { Shield, User, Briefcase, Lock, Mail, AlertCircle, X, Check } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'worker' | 'client'>('worker');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login(email.trim(), password);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.register({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          role,
          phone: phone.trim() || undefined,
        });
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (targetRole: 'worker' | 'client' | 'admin') => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.demoSwitch(targetRole);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white text-base">
              {mode === 'login' ? 'Sign in to TaskNova' : 'Create TaskNova Account'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {mode === 'login' ? 'Access your dashboard, wallet, or tasks' : 'Choose your marketplace role'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Instant Persona Quick Switchers */}
        <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Instant Demo Evaluation Logins
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('worker')}
              disabled={isLoading}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-colors"
            >
              <div className="text-xs font-semibold text-white">Worker</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Zainab (PKR 100)</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('client')}
              disabled={isLoading}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-colors"
            >
              <div className="text-xs font-semibold text-white">Client</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Apex Solutions</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              disabled={isLoading}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition-colors"
            >
              <div className="text-xs font-semibold text-white">Admin</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Platform Ops</div>
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`w-1/2 py-1.5 text-xs font-medium rounded-md transition-colors ${
              mode === 'login' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`w-1/2 py-1.5 text-xs font-medium rounded-md transition-colors ${
              mode === 'register' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('worker')}
                    className={`p-2.5 rounded-xl border text-left transition-colors ${
                      role === 'worker'
                        ? 'bg-sky-600/20 border-sky-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium text-xs">
                      <User className="w-3.5 h-3.5 text-sky-400" />
                      <span>Worker / Contributor</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Submit work & withdraw</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    className={`p-2.5 rounded-xl border text-left transition-colors ${
                      role === 'client'
                        ? 'bg-sky-600/20 border-sky-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium text-xs">
                      <Briefcase className="w-3.5 h-3.5 text-sky-400" />
                      <span>Client / Business</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Create & fund tasks</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name / Business Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Asad Malik or Alpha Media"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white font-mono"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password *</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            {isLoading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Register Account'}
          </button>
        </form>

        <div className="text-[11px] text-slate-500 text-center">
          By signing in, you agree to TaskNova's verified client-funded terms and manual withdrawal reconciliation policies.
        </div>
      </div>
    </div>
  );
};
