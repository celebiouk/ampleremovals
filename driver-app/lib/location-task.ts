import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "./api";
import { bufferLocation, postOrQueue } from "./offline-queue";
import { hasArrived } from "./haversine";

/**
 * Background GPS (Feature 5 + the "eyes" half of the hybrid ETA engine).
 *
 * While a journey is active the OS wakes this task ~every 60s. Each fix is
 * uploaded to /api/drivers/location (or buffered offline). The task also does
 * the on-device 80m arrival check (Call 4) and fires /arrived exactly once —
 * the server then sends the "driver has arrived" notifications.
 */

export const LOCATION_TASK = "ample-driver-location";
const JOURNEY_KEY = "AMPLE_DRIVER_ACTIVE_JOURNEY";

export interface ActiveJourney {
  bookingId: string;
  leg: "pickup" | "delivery";
  destLat: number;
  destLng: number;
  arrivedFired: boolean;
}

export async function setActiveJourney(j: ActiveJourney): Promise<void> {
  await AsyncStorage.setItem(JOURNEY_KEY, JSON.stringify(j));
}
export async function getActiveJourney(): Promise<ActiveJourney | null> {
  try { const raw = await AsyncStorage.getItem(JOURNEY_KEY); return raw ? (JSON.parse(raw) as ActiveJourney) : null; } catch { return null; }
}
export async function clearActiveJourney(): Promise<void> {
  await AsyncStorage.removeItem(JOURNEY_KEY);
}

/** Upload one GPS fix, buffering it if we're offline. */
async function uploadPoint(p: { lat: number; lng: number; heading?: number | null; speed?: number | null; accuracy?: number | null }) {
  const recorded_at = new Date().toISOString();
  try {
    await apiFetch("/api/drivers/location", { method: "POST", body: JSON.stringify({ ...p, recorded_at }) });
  } catch {
    await bufferLocation({ ...p, recorded_at });
  }
}

// Registered at module load (this file is imported by the root layout).
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const locations: Location.LocationObject[] = (data as any)?.locations ?? [];
  if (locations.length === 0) return;

  const fix = locations[locations.length - 1];
  const { latitude, longitude, heading, speed, accuracy } = fix.coords;

  await uploadPoint({ lat: latitude, lng: longitude, heading, speed, accuracy });

  const journey = await getActiveJourney();
  if (journey && !journey.arrivedFired && hasArrived(latitude, longitude, journey.destLat, journey.destLng)) {
    const ok = await postOrQueue(`/api/drivers/jobs/${journey.bookingId}/arrived`, {
      leg: journey.leg, lat: latitude, lng: longitude,
    });
    if (ok) await setActiveJourney({ ...journey, arrivedFired: true });
  }
});

/** Ask for background location permission (foreground first, then background). */
export async function ensureLocationPermissions(): Promise<boolean> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") return false;
  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.status === "granted";
}

/** Begin background GPS for an active journey. */
export async function startBackgroundLocation(journey: ActiveJourney): Promise<boolean> {
  const granted = await ensureLocationPermissions();
  if (!granted) return false;
  await setActiveJourney(journey);

  const already = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (!already) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 60_000, // ~60s as specified
      distanceInterval: 40, // or every 40m, whichever first
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Ample Driver — on a job",
        notificationBody: "Sharing your live location with the office and customer.",
        notificationColor: "#6b21a8",
      },
    });
  }
  return true;
}

/** Stop background GPS (job finished / journey ended). */
export async function stopBackgroundLocation(): Promise<void> {
  await clearActiveJourney();
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (started) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
}

/** One-shot current position (for the instant Call 1 on "Start Journey"). */
export async function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  const granted = await ensureLocationPermissions();
  if (!granted) {
    // Foreground-only is enough for a single reading.
    const fg = await Location.getForegroundPermissionsAsync();
    if (fg.status !== "granted") return null;
  }
  try {
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}
