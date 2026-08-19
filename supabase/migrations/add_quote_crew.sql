-- Team & vehicle shown on the quote so the customer knows exactly what they get:
-- how many movers, how many vans (and size), plus a reassurance blurb about the
-- crew's experience and how items are protected / loaded / unloaded.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS quote_crew_men   INT,          -- number of movers
  ADD COLUMN IF NOT EXISTS quote_van_count  INT,          -- number of vans
  ADD COLUMN IF NOT EXISTS quote_van_size   TEXT,         -- van size key (e.g. '3.5t_luton')
  ADD COLUMN IF NOT EXISTS quote_crew_blurb TEXT;         -- editable reassurance copy
