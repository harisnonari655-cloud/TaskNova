-- ==============================================================================
-- TASKNOVA PRODUCTION POSTGRESQL & SUPABASE MIGRATION (2026-01-01)
-- Full schema for 16 tables with constraints, indexes, and Row Level Security (RLS)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('worker', 'client', 'admin')),
    phone TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    payout_method TEXT CHECK (payout_method IN ('jazzcash', 'easypaisa', 'bank_transfer')),
    payout_account_number TEXT,
    payout_account_title TEXT,
    payout_bank_name TEXT,
    risk_flag BOOLEAN DEFAULT FALSE,
    risk_reason TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Role Assignments (Protected Role Auditing)
CREATE TABLE IF NOT EXISTS public.role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('worker', 'client', 'admin')),
    assigned_by UUID REFERENCES public.profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- 3. Client Accounts
CREATE TABLE IF NOT EXISTS public.client_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    verified_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verified_status IN ('unverified', 'verified')),
    total_funded_minor BIGINT NOT NULL DEFAULT 0 CHECK (total_funded_minor >= 0),
    currency TEXT NOT NULL DEFAULT 'PKR',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'data_categorization', 'transcription', 'usability_testing',
        'fact_checking', 'content_moderation', 'digital_survey'
    )),
    instructions TEXT NOT NULL,
    acceptance_criteria TEXT NOT NULL,
    evidence_type TEXT NOT NULL CHECK (evidence_type IN ('text_and_url', 'file_upload', 'code_snippet')),
    reward_per_slot_minor BIGINT NOT NULL CHECK (reward_per_slot_minor > 0),
    max_slots INT NOT NULL CHECK (max_slots > 0),
    approved_slots INT NOT NULL DEFAULT 0 CHECK (approved_slots >= 0),
    total_required_budget_minor BIGINT NOT NULL CHECK (total_required_budget_minor > 0),
    funded_budget_minor BIGINT NOT NULL DEFAULT 0 CHECK (funded_budget_minor >= 0),
    remaining_budget_minor BIGINT NOT NULL DEFAULT 0 CHECK (remaining_budget_minor >= 0),
    status TEXT NOT NULL DEFAULT 'pending_moderation' CHECK (status IN (
        'draft', 'pending_moderation', 'approved_unfunded', 'active', 'paused', 'completed', 'rejected'
    )),
    rejection_reason TEXT,
    currency TEXT NOT NULL DEFAULT 'PKR',
    estimated_minutes INT NOT NULL DEFAULT 15,
    deadline TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Task Funding
CREATE TABLE IF NOT EXISTS public.task_funding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE RESTRICT,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency TEXT NOT NULL DEFAULT 'PKR',
    method TEXT NOT NULL CHECK (method IN ('jazzcash', 'easypaisa', 'bank_transfer')),
    payment_reference TEXT NOT NULL,
    proof_notes TEXT,
    status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'verified', 'rejected', 'reversed')),
    verified_amount_minor BIGINT,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Task Budget Allocations
CREATE TABLE IF NOT EXISTS public.task_budget_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE RESTRICT,
    funding_id UUID NOT NULL REFERENCES public.task_funding(id) ON DELETE RESTRICT,
    allocated_amount_minor BIGINT NOT NULL CHECK (allocated_amount_minor > 0),
    remaining_budget_minor BIGINT NOT NULL CHECK (remaining_budget_minor >= 0),
    status TEXT NOT NULL DEFAULT 'allocated',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Task Submissions
CREATE TABLE IF NOT EXISTS public.task_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE RESTRICT,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reward_amount_minor BIGINT NOT NULL CHECK (reward_amount_minor > 0),
    evidence_notes TEXT NOT NULL,
    evidence_links TEXT,
    evidence_file_name TEXT,
    evidence_file_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'appealed')),
    rejection_reason TEXT,
    appeal_notes TEXT,
    reviewer_id UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    reward_credited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Submission Reviews
