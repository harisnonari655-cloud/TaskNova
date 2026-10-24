import {
  UserProfile,
  Task,
  TaskFunding,
  TaskSubmission,
  WalletAccount,
  LedgerEntry,
  WithdrawalRequest,
  NotificationItem,
  SupportTicket,
  AuditLog,
  FinancialReconciliationReport
} from './types';

function getAuthToken(): string | null {
  return localStorage.getItem('tasknova_token') || 'demo_worker_token';
}

export function setAuthToken(token: string) {
  localStorage.setItem('tasknova_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('tasknova_token');
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed with status ' + response.status }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  async getCurrentUser(): Promise<{ user: UserProfile } | null> {
    try {
      return await apiRequest<{ user: UserProfile }>('/api/auth/me');
    } catch {
      return null;
    }
  },

  async login(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const res = await apiRequest<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.token);
    return res;
  },

  async register(data: { email: string; password: string; full_name: string; role: 'worker' | 'client'; phone?: string }): Promise<{ token: string; user: UserProfile }> {
    const res = await apiRequest<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setAuthToken(res.token);
    return res;
  },

  async demoSwitch(role: 'admin' | 'client' | 'worker'): Promise<{ token: string; user: UserProfile }> {
    const res = await apiRequest<{ token: string; user: UserProfile }>('/api/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    setAuthToken(res.token);
    return res;
  },

  async logout(): Promise<void> {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } finally {
      clearAuthToken();
    }
  },

  // Tasks
  async getTasks(params?: { category?: string; search?: string; status?: string; client_only?: boolean }): Promise<Task[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.client_only) query.append('client_only', 'true');
    const qs = query.toString();
    return apiRequest<Task[]>(`/api/tasks${qs ? `?${qs}` : ''}`);
  },

  async getTask(id: string): Promise<Task> {
    return apiRequest<Task>(`/api/tasks/${id}`);
  },

  async createTask(data: Partial<Task>): Promise<Task> {
    return apiRequest<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async moderateTask(taskId: string, decision: 'approved' | 'rejected', reason?: string): Promise<Task> {
    return apiRequest<Task>(`/api/tasks/${taskId}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason }),
    });
  },

  async reportFunding(taskId: string, data: { amount_minor: number; method: string; payment_reference: string; proof_notes?: string }): Promise<TaskFunding> {
    return apiRequest<TaskFunding>(`/api/tasks/${taskId}/fund`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getFundingHistory(): Promise<TaskFunding[]> {
    return apiRequest<TaskFunding[]>('/api/funding');
  },

  async verifyFunding(fundingId: string, decision: 'verified' | 'rejected', reason?: string): Promise<TaskFunding> {
    return apiRequest<TaskFunding>(`/api/funding/${fundingId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason }),
    });
  },

  // Submissions
  async getSubmissions(taskId?: string): Promise<TaskSubmission[]> {
    const qs = taskId ? `?task_id=${taskId}` : '';
    return apiRequest<TaskSubmission[]>(`/api/submissions${qs}`);
  },

  async submitWork(data: { task_id: string; evidence_notes: string; evidence_links?: string; evidence_file_name?: string; evidence_file_data?: string }): Promise<TaskSubmission> {
    return apiRequest<TaskSubmission>('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async reviewSubmission(id: string, decision: 'approved' | 'rejected', reason?: string): Promise<TaskSubmission> {
    return apiRequest<TaskSubmission>(`/api/submissions/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason }),
    });
  },

  async appealSubmission(id: string, appeal_notes: string): Promise<TaskSubmission> {
    return apiRequest<TaskSubmission>(`/api/submissions/${id}/appeal`, {
      method: 'POST',
      body: JSON.stringify({ appeal_notes }),
    });
  },

  // Wallet & Ledger
  async getWallet(): Promise<WalletAccount> {
    return apiRequest<WalletAccount>('/api/wallet');
  },

  async getLedger(): Promise<LedgerEntry[]> {
    return apiRequest<LedgerEntry[]>('/api/ledger');
  },

  // Withdrawals
  async getWithdrawals(): Promise<WithdrawalRequest[]> {
    return apiRequest<WithdrawalRequest[]>('/api/withdrawals');
  },

  async requestWithdrawal(data: { amount_minor: number; method: string; account_number: string; account_title: string; bank_name?: string }): Promise<WithdrawalRequest> {
    return apiRequest<WithdrawalRequest>('/api/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async reconcileWithdrawal(withdrawalId: string, data: { actual_payment_reference: string; admin_notes: string }): Promise<WithdrawalRequest> {
    return apiRequest<WithdrawalRequest>(`/api/admin/withdrawals/${withdrawalId}/reconcile`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async rejectWithdrawal(withdrawalId: string, reason: string): Promise<WithdrawalRequest> {
    return apiRequest<WithdrawalRequest>(`/api/admin/withdrawals/${withdrawalId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Admin & Audits
  async getFinancialReconciliation(): Promise<FinancialReconciliationReport> {
    return apiRequest<FinancialReconciliationReport>('/api/admin/reconciliation');
  },

  async getUsers(): Promise<UserProfile[]> {
    return apiRequest<UserProfile[]>('/api/admin/users');
  },

  async updateUserStatus(id: string, data: { status?: 'active' | 'suspended'; risk_flag?: boolean; risk_reason?: string }): Promise<UserProfile> {
    return apiRequest<UserProfile>(`/api/admin/users/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    return apiRequest<AuditLog[]>('/api/admin/audit-logs');
  },

  async runSystemTests(): Promise<any> {
    return apiRequest('/api/admin/run-tests');
  },

  // Notifications & Support
  async getNotifications(): Promise<NotificationItem[]> {
    return apiRequest<NotificationItem[]>('/api/notifications');
  },

  async markNotificationRead(id: string): Promise<void> {
    return apiRequest(`/api/notifications/${id}/read`, { method: 'POST' });
  },

  async getSupportTickets(): Promise<SupportTicket[]> {
    return apiRequest<SupportTicket[]>('/api/support/tickets');
  },

  async createSupportTicket(data: { subject: string; category: string; message: string }): Promise<SupportTicket> {
    return apiRequest<SupportTicket>('/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async replySupportTicket(id: string, data: { reply: string; status?: string }): Promise<SupportTicket> {
    return apiRequest<SupportTicket>(`/api/support/tickets/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
