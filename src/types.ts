export type UserRole = 'worker' | 'client' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  email_verified: boolean;
  payout_method?: 'jazzcash' | 'easypaisa' | 'bank_transfer';
  payout_account_number?: string;
  payout_account_title?: string;
  payout_bank_name?: string;
  risk_flag: boolean;
  risk_reason?: string;
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  description: string;
  category: 'data_categorization' | 'transcription' | 'usability_testing' | 'fact_checking' | 'content_moderation' | 'digital_survey';
  instructions: string;
  acceptance_criteria: string;
  evidence_type: 'text_and_url' | 'file_upload' | 'code_snippet';
  reward_per_slot_minor: number; // in paisa (100 paisa = 1 PKR)
  max_slots: number;
  approved_slots: number;
  total_required_budget_minor: number;
  funded_budget_minor: number;
  remaining_budget_minor: number;
  status: 'draft' | 'pending_moderation' | 'approved_unfunded' | 'active' | 'paused' | 'completed' | 'rejected';
  rejection_reason?: string;
  currency: 'PKR';
  estimated_minutes: number;
  deadline: string;
  created_at: string;
  updated_at: string;
}

export interface TaskFunding {
  id: string;
  task_id: string;
  client_id: string;
  task_title: string;
  amount_minor: number;
  currency: 'PKR';
  method: 'jazzcash' | 'easypaisa' | 'bank_transfer';
  payment_reference: string;
  proof_notes?: string;
  status: 'reported' | 'verified' | 'rejected' | 'reversed';
  verified_amount_minor?: number;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  task_title: string;
  worker_id: string;
  worker_name: string;
  reward_amount_minor: number;
  evidence_notes: string;
  evidence_links?: string;
  evidence_file_name?: string;
  evidence_file_data?: string;
  status: 'pending' | 'approved' | 'rejected' | 'appealed';
  rejection_reason?: string;
  appeal_notes?: string;
  reviewer_id?: string;
  reviewed_at?: string;
  reward_credited: boolean;
  created_at: string;
}

export interface WalletAccount {
  user_id: string;
  currency: 'PKR';
  available_minor: number;
  pending_minor: number;
  reserved_minor: number;
  withdrawn_minor: number;
  total_earned_minor: number;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  user_id: string;
  transaction_type: 
    | 'client_funding_received' 
    | 'task_budget_allocated' 
    | 'worker_reward_credit' 
    | 'withdrawal_reservation' 
    | 'withdrawal_completed' 
    | 'withdrawal_cancelled_release' 
    | 'authorized_refund';
  direction: 'credit' | 'debit';
  amount_minor: number;
  currency: 'PKR';
  related_entity_type: 'task' | 'submission' | 'funding' | 'withdrawal';
  related_entity_id: string;
  balance_after_minor: number;
  actor_id: string;
  idempotency_key: string;
  notes: string;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  worker_id: string;
  worker_name: string;
  amount_minor: number;
  currency: 'PKR';
  method: 'jazzcash' | 'easypaisa' | 'bank_transfer';
  account_number_masked: string;
  account_title: string;
  bank_name?: string;
  status: 'pending_review' | 'approved_pending_payout' | 'completed' | 'rejected' | 'cancelled';
  reviewed_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'task' | 'funding' | 'submission' | 'withdrawal' | 'security' | 'support';
  read: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  user_name: string;
  subject: string;
  category: 'payment' | 'task_review' | 'account' | 'dispute' | 'general';
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  admin_reply?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  reason?: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface FinancialReconciliationReport {
  isClean: boolean;
  discrepancies: string[];
  totalClientFundingMinor: number;
  totalAllocatedBudgetMinor: number;
  totalWorkerEarnedMinor: number;
  totalWithdrawnMinor: number;
  pendingWithdrawalLiabilityMinor: number;
  totalAvailableWorkerBalancesMinor: number;
}
