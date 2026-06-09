/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Calendar, MapPin, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";

export type JobsFilterTab = "all" | "upcoming" | "today" | "past";

interface DriverJobsListProps {
  initialTab?: JobsFilterTab;
  title?: string;
  subtitle?: string;
  /** Hide the filter tabs (e.g. on the dedicated Today view). */
  hideTabs?: boolean;
  /** Message shown when there are no jobs for the active filter. */
  emptyMessage?: string;
}

export function DriverJobsList({
  initialTab = "upcoming",
  title = "My Jobs",
  subtitle = "View and manage your assigned jobs",
  hideTabs = false,
  emptyMessage = "No jobs found",
}: DriverJobsListProps) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<JobsFilterTab>(initialTab);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: driver } = await supabase
      .from("drivers")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!driver) return;

    const { data: assignments } = await supabase
      .from("booking_driver_assignments")
      .select(
        `
        *,
        booking:bookings(
          *,
          customer:customers(*),
          origin_address:addresses!origin_address_id(*),
          destination_address:addresses!destination_address_id(*)
        )
      `
      )
      .eq("driver_id", driver.id)
      .order("assigned_at", { ascending: false });

    setJobs(assignments || []);
    setLoading(false);
  }

  const filteredJobs = jobs.filter((assignment) => {
    const booking = assignment.booking;
    if (!booking) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const moveDate = booking.move_date ? new Date(booking.move_date) : null;
    if (moveDate) moveDate.setHours(0, 0, 0, 0);

    switch (activeTab) {
      case "today":
        return moveDate && moveDate.getTime() === today.getTime();
      case "upcoming":
        return moveDate && moveDate >= today;
      case "past":
        return (
          booking.status === "job_completed" || (moveDate && moveDate < today)
        );
      case "all":
      default:
        return true;
    }
  });

  const tabs: Array<{ id: JobsFilterTab; label: string }> = [
    { id: "all", label: "All Jobs" },
    { id: "upcoming", label: "Upcoming" },
    { id: "today", label: "Today" },
    { id: "past", label: "Past" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-slate-600">{subtitle}</p>
      </div>

      {!hideTabs && (
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-brand-purple-600 text-brand-purple-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {filteredJobs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-600">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((assignment) => {
            const booking = assignment.booking;
            const isToday =
              booking.move_date &&
              new Date(booking.move_date).toDateString() ===
                new Date().toDateString();
            const isCompleted = booking.status === "job_completed";

            return (
              <Link
                key={assignment.id}
                href={`/drivers/jobs/${booking.id}`}
                className={`block rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md ${
                  isToday
                    ? "border-l-4 border-l-brand-purple-600"
                    : isCompleted
                    ? "border-l-4 border-l-green-600 opacity-75"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {booking.move_date && (
                        <div
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-medium ${
                            isToday
                              ? "bg-brand-purple-100 text-brand-purple-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <Calendar className="h-4 w-4" />
                          {new Date(booking.move_date).toLocaleDateString("en-GB")}
                        </div>
                      )}
                      <div className="rounded-lg bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                        {booking.service_type?.replace(/_/g, " ").toUpperCase()}
                      </div>
                      {booking.latest_driver_status && (
                        <div className="rounded-lg bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                          {booking.latest_driver_status.replace(/_/g, " ")}
                        </div>
                      )}
                    </div>

                    <div className="mb-2 font-semibold text-slate-900">
                      {booking.customer?.full_name?.split(" ")[0]}{" "}
                      {booking.customer?.full_name?.split(" ")[1]?.[0]}.
                    </div>

                    <div className="space-y-1 text-sm text-slate-600">
                      {booking.origin_address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                          <span>{booking.origin_address.postcode}</span>
                          {booking.destination_address && (
                            <>
                              <span>→</span>
                              <span>{booking.destination_address.postcode}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 font-mono text-xs text-slate-500">
                      {booking.reference}
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
