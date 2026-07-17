import { useCallback, useEffect, useState } from "react";
import { View, Text, Linking, Share, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Navigation, MapPin, Home, Calendar, Users, PoundSterling, Info, Truck,
  Package, CheckCircle2, Share2, Phone, Play, Flag, FileText,
} from "lucide-react-native";
import { Screen, Card, Button, Badge, toast, ErrorState, Skeleton } from "@/components/ui";
import { ArrivedModal } from "@/components/ArrivedModal";
import { JobExtraButton } from "@/components/JobExtraButton";
import { useJob, useJobExtras } from "@/hooks/queries";
import { colors, radius, spacing, shadows, type } from "@/lib/theme";
import { customerShortName, serviceLabel, formatDate, formatCurrency } from "@/lib/format";
import { journeyPhase, legDestination, currentEta, minutesUntil, type JourneyPhase } from "@/lib/journey";
import { postOrQueue } from "@/lib/offline-queue";
import { startBackgroundLocation, stopBackgroundLocation, getCurrentPosition } from "@/lib/location-task";
import { apiFetch } from "@/lib/api";
import { ENV } from "@/lib/env";
import type { Job, Address } from "@/lib/types";

function fullAddress(a?: Address | null): string {
  if (!a) return "—";
  return [a.line_1, a.line_2, a.city, a.county, a.postcode].filter(Boolean).join(", ");
}
function directionsUrl(a?: Address | null): string {
  return `https://maps.google.com/?q=${encodeURIComponent(fullAddress(a))}`;
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const job = useJob(id);
  const extras = useJobExtras(id);
  const [busy, setBusy] = useState(false);
  const [arrivedDismissed, setArrivedDismissed] = useState(false);

  // Poll while a journey is live so arrival + ETA refresh without manual pull.
  const phase = job.data ? journeyPhase(job.data) : null;
  const active = phase === "enroute_pickup" || phase === "enroute_delivery";

  const refetch = useCallback(() => job.refetch(), [job]);

  // Auto-refresh every 20s while en route, so background arrival + ETA surface here.
  // Also push a foreground GPS fix each tick — this keeps the live map + ETA moving
  // even when the OS hasn't granted "Always" background location.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    async function tick() {
      job.refetch();
      try {
        const pos = await getCurrentPosition();
        if (pos && !cancelled) {
          await postOrQueue("/api/drivers/location", { lat: pos.lat, lng: pos.lng, recorded_at: new Date().toISOString() });
        }
      } catch { /* best-effort */ }
    }
    tick();
    const t = setInterval(tick, 20_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [active, job]);

  // Reset the arrived takeover whenever we leave an "at stop" phase.
  useEffect(() => {
    if (phase !== "at_pickup" && phase !== "at_delivery") setArrivedDismissed(false);
  }, [phase]);

  if (job.isLoading) {
    return (
      <Screen title="Job" back>
        <Skeleton height={120} rounded={radius["2xl"]} style={{ marginBottom: spacing.base }} />
        <Skeleton height={90} rounded={radius.xl} style={{ marginBottom: spacing.base }} />
        <Skeleton height={160} rounded={radius.xl} />
      </Screen>
    );
  }
  if (job.isError || !job.data) {
    return <Screen title="Job" back><ErrorState message={(job.error as Error)?.message} onRetry={refetch} /></Screen>;
  }

  const j = job.data;

  async function startJourney(leg: "pickup" | "delivery") {
    setBusy(true);
    try {
      const dest = legDestination(j, leg);
      const pos = await getCurrentPosition();
      if (!pos) { toast.error("Location needed", "Enable location to start the journey."); return; }
      const res = await apiFetch(`/api/drivers/jobs/${j.id}/journey/start`, { method: "POST", body: JSON.stringify({ leg, lat: pos.lat, lng: pos.lng }) });
      // Server geocodes the destination and returns its coords. NEVER fall back to
      // the driver's own position — that makes the 80m check fire "arrived" instantly.
      // 0 = unknown destination → the task won't auto-arrive; driver taps "I've arrived".
      const startData = (await res.json().catch(() => ({}))) as { destLat?: number; destLng?: number };
      const sLat = Number(startData?.destLat);
      const sLng = Number(startData?.destLng);
      const destLat = sLat && Number.isFinite(sLat) ? sLat : (Number(dest?.lat) || 0);
      const destLng = sLng && Number.isFinite(sLng) ? sLng : (Number(dest?.lng) || 0);
      await startBackgroundLocation({ bookingId: j.id, leg, destLat, destLng, arrivedFired: false });
      toast.success(`Journey to ${leg} started`, "Live tracking is now on.");
      await refetch();
    } catch (e) {
      toast.error("Couldn't start", (e as Error)?.message);
    } finally { setBusy(false); }
  }

  async function markArrived(leg: "pickup" | "delivery") {
    setBusy(true);
    try {
      const pos = await getCurrentPosition();
      await postOrQueue(`/api/drivers/jobs/${j.id}/arrived`, { leg, lat: pos?.lat ?? 0, lng: pos?.lng ?? 0 });
      toast.success("Marked as arrived");
      await refetch();
    } catch (e) {
      toast.error("Couldn't update", (e as Error)?.message);
    } finally { setBusy(false); }
  }

  async function shareTracking() {
    const token = j.live_tracking_token;
    if (!token) { toast.info("Tracking link appears once you start the journey"); return; }
    const url = `${ENV.SITE_URL}/track/${token}`;
    try { await Share.share({ message: `Track your Ample Removals driver live: ${url}`, url }); } catch { /* cancelled */ }
  }

  const svcColor = colors.primary.DEFAULT;

  return (
    <Screen
      title="Job"
      back
      headerRight={
        <Pressable onPress={shareTracking} hitSlop={10} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary.surfaceMid, alignItems: "center", justifyContent: "center" }}>
          <Share2 size={18} color={colors.primary.DEFAULT} />
        </Pressable>
      }
      onRefresh={refetch}
      refreshing={job.isRefetching && !busy}
    >
      {/* Summary */}
      <View style={[{ borderRadius: radius["2xl"], overflow: "hidden", marginBottom: spacing.base }, shadows.md]}>
        <View style={{ backgroundColor: colors.primary.DEFAULT, padding: spacing.lg }}>
          <Text style={[type.label, { color: colors.primary.surfaceMid }]}>{serviceLabel(j.service_type)}</Text>
          <Text style={[type.h1, { color: colors.white, marginTop: 4 }]}>{customerShortName(j.customer?.full_name)}</Text>
          <Text style={[type.mono, { color: "rgba(255,255,255,0.85)", marginTop: 2 }]}>{j.reference}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md }}>
            <Calendar size={16} color={colors.white} />
            <Text style={[type.bodySemiBold, { color: colors.white }]}>{formatDate(j.move_date)}{j.move_time ? ` · ${j.move_time}` : ""}</Text>
          </View>
        </View>
      </View>

      {/* Journey engine — porters don't drive, so they skip it (lead driver handles it) */}
      {j.role === "porter" ? (
        <View style={[{ borderRadius: radius.xl, padding: spacing.lg, backgroundColor: colors.white }, shadows.sm]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Badge label="Porter" bg="#ede9fe" fg="#6b21a8" />
            <Text style={[type.bodySmall, { color: colors.slate[500], flex: 1 }]}>
              You&apos;re a porter on this job — the lead driver handles the journey, pickup and delivery sign-off.
            </Text>
          </View>
        </View>
      ) : (
        <JourneyPanel job={j} phase={phase!} busy={busy} onStart={startJourney} onArrived={markArrived}
          onConfirmPickup={() => router.push(`/job/${j.id}/pickup`)}
          onConfirmDelivery={() => router.push(`/job/${j.id}/delivery`)}
          onComplete={() => router.push(`/job/${j.id}/complete`)}
        />
      )}

      {/* On-site extra charge */}
      <JobExtraButton bookingId={j.id} />

      {/* Contact */}
      {j.customer?.phone ? (
        <Card style={{ marginTop: spacing.base }} onPress={() => Linking.openURL(`tel:${j.customer?.phone}`)}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.accent.surfaceMid, alignItems: "center", justifyContent: "center" }}>
              <Phone size={18} color={colors.accent.DEFAULT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.bodySmall, { color: colors.slate[400] }]}>Call customer</Text>
              <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900] }]}>{j.customer.phone}</Text>
            </View>
          </View>
        </Card>
      ) : null}

      {/* Liability waiver — for when the customer hasn't protected their goods */}
      <Card style={{ marginTop: spacing.base }} onPress={() => router.push(`/job/${j.id}/waiver`)}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primary.surfaceMid, alignItems: "center", justifyContent: "center" }}>
            <FileText size={18} color={colors.primary.DEFAULT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[type.bodySmall, { color: colors.slate[400] }]}>If goods weren&apos;t protected by the customer</Text>
            <Text style={[type.bodyLargeSemiBold, { color: colors.slate[900] }]}>Sign liability waiver</Text>
          </View>
        </View>
      </Card>

      {/* Co-drivers + earnings */}
      {(extras.data?.coDrivers.length || extras.data?.earning) ? (
        <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.base }}>
          {extras.data?.coDrivers.length ? (
            <Card style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm }}>
                <Users size={16} color={colors.slate[600]} /><Text style={[type.bodySemiBold, { color: colors.slate[700] }]}>Working with</Text>
              </View>
              {extras.data.coDrivers.map((c, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <Text style={[type.body, { color: colors.slate[800] }]}>{c.name}</Text>
                  {c.isLead ? <Badge label="Lead" bg={colors.primary.surfaceMid} fg={colors.primary.DEFAULT} /> : null}
                </View>
              ))}
            </Card>
          ) : null}
          {extras.data?.earning ? (
            <Card style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm }}>
                <PoundSterling size={16} color={colors.slate[600]} /><Text style={[type.bodySemiBold, { color: colors.slate[700] }]}>My earnings</Text>
              </View>
              <Text style={[type.h2, { color: colors.slate[900] }]}>{formatCurrency(Number(extras.data.earning.total_earnings))}</Text>
              <Text style={[type.bodySmall, { color: colors.slate[500] }]}>incl. {formatCurrency(Number(extras.data.earning.tip_amount))} tips</Text>
            </Card>
          ) : null}
        </View>
      ) : null}

      {/* Addresses */}
      <AddressCard kind="pickup" address={j.origin} />
      <AddressCard kind="delivery" address={j.destination} />

      {/* Instructions */}
      {(j.special_instructions || j.description) ? (
        <Card style={{ marginTop: spacing.base }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm }}>
            <Info size={16} color={colors.primary.DEFAULT} /><Text style={[type.bodySemiBold, { color: colors.slate[700] }]}>Job notes</Text>
          </View>
          <Text style={[type.bodyLarge, { color: colors.slate[700] }]}>{j.special_instructions || j.description}</Text>
        </Card>
      ) : null}

      {/* Access — floor / lift / parking the customer told us about */}
      {(j.floor || j.has_lift != null || j.parking_within_20m != null) ? (
        <Card style={{ marginTop: spacing.base }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm }}>
            <Home size={16} color={colors.primary.DEFAULT} /><Text style={[type.bodySemiBold, { color: colors.slate[700] }]}>Access</Text>
          </View>
          {j.floor ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
              <Text style={[type.body, { color: colors.slate[500] }]}>Floor</Text>
              <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{j.floor === "ground" ? "Ground floor" : `Floor ${j.floor}`}</Text>
            </View>
          ) : null}
          {j.has_lift != null ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
              <Text style={[type.body, { color: colors.slate[500] }]}>Lift</Text>
              <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{j.has_lift ? "Yes" : "No"}</Text>
            </View>
          ) : null}
          {j.parking_within_20m != null ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
              <Text style={[type.body, { color: colors.slate[500] }]}>Parking within 20m</Text>
              <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>{j.parking_within_20m ? "Yes" : "No"}</Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      {/* What you're moving — the customer's item list */}
      {Array.isArray(j.inventory) && j.inventory.length > 0 ? (
        <Card style={{ marginTop: spacing.base }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm }}>
            <Package size={16} color={colors.primary.DEFAULT} /><Text style={[type.bodySemiBold, { color: colors.slate[700] }]}>What you&apos;re moving</Text>
          </View>
          {j.inventory.map((it, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
              <Text style={[type.body, { color: colors.slate[700], flex: 1 }]}>{it.label}</Text>
              <Text style={[type.bodySemiBold, { color: colors.slate[900] }]}>×{it.quantity}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {active ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: spacing.lg }}>
          <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
          <Text style={[type.bodySmall, { color: colors.slate[400] }]}>Live tracking on · refreshing automatically</Text>
        </View>
      ) : null}

      {/* Full-screen arrival takeover (Call 4) — GPS detected the driver is at the stop. */}
      <ArrivedModal
        visible={(phase === "at_pickup" || phase === "at_delivery") && !arrivedDismissed}
        leg={phase === "at_delivery" ? "delivery" : "pickup"}
        customerName={customerShortName(j.customer?.full_name)}
        onConfirm={() => {
          setArrivedDismissed(true);
          router.push(`/job/${j.id}/${phase === "at_delivery" ? "delivery" : "pickup"}`);
        }}
        onDismiss={() => setArrivedDismissed(true)}
      />
    </Screen>
  );
}

