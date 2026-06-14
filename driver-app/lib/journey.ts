import type { Job } from "./types";

export type JourneyPhase =
  | "to_pickup"
  | "enroute_pickup"
  | "at_pickup"
  | "to_delivery"
  | "enroute_delivery"
  | "at_delivery"
  | "ready_to_complete"
  | "completed";

/** Derive the single current phase of the chain-of-custody from a job's flags. */
export function journeyPhase(job: Job): JourneyPhase {
  if (job.completed_at) return "completed";
  if (job.delivery_confirmed) return "ready_to_complete";

  if (job.current_journey_leg === "delivery") {
    return job.arrived_at ? "at_delivery" : "enroute_delivery";
  }
  if (job.pickup_confirmed) return "to_delivery";

  if (job.current_journey_leg === "pickup") {
    return job.arrived_at ? "at_pickup" : "enroute_pickup";
  }
  return "to_pickup";
}

/** The destination address relevant to a leg. */
export function legDestination(job: Job, leg: "pickup" | "delivery") {
  return leg === "pickup" ? job.origin : job.destination;
}

/** Best available ETA timestamp from the latest server call. */
export function currentEta(job: Job): string | null {
  return job.call3_eta_timestamp || job.call2_eta_timestamp || job.call1_eta_timestamp || null;
}

/** Minutes until an ETA (rounded), or null. */
export function minutesUntil(eta: string | null): number | null {
  if (!eta) return null;
  return Math.round((new Date(eta).getTime() - Date.now()) / 60000);
}
