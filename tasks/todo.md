## Task: Phase 4B — World-Class CRM Upgrade

### Context
Phase 4 ✅ — Admin dashboard with CRM basics built
Phase 4B (THIS) — Full redesign + Kanban + Calendar + Automations + Realtime

### New packages installed
- cmdk@1.1.1 (command palette)
- @dnd-kit/core@6.3.1 + @dnd-kit/sortable@10.0.0 (kanban)
- papaparse@5.5.3 (CSV export)

### Database migrations required (run in Supabase SQL editor)
See: supabase/migrations/phase4b.sql

### Plan
- [x] Install packages
- [x] Write plan to tasks/todo.md
- [ ] supabase/migrations/phase4b.sql — all new tables + columns
- [ ] Rebuild AdminShell (dark sidebar, grouped nav, collapse, badge)
- [ ] Build AdminTopBar (breadcrumb, command palette trigger, notifications, quick add)
- [ ] Build CommandPalette component (cmdk, ⌘K)
- [ ] Build NotificationCentre component (slide-in panel)
- [ ] Rebuild dashboard page (KPI cards, charts, activity feed, upcoming jobs)
- [ ] Build lib/realtime.ts helper
- [ ] Build Kanban pipeline page (/admin/pipeline) with @dnd-kit
- [ ] Enhance booking detail page (pipeline tracker, quick actions, lead score, flag, inline edit, related bookings)
- [ ] Build lib/automation-templates.ts with renderTemplate()
- [ ] Build app/api/cron/automations/route.ts (secured cron)
- [ ] Build automations management page (/admin/automations)
- [ ] Build calendar page (/admin/calendar) — simplified without FullCalendar
- [ ] Build payments page (/admin/payments) with CSV export
- [ ] Build settings page (/admin/settings) with 4 tabs
- [ ] Add vercel.json cron config
- [ ] Page transition animations (Framer Motion)
- [ ] tsc --noEmit clean
- [ ] tasks/lessons.md updated
- [ ] Git push (multiple commits throughout)

### Architecture decisions
- FullCalendar skipped (heavy dep) — using custom calendar built with date-fns
- Realtime via Supabase client channels
- Sidebar state persisted in localStorage
- Command palette uses cmdk library
- Kanban uses @dnd-kit (lighter than react-beautiful-dnd)

### Review
(to fill in on completion)
