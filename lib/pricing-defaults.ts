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
export const DEFAULT_CUSTOM_ITEM_PRICE = 20;

/** Default £ price per catalogue item key (edit in the admin Pricing page). */
export const DEFAULT_ITEM_PRICES: Record<string, number> = {
  // White goods
  fridge_freezer: 40, american_fridge_freezer: 55, fridge: 25, freezer: 25, chest_freezer: 40,
  washing_machine: 35, washer_dryer: 40, tumble_dryer: 30, dishwasher: 30, oven: 30, cooker: 40, range_cooker: 55,
  // Kitchen appliances
  microwave: 8, air_fryer: 6, toaster: 4, kettle: 3, coffee_machine: 8, food_mixer: 8, vacuum_cleaner: 8, small_appliances_box: 10,
  // Bedroom
  single_bed: 20, double_bed: 30, king_bed: 35, super_king_bed: 45, bunk_bed: 40, cot_bed: 15, mattress: 20,
  wardrobe: 35, chest_of_drawers: 20, bedside_table: 8, dressing_table: 20, clothes_rail: 8, mirror: 10,
  // Living room
  sofa: 45, sofa_bed: 50, footstool: 8, tv: 25, tv_stand: 15, tv_console: 20, coffee_table: 12, side_table: 8,
  lamp: 6, rug: 8, bookcase: 20, display_cabinet: 30,
  // Dining
  dining_table: 30, dining_chair: 6, sideboard: 30, bar_stool: 8, drinks_cabinet: 25,
  // Office & electronics
  office_desk: 25, office_chair: 12, monitor: 8, computer_tower: 10, printer: 8, filing_cabinet: 20, soundbar: 8,
  // Boxes & storage
  boxes: 5, bags: 4, suitcase: 5, plastic_crate: 5, shoe_rack: 8, shelving_unit: 20, storage_ottoman: 15,
  // Garden & outdoor
  garden_table: 20, garden_chair: 6, garden_bench: 20, bbq: 20, plant_pots: 4, garden_storage_box: 15,
  lawn_mower: 20, ladder: 10, shed_contents: 60,
  // Fitness & leisure
  treadmill: 45, exercise_bike: 30, gym_equipment: 40, bicycle: 15, piano: 120, guitar: 10, pool_table: 90, fish_tank: 25,
};
