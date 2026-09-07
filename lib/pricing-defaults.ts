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
  premium_multiplier: 1.7,
};

/** Fallback price for a customer-typed "custom:" item with no catalogue price. */
export const DEFAULT_CUSTOM_ITEM_PRICE = 14;

/** Default £ price per catalogue item key (edit in the admin Pricing page).
 *  Reduced a further 15% (Sep 2026), on top of the earlier -15% (Aug 2026), in
 *  response to customer feedback that quotes were high — see item_prices in DB. */
export const DEFAULT_ITEM_PRICES: Record<string, number> = {
  // White goods
  fridge_freezer: 25, american_fridge_freezer: 34, fridge: 15, freezer: 15, chest_freezer: 25,
  washing_machine: 22, washer_dryer: 25, tumble_dryer: 19, dishwasher: 19, oven: 19, cooker: 25, range_cooker: 34,
  // Kitchen appliances
  microwave: 5, air_fryer: 3, toaster: 3, kettle: 3, coffee_machine: 5, food_mixer: 5, vacuum_cleaner: 5, small_appliances_box: 7,
  // Bedroom
  single_bed: 12, double_bed: 19, king_bed: 22, super_king_bed: 27, bunk_bed: 25, cot_bed: 9, mattress: 12,
  wardrobe: 22, chest_of_drawers: 12, bedside_table: 5, dressing_table: 12, clothes_rail: 5, mirror: 7,
  // Living room
  sofa: 27, sofa_bed: 31, footstool: 5, tv: 15, tv_stand: 9, tv_console: 12, coffee_table: 8, side_table: 5,
  lamp: 3, rug: 5, bookcase: 12, display_cabinet: 19,
  // Dining
  dining_table: 19, dining_chair: 3, sideboard: 19, bar_stool: 5, drinks_cabinet: 15,
  // Office & electronics
  office_desk: 15, office_chair: 8, monitor: 5, computer_tower: 7, printer: 5, filing_cabinet: 12, soundbar: 5,
  // Boxes & storage
  boxes: 3, bags: 3, suitcase: 3, plastic_crate: 3, shoe_rack: 5, shelving_unit: 12, storage_ottoman: 9,
  // Garden & outdoor
  garden_table: 12, garden_chair: 3, garden_bench: 12, bbq: 12, plant_pots: 3, garden_storage_box: 9,
  lawn_mower: 12, ladder: 7, shed_contents: 37,
  // Fitness & leisure
  treadmill: 27, exercise_bike: 19, gym_equipment: 25, bicycle: 9, piano: 74, guitar: 7, pool_table: 55, fish_tank: 15,
};
