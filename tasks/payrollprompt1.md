# Payroll — Source Prompt 1
> Saved verbatim. This is the design + build standard the payroll feature must meet.

---

BEFORE WRITING A SINGLE LINE OF CODE — STOP AND READ EVERYTHING FIRST.

Read in this exact order:
1. CLAUDE.md
2. ADMIN_MOBILE_APP.md
3. tasks/todo.md
4. tasks/lessons.md
5. /mnt/skills/public/frontend-design/SKILL.md

Then do the following before touching any component:
  - Open and read every file in app/(admin)/**
  - Open and read components/shared/Navbar.tsx
  - Open and read globals.css
  - Open and read tailwind.config.ts
  - Study the exact purple and green values used throughout
  - Study the card styles, shadow levels, border radii,
    typography scale, spacing rhythm, and animation patterns
    used in the existing web platform and admin dashboard
  - Note every design decision that makes the web version
    feel premium and replicate that energy in mobile form

You are not a code generator.
You are a senior principal product designer with 30 years at Apple
and 20 years at Google. You have designed iOS, Android, watchOS,
and every major Google product. You have won every design award
that exists. You have forgotten more about mobile UX than most
people will ever learn.

You are also the engineer building what you design.
Every pixel you place is intentional.
Every interaction is considered.
Every animation has a purpose.
There are no accidents in your work.

==============================================================
THE BRAND — MEMORISE THIS BEFORE YOU DESIGN ANYTHING
==============================================================

PRIMARY COLOUR: Purple
  Web values from the codebase:
  purple-800: #6b21a8  ← PRIMARY — the soul of this brand
  purple-700: #7e22ce
  purple-600: #9333ea
  purple-500: #a855f7
  purple-50:  #faf5ff  ← surface tints

SECONDARY COLOUR: Green
  green-600: #16a34a  ← ACCENT — confirms, celebrates, succeeds
  green-500: #22c55e
  green-400: #4ade80
  green-50:  #f0fdf4  ← success tints

BASE: White #ffffff — the canvas everything lives on
DARK SURFACES: Used sparingly — #0f172a, #1e293b for contrast moments
TEXT HIERARCHY:
  Primary text: #0f172a (slate-900)
  Secondary text: #475569 (slate-600)
  Muted text: #94a3b8 (slate-400)
  On purple: #ffffff
  On green: #ffffff

TYPOGRAPHY (from the web platform):
  Display / Headings: Syne — geometric, commanding, distinctive
  Body: DM Sans — clean, readable, warm
  Monospace (references, codes): system mono
  In React Native: use custom fonts loaded via expo-font:
    npx expo install expo-font @expo-google-fonts/syne
    npx expo install @expo-google-fonts/dm-sans

LOGO: The company logo uses the purple primary.
  Read the exact logo treatment from the web codebase.
  Replicate it faithfully in the mobile app.
  Never distort, recolour, or approximate the logo.

==============================================================
THE DESIGN PHILOSOPHY — WHAT MAKES THIS APP WORLD CLASS
==============================================================

This app must feel like it was designed by Apple and built by
Google. It must feel MORE premium than the web version, not less.
Mobile is not a downgrade. It is a different canvas that demands
its own excellence.

THE APPLE PRINCIPLES (non-negotiable):
  Clarity: Every element has a clear purpose. If it does not
    serve the user, it does not exist.
  Deference: The UI steps aside and lets content lead.
    Chrome is invisible. Data is the hero.
  Depth: Layering, shadow, and motion create a sense of physical
    space. Cards feel like objects you can pick up.
  Consistency: Every screen feels like it belongs to the same
    family. Same spacing rhythm. Same type scale. Same motion.

THE GOOGLE PRINCIPLES (non-negotiable):
  Material You: Surfaces respond to interaction. Colours shift.
    Buttons react. The UI feels alive and responsive.
  Accessibility: Minimum 44pt touch targets everywhere.
    Contrast ratios that pass WCAG AA at minimum.
    Never sacrifice legibility for aesthetics.
  Performance feel: 60fps everywhere. If an animation drops
    frames, cut it. Instant response on every tap.
    Perceived performance is as important as actual performance.

THE REMOVAL COMPANY CONTEXT:
  Admins using this app are running a real business.
  They are answering calls, managing drivers, chasing invoices.
  They need information fast. They need actions one tap away.
  They cannot afford to be confused by clever design.
  Clarity of function beats cleverness of form — always.

==============================================================
THE DESIGN SYSTEM — BUILD THIS FIRST, USE IT EVERYWHERE
==============================================================
Before building any screens, build the complete design system.
Every screen is assembled from these atomic pieces.
Consistency is not negotiable.

SPACING SCALE (use only these values, nothing else):
  4, 8, 12, 16, 20, 24, 32, 40, 48, 64px
  In React Native: define as constants
    export const spacing = {
      xs: 4, sm: 8, md: 12, base: 16, lg: 20,
      xl: 24, '2xl': 32, '3xl': 40, '4xl': 48, '5xl': 64
    }

BORDER RADIUS SCALE:
  sm: 8px  (tags, chips, small elements)
  md: 12px (inputs, small cards)
  lg: 16px (cards, buttons)
  xl: 20px (modals, sheets, large cards)
  full: 999px (badges, pills, avatars)

SHADOW SCALE (iOS + Android):
  Define a shadow system using both iOS shadowColor/shadowOpacity
  and Android elevation:
  sm:  iOS shadow 0 1 3 rgba(0,0,0,0.1),  Android elevation 2
  md:  iOS shadow 0 4 6 rgba(0,0,0,0.1),  Android elevation 4
  lg:  iOS shadow 0 10 15 rgba(0,0,0,0.1), Android elevation 8
  xl:  iOS shadow 0 20 25 rgba(0,0,0,0.15), Android elevation 16

TYPOGRAPHY SCALE:
  Define using Syne (headings) + DM Sans (body):
  Display: Syne 32px bold        (hero headings)
  H1: Syne 28px bold             (screen titles)
  H2: Syne 22px semibold         (section titles)
  H3: DM Sans 18px semibold      (card titles)
  Body Large: DM Sans 16px regular (primary body)
  Body: DM Sans 14px regular     (secondary body)
  Body Small: DM Sans 12px regular (captions, meta)
  Label: DM Sans 12px semibold uppercase tracking-wide (labels)
  Mono: system mono 14px         (references, codes)
  Mono Large: system mono 20px bold (postcodes, amounts)

Create lib/typography.ts with all text styles as StyleSheet objects.
Use these exclusively — never define font sizes inline.

COLOUR TOKENS:
  Create lib/colors.ts with every colour token used in the app.
  Never use raw hex values in component files.
  Always import from lib/colors.ts.

  export const colors = {
    primary: {
      DEFAULT: '#6b21a8',
      light: '#9333ea',
      lighter: '#a855f7',
      surface: '#faf5ff',
      surfaceMid: '#f3e8ff',
    },
    accent: {
      DEFAULT: '#16a34a',
      light: '#22c55e',
      surface: '#f0fdf4',
    },
    white: '#ffffff',
    dark: {
      DEFAULT: '#0f172a',
      mid: '#1e293b',
      card: '#1e293b',
    },
    slate: {
      900: '#0f172a',
      700: '#334155',
      600: '#475569',
      500: '#64748b',
      400: '#94a3b8',
      300: '#cbd5e1',
      200: '#e2e8f0',
      100: '#f1f5f9',
      50: '#f8fafc',
    },
    status: {
      inquiry: { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' },
      job_completed: { bg: '#dcfce7', text: '#166534', dot: '#16a34a' },
      bad_lead: { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
      deposit_paid_job_confirmed: { bg: '#d1fae5', text: '#065f46', dot: '#059669' },
      processing: { bg: '#e0e7ff', text: '#3730a3', dot: '#4f46e5' },
      pending: { bg: '#fef9c3', text: '#854d0e', dot: '#ca8a04' },
      // ... all other statuses
    }
  }

COMPONENT TOKENS:
  Create lib/tokens.ts for component-level design decisions:
  Card background: colors.white
  Card border: colors.slate[200]
  Screen background: colors.slate[50]
  Input background: colors.white
  Input border default: colors.slate[300]
  Input border focus: colors.primary.DEFAULT
  Input border error: #dc2626
  Tab bar background: colors.white
  Tab bar border: colors.slate[200]
  Tab active: colors.primary.DEFAULT
  Tab inactive: colors.slate[400]
  Bottom sheet handle: colors.slate[300]
  Separator: colors.slate[100]

==============================================================
CORE COMPONENT LIBRARY — THE ATOMS
==============================================================
Every component below must be pixel-perfect before any screen
is built. These are the atoms. Screens are molecules.
A screen built from imperfect atoms will always look imperfect.

------------------------------------------------------------------
Button.tsx — the most used component in the app
------------------------------------------------------------------
VARIANTS:

  Primary (purple):
    Background: colors.primary.DEFAULT (#6b21a8)
    Text: white, DM Sans 16px semibold
    Border radius: 16px
    Height: 52px
    Padding: horizontal 24px
    Active state: scale(0.97) + brightness darker (Reanimated)
    Shadow: md shadow in purple tint
      shadowColor: '#6b21a8', shadowOpacity: 0.3, elevation: 4
    Loading state: white ActivityIndicator replaces label
    Disabled: opacity 0.5, no press feedback

  Secondary (outlined purple):
    Background: transparent
    Border: 2px solid colors.primary.DEFAULT
    Text: colors.primary.DEFAULT, 16px semibold
    Same dimensions as primary
    Active: purple background at 8% opacity

  Accent (green):
    Background: colors.accent.DEFAULT (#16a34a)
    Text: white
    Shadow: green tint shadow
    Used for: confirmations, success actions, "Get Directions"

  Danger (red):
    Background: #dc2626
    Text: white
    Used for: destructive actions only

  Ghost (transparent):
    No background, no border
    Text: colors.primary.DEFAULT
    Active: purple background at 6% opacity
    Used for: secondary actions, cancel buttons

  Icon Button variant:
    Square, 44x44px minimum
    Icon centred
    All same colour variants available

  FAB (Floating Action Button):
    Circle, 56px diameter
    Background: primary or accent
    Large shadow: xl
    Icon: 24px white
    Position: absolute bottom-right on list screens
    Entry animation: scale from 0.8 → 1.0 with spring

------------------------------------------------------------------
Input.tsx
------------------------------------------------------------------
  Label: DM Sans 14px semibold, colors.slate[700], above input
  Container: height 52px, border radius 12px
  Background: white, border 1.5px colors.slate[300]
  Focused: border colors.primary.DEFAULT, subtle purple glow
    (iOS: shadow in purple, Android: purple border brighter)
  Text: DM Sans 16px, colors.slate[900]
  Placeholder: colors.slate[400]
  Error state: border #dc2626, error message below in red
    with AlertCircle icon
  Success state (after valid input): subtle green border
  Leading icon variant (e.g. search icon inside input)
  Trailing icon variant (e.g. eye toggle for password)
  Multiline variant: min height 100px, grows with content

------------------------------------------------------------------
Card.tsx
------------------------------------------------------------------
  Background: white
  Border radius: 20px
  Border: 1px colors.slate[100]
  Shadow: sm
  Padding: 16px default (configurable)
  Pressable variant:
    Active: scale(0.98) + shadow reduces
    Hover (tablet): border purple tint
  Elevation progression:
    Default: shadow sm, no border
    Hover/focused: shadow md, border slate-200
    Active: shadow sm, scale 0.98
    Selected: border 2px primary, bg primary surface

------------------------------------------------------------------
Badge.tsx
------------------------------------------------------------------
  Pill shape (border radius full)
  Padding: horizontal 10px, vertical 4px
  Text: 12px semibold, label case (not uppercase)
  Colour variants matching colors.status tokens
  Dot variant: 8px circle + text side by side
  Size variants: sm (10px text) | md (12px text) | lg (14px text)

------------------------------------------------------------------
Avatar.tsx
------------------------------------------------------------------
  Sizes: sm 32px | md 40px | lg 56px | xl 80px
  Default: shows initials on purple gradient background
  With image: circular image
  With status ring: coloured ring around circle
    (green = active driver, amber = on_leave etc.)
  Initials: DM Sans, semibold, white, proportional to size

------------------------------------------------------------------
ScreenHeader.tsx
------------------------------------------------------------------
  Used on all non-tab stack screens.
  Height: 56px
  Background: white, border bottom 1px colors.slate[100]
  Left: back chevron (ChevronLeft, 24px, primary) + page title
  Title: Syne 18px semibold, slate-900
  Right: optional action (icon button or text button)
  On scroll: adds shadow (md) — use Animated scroll listener

------------------------------------------------------------------
BottomSheet.tsx (wrapper around @gorhom/bottom-sheet)
------------------------------------------------------------------
  Handle: 4px × 40px rounded pill, colors.slate[300], centred
  Background: white
  Border radius: 24px top corners only
  Shadow: xl upward
  Backdrop: semi-transparent black (opacity 0.5)
  Snap points: variable per sheet (30%, 60%, 90%)
  All destructive action sheets: slightly red-tinted handle

------------------------------------------------------------------
Skeleton.tsx
------------------------------------------------------------------
  Animated shimmer using Reanimated:
    LinearGradient (via expo-linear-gradient) that slides
    from left to right repeatedly
    Base colour: colors.slate[100]
    Highlight colour: colors.slate[50]
    Animation: 1.5s loop, smooth easing
  Variants:
    SkeletonText: rounded-full, height 12-16px, variable widths
    SkeletonCard: full card skeleton matching BookingCard shape
    SkeletonAvatar: circle variant
    SkeletonStat: stat card shape

------------------------------------------------------------------
EmptyState.tsx
------------------------------------------------------------------
  Centred vertically and horizontally in container
  Icon: 64px, colors.primary.light (purple-400), Lucide icon
  Title: Syne 20px semibold, slate-900
  Subtitle: DM Sans 14px, slate-500, centred, max-width 280px
  Optional CTA button below (primary variant)
  Subtle purple circle in the background (decorative, 30% opacity)

------------------------------------------------------------------
Toast.tsx (global, rendered in root layout)
------------------------------------------------------------------
  Slides down from top of screen (not bottom)
  Width: screen width minus 32px, centred
  Border radius: 16px
  Shadow: lg
  Minimum height: 52px
  Left accent bar: 4px wide, full height
  Icon on left: CheckCircle2 (success), AlertCircle (error),
    Info (info), AlertTriangle (warning)
  Title: DM Sans 14px semibold
  Subtitle: DM Sans 12px (optional)
  Dismiss: tap anywhere on toast
  Auto-dismiss: 4 seconds
  Success: white background, green accent bar + icon
  Error: white background, red accent bar + icon
  Warning: white background, amber accent bar + icon
  Info: white background, purple accent bar + icon
  Entry animation: translateY(-80) → 0 with spring (Reanimated)
  Exit: translateY(-80) fade out

------------------------------------------------------------------
StatCard.tsx (dashboard KPI cards)
------------------------------------------------------------------
  White card, rounded-2xl, shadow-sm, border slate-100
  Padding: 20px
  Icon: 44x44px rounded-xl, coloured background, icon inside
    (e.g. purple-100 background, purple icon for bookings)
    (e.g. green-100 background, green icon for revenue)
  Value: Syne 28px bold, slate-900
    Animated count-up on mount (useCountUp hook)
  Label: DM Sans 13px, slate-500
  Trend (optional): row of arrow icon + percentage
    Up trend: green arrow + text
    Down trend: red arrow + text
  Sub-label: DM Sans 11px, slate-400

==============================================================
NAVIGATION DESIGN
==============================================================

BOTTOM TAB BAR:
  This is the spine of the entire app. Get it right.

  Design:
    Background: white
    Top border: 1px colors.slate[100]
    Height: 83px (including safe area bottom inset on iPhone)
    Tabs: 5 items

  Active tab indicator:
    NOT just a coloured icon — use a pill background.
    Active tab: small purple pill (32px height, borderRadius full)
      behind the icon. Icon turns purple-800. Label turns purple-800.
    Inactive: icon slate-400, label slate-400.
    Transition: pill slides and scales between tabs (Reanimated layout).
    This is the same pattern as the App Store and Spotify.

  Tab icons: Lucide icons, 24px stroke width 1.8
  Tab labels: DM Sans 11px semibold

  Notification badge:
    Red circle, 18px, white number inside, 10px font
    Position: top-right of icon, offset slightly
    Pulse animation when count > 0 (Reanimated)

NAVIGATION TRANSITIONS:
  Stack push: standard iOS slide right (default)
  Modal presentation: slide up from bottom
  Bottom sheet: spring up
  Tab switch: instant (no animation — this is correct on mobile)

==============================================================
SCREEN-LEVEL DESIGN STANDARDS
==============================================================
Every screen must follow these rules without exception:

BACKGROUND: colors.slate[50] (#f8fafc) — never pure white for full screens.
  Cards sit on this surface and appear to float.

SAFE AREA: Always respect safe area insets.
  Top: under status bar.
  Bottom: above home indicator.
  Never clip content under the notch or home bar.

SCROLL BEHAVIOUR:
  All list screens: FlatList or SectionList (never ScrollView
  for long lists — performance will suffer).
  Pull to refresh: RefreshControl with brand purple tintColor.
  Scroll-to-top: tap status bar (iOS default behaviour).

HEADER PATTERNS:
  Tab screens: large title style (iOS) — title scrolls into nav bar.
    Large title: Syne 32px bold
    Collapsed title: Syne 18px semibold in nav bar
  Stack screens: standard ScreenHeader component (56px, back button).

SECTION HEADERS in lists:
  Sticky section headers: white background, 40px height.
  Text: DM Sans 12px semibold uppercase tracking-wide, slate-500.
  Bottom border: 1px slate-100.

LOADING PATTERNS:
  First load: full skeleton screen (never a spinner on blank white).
  Refetch / pull to refresh: RefreshControl spinner only
    (skeleton on first load only).
  Mutation (button press): button enters loading state.
    Spinner inside button. Button stays full width. Never disappear.
  Inline data (e.g. a count in a badge): show slate-200 skeleton
    pill while loading.

GESTURE PATTERNS:
  Swipe left on list items: reveal action buttons
    (red destructive on far left, primary action nearest to item).
  Swipe down on modal/sheet: dismiss.
  Long press on pipeline cards: trigger action sheet.
  Pinch/zoom: never used in this app.

==============================================================
KEY SCREEN DESIGN SPECS (THE ONES THAT MATTER MOST)
==============================================================

DASHBOARD SCREEN — design intent:
  This screen should feel like a beautiful command centre.
  Not a table of data. A living, breathing overview of the business.

  The greeting banner must feel warm and human:
    "Good morning, Rafael ☀️"
    Dynamic: changes with time of day (morning/afternoon/evening)
    With today's date below in a lighter weight.
    Purple gradient: from #6b21a8 to #9333ea, 140px height.
    White text throughout.
    Subtle wave shape at the bottom (SVG, white, cuts into content).

  KPI cards: 2×2 grid, equal size, white with coloured icon blocks.
    Each card feels like a physical object — shadow + border.
    Numbers count up on mount (0 → actual value in 800ms).

  Recent bookings: horizontal scrollable row of cards above the list.
    Shows 5 most urgent (status = 'inquiry') bookings as compact cards.
    "Fire fighting" section — these need attention NOW.

  Activity feed: each entry has a 32px icon circle on the left
    (coloured by action type), text and time on the right.
    New entries slide in from the top with a spring animation.

BOOKING DETAIL SCREEN — design intent:
  This is where the admin lives. It must be exceptional.

  The visual pipeline tracker at the top:
    Full width, white card, 80px height.
    6 stage circles connected by lines.
    Completed: filled green circle, white checkmark.
    Current: filled purple circle, pulsing ring animation.
    Future: grey outline circle.
    Connecting lines: completed = green, future = slate-200.
    Stage labels: 10px DM Sans below each circle.
    The whole tracker scrolls horizontally on small screens.

  Quick action bar:
    Horizontal scroll of pill buttons:
    [📞 Log Call] [✉ Email] [💬 SMS] [📄 Invoice] [✓ Complete]
    Each pill: 40px height, rounded-full.
    Background: slate-100. Icon + label. Active: purple bg white text.
    Spacing: 8px between pills. Left padding: 16px.

  Section cards:
    Each section (Customer, Booking Details, Assigned Drivers etc.)
    is a white Card.tsx with a section title (H3) and content.
    Section title has a left border accent: 4px purple.
    Sections have consistent 16px padding.
    Divider between sections: 8px gap (background colour shows through).

  Status update bottom sheet:
    Not just a list of options — a visual status selector.
    Current status shown prominently at the top in its colour.
    All other statuses listed as rows:
      Left: coloured dot. Centre: status label. Right: checkmark if current.
    "Update Status" button at bottom: full-width primary button.
    Sheet snaps to 70% of screen height.

PIPELINE (KANBAN) SCREEN — design intent:
  This must feel like a real kanban board, not a list.

  Background: slate-100 (slightly darker than screen default).
  Columns are white cards floating on this background.
  Column header: bold status label, count badge, coloured left border.
  Cards inside columns are compact (no overflow).
  Horizontal scroll indicator: thin purple line at bottom of screen
    (custom scroll indicator — React Native's default is ugly).

DRIVER PROFILE SCREEN — design intent:
  Top section: purple gradient header (120px).
    Driver photo (80px circle) overlapping the gradient and content.
    White name text on gradient. Status badge below name.
    Phone and email as pill buttons (call / email icons).
  Content below: white cards on slate-50 background.
  Pay percentage: displayed with a purple progress bar showing
    the percentage visually (e.g. 40% → bar is 40% filled).

LOGIN SCREEN — design intent:
  This is the first screen an admin sees.
  It sets the tone for the entire app.
  It must be beautiful.

  Full screen purple gradient background:
    from #3b0764 (bottom) to #6b21a8 (middle) to #9333ea (top).
    Subtle SVG pattern overlay at 5% opacity.

  Floating white card:
    Width: screen width minus 32px.
    Border radius: 24px.
    Padding: 32px.
    Shadow: xl.
    Positioned in centre of screen.

  Inside the card:
    Logo mark: purple, 48px, centred at top.
    "Admin Portal" badge: purple-100 background, purple-800 text.
    Headline: "Welcome Back" — Syne 28px bold, slate-900.
    Subtitle: DM Sans 14px, slate-500, centred.
    Inputs: as designed in Input.tsx spec above.
    Sign In button: full width, primary variant, 52px height.
    Forgot password: ghost text link, centred below button.

  The purple gradient background should have a very subtle
  animated gradient shift (slow, 8-second loop, barely noticeable).
  It signals life without being distracting.

==============================================================
MOTION DESIGN PRINCIPLES
==============================================================
Motion is not decoration. Every animation communicates something.

SPRING ANIMATIONS (for interactions that feel physical):
  Use withSpring() from Reanimated.
  Default spring config: { damping: 20, stiffness: 300 }
  Used for: button press, card tap, sheet open, tab switch pill.

TIMING ANIMATIONS (for state changes):
  Use withTiming() from Reanimated.
  Fast: 150ms easeOut — for immediate responses (button active state)
  Normal: 250ms easeInOut — for transitions (screen enter)
  Slow: 400ms easeInOut — for large movements (sheet opening)

ENTER ANIMATIONS for list items:
  FadeInDown from Reanimated 2 entering prop.
  Stagger: each item 50ms after the previous.
  Only on initial mount — not on re-renders.

NEVER use animation for:
  Tab switches (instant — like all great apps)
  Loading state changes (just switch states immediately)
  Network error appearances (they need to be seen immediately)

==============================================================
ACCESSIBILITY STANDARDS (NON-NEGOTIABLE)
==============================================================
  Minimum touch target: 44×44pt on every tappable element.
  Colour contrast: WCAG AA (4.5:1 for normal text, 3:1 for large).
  Never rely on colour alone to convey meaning (always pair with
    an icon or text label).
  All images: accessibilityLabel describing the image.
  All interactive elements: accessibilityRole and accessibilityLabel.
  Dynamic text sizing: respect system font size preferences.
  Reduce motion: check AccessibilityInfo.isReduceMotionEnabled()
    before running decorative animations.

==============================================================
DARK MODE
==============================================================
Support dark mode from the start. Do not retrofit it later.

Dark mode colour overrides:
  Screen background: #0f172a (slate-950)
  Card background: #1e293b (slate-800)
  Card border: #334155 (slate-700)
  Primary text: #f8fafc (slate-50)
  Secondary text: #94a3b8 (slate-400)
  Muted text: #475569 (slate-600)
  Input background: #1e293b
  Input border: #334155
  Tab bar background: #0f172a
  Tab bar border: #1e293b

Brand colours stay the same in dark mode:
  Purple primary: #6b21a8 (unchanged)
  Green accent: #16a34a (unchanged)
  Only surfaces and text adapt.

Use useColorScheme() from React Native.
Create a useTheme() hook that returns the correct token set
based on the current colour scheme.
All components consume colours from useTheme(), never hardcoded.

==============================================================
INSTALL THESE ADDITIONAL PACKAGES FOR THE DESIGN SYSTEM
==============================================================
  npx expo install expo-linear-gradient
  npx expo install expo-haptics
  npx expo install expo-image
  npx expo install @gorhom/bottom-sheet
  npm install react-native-calendars
  npm install @react-native-community/netinfo
  npx expo install expo-font @expo-google-fonts/syne
  npx expo install @expo-google-fonts/dm-sans

Configure fonts in root _layout.tsx:
  const [fontsLoaded] = useFonts({
    'Syne-Regular': Syne_400Regular,
    'Syne-SemiBold': Syne_600SemiBold,
    'Syne-Bold': Syne_700Bold,
    'DM-Sans-Regular': DMSans_400Regular,
    'DM-Sans-Medium': DMSans_500Medium,
    'DM-Sans-SemiBold': DMSans_600SemiBold,
  })
  if (!fontsLoaded) return <SplashScreen />

==============================================================
NOW BUILD THE APP — PHASE BY PHASE
==============================================================
With the design system built and every design decision documented,
proceed to build the app phase by phase as defined in
ADMIN_MOBILE_APP.md.

For EVERY component you build:
  ✓ Use only tokens from lib/colors.ts — never raw hex values
  ✓ Use only sizes from lib/typography.ts — never inline font sizes
  ✓ Use only spacing from the spacing scale — never arbitrary values
  ✓ Respect the border radius scale
  ✓ Apply the correct shadow level
  ✓ Support dark mode via useTheme()
  ✓ Respect safe area insets
  ✓ Minimum 44pt touch targets
  ✓ accessibilityLabel on all interactive elements
  ✓ Check reduce motion before decorative animations

For EVERY screen you build:
  ✓ Slate-50 background (not white)
  ✓ Skeleton on first load (not spinner)
  ✓ Pull to refresh with purple tintColor
  ✓ Empty state when list is empty
  ✓ Error state when request fails
  ✓ Toast feedback on every user action
  ✓ Haptic feedback on primary actions

The standard is: would a senior Apple designer and a senior
Google designer both look at this screen and nod?
If the answer is anything other than an immediate yes, keep going.

Write the plan to tasks/todo.md before writing any code.
Push to Git after every phase.
Update tasks/lessons.md after every correction.

When Phase 1 is complete: confirm in chat, show a screenshot
description of what the login screen and tab bar look like,
then stop and wait for "Next Phase".
