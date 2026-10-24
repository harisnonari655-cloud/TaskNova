import React, { useState } from 'react';
import { UserProfile } from '../types';
import { api } from '../api';
import { Shield, Bell, ChevronDown, LogOut, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  currentUser: UserProfile | null;
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
  onUserChange: (user: UserProfile | null) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenNotifications,
  unreadCount,
  onUserChange,
}) => {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleDemoSwitch = async (role: 'admin' | 'client' | 'worker') => {
    try {
      setIsSwitching(true);
      const res = await api.demoSwitch(role);
      onUserChange(res.user);
      setShowPersonaMenu(false);
      if (role === 'admin') onNavigate('admin');
      else if (role === 'client') onNavigate('client');
      else onNavigate('worker');
    } catch (err) {
      console.error('Failed to switch persona:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    onUserChange(null);
    onNavigate('landing');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar Contract: Zone 1, Zone 2, Zone 3 separated by gap-8 */}
        <div className="flex items-center justify-between gap-8 h-16">
          
          {/* Zone 1: Brand wordmark (single element) */}
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-sky-400 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-sky-500/20">
              TN
            </div>
            <span>TaskNova</span>
          </button>

          {/* Zone 2: Single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={() => onNavigate('browse')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'browse' ? 'text-sky-400 font-semibold' : ''
              }`}
            >
              Browse Tasks
            </button>
            <button
              onClick={() => {
                if (!currentUser) onOpenAuth();
                else onNavigate('worker');
              }}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'worker' ? 'text-sky-400 font-semibold' : ''
              }`}
            >
              Worker Portal
            </button>
            <button
              onClick={() => {
                if (!currentUser) onOpenAuth();
                else onNavigate('client');
              }}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'client' ? 'text-sky-400 font-semibold' : ''
              }`}
            >
              Client Desk
            </button>
            <button
              onClick={() => {
                if (!currentUser) onOpenAuth();
                else onNavigate('admin');
              }}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentView === 'admin' ? 'text-sky-400 font-semibold' : ''
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span>Admin Console</span>
            </button>
            <button
              onClick={() => onNavigate('support')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'support' ? 'text-sky-400 font-semibold' : ''
              }`}
            >
              Support & FAQ
            </button>
          </nav>

          {/* Zone 3: Primary action / Auth & Persona Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-2">
                {/* Notifications trigger */}
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-500 rounded-full" />
                  )}
                </button>

                {/* Persona Switcher Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-semibold text-white capitalize">{currentUser.role}</span>
                    <span className="text-slate-400 hidden sm:inline">({currentUser.full_name.split(' ')[0]})</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showPersonaMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-2 z-50 text-xs">
                      <div className="px-3 py-2 border-b border-slate-800 text-slate-400">
                        <p className="font-medium text-slate-200 truncate">{currentUser.full_name}</p>
                        <p className="font-mono text-[11px] truncate text-slate-500">{currentUser.email}</p>
                      </div>

                      <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                        Instant Persona Switch
                      </div>

                      <button
                        onClick={() => handleDemoSwitch('worker')}
                        disabled={isSwitching}
                        className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-300 hover:text-white"
                      >
                        <div>
                          <div className="font-medium">Worker (Zainab Ahmed)</div>
                          <div className="text-[11px] text-slate-500">Submit work & withdraw</div>
                        </div>
                        {currentUser.role === 'worker' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                      </button>

                      <button
                        onClick={() => handleDemoSwitch('client')}
                        disabled={isSwitching}
                        className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-300 hover:text-white"
                      >
                        <div>
                          <div className="font-medium">Client (Apex Solutions)</div>
                          <div className="text-[11px] text-slate-500">Create & fund tasks</div>
                        </div>
                        {currentUser.role === 'client' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                      </button>

                      <button
                        onClick={() => handleDemoSwitch('admin')}
                        disabled={isSwitching}
                        className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-300 hover:text-white"
                      >
                        <div>
                          <div className="font-medium">Platform Admin</div>
                          <div className="text-[11px] text-slate-500">Verify funding & payouts</div>
                        </div>
                        {currentUser.role === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                      </button>

                      <div className="border-t border-slate-800 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-rose-400 hover:text-rose-300 flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-sky-600/30"
                >
                  Sign In / Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
