/**
 * Seed defaults for item-based pricing. The live values are stored in the DB
 * (pricing_config + item_prices) and edited in the admin Pricing page; these are
 * only the starting figures and the fallback if a row is missing.
 *
 * Standard total = base call-out + Σ(item price × qty) + mileage beyond free radius
 *                  + optional services (packing / dismantle / assemble).
 */

export const DEFAULT_PRICING_CONFIG = {
  base_callout: 120,       // £ minimum — crew + van turning up (short local move)
  free_miles: 15,          // miles included before mileage applies
  per_mile: 1.5,           // £ per mile beyond the free radius
  premium_multiplier: 2.25,
};

/** Fallback price for a customer-typed "custom:" item with no catalogue price. */
export const DEFAULT_CUSTOM_ITEM_PRICE = 17;

/** Default £ price per catalogue item key (edit in the admin Pricing page).
 *  Reduced 15% from the original launch table (Aug 2026) — see item_prices in DB. */
export const DEFAULT_ITEM_PRICES: Record<string, number> = {
  // White goods
  fridge_freezer: 34, american_fridge_freezer: 47, fridge: 21, freezer: 21, chest_freezer: 34,
  washing_machine: 30, washer_dryer: 34, tumble_dryer: 26, dishwasher: 26, oven: 26, cooker: 34, range_cooker: 47,
  // Kitchen appliances
  microwave: 7, air_fryer: 5, toaster: 3, kettle: 3, coffee_machine: 7, food_mixer: 7, vacuum_cleaner: 7, small_appliances_box: 9,
  // Bedroom
  single_bed: 17, double_bed: 26, king_bed: 30, super_king_bed: 38, bunk_bed: 34, cot_bed: 13, mattress: 17,
  wardrobe: 30, chest_of_drawers: 17, bedside_table: 7, dressing_table: 17, clothes_rail: 7, mirror: 9,
  // Living room
  sofa: 38, sofa_bed: 43, footstool: 7, tv: 21, tv_stand: 13, tv_console: 17, coffee_table: 10, side_table: 7,
  lamp: 5, rug: 7, bookcase: 17, display_cabinet: 26,
  // Dining
  dining_table: 26, dining_chair: 5, sideboard: 26, bar_stool: 7, drinks_cabinet: 21,
  // Office & electronics
  office_desk: 21, office_chair: 10, monitor: 7, computer_tower: 9, printer: 7, filing_cabinet: 17, soundbar: 7,
  // Boxes & storage
  boxes: 4, bags: 3, suitcase: 4, plastic_crate: 4, shoe_rack: 7, shelving_unit: 17, storage_ottoman: 13,
  // Garden & outdoor
  garden_table: 17, garden_chair: 5, garden_bench: 17, bbq: 17, plant_pots: 3, garden_storage_box: 13,
  lawn_mower: 17, ladder: 9, shed_contents: 51,
  // Fitness & leisure
  treadmill: 38, exercise_bike: 26, gym_equipment: 34, bicycle: 13, piano: 102, guitar: 9, pool_table: 77, fish_tank: 21,
};
