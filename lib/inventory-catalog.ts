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
  {
    category: "Kitchen appliances",
    items: [
      { key: "fridge_freezer", label: "Fridge freezer", whiteGood: true },
      { key: "washing_machine", label: "Washing machine", whiteGood: true },
      { key: "tumble_dryer", label: "Tumble dryer", whiteGood: true },
      { key: "dishwasher", label: "Dishwasher", whiteGood: true },
      { key: "chest_freezer", label: "Chest freezer", whiteGood: true },
    ],
  },
  {
    category: "Beds",
    items: [
      { key: "single_bed", label: "Single bed & mattress" },
      { key: "double_bed", label: "Double bed & mattress" },
      { key: "king_bed", label: "King size bed & mattress" },
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
      {
        key: "tv",
        label: "TV",
        variants: [
          { key: "30in", label: "30 inches" },
          { key: "40in", label: "40 inches" },
          { key: "40in_plus", label: "More than 40 inches" },
        ],
      },
      { key: "tv_console", label: "TV console" },
      { key: "tv_stand", label: "TV stand" },
      { key: "coffee_table", label: "Coffee table" },
      { key: "bedside_table", label: "Bedside table" },
    ],
  },
  {
    category: "Dining & office",
    items: [
      {
        key: "dining_table",
        label: "Dining table",
        variants: [
          { key: "4_seater", label: "4 seater" },
          { key: "6_seater", label: "6 seater" },
        ],
      },
      { key: "dining_chair", label: "Dining chair" },
      { key: "office_desk", label: "Office desk" },
      { key: "office_chair", label: "Office chair" },
      { key: "monitor", label: "Monitor" },
      { key: "printer", label: "Printer" },
    ],
  },
  {
    category: "Storage & wardrobes",
    items: [
      { key: "wardrobe", label: "Wardrobe" },
      { key: "chest_of_drawers", label: "Chest of drawers" },
      {
        key: "mirror",
        label: "Mirror",
        variants: [
          { key: "full_length", label: "Full length mirror" },
          { key: "large", label: "Large mirror" },
        ],
      },
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
