import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface Profile {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'worker' | 'client' | 'admin';
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

export interface ClientAccount {
  id: string;
  user_id: string;
  company_name: string;
  verified_status: 'unverified' | 'verified';
  total_funded_minor: number; // in paisa (100 paisa = 1 PKR)
  currency: 'PKR';
  created_at: string;
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
  reward_per_slot_minor: number; // in paisa (e.g. 5000 = 50 PKR)
  max_slots: number;
  approved_slots: number;
  total_required_budget_minor: number; // max_slots * reward_per_slot_minor
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
  evidence_file_data?: string; // base64 or file reference
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
  reserved_minor: number; // reserved for withdrawal
  withdrawn_minor: number; // total completed withdrawals
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

export interface PayoutReconciliation {
  id: string;
  withdrawal_id: string;
  actual_payment_reference: string;
  external_rail: 'jazzcash' | 'easypaisa' | 'bank_transfer';
  actual_amount_paid_minor: number;
  currency: 'PKR';
  processed_by_admin: string;
  admin_notes: string;
  confirmation_timestamp: string;
}

export interface Notification {
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

export interface PlatformSettings {
  min_withdrawal_minor: number; // e.g. 20000 paisa = PKR 200
  pkr_paisa_multiplier: number; // 100
  manual_payout_rails: string[];
  max_slots_per_task: number;
  platform_fee_percent: number;
}

export interface DatabaseState {
  profiles: Profile[];
  client_accounts: ClientAccount[];
  tasks: Task[];
  task_funding: TaskFunding[];
  task_submissions: TaskSubmission[];
  wallet_accounts: WalletAccount[];
  wallet_ledger: LedgerEntry[];
  withdrawal_requests: WithdrawalRequest[];
  payout_reconciliation: PayoutReconciliation[];
  notifications: Notification[];
  support_tickets: SupportTicket[];
  audit_logs: AuditLog[];
  platform_settings: PlatformSettings;
}

// Password hashing utility using crypto pbkdf2
export function hashPassword(password: string): string {
  const salt = 'tasknova_salt_v1';
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function maskAccountNumber(num?: string): string {
  if (!num) return '***';
  if (num.length <= 4) return '***' + num;
  return num.substring(0, 3) + '****' + num.substring(num.length - 3);
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'tasknova_db.json');

class Database {
  private state: DatabaseState;
  private isWriting = false;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error loading db file, initializing fresh:', err);
    }
    const fresh = this.getInitialState();
    this.persistSync(fresh);
    return fresh;
  }

  private persistSync(state: DatabaseState) {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  }

  public save() {
    this.persistSync(this.state);
  }

  public resetForTesting() {
    this.state = this.getInitialState();
    this.persistSync(this.state);
  }

  public getState(): DatabaseState {
    return this.state;
  }

  private getInitialState(): DatabaseState {
    const adminId = 'usr_admin_001';
    const clientId = 'usr_client_001';
    const workerId = 'usr_worker_001';

    const profiles: Profile[] = [
      {
        id: adminId,
        email: 'admin@tasknova.io',
        password_hash: hashPassword('AdminPass2026!'),
        full_name: 'Platform Operations Admin',
        role: 'admin',
        phone: '+92 300 1234567',
        email_verified: true,
        risk_flag: false,
        status: 'active',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: clientId,
        email: 'client@tasknova.io',
        password_hash: hashPassword('ClientPass2026!'),
        full_name: 'Apex Digital Solutions',
        role: 'client',
        phone: '+92 321 9876543',
        email_verified: true,
        risk_flag: false,
        status: 'active',
        created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: workerId,
        email: 'worker@tasknova.io',
        password_hash: hashPassword('WorkerPass2026!'),
        full_name: 'Zainab Ahmed',
        role: 'worker',
        phone: '+92 333 4567890',
        email_verified: true,
        payout_method: 'easypaisa',
        payout_account_number: '03334567890',
        payout_account_title: 'Zainab Ahmed',
        risk_flag: false,
        status: 'active',
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    const clientAccounts: ClientAccount[] = [
      {
        id: 'clt_001',
        user_id: clientId,
        company_name: 'Apex Digital Solutions',
        verified_status: 'verified',
        total_funded_minor: 1500000, // PKR 15,000 (15,000 * 100 paisa)
        currency: 'PKR',
        created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      }
    ];

    // Seeded legitimate tasks with verified funding
    const task1Id = 'tsk_001';
    const task2Id = 'tsk_002';
    const task3Id = 'tsk_003';

    const tasks: Task[] = [
      {
        id: task1Id,
        client_id: clientId,
        client_name: 'Apex Digital Solutions',
        title: 'E-Commerce Product Categorization & Attribute Audit',
        description: 'Review 10 product listings, categorize them into standardized e-commerce taxonomies, and verify title clarity.',
        category: 'data_categorization',
        instructions: '1. Access provided item SKU spreadsheet link.\n2. Assign primary and secondary product categories according to guidelines.\n3. Note missing attributes (dimensions, material, manufacturer).\n4. Provide completed spreadsheet or verification report link.',
        acceptance_criteria: 'All 10 items must have accurate category classification with zero missing mandatory fields.',
        evidence_type: 'text_and_url',
        reward_per_slot_minor: 5000, // PKR 50.00
        max_slots: 50,
        approved_slots: 12,
        total_required_budget_minor: 250000, // PKR 2,500
        funded_budget_minor: 250000, // Fully funded and verified
        remaining_budget_minor: 190000, // 250000 - (12 * 5000)
        status: 'active',
        currency: 'PKR',
        estimated_minutes: 15,
        deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: task2Id,
        client_id: clientId,
        client_name: 'Apex Digital Solutions',
        title: 'Customer Onboarding Flow Usability Review',
        description: 'Walk through the checkout and signup interface on our staging domain and document usability friction points.',
        category: 'usability_testing',
        instructions: '1. Open staging onboarding URL.\n2. Complete user registration process.\n3. Document any confusing steps, loading lags, or error state ambiguities.\n4. Submit concise written observations with screenshots or timestamped notes.',
        acceptance_criteria: 'Detailed, constructive critique covering minimum 3 specific steps with actionable feedback.',
        evidence_type: 'text_and_url',
        reward_per_slot_minor: 15000, // PKR 150.00
        max_slots: 20,
        approved_slots: 4,
        total_required_budget_minor: 300000, // PKR 3,000
        funded_budget_minor: 300000,
        remaining_budget_minor: 240000, // 300000 - (4 * 15000)
        status: 'active',
        currency: 'PKR',
        estimated_minutes: 25,
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: task3Id,
        client_id: clientId,
        client_name: 'Apex Digital Solutions',
        title: 'Urdu Audio Transcription Snippet (2 Minutes)',
        description: 'Transcribe a 2-minute clear Urdu customer service phone call excerpt into accurate Urdu text.',
        category: 'transcription',
        instructions: '1. Listen to audio clip via secure player.\n2. Type exact spoken Urdu dialogue without omissions.\n3. Mark speaker turns (Speaker A / Speaker B).\n4. Review spelling against standard dictionary forms.',
        acceptance_criteria: 'Accuracy >= 95% word error rate, correct punctuation and speaker labeling.',
        evidence_type: 'text_and_url',
        reward_per_slot_minor: 8000, // PKR 80.00
        max_slots: 30,
        approved_slots: 2,
        total_required_budget_minor: 240000, // PKR 2,400
        funded_budget_minor: 240000,
        remaining_budget_minor: 224000, // 240000 - (2 * 8000)
        status: 'active',
        currency: 'PKR',
        estimated_minutes: 20,
        deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    const taskFunding: TaskFunding[] = [
      {
        id: 'fnd_001',
        task_id: task1Id,
        client_id: clientId,
        task_title: 'E-Commerce Product Categorization & Attribute Audit',
        amount_minor: 250000,
        currency: 'PKR',
        method: 'bank_transfer',
        payment_reference: 'HBL-FT-99201481',
        proof_notes: 'Transferred from Habib Bank corporate account to TaskNova bank desk.',
        status: 'verified',
        verified_amount_minor: 250000,
        verified_by: adminId,
        verified_at: new Date(Date.now() - 9 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: 'fnd_002',
        task_id: task2Id,
        client_id: clientId,
        task_title: 'Customer Onboarding Flow Usability Review',
        amount_minor: 300000,
        currency: 'PKR',
        method: 'easypaisa',
        payment_reference: 'EP-98440192',
        proof_notes: 'Easypaisa merchant payment reference confirmed by bank statement.',
        status: 'verified',
        verified_amount_minor: 300000,
        verified_by: adminId,
        verified_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      },
      {
        id: 'fnd_003',
        task_id: task3Id,
        client_id: clientId,
        task_title: 'Urdu Audio Transcription Snippet (2 Minutes)',
        amount_minor: 240000,
        currency: 'PKR',
        method: 'jazzcash',
        payment_reference: 'JC-77319024',
        proof_notes: 'JazzCash till transfer verified via merchant SMS statement.',
        status: 'verified',
        verified_amount_minor: 240000,
        verified_by: adminId,
        verified_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      }
    ];

    const taskSubmissions: TaskSubmission[] = [
      {
        id: 'sub_001',
        task_id: task1Id,
        task_title: 'E-Commerce Product Categorization & Attribute Audit',
        worker_id: workerId,
        worker_name: 'Zainab Ahmed',
        reward_amount_minor: 5000,
        evidence_notes: 'Completed all 10 SKU classifications in the shared sheet. Added material composition attributes for 4 kitchen items that lacked packaging details.',
        evidence_links: 'https://docs.google.com/spreadsheets/d/tasknova-sample-sku-audit',
        status: 'approved',
        reviewer_id: clientId,
        reviewed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        reward_credited: true,
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        id: 'sub_002',
        task_id: task2Id,
        task_title: 'Customer Onboarding Flow Usability Review',
        worker_id: workerId,
        worker_name: 'Zainab Ahmed',
        reward_amount_minor: 15000,
        evidence_notes: 'Detailed step-by-step UX analysis of signup modal. Identified that SMS OTP input lost focus on mobile keyboards and error toast disappeared after 1 second.',
        evidence_links: 'https://gist.github.com/tasknova/onboarding-ux-report',
        status: 'approved',
        reviewer_id: clientId,
        reviewed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        reward_credited: true,
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      }
    ];

    // Worker earned: 5000 + 15000 = 20000 paisa (PKR 200)
    // Worker requested withdrawal of PKR 100 (10000 paisa), which was completed
    // Leaving PKR 100 (10000 paisa) available
    const walletAccounts: WalletAccount[] = [
      {
        user_id: workerId,
        currency: 'PKR',
        available_minor: 10000, // PKR 100.00
        pending_minor: 0,
        reserved_minor: 0,
        withdrawn_minor: 10000, // PKR 100.00
        total_earned_minor: 20000, // PKR 200.00
        updated_at: new Date().toISOString(),
      }
    ];

    const walletLedger: LedgerEntry[] = [
      {
        id: 'ldg_001',
        user_id: workerId,
        transaction_type: 'worker_reward_credit',
        direction: 'credit',
        amount_minor: 5000,
        currency: 'PKR',
        related_entity_type: 'submission',
        related_entity_id: 'sub_001',
        balance_after_minor: 5000,
        actor_id: clientId,
        idempotency_key: 'idemp_sub_001_approve',
        notes: 'Task reward credit for approved SKU categorization submission #sub_001',
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        id: 'ldg_002',
        user_id: workerId,
        transaction_type: 'worker_reward_credit',
        direction: 'credit',
        amount_minor: 15000,
        currency: 'PKR',
        related_entity_type: 'submission',
        related_entity_id: 'sub_002',
        balance_after_minor: 20000,
        actor_id: clientId,
        idempotency_key: 'idemp_sub_002_approve',
        notes: 'Task reward credit for approved UX audit submission #sub_002',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'ldg_003',
        user_id: workerId,
        transaction_type: 'withdrawal_reservation',
        direction: 'debit',
        amount_minor: 10000,
        currency: 'PKR',
        related_entity_type: 'withdrawal',
        related_entity_id: 'wth_001',
        balance_after_minor: 10000,
        actor_id: workerId,
        idempotency_key: 'idemp_wth_001_reserve',
        notes: 'Reserved PKR 100.00 for manual withdrawal request #wth_001 to Easypaisa',
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: 'ldg_004',
        user_id: workerId,
        transaction_type: 'withdrawal_completed',
        direction: 'debit',
        amount_minor: 10000,
        currency: 'PKR',
        related_entity_type: 'withdrawal',
        related_entity_id: 'wth_001',
        balance_after_minor: 10000,
        actor_id: adminId,
        idempotency_key: 'idemp_wth_001_complete',
        notes: 'Withdrawal fulfilled and reconciled by Admin. Ref: EP-TRX-8819024',
        created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      }
    ];

    const withdrawalRequests: WithdrawalRequest[] = [
      {
        id: 'wth_001',
        worker_id: workerId,
        worker_name: 'Zainab Ahmed',
        amount_minor: 10000,
        currency: 'PKR',
        method: 'easypaisa',
        account_number_masked: '0333****890',
        account_title: 'Zainab Ahmed',
        status: 'completed',
        reviewed_by: adminId,
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      }
    ];

    const payoutReconciliation: PayoutReconciliation[] = [
      {
        id: 'payout_001',
        withdrawal_id: 'wth_001',
        actual_payment_reference: 'EP-TRX-8819024',
        external_rail: 'easypaisa',
        actual_amount_paid_minor: 10000,
        currency: 'PKR',
        processed_by_admin: adminId,
        admin_notes: 'Paid manually through verified corporate Easypaisa account. Reference confirmed on receipt.',
        confirmation_timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
      }
    ];

    const notifications: Notification[] = [
      {
        id: 'notif_001',
        user_id: workerId,
        title: 'Task Approved',
        message: 'Your submission for "E-Commerce Product Categorization" was approved. PKR 50.00 credited to ledger.',
        type: 'submission',
        read: true,
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        id: 'notif_002',
        user_id: workerId,
        title: 'Payout Completed',
        message: 'Your withdrawal request for PKR 100.00 has been sent to your Easypaisa account. Ref: EP-TRX-8819024.',
        type: 'withdrawal',
        read: false,
        created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      }
    ];

    const supportTickets: SupportTicket[] = [
      {
        id: 'tkt_001',
        user_id: workerId,
        user_name: 'Zainab Ahmed',
        subject: 'Inquiry regarding Urdu transcription format',
        category: 'task_review',
        message: 'Should background noise tags like [music] or [cough] be transcribed or omitted in Urdu tasks?',
        status: 'resolved',
        admin_reply: 'Please only transcribe spoken words and omit environmental sounds unless explicitly requested in client instructions.',
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      }
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'aud_001',
        actor_id: adminId,
        actor_role: 'admin',
        action: 'VERIFY_CLIENT_FUNDING',
        resource_type: 'task_funding',
        resource_id: 'fnd_001',
        reason: 'Bank transfer receipt HBL-FT-99201481 reconciled with official bank credit statement.',
        details: { amount_minor: 250000, currency: 'PKR', task_id: task1Id },
        created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      },
      {
        id: 'aud_002',
        actor_id: adminId,
        actor_role: 'admin',
        action: 'RECONCILE_WITHDRAWAL_PAYMENT',
        resource_type: 'withdrawal_request',
        resource_id: 'wth_001',
        reason: 'External Easypaisa transfer EP-TRX-8819024 confirmed delivered.',
        details: { amount_minor: 10000, currency: 'PKR', worker_id: workerId },
        created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      }
    ];

    const platformSettings: PlatformSettings = {
      min_withdrawal_minor: 10000, // PKR 100 minimum withdrawal (100 * 100 paisa)
      pkr_paisa_multiplier: 100,
      manual_payout_rails: ['easypaisa', 'jazzcash', 'bank_transfer'],
      max_slots_per_task: 1000,
      platform_fee_percent: 0, // No hidden fees
    };

    return {
      profiles,
      client_accounts: clientAccounts,
      tasks,
      task_funding: taskFunding,
      task_submissions: taskSubmissions,
      wallet_accounts: walletAccounts,
      wallet_ledger: walletLedger,
      withdrawal_requests: withdrawalRequests,
      payout_reconciliation: payoutReconciliation,
      notifications,
      support_tickets: supportTickets,
      audit_logs: auditLogs,
      platform_settings: platformSettings,
    };
  }

  // --- LEDGER RECONCILIATION & INTEGRITY ---
  public verifyLedgerIntegrity(): {
    isClean: boolean;
    discrepancies: string[];
    totalClientFundingMinor: number;
    totalAllocatedBudgetMinor: number;
    totalWorkerEarnedMinor: number;
    totalWithdrawnMinor: number;
    pendingWithdrawalLiabilityMinor: number;
    totalAvailableWorkerBalancesMinor: number;
  } {
    const s = this.state;
    const discrepancies: string[] = [];

    // Sum client verified funding
    const totalClientFundingMinor = s.task_funding
      .filter(f => f.status === 'verified')
      .reduce((sum, f) => sum + (f.verified_amount_minor || f.amount_minor), 0);

    // Sum task allocated budgets
    const totalAllocatedBudgetMinor = s.tasks.reduce((sum, t) => sum + t.funded_budget_minor, 0);

    // Sum worker earnings from approved submissions
    const totalApprovedRewardsFromSubmissions = s.task_submissions
      .filter(sub => sub.status === 'approved')
      .reduce((sum, sub) => sum + sub.reward_amount_minor, 0);

    // Sum worker reward credits from ledger
    const totalRewardCreditsFromLedger = s.wallet_ledger
      .filter(l => l.transaction_type === 'worker_reward_credit')
      .reduce((sum, l) => sum + l.amount_minor, 0);

    if (totalApprovedRewardsFromSubmissions !== totalRewardCreditsFromLedger) {
      discrepancies.push(`Submission rewards (${totalApprovedRewardsFromSubmissions}) do not match ledger reward credits (${totalRewardCreditsFromLedger})`);
    }

    // Sum completed withdrawals
    const totalCompletedWithdrawals = s.withdrawal_requests
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + w.amount_minor, 0);

    const totalWithdrawalLedgerCompleted = s.wallet_ledger
      .filter(l => l.transaction_type === 'withdrawal_completed')
      .reduce((sum, l) => sum + l.amount_minor, 0);

    if (totalCompletedWithdrawals !== totalWithdrawalLedgerCompleted) {
      discrepancies.push(`Completed withdrawal requests (${totalCompletedWithdrawals}) do not match ledger completions (${totalWithdrawalLedgerCompleted})`);
    }

    // Pending withdrawal liability
    const pendingWithdrawalLiabilityMinor = s.withdrawal_requests
      .filter(w => w.status === 'pending_review' || w.status === 'approved_pending_payout')
      .reduce((sum, w) => sum + w.amount_minor, 0);

    // Check individual worker wallet calculations from ledger
    for (const w of s.wallet_accounts) {
      const userEntries = s.wallet_ledger.filter(l => l.user_id === w.user_id);
      let calculatedAvailable = 0;
      let calculatedEarned = 0;
      let calculatedWithdrawn = 0;
      let calculatedReserved = 0;

      for (const entry of userEntries) {
        if (entry.transaction_type === 'worker_reward_credit') {
          calculatedAvailable += entry.amount_minor;
          calculatedEarned += entry.amount_minor;
        } else if (entry.transaction_type === 'withdrawal_reservation') {
          calculatedAvailable -= entry.amount_minor;
          calculatedReserved += entry.amount_minor;
        } else if (entry.transaction_type === 'withdrawal_completed') {
          calculatedReserved -= entry.amount_minor;
          calculatedWithdrawn += entry.amount_minor;
        } else if (entry.transaction_type === 'withdrawal_cancelled_release') {
          calculatedAvailable += entry.amount_minor;
          calculatedReserved -= entry.amount_minor;
        }
      }

      if (w.available_minor !== calculatedAvailable) {
        discrepancies.push(`Worker ${w.user_id} cached available (${w.available_minor}) != ledger calculated (${calculatedAvailable})`);
      }
      if (w.reserved_minor !== calculatedReserved) {
        discrepancies.push(`Worker ${w.user_id} cached reserved (${w.reserved_minor}) != ledger calculated (${calculatedReserved})`);
      }
      if (w.withdrawn_minor !== calculatedWithdrawn) {
        discrepancies.push(`Worker ${w.user_id} cached withdrawn (${w.withdrawn_minor}) != ledger calculated (${calculatedWithdrawn})`);
      }
    }

    const totalAvailableWorkerBalancesMinor = s.wallet_accounts.reduce((sum, w) => sum + w.available_minor, 0);

    return {
      isClean: discrepancies.length === 0,
      discrepancies,
      totalClientFundingMinor,
      totalAllocatedBudgetMinor,
      totalWorkerEarnedMinor: totalRewardCreditsFromLedger,
      totalWithdrawnMinor: totalCompletedWithdrawals,
      pendingWithdrawalLiabilityMinor,
      totalAvailableWorkerBalancesMinor,
    };
  }

  // --- CORE FINANCIAL & WORKFLOW MUTATIONS (ACID CONSTRAINTS) ---

  // 1. Client creates draft task
  public createTask(data: {
    client_id: string;
    title: string;
    description: string;
    category: Task['category'];
    instructions: string;
    acceptance_criteria: string;
    evidence_type: Task['evidence_type'];
    reward_per_slot_minor: number;
    max_slots: number;
    estimated_minutes: number;
    deadline: string;
  }): Task {
    if (data.reward_per_slot_minor <= 0) throw new Error('Reward per slot must be greater than zero');
    if (data.max_slots <= 0) throw new Error('Max slots must be greater than zero');

    const client = this.state.profiles.find(p => p.id === data.client_id);
    if (!client) throw new Error('Client not found');

    const total_required_budget_minor = data.reward_per_slot_minor * data.max_slots;
    const task: Task = {
      id: 'tsk_' + crypto.randomUUID().substring(0, 8),
      client_id: data.client_id,
      client_name: client.full_name,
      title: data.title,
      description: data.description,
      category: data.category,
      instructions: data.instructions,
      acceptance_criteria: data.acceptance_criteria,
      evidence_type: data.evidence_type,
      reward_per_slot_minor: data.reward_per_slot_minor,
      max_slots: data.max_slots,
      approved_slots: 0,
      total_required_budget_minor,
      funded_budget_minor: 0,
      remaining_budget_minor: 0,
      status: 'pending_moderation', // Sent for admin moderation
      currency: 'PKR',
      estimated_minutes: data.estimated_minutes,
      deadline: data.deadline,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.tasks.push(task);
    this.logAudit({
      actor_id: data.client_id,
      actor_role: client.role,
      action: 'CREATE_TASK',
      resource_type: 'task',
      resource_id: task.id,
      details: { title: task.title, budget_minor: total_required_budget_minor }
    });
    this.save();
    return task;
  }

  // 2. Admin moderates task (approve or reject)
  public moderateTask(taskId: string, adminId: string, decision: 'approved' | 'rejected', reason?: string): Task {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    if (task.status !== 'pending_moderation') throw new Error(`Cannot moderate task in state: ${task.status}`);

    if (decision === 'approved') {
      task.status = task.funded_budget_minor >= task.total_required_budget_minor ? 'active' : 'approved_unfunded';
    } else {
      task.status = 'rejected';
      task.rejection_reason = reason || 'Does not meet task quality criteria';
    }
    task.updated_at = new Date().toISOString();

    this.logAudit({
      actor_id: adminId,
      actor_role: 'admin',
      action: 'MODERATE_TASK',
      resource_type: 'task',
      resource_id: taskId,
      reason,
      details: { decision, status: task.status }
    });
    this.save();
    return task;
  }

  // 3. Client reports funding payment
  public reportFunding(data: {
    task_id: string;
    client_id: string;
    amount_minor: number;
    method: TaskFunding['method'];
    payment_reference: string;
    proof_notes?: string;
  }): TaskFunding {
    const task = this.state.tasks.find(t => t.id === data.task_id);
    if (!task) throw new Error('Task not found');
    if (task.client_id !== data.client_id) throw new Error('Task belongs to another client');
    if (data.amount_minor <= 0) throw new Error('Funding amount must be greater than zero');
    if (!data.payment_reference || data.payment_reference.trim().length === 0) {
      throw new Error('Valid payment reference number is required');
    }

    const funding: TaskFunding = {
      id: 'fnd_' + crypto.randomUUID().substring(0, 8),
      task_id: data.task_id,
      client_id: data.client_id,
      task_title: task.title,
      amount_minor: data.amount_minor,
      currency: 'PKR',
      method: data.method,
      payment_reference: data.payment_reference.trim(),
      proof_notes: data.proof_notes,
      status: 'reported',
      created_at: new Date().toISOString(),
    };

    this.state.task_funding.push(funding);
    this.logAudit({
      actor_id: data.client_id,
      actor_role: 'client',
      action: 'REPORT_FUNDING',
      resource_type: 'task_funding',
      resource_id: funding.id,
      details: { task_id: data.task_id, amount_minor: data.amount_minor, ref: funding.payment_reference }
    });
    this.save();
    return funding;
  }

  // 4. Admin independently verifies incoming payment and allocates to task
  public verifyFunding(fundingId: string, adminId: string, decision: 'verified' | 'rejected', reason?: string): TaskFunding {
    const funding = this.state.task_funding.find(f => f.id === fundingId);
    if (!funding) throw new Error('Funding record not found');
    if (funding.status !== 'reported') throw new Error(`Funding already processed (${funding.status})`);

    const task = this.state.tasks.find(t => t.id === funding.task_id);
    if (!task) throw new Error('Associated task not found');

    if (decision === 'verified') {
      funding.status = 'verified';
      funding.verified_amount_minor = funding.amount_minor;
      funding.verified_by = adminId;
      funding.verified_at = new Date().toISOString();

      // Allocate to task budget
      task.funded_budget_minor += funding.amount_minor;
      task.remaining_budget_minor = task.funded_budget_minor - (task.approved_slots * task.reward_per_slot_minor);

      // If task was approved_unfunded and now has full required budget, activate it!
      if (task.status === 'approved_unfunded' && task.funded_budget_minor >= task.total_required_budget_minor) {
        task.status = 'active';
      }
      task.updated_at = new Date().toISOString();

      // Create ledger record for client funding received
      this.state.wallet_ledger.push({
        id: 'ldg_' + crypto.randomUUID().substring(0, 8),
        user_id: funding.client_id,
        transaction_type: 'client_funding_received',
        direction: 'credit',
        amount_minor: funding.amount_minor,
        currency: 'PKR',
        related_entity_type: 'funding',
        related_entity_id: funding.id,
        balance_after_minor: task.funded_budget_minor,
        actor_id: adminId,
        idempotency_key: `idemp_fund_${funding.id}`,
        notes: `Verified incoming client payment via ${funding.method}. Ref: ${funding.payment_reference}`,
        created_at: new Date().toISOString(),
      });

      // Notify client
      this.addNotification({
        user_id: funding.client_id,
        title: 'Funding Verified',
        message: `Your payment of PKR ${(funding.amount_minor / 100).toFixed(2)} for "${task.title}" has been verified. Task is now funded.`,
        type: 'funding'
      });
    } else {
      funding.status = 'rejected';
      funding.rejection_reason = reason || 'Payment reference not found in receiving account';
      this.addNotification({
        user_id: funding.client_id,
        title: 'Funding Verification Failed',
        message: `Your reported payment of PKR ${(funding.amount_minor / 100).toFixed(2)} could not be verified: ${funding.rejection_reason}`,
        type: 'funding'
      });
    }

    this.logAudit({
      actor_id: adminId,
      actor_role: 'admin',
      action: 'VERIFY_CLIENT_FUNDING',
      resource_type: 'task_funding',
      resource_id: funding.id,
      reason,
      details: { decision, amount_minor: funding.amount_minor }
    });
    this.save();
    return funding;
  }

  // 5. Worker submits work
  public submitWork(data: {
    task_id: string;
    worker_id: string;
    evidence_notes: string;
    evidence_links?: string;
    evidence_file_name?: string;
    evidence_file_data?: string;
  }): TaskSubmission {
    const task = this.state.tasks.find(t => t.id === data.task_id);
    if (!task) throw new Error('Task not found');
    if (task.status !== 'active') throw new Error('Task is not active for new submissions');
    if (task.approved_slots >= task.max_slots) throw new Error('Task has reached its maximum approved capacity');

    // Check duplicate pending/approved submission by same worker
    const existing = this.state.task_submissions.find(s => 
      s.task_id === data.task_id && 
      s.worker_id === data.worker_id && 
      (s.status === 'pending' || s.status === 'approved')
    );
    if (existing) {
      throw new Error('You already have a pending or approved submission for this task');
    }

    const worker = this.state.profiles.find(p => p.id === data.worker_id);
    if (!worker) throw new Error('Worker not found');

    const submission: TaskSubmission = {
      id: 'sub_' + crypto.randomUUID().substring(0, 8),
      task_id: data.task_id,
      task_title: task.title,
      worker_id: data.worker_id,
      worker_name: worker.full_name,
      reward_amount_minor: task.reward_per_slot_minor,
      evidence_notes: data.evidence_notes,
      evidence_links: data.evidence_links,
      evidence_file_name: data.evidence_file_name,
      evidence_file_data: data.evidence_file_data,
      status: 'pending',
      reward_credited: false,
      created_at: new Date().toISOString(),
    };

    this.state.task_submissions.push(submission);

    // Update pending balance in worker's wallet
    let wallet = this.state.wallet_accounts.find(w => w.user_id === data.worker_id);
    if (!wallet) {
      wallet = {
        user_id: data.worker_id,
        currency: 'PKR',
        available_minor: 0,
        pending_minor: 0,
        reserved_minor: 0,
        withdrawn_minor: 0,
        total_earned_minor: 0,
        updated_at: new Date().toISOString(),
      };
      this.state.wallet_accounts.push(wallet);
    }
    wallet.pending_minor += task.reward_per_slot_minor;
    wallet.updated_at = new Date().toISOString();

    this.logAudit({
      actor_id: data.worker_id,
      actor_role: 'worker',
      action: 'SUBMIT_WORK',
      resource_type: 'task_submission',
      resource_id: submission.id,
      details: { task_id: data.task_id }
    });
    this.save();
    return submission;
  }

  // 6. Review submission (approve or reject) with ATOMIC LEDGER CREDIT
  public reviewSubmission(submissionId: string, reviewerId: string, decision: 'approved' | 'rejected', reason?: string): TaskSubmission {
    const sub = this.state.task_submissions.find(s => s.id === submissionId);
    if (!sub) throw new Error('Submission not found');
    if (sub.status !== 'pending' && sub.status !== 'appealed') {
      throw new Error(`Submission has already been decided (${sub.status})`);
    }

    const task = this.state.tasks.find(t => t.id === sub.task_id);
    if (!task) throw new Error('Associated task not found');

    const reviewer = this.state.profiles.find(p => p.id === reviewerId);
    if (!reviewer) throw new Error('Reviewer not found');
    // Ensure reviewer is either admin or the task's client
    if (reviewer.role !== 'admin' && task.client_id !== reviewerId) {
      throw new Error('Unauthorized to review this submission');
    }

    let wallet = this.state.wallet_accounts.find(w => w.user_id === sub.worker_id);
    if (!wallet) {
      wallet = {
        user_id: sub.worker_id,
        currency: 'PKR',
        available_minor: 0,
        pending_minor: 0,
        reserved_minor: 0,
        withdrawn_minor: 0,
        total_earned_minor: 0,
        updated_at: new Date().toISOString(),
      };
      this.state.wallet_accounts.push(wallet);
    }

    if (decision === 'approved') {
      // Slot check
      if (task.approved_slots >= task.max_slots) {
        throw new Error('Task maximum capacity has been reached. Cannot approve additional slots.');
      }
      // Budget check
      if (task.remaining_budget_minor < sub.reward_amount_minor) {
        throw new Error('Insufficient funded budget remaining on task to approve this submission.');
      }
      // Idempotency check: Ensure submission has not already been credited
      if (sub.reward_credited) {
        throw new Error('Reward has already been credited for this submission');
      }

      // 1. Update submission state
      sub.status = 'approved';
      sub.reviewer_id = reviewerId;
      sub.reviewed_at = new Date().toISOString();
      sub.reward_credited = true;

      // 2. Increment task approved slots and deduct from remaining budget
      task.approved_slots += 1;
      task.remaining_budget_minor -= sub.reward_amount_minor;
      if (task.approved_slots >= task.max_slots) {
        task.status = 'completed';
      }
      task.updated_at = new Date().toISOString();

      // 3. Atomically update worker wallet balance
      wallet.pending_minor = Math.max(0, wallet.pending_minor - sub.reward_amount_minor);
      wallet.available_minor += sub.reward_amount_minor;
      wallet.total_earned_minor += sub.reward_amount_minor;
      wallet.updated_at = new Date().toISOString();

      // 4. Record single immutable wallet ledger entry
      this.state.wallet_ledger.push({
        id: 'ldg_' + crypto.randomUUID().substring(0, 8),
        user_id: sub.worker_id,
        transaction_type: 'worker_reward_credit',
        direction: 'credit',
        amount_minor: sub.reward_amount_minor,
        currency: 'PKR',
        related_entity_type: 'submission',
        related_entity_id: sub.id,
        balance_after_minor: wallet.available_minor,
        actor_id: reviewerId,
        idempotency_key: `idemp_sub_${sub.id}_approve`,
        notes: `Reward credited for approved submission #${sub.id} on "${task.title}"`,
        created_at: new Date().toISOString(),
      });

      // 5. Notify worker
      this.addNotification({
        user_id: sub.worker_id,
        title: 'Work Approved! Reward Credited',
        message: `Your work on "${task.title}" was approved. PKR ${(sub.reward_amount_minor / 100).toFixed(2)} has been added to your available wallet balance.`,
        type: 'submission'
      });
    } else {
      sub.status = 'rejected';
      sub.rejection_reason = reason || 'Work does not meet specified acceptance criteria.';
      sub.reviewer_id = reviewerId;
      sub.reviewed_at = new Date().toISOString();

      wallet.pending_minor = Math.max(0, wallet.pending_minor - sub.reward_amount_minor);
      wallet.updated_at = new Date().toISOString();

      this.addNotification({
        user_id: sub.worker_id,
        title: 'Submission Rejected',
        message: `Your work on "${task.title}" was rejected: ${sub.rejection_reason}. You may submit an appeal if appropriate.`,
        type: 'submission'
      });
    }

    this.logAudit({
      actor_id: reviewerId,
      actor_role: reviewer.role,
      action: 'REVIEW_SUBMISSION',
      resource_type: 'task_submission',
      resource_id: sub.id,
      reason,
      details: { decision, reward_minor: sub.reward_amount_minor }
    });
    this.save();
    return sub;
  }

  // 7. Worker requests manual withdrawal with atomic funds reservation in ledger
  public requestWithdrawal(data: {
    worker_id: string;
    amount_minor: number;
    method: WithdrawalRequest['method'];
    account_number: string;
    account_title: string;
    bank_name?: string;
  }): WithdrawalRequest {
    const minWithdrawal = this.state.platform_settings.min_withdrawal_minor;
    if (data.amount_minor < minWithdrawal) {
      throw new Error(`Minimum withdrawal amount is PKR ${(minWithdrawal / 100).toFixed(2)}`);
    }

    const worker = this.state.profiles.find(p => p.id === data.worker_id);
    if (!worker) throw new Error('Worker not found');
    if (worker.status !== 'active') throw new Error('Account is suspended or pending verification');

    let wallet = this.state.wallet_accounts.find(w => w.user_id === data.worker_id);
    if (!wallet || wallet.available_minor < data.amount_minor) {
      throw new Error(`Insufficient available balance. Available: PKR ${((wallet?.available_minor || 0) / 100).toFixed(2)}`);
    }

    // Check for existing pending withdrawal to prevent spamming
    const existingPending = this.state.withdrawal_requests.find(w => 
      w.worker_id === data.worker_id && (w.status === 'pending_review' || w.status === 'approved_pending_payout')
    );
    if (existingPending) {
      throw new Error('You already have an active withdrawal request under review. Please wait for it to be processed.');
    }

    const withdrawalId = 'wth_' + crypto.randomUUID().substring(0, 8);

    // Atomically reserve funds
    wallet.available_minor -= data.amount_minor;
    wallet.reserved_minor += data.amount_minor;
    wallet.updated_at = new Date().toISOString();

    // Create reservation ledger record
    this.state.wallet_ledger.push({
      id: 'ldg_' + crypto.randomUUID().substring(0, 8),
      user_id: data.worker_id,
      transaction_type: 'withdrawal_reservation',
      direction: 'debit',
      amount_minor: data.amount_minor,
      currency: 'PKR',
      related_entity_type: 'withdrawal',
      related_entity_id: withdrawalId,
      balance_after_minor: wallet.available_minor,
      actor_id: data.worker_id,
      idempotency_key: `idemp_${withdrawalId}_reserve`,
      notes: `Reserved PKR ${(data.amount_minor / 100).toFixed(2)} for ${data.method} payout request`,
      created_at: new Date().toISOString(),
    });

    const withdrawal: WithdrawalRequest = {
      id: withdrawalId,
      worker_id: data.worker_id,
      worker_name: worker.full_name,
      amount_minor: data.amount_minor,
      currency: 'PKR',
      method: data.method,
      account_number_masked: maskAccountNumber(data.account_number),
      account_title: data.account_title,
      bank_name: data.bank_name,
      status: 'pending_review',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.withdrawal_requests.push(withdrawal);

    this.logAudit({
      actor_id: data.worker_id,
      actor_role: 'worker',
      action: 'REQUEST_WITHDRAWAL',
      resource_type: 'withdrawal_request',
      resource_id: withdrawal.id,
      details: { amount_minor: data.amount_minor, method: data.method }
    });
    this.save();
    return withdrawal;
  }

  // 8. Admin reviews & reconciles manual external payment
  public reconcileWithdrawalPayment(data: {
    withdrawal_id: string;
    admin_id: string;
    actual_payment_reference: string;
    admin_notes: string;
  }): WithdrawalRequest {
    if (!data.actual_payment_reference || data.actual_payment_reference.trim().length === 0) {
      throw new Error('Actual payment transaction reference is mandatory to reconcile payout');
    }

    const withdrawal = this.state.withdrawal_requests.find(w => w.id === data.withdrawal_id);
    if (!withdrawal) throw new Error('Withdrawal request not found');
    if (withdrawal.status !== 'pending_review' && withdrawal.status !== 'approved_pending_payout') {
      throw new Error(`Cannot complete withdrawal in state: ${withdrawal.status}`);
    }

    const wallet = this.state.wallet_accounts.find(w => w.user_id === withdrawal.worker_id);
    if (!wallet) throw new Error('Worker wallet not found');

    // 1. Deduct from reserved, add to withdrawn
    wallet.reserved_minor = Math.max(0, wallet.reserved_minor - withdrawal.amount_minor);
    wallet.withdrawn_minor += withdrawal.amount_minor;
    wallet.updated_at = new Date().toISOString();

    // 2. Update withdrawal request state
    withdrawal.status = 'completed';
    withdrawal.reviewed_by = data.admin_id;
    withdrawal.updated_at = new Date().toISOString();

    // 3. Create immutable ledger entry for completed withdrawal
    this.state.wallet_ledger.push({
      id: 'ldg_' + crypto.randomUUID().substring(0, 8),
      user_id: withdrawal.worker_id,
      transaction_type: 'withdrawal_completed',
      direction: 'debit',
      amount_minor: withdrawal.amount_minor,
      currency: 'PKR',
      related_entity_type: 'withdrawal',
      related_entity_id: withdrawal.id,
      balance_after_minor: wallet.available_minor,
      actor_id: data.admin_id,
      idempotency_key: `idemp_${withdrawal.id}_complete`,
      notes: `Withdrawal payout executed via ${withdrawal.method}. External reference: ${data.actual_payment_reference.trim()}`,
      created_at: new Date().toISOString(),
    });

    // 4. Create payout reconciliation record
    this.state.payout_reconciliation.push({
      id: 'payrec_' + crypto.randomUUID().substring(0, 8),
      withdrawal_id: withdrawal.id,
      actual_payment_reference: data.actual_payment_reference.trim(),
      external_rail: withdrawal.method,
      actual_amount_paid_minor: withdrawal.amount_minor,
      currency: 'PKR',
      processed_by_admin: data.admin_id,
      admin_notes: data.admin_notes || 'Confirmed transfer executed outside platform',
      confirmation_timestamp: new Date().toISOString(),
    });

    // 5. Notify worker
    this.addNotification({
      user_id: withdrawal.worker_id,
      title: 'Withdrawal Processed',
      message: `Your withdrawal of PKR ${(withdrawal.amount_minor / 100).toFixed(2)} has been paid to your ${withdrawal.method} account. Ref: ${data.actual_payment_reference.trim()}`,
      type: 'withdrawal'
    });

    this.logAudit({
      actor_id: data.admin_id,
      actor_role: 'admin',
      action: 'RECONCILE_WITHDRAWAL_PAYMENT',
      resource_type: 'withdrawal_request',
      resource_id: withdrawal.id,
      reason: data.admin_notes,
      details: { ref: data.actual_payment_reference.trim(), amount_minor: withdrawal.amount_minor }
    });
    this.save();
    return withdrawal;
  }

  // 9. Admin rejects withdrawal (or worker cancels) -> ATOMIC RESERVATION RELEASE
  public rejectOrCancelWithdrawal(data: {
    withdrawal_id: string;
    actor_id: string;
    actor_role: 'admin' | 'worker';
    reason: string;
  }): WithdrawalRequest {
    const withdrawal = this.state.withdrawal_requests.find(w => w.id === data.withdrawal_id);
    if (!withdrawal) throw new Error('Withdrawal request not found');
    if (withdrawal.status !== 'pending_review' && withdrawal.status !== 'approved_pending_payout') {
      throw new Error(`Cannot reject or cancel withdrawal in state: ${withdrawal.status}`);
    }

    if (data.actor_role === 'worker' && withdrawal.worker_id !== data.actor_id) {
      throw new Error('You cannot cancel another user\'s withdrawal request');
    }

    const wallet = this.state.wallet_accounts.find(w => w.user_id === withdrawal.worker_id);
    if (!wallet) throw new Error('Worker wallet not found');

    // 1. Release reserved funds back to available
    wallet.reserved_minor = Math.max(0, wallet.reserved_minor - withdrawal.amount_minor);
    wallet.available_minor += withdrawal.amount_minor;
    wallet.updated_at = new Date().toISOString();

    // 2. Update status
    withdrawal.status = data.actor_role === 'admin' ? 'rejected' : 'cancelled';
    withdrawal.rejection_reason = data.reason;
    withdrawal.reviewed_by = data.actor_id;
    withdrawal.updated_at = new Date().toISOString();

    // 3. Create immutable release ledger entry
    this.state.wallet_ledger.push({
      id: 'ldg_' + crypto.randomUUID().substring(0, 8),
      user_id: withdrawal.worker_id,
      transaction_type: 'withdrawal_cancelled_release',
      direction: 'credit',
      amount_minor: withdrawal.amount_minor,
      currency: 'PKR',
      related_entity_type: 'withdrawal',
      related_entity_id: withdrawal.id,
      balance_after_minor: wallet.available_minor,
      actor_id: data.actor_id,
      idempotency_key: `idemp_${withdrawal.id}_release`,
      notes: `Released reserved PKR ${(withdrawal.amount_minor / 100).toFixed(2)} back to available balance. Reason: ${data.reason}`,
      created_at: new Date().toISOString(),
    });

    // 4. Notify worker
    this.addNotification({
      user_id: withdrawal.worker_id,
      title: data.actor_role === 'admin' ? 'Withdrawal Rejected' : 'Withdrawal Cancelled',
      message: `Your withdrawal for PKR ${(withdrawal.amount_minor / 100).toFixed(2)} was ${withdrawal.status}. PKR ${(withdrawal.amount_minor / 100).toFixed(2)} has been refunded to your available balance.`,
      type: 'withdrawal'
    });

    this.logAudit({
      actor_id: data.actor_id,
      actor_role: data.actor_role,
      action: data.actor_role === 'admin' ? 'REJECT_WITHDRAWAL' : 'CANCEL_WITHDRAWAL',
      resource_type: 'withdrawal_request',
      resource_id: withdrawal.id,
      reason: data.reason,
      details: { amount_minor: withdrawal.amount_minor }
    });
    this.save();
    return withdrawal;
  }

  // 10. Notifications
  public addNotification(data: { user_id: string; title: string; message: string; type: Notification['type'] }): Notification {
    const notif: Notification = {
      id: 'notif_' + crypto.randomUUID().substring(0, 8),
      user_id: data.user_id,
      title: data.title,
      message: data.message,
      type: data.type,
      read: false,
      created_at: new Date().toISOString(),
    };
    this.state.notifications.unshift(notif);
    return notif;
  }

  // 11. Audit logging
  public logAudit(data: {
    actor_id: string;
    actor_role: string;
    action: string;
    resource_type: string;
    resource_id: string;
    reason?: string;
    details: Record<string, any>;
    ip_address?: string;
  }): AuditLog {
    const entry: AuditLog = {
      id: 'aud_' + crypto.randomUUID().substring(0, 8),
      actor_id: data.actor_id,
      actor_role: data.actor_role,
      action: data.action,
      resource_type: data.resource_type,
      resource_id: data.resource_id,
      reason: data.reason,
      details: data.details,
      ip_address: data.ip_address,
      created_at: new Date().toISOString(),
    };
    this.state.audit_logs.unshift(entry);
    return entry;
  }
}

export const db = new Database();
