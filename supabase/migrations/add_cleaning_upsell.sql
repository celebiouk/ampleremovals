-- Cross-sell flag: customer booking a removal / man-and-van / house-clearance
-- said they'd also like end-of-tenancy cleaning (offered at 30% off when added
-- to the move). The team applies the discount when quoting the cleaning.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS wants_eot_cleaning BOOLEAN DEFAULT false;
