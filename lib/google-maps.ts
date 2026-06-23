/**
 * Google Maps Distance Matrix — server-side only (key never ships to the app).
 * Returns the live, traffic-aware duration + ETA from the driver's GPS to the
 * destination. Destination may be "lat,lng" or a postcode string.
 */

export interface DistanceResult {
  durationSeconds: number;
  etaTimestamp: string; // ISO
}

/** Padding added to every ETA to absorb stops, parking and load-in delays. */
const ETA_BUFFER_SECONDS = 5 * 60;

export async function distanceMatrix(
  originLat: number,
  originLng: number,
  destination: string
): Promise<DistanceResult> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY not set");

  const params = new URLSearchParams({
    origins: `${originLat},${originLng}`,
    destinations: destination,
    departure_time: "now",
    traffic_model: "best_guess",
    mode: "driving",
    key,
  });

  const res = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?${params}`);
  const data = await res.json();

  const element = data?.rows?.[0]?.elements?.[0];
  if (data.status !== "OK" || !element || element.status !== "OK") {
    throw new Error(`Distance Matrix error: ${element?.status ?? data.status}`);
  }

  // duration_in_traffic when available (traffic-aware), else duration. We add a
  // small fixed buffer so the customer-facing ETA accounts for real-world delays.
  const drive: number = element.duration_in_traffic?.value ?? element.duration.value;
  const durationSeconds = drive + ETA_BUFFER_SECONDS;
  const etaTimestamp = new Date(Date.now() + durationSeconds * 1000).toISOString();
  return { durationSeconds, etaTimestamp };
}
