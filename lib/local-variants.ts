/**
 * Deterministic variant picker for programmatic local pages — the same FAQ
 * question asked with the same fixed sentence structure on 150+ village
 * pages (just the village name swapped) is exactly the duplicate-content
 * pattern this whole system exists to avoid. Each templated content slot
 * gets several genuinely different phrasings; this picks one per village
 * deterministically (same village always gets the same variant, so content
 * doesn't shuffle between builds, but different villages get different
 * wording for the same underlying fact).
 */
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function pickVariant<T>(seed: string, slot: string, options: T[]): T {
  const idx = hashSeed(`${seed}:${slot}`) % options.length;
  return options[idx];
}
