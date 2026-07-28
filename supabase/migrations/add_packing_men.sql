-- Number of packers requested for the packing service (£35/hr per man).
ALTER TABLE additional_services ADD COLUMN IF NOT EXISTS packing_men INT DEFAULT 1;