CREATE TABLE IF NOT EXISTS public.submission_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.task_submissions(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
    decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
    reason TEXT NOT NULL,
    reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Wallet Accounts (Transactional Balance Projections)
CREATE TABLE IF NOT EXISTS public.wallet_accounts (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    currency TEXT NOT NULL DEFAULT 'PKR',
    available_minor BIGINT NOT NULL DEFAULT 0 CHECK (available_minor >= 0),
    pending_minor BIGINT NOT NULL DEFAULT 0 CHECK (pending_minor >= 0),
    reserved_minor BIGINT NOT NULL DEFAULT 0 CHECK (reserved_minor >= 0),
    withdrawn_minor BIGINT NOT NULL DEFAULT 0 CHECK (withdrawn_minor >= 0),
    total_earned_minor BIGINT NOT NULL DEFAULT 0 CHECK (total_earned_minor >= 0),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Immutable Wallet Ledger
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'client_funding_received', 'task_budget_allocated', 'worker_reward_credit',
        'withdrawal_reservation', 'withdrawal_completed', 'withdrawal_cancelled_release', 'authorized_refund'
    )),
    direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency TEXT NOT NULL DEFAULT 'PKR',
    related_entity_type TEXT NOT NULL CHECK (related_entity_type IN ('task', 'submission', 'funding', 'withdrawal')),
    related_entity_id TEXT NOT NULL,
    balance_after_minor BIGINT NOT NULL,
    actor_id UUID NOT NULL REFERENCES public.profiles(id),
    idempotency_key TEXT NOT NULL UNIQUE,
    notes TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Withdrawal Requests
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amount_minor BIGINT NOT NULL CHECK (amount_minor >= 10000), -- Minimum PKR 100
    currency TEXT NOT NULL DEFAULT 'PKR',
    method TEXT NOT NULL CHECK (method IN ('jazzcash', 'easypaisa', 'bank_transfer')),
    account_number_masked TEXT NOT NULL,
    account_title TEXT NOT NULL,
    bank_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN (
        'pending_review', 'approved_pending_payout', 'completed', 'rejected', 'cancelled'
    )),
    reviewed_by UUID REFERENCES public.profiles(id),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Payout Reconciliation
CREATE TABLE IF NOT EXISTS public.payout_reconciliation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    withdrawal_id UUID NOT NULL UNIQUE REFERENCES public.withdrawal_requests(id) ON DELETE RESTRICT,
    actual_payment_reference TEXT NOT NULL,
    external_rail TEXT NOT NULL CHECK (external_rail IN ('jazzcash', 'easypaisa', 'bank_transfer')),
    actual_amount_paid_minor BIGINT NOT NULL CHECK (actual_amount_paid_minor > 0),
    currency TEXT NOT NULL DEFAULT 'PKR',
    processed_by_admin UUID NOT NULL REFERENCES public.profiles(id),
    admin_notes TEXT NOT NULL,
    confirmation_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('task', 'funding', 'submission', 'withdrawal', 'security', 'support')),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('payment', 'task_review', 'account', 'dispute', 'general')),
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    admin_reply TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Disputes
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.task_submissions(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
        'open', 'investigating', 'resolved_favour_worker', 'resolved_favour_client', 'closed'
    )),
    resolution_notes TEXT,
    resolved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    reason TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR HIGH-THROUGHPUT MARKETPLACE QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_client ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_submissions_task ON public.task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_worker ON public.task_submissions(worker_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.task_submissions(status);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON public.wallet_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entity ON public.wallet_ledger(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_worker ON public.withdrawal_requests(worker_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_funding_task ON public.task_funding(task_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_funding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: Users can read their own profile; admins can read all
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Tasks: Anyone can view active tasks; clients view their own; admins view all
CREATE POLICY "tasks_select" ON public.tasks
    FOR SELECT USING (
        status = 'active' OR client_id = auth.uid() OR public.is_admin()
    );

CREATE POLICY "tasks_client_insert" ON public.tasks
    FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "tasks_client_update" ON public.tasks
    FOR UPDATE USING (client_id = auth.uid() OR public.is_admin());

-- Submissions: Workers see their own; clients see their task's submissions; admins see all
CREATE POLICY "submissions_select" ON public.task_submissions
    FOR SELECT USING (
        worker_id = auth.uid() OR 
        task_id IN (SELECT id FROM public.tasks WHERE client_id = auth.uid()) OR
        public.is_admin()
    );

CREATE POLICY "submissions_worker_insert" ON public.task_submissions
    FOR INSERT WITH CHECK (worker_id = auth.uid());

-- Ledger & Wallet: Read own records only; writes strictly restricted to server service-role
CREATE POLICY "wallet_select_own" ON public.wallet_accounts
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "ledger_select_own" ON public.wallet_ledger
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- Withdrawals: Workers see their own requests; admins see all
CREATE POLICY "withdrawals_select" ON public.withdrawal_requests
    FOR SELECT USING (worker_id = auth.uid() OR public.is_admin());

CREATE POLICY "withdrawals_worker_insert" ON public.withdrawal_requests
    FOR INSERT WITH CHECK (worker_id = auth.uid());

-- Payout Reconciliation: Admin only
CREATE POLICY "payout_admin_only" ON public.payout_reconciliation
    FOR ALL USING (public.is_admin());

-- Notifications: User reads their own notifications
CREATE POLICY "notif_select_own" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notif_update_own" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Support Tickets: User reads and creates own tickets; admins manage all
CREATE POLICY "tickets_user_select" ON public.support_tickets
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "tickets_user_insert" ON public.support_tickets
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Audit Logs: Admin read-only
CREATE POLICY "audit_admin_select" ON public.audit_logs
    FOR SELECT USING (public.is_admin());
