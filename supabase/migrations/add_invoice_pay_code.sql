-- Short, unguessable code for the customer "pay balance" link (/pay/<code>),
-- so invoice SMS/WhatsApp carry a short URL instead of a long token path.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pay_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_pay_code ON invoices (pay_code) WHERE pay_code IS NOT NULL;
