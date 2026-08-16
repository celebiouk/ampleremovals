/**
 * Inventory catalog — the single source of truth for the "what are you moving?"
 * item template. Drives BOTH the customer-facing picker (Phase B UI) and the
 * white-goods detection that the quote engine relies on.
 *
 * Grouped into a few categories so the picker can render fast, scannable
 * sections rather than one overwhelming list. Every item has a stable `key`
 * (never rename — it is persisted on the booking); some items have `variants`
 * (e.g. sofa seat count, TV size) and every selection carries a quantity.
 */

export interface InventoryVariant {
  key: string;
  label: string;
}

export interface InventoryItem {
  key: string;
  label: string;
  /** Counts toward the hidden white-goods +£50 uplift. */
  whiteGood?: boolean;
  /** Optional sub-types the customer picks between (e.g. sofa size). */
  variants?: InventoryVariant[];
}

export interface InventoryCategory {
  category: string;
  items: InventoryItem[];
}

/** A single line the customer selected, as stored on `bookings.inventory`. */
export interface InventorySelection {
  key: string;
  label: string;
  variant?: string;
  quantity: number;
}

export const INVENTORY_CATALOG: InventoryCategory[] = [
  // ── White goods first (heavy appliances — drive the hidden white-goods uplift).
  {
    category: "White goods",
    items: [
      { key: "fridge_freezer", label: "Fridge freezer", whiteGood: true },
      { key: "american_fridge_freezer", label: "American fridge freezer", whiteGood: true },
      { key: "fridge", label: "Fridge / under-counter fridge", whiteGood: true },
      { key: "freezer", label: "Freezer / under-counter freezer", whiteGood: true },
      { key: "chest_freezer", label: "Chest freezer", whiteGood: true },
      { key: "washing_machine", label: "Washing machine", whiteGood: true },
      { key: "washer_dryer", label: "Washer dryer", whiteGood: true },
      { key: "tumble_dryer", label: "Tumble dryer", whiteGood: true },
      { key: "dishwasher", label: "Dishwasher", whiteGood: true },
      { key: "oven", label: "Built-in oven", whiteGood: true },
      { key: "cooker", label: "Freestanding cooker", whiteGood: true },
      { key: "range_cooker", label: "Range cooker", whiteGood: true },
    ],
  },
  {
    category: "Kitchen appliances",
    items: [
      { key: "microwave", label: "Microwave" },
      { key: "air_fryer", label: "Air fryer" },
      { key: "toaster", label: "Toaster" },
      { key: "kettle", label: "Kettle" },
      { key: "coffee_machine", label: "Coffee machine" },
      { key: "food_mixer", label: "Food / stand mixer" },
      { key: "vacuum_cleaner", label: "Vacuum cleaner" },
      { key: "small_appliances_box", label: "Box of small appliances" },
    ],
  },
  {
    category: "Bedroom",
    items: [
      { key: "single_bed", label: "Single bed & mattress" },
      { key: "double_bed", label: "Double bed & mattress" },
      { key: "king_bed", label: "King size bed & mattress" },
      { key: "super_king_bed", label: "Super king bed & mattress" },
      { key: "bunk_bed", label: "Bunk bed" },
      { key: "cot_bed", label: "Cot / baby bed" },
      {
        key: "mattress",
        label: "Mattress (on its own)",
        variants: [
          { key: "single", label: "Single" },
          { key: "double", label: "Double" },
          { key: "king", label: "King" },
        ],
      },
      { key: "wardrobe", label: "Wardrobe" },
      { key: "chest_of_drawers", label: "Chest of drawers" },
      { key: "bedside_table", label: "Bedside table" },
      { key: "dressing_table", label: "Dressing table" },
      { key: "clothes_rail", label: "Clothes rail" },
      {
        key: "mirror",
        label: "Mirror",
        variants: [
          { key: "full_length", label: "Full length mirror" },
          { key: "large", label: "Large mirror" },
        ],
      },
    ],
  },
  {
    category: "Living room",
    items: [
      {
        key: "sofa",
        label: "Sofa",
        variants: [
          { key: "1_seater", label: "1 seater" },
          { key: "2_seater", label: "2 seater" },
          { key: "3_seater", label: "3 seater" },
          { key: "4_seater", label: "4 seater" },
          { key: "corner", label: "Corner sofa" },
          { key: "armchair", label: "Arm chair" },
        ],
      },
      { key: "sofa_bed", label: "Sofa bed" },
      { key: "footstool", label: "Footstool / pouffe" },
      {
        key: "tv",
        label: "TV",
        variants: [
          { key: "30in", label: "30 inches" },
          { key: "40in", label: "40 inches" },
          { key: "40in_plus", label: "More than 40 inches" },
        ],
      },
      { key: "tv_stand", label: "TV stand" },
      { key: "tv_console", label: "TV console" },
      { key: "coffee_table", label: "Coffee table" },
      { key: "side_table", label: "Side table" },
      { key: "lamp", label: "Floor / standing lamp" },
      { key: "rug", label: "Rug" },
      { key: "bookcase", label: "Bookcase" },
      { key: "display_cabinet", label: "Display cabinet" },
    ],
  },
  {
    category: "Dining room",
    items: [
      {
        key: "dining_table",
        label: "Dining table",
        variants: [
          { key: "4_seater", label: "4 seater" },
          { key: "6_seater", label: "6 seater" },
          { key: "8_seater", label: "8 seater" },
        ],
      },
      { key: "dining_chair", label: "Dining chair" },
      { key: "sideboard", label: "Sideboard" },
      { key: "bar_stool", label: "Bar stool" },
      { key: "drinks_cabinet", label: "Drinks cabinet" },
    ],
  },
  {
    category: "Office & electronics",
    items: [
      { key: "office_desk", label: "Office desk" },
      { key: "office_chair", label: "Office chair" },
      { key: "monitor", label: "Monitor" },
      { key: "computer_tower", label: "Computer tower / PC" },
      { key: "printer", label: "Printer" },
      { key: "filing_cabinet", label: "Filing cabinet" },
      { key: "soundbar", label: "Soundbar / speakers" },
    ],
  },
  {
    category: "Boxes & storage",
    items: [
      {
        key: "boxes",
        label: "Boxes",
        variants: [
          { key: "small", label: "Small" },
          { key: "medium", label: "Medium" },
          { key: "large", label: "Large" },
          { key: "xlarge", label: "X large" },
        ],
      },
      {
        key: "bags",
        label: "Bags",
        variants: [
          { key: "small", label: "Small bag" },
          { key: "medium", label: "Medium bag" },
          { key: "large", label: "Large bag" },
        ],
      },
      { key: "suitcase", label: "Suitcase" },
      { key: "plastic_crate", label: "Plastic crate" },
      { key: "shoe_rack", label: "Shoe rack" },
      { key: "shelving_unit", label: "Shelving unit (e.g. IKEA Kallax)" },
      { key: "storage_ottoman", label: "Storage ottoman / blanket box" },
    ],
  },
  {
    category: "Garden & outdoor",
    items: [
      { key: "garden_table", label: "Garden table" },
      { key: "garden_chair", label: "Garden chair" },
      { key: "garden_bench", label: "Garden bench" },
      { key: "bbq", label: "BBQ" },
      { key: "plant_pots", label: "Plant pots" },
      { key: "garden_storage_box", label: "Garden storage box" },
      { key: "lawn_mower", label: "Lawn mower" },
      { key: "ladder", label: "Ladder / step ladder" },
      { key: "shed_contents", label: "Contents of shed" },
    ],
  },
  {
    category: "Fitness & leisure",
    items: [
      { key: "treadmill", label: "Treadmill" },
      { key: "exercise_bike", label: "Exercise bike" },
      { key: "gym_equipment", label: "Gym equipment / weights" },
      { key: "bicycle", label: "Bicycle" },
      {
        key: "piano",
        label: "Piano",
        variants: [
          { key: "upright", label: "Upright piano" },
          { key: "grand", label: "Grand piano" },
          { key: "digital", label: "Digital piano / keyboard" },
        ],
      },
      { key: "guitar", label: "Guitar / instrument" },
      { key: "pool_table", label: "Pool table" },
      { key: "fish_tank", label: "Fish tank / aquarium" },
    ],
  },
];

/** Item keys that count as white goods (drive the hidden +£50). */
export const WHITE_GOODS_KEYS: ReadonlySet<string> = new Set(
  INVENTORY_CATALOG.flatMap((c) => c.items.filter((i) => i.whiteGood).map((i) => i.key))
);

/** Flat lookup of every catalog item by key (for validation/labelling). */
export const INVENTORY_ITEMS_BY_KEY: ReadonlyMap<string, InventoryItem> = new Map(
  INVENTORY_CATALOG.flatMap((c) => c.items).map((i) => [i.key, i])
);

/**
 * True if any selected line is a white good with quantity ≥ 1. Tolerant of
 * missing/garbage input (returns false) so it can run over raw stored JSON.
 */
export function hasWhiteGoods(inventory: unknown): boolean {
  if (!Array.isArray(inventory)) return false;
  return inventory.some(
    (line) =>
      line &&
      typeof line === "object" &&
      WHITE_GOODS_KEYS.has((line as InventorySelection).key) &&
      Number((line as InventorySelection).quantity) >= 1
  );
}
