-- Separate from add_extra_charge_structure.sql: ALTER TYPE ... ADD VALUE
-- cannot run in the same transaction as other statements that might use it.
ALTER TYPE invoice_type ADD VALUE IF NOT EXISTS 'extra';