/** A pickup / delivery address row with a big Directions button. */
function AddressCard({ kind, address }: { kind: "pickup" | "delivery"; address?: Address | null }) {
  if (!address) return null;
  const isPickup = kind === "pickup";
  const color = isPickup ? colors.primary.DEFAULT : colors.accent.DEFAULT;
  return (
    <Card style={{ marginTop: spacing.base }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm }}>
        {isPickup ? <MapPin size={18} color={color} /> : <Home size={18} color={color} />}
        <Text style={[type.label, { color }]}>{isPickup ? "Pick up" : "Drop off"}</Text>
      </View>
      <Text style={[type.bodyLarge, { color: colors.slate[700] }]}>{fullAddress(address)}</Text>
      <Text style={[type.h2, { color: colors.slate[900], marginTop: 4, marginBottom: spacing.md, fontFamily: type.mono.fontFamily }]}>{address.postcode ?? "—"}</Text>
      <Button label="Get directions" variant={isPickup ? "primary" : "accent"} icon={<Navigation size={18} color={colors.white} />} onPress={() => Linking.openURL(directionsUrl(address))} fullWidth />
    </Card>
  );
}

/** The chain-of-custody action panel — exactly one primary action per phase. */
function JourneyPanel({
  job, phase, busy, onStart, onArrived, onConfirmPickup, onConfirmDelivery, onComplete,
}: {
  job: Job; phase: JourneyPhase; busy: boolean;
  onStart: (leg: "pickup" | "delivery") => void;
  onArrived: (leg: "pickup" | "delivery") => void;
  onConfirmPickup: () => void; onConfirmDelivery: () => void; onComplete: () => void;
}) {
  const eta = currentEta(job);
  const mins = minutesUntil(eta);

  const Wrap = ({ accent, children }: { accent: string; children: React.ReactNode }) => (
    <Card accent={accent}>{children}</Card>
  );

  if (phase === "completed") {
    return (
      <Wrap accent={colors.accent.DEFAULT}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <CheckCircle2 size={28} color={colors.accent.DEFAULT} />
          <View style={{ flex: 1 }}>
            <Text style={[type.h3, { color: colors.slate[900] }]}>Job completed</Text>
            <Text style={[type.body, { color: colors.slate[500] }]}>Invoice has been triggered for the office.</Text>
          </View>
        </View>
      </Wrap>
    );
  }

  if (phase === "to_pickup") {
    return (
      <Wrap accent={colors.primary.DEFAULT}>
        <Text style={[type.h3, { color: colors.slate[900], marginBottom: 4 }]}>Ready to go?</Text>
        <Text style={[type.body, { color: colors.slate[500], marginBottom: spacing.md }]}>Start the journey to pickup — we&apos;ll keep the customer updated with live ETAs.</Text>
        <Button label="Start journey to pickup" icon={<Play size={18} color={colors.white} />} loading={busy} onPress={() => onStart("pickup")} fullWidth />
      </Wrap>
    );
  }

  if (phase === "enroute_pickup" || phase === "enroute_delivery") {
    const leg = phase === "enroute_pickup" ? "pickup" : "delivery";
    return (
      <Wrap accent={colors.blue.DEFAULT}>
        <Text style={[type.label, { color: colors.blue.DEFAULT }]}>{leg === "pickup" ? "En route to pickup" : "En route to delivery"}</Text>
        <Text style={[type.display, { color: colors.slate[900], marginTop: 4 }]}>{mins != null ? (mins <= 1 ? "Arriving" : `${mins} min`) : "On the way"}</Text>
        <Text style={[type.body, { color: colors.slate[500], marginBottom: spacing.md }]}>The office and customer get automatic 20- and 10-minute alerts. Tap below when you arrive.</Text>
        <Button label="I've arrived" variant="accent" icon={<Flag size={18} color={colors.white} />} loading={busy} onPress={() => onArrived(leg)} fullWidth />
      </Wrap>
    );
  }

  if (phase === "at_pickup") {
    return (
      <Wrap accent={colors.primary.DEFAULT}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Truck size={20} color={colors.primary.DEFAULT} /><Text style={[type.h3, { color: colors.slate[900] }]}>At pickup</Text>
        </View>
        <Text style={[type.body, { color: colors.slate[500], marginBottom: spacing.md }]}>Photograph the load, get the customer&apos;s sign-off, then you&apos;re cleared to drive.</Text>
        <Button label="Confirm pickup" icon={<Package size={18} color={colors.white} />} onPress={onConfirmPickup} fullWidth />
      </Wrap>
    );
  }

  if (phase === "to_delivery") {
    return (
      <Wrap accent={colors.accent.DEFAULT}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <CheckCircle2 size={20} color={colors.accent.DEFAULT} /><Text style={[type.h3, { color: colors.slate[900] }]}>Pickup confirmed</Text>
        </View>
        <Text style={[type.body, { color: colors.slate[500], marginBottom: spacing.md }]}>Head to the delivery address when you&apos;re loaded and ready.</Text>
        <Button label="Start journey to delivery" variant="accent" icon={<Play size={18} color={colors.white} />} loading={busy} onPress={() => onStart("delivery")} fullWidth />
      </Wrap>
    );
  }

  if (phase === "at_delivery") {
    return (
      <Wrap accent={colors.accent.DEFAULT}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Home size={20} color={colors.accent.DEFAULT} /><Text style={[type.h3, { color: colors.slate[900] }]}>At delivery</Text>
        </View>
        <Text style={[type.body, { color: colors.slate[500], marginBottom: spacing.md }]}>Unload, photograph the delivered items and get the final sign-off.</Text>
        <Button label="Confirm delivery" variant="accent" icon={<Package size={18} color={colors.white} />} onPress={onConfirmDelivery} fullWidth />
      </Wrap>
    );
  }

  // ready_to_complete
  return (
    <Wrap accent={colors.accent.DEFAULT}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <CheckCircle2 size={20} color={colors.accent.DEFAULT} /><Text style={[type.h3, { color: colors.slate[900] }]}>Delivery confirmed</Text>
      </View>
      <Text style={[type.body, { color: colors.slate[500], marginBottom: spacing.md }]}>One last step — complete the job to trigger the customer&apos;s invoice.</Text>
      <Button label="Complete job" icon={<Flag size={18} color={colors.white} />} onPress={onComplete} fullWidth />
    </Wrap>
  );
}
