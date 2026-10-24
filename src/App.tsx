import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Task, TaskFunding, TaskSubmission, WalletAccount, LedgerEntry, WithdrawalRequest, NotificationItem, SupportTicket, AuditLog, FinancialReconciliationReport } from './types';
import { api } from './api';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { BrowseTasks } from './components/BrowseTasks';
import { WorkerDashboard } from './components/WorkerDashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { SupportDisputes } from './components/SupportDisputes';
import { LegalPoliciesModal } from './components/LegalPoliciesModal';
import { AuthModal } from './components/AuthModal';
import { NotificationsModal } from './components/NotificationsModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<string>('landing');
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [fundingList, setFundingList] = useState<TaskFunding[]>([]);
  const [wallet, setWallet] = useState<WalletAccount | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [reconciliation, setReconciliation] = useState<FinancialReconciliationReport | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [activePolicyKey, setActivePolicyKey] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Load current user and initial tasks
  const refreshUserData = useCallback(async () => {
    try {
      const userRes = await api.getCurrentUser();
      if (userRes) {
        setCurrentUser(userRes.user);
        
        // Fetch user-specific records
        const [w, l, wth, n, t] = await Promise.all([
          api.getWallet().catch(() => null),
          api.getLedger().catch(() => []),
          api.getWithdrawals().catch(() => []),
          api.getNotifications().catch(() => []),
          api.getSupportTickets().catch(() => []),
        ]);
        setWallet(w);
        setLedger(l);
        setWithdrawals(wth);
        setNotifications(n);
        setTickets(t);

        // Fetch submissions
        const subs = await api.getSubmissions().catch(() => []);
        setSubmissions(subs);

        // Fetch funding if client or admin
        if (userRes.user.role === 'client' || userRes.user.role === 'admin') {
          const f = await api.getFundingHistory().catch(() => []);
          setFundingList(f);
        }

        // Fetch admin data if admin
        if (userRes.user.role === 'admin') {
          const [u, a, r] = await Promise.all([
            api.getUsers().catch(() => []),
            api.getAuditLogs().catch(() => []),
            api.getFinancialReconciliation().catch(() => null),
          ]);
          setUsers(u);
          setAuditLogs(a);
          setReconciliation(r);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      // Always fetch public/active tasks
      const allTasks = await api.getTasks({ client_only: false }).catch(() => []);
      setTasks(allTasks);
      await refreshUserData();
    } catch (err) {
      console.error('Error refreshing applet:', err);
    } finally {
      setIsLoading(false);
    }
  }, [refreshUserData]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleSelectTaskFromLanding = (task: Task) => {
    setSelectedTask(task);
    setCurrentView('browse');
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* 3-Zone Top Bar Navigation */}
      <Header
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={view => {
          setSelectedTask(null);
          setCurrentView(view);
        }}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        unreadCount={unreadNotifCount}
        onUserChange={user => {
          setCurrentUser(user);
          refreshAll();
        }}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-32 text-xs text-slate-400">
            <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mr-3" />
            <span>Loading TaskNova Marketplace...</span>
          </div>
        ) : currentView === 'landing' ? (
          <LandingPage
            onNavigate={view => {
              setSelectedTask(null);
              setCurrentView(view);
            }}
            onOpenAuth={() => setShowAuthModal(true)}
            onSelectTask={handleSelectTaskFromLanding}
            featuredTasks={tasks}
          />
        ) : currentView === 'browse' ? (
          <BrowseTasks
            tasks={tasks}
            currentUser={currentUser}
            onOpenAuth={() => setShowAuthModal(true)}
            onSubmissionSuccess={refreshAll}
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            mySubmissions={submissions}
          />
        ) : currentView === 'worker' ? (
          currentUser ? (
            <WorkerDashboard
              currentUser={currentUser}
              wallet={wallet}
              submissions={submissions}
              ledger={ledger}
              withdrawals={withdrawals}
              onRefresh={refreshAll}
              onNavigate={setCurrentView}
            />
          ) : (
            <div className="max-w-md mx-auto text-center py-24 space-y-4 px-4">
              <h2 className="text-xl font-bold text-white">Worker Account Required</h2>
              <p className="text-xs text-slate-400">
                Please sign in or select the Demo Worker persona from the header to view worker submissions and wallet balance.
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg"
              >
                Sign In / Demo Login
              </button>
            </div>
          )
        ) : currentView === 'client' ? (
          currentUser ? (
            <ClientDashboard
              currentUser={currentUser}
              tasks={tasks}
              submissions={submissions}
              fundingHistory={fundingList}
              onRefresh={refreshAll}
            />
          ) : (
            <div className="max-w-md mx-auto text-center py-24 space-y-4 px-4">
              <h2 className="text-xl font-bold text-white">Client Account Required</h2>
              <p className="text-xs text-slate-400">
                Please sign in or select the Demo Client persona from the header to author tasks and fund budgets.
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg"
              >
                Sign In / Demo Login
              </button>
            </div>
          )
        ) : currentView === 'admin' ? (
          currentUser && currentUser.role === 'admin' ? (
            <AdminDashboard
              currentUser={currentUser}
              tasks={tasks}
              fundingList={fundingList}
              submissions={submissions}
              withdrawals={withdrawals}
              users={users}
              auditLogs={auditLogs}
              reconciliation={reconciliation}
              onRefresh={refreshAll}
            />
          ) : (
            <div className="max-w-md mx-auto text-center py-24 space-y-4 px-4">
              <h2 className="text-xl font-bold text-white">Administrative Verification Required</h2>
              <p className="text-xs text-slate-400">
                Privileged operations require server-side verified admin authorization. Use the persona switcher in the header to select Platform Admin.
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg"
              >
                Demo Admin Access
              </button>
            </div>
          )
        ) : currentView === 'support' ? (
          <SupportDisputes
            currentUser={currentUser}
            tickets={tickets}
            onRefresh={refreshAll}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        ) : null}
      </main>

      {/* Footer */}
      <Footer
        onOpenPolicy={key => setActivePolicyKey(key)}
        onNavigate={view => {
          setSelectedTask(null);
          setCurrentView(view);
        }}
      />

      {/* MODALS */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={user => {
            setCurrentUser(user);
            refreshAll();
          }}
        />
      )}

      {showNotificationsModal && (
        <NotificationsModal
          notifications={notifications}
          onClose={() => setShowNotificationsModal(false)}
          onRefresh={refreshUserData}
        />
      )}

      {activePolicyKey && (
        <LegalPoliciesModal
          initialPolicy={activePolicyKey}
          onClose={() => setActivePolicyKey(null)}
        />
      )}
    </div>
  );
}
