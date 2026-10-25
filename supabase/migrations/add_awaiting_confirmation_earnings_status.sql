-- Separate from add_worker_completion_and_payments.sql — ALTER TYPE ... ADD
-- VALUE cannot run in the same transaction as other statements that might
-- use it. driver_earnings.status is the earnings_status enum, not plain
-- text (confirmed before writing this).
ALTER TYPE earnings_status ADD VALUE IF NOT EXISTS 'awaiting_confirmation';
