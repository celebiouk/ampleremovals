import type { BrandPageContent } from "@/components/local/multibrand/BrandPageShell";
import type { BrandAboutContent } from "@/components/local/multibrand/BrandAboutPage";
import type { TipArticle } from "@/components/local/multibrand/BrandTipsPages";
import { HeroCtaButtons } from "@/components/local/multibrand/HeroCtaButtons";
import { InstantHourlyQuoteWidget } from "@/components/local/InstantHourlyQuoteWidget";
import { ManyVansFleet } from "@/components/shared/illustrations/ManyVansFleet";
import { BRAND_BY_SLUG } from "@/lib/brands";

const brand = BRAND_BY_SLUG["manyvans"];
const base = {
  accent: brand.colors.accent,
  whatsappNumber: brand.whatsappNumber,
  phone: brand.phone,
  phoneHref: brand.phoneHref,
};

export const manyVansRemovals: BrandPageContent = {
  layout: "bold",
  eyebrow: "Newbury and Thatcham's Removal Fleet",
  h1: "Whatever You're Moving, We Have The Van For It",
  subhead:
    "ManyVans runs a full working fleet across Newbury and Thatcham — small vans for a quick flat move, full-size Lutons for a five-bedroom house, and everything in between. Tell us the job; we already have the right van for it, and a fixed price agreed before you book.",
  trustPoints: ["A fleet sized for every job", "Fixed price, agreed upfront", "Fully insured on every move", "7+ years moving Newbury & Thatcham"],
  storyHeading: "Any van. Any size job. One name you can trust.",
  storyParagraphs: [
    "Most removal companies own one van and hope it fits your move. ManyVans was built the opposite way round: a proper fleet of vans in different sizes, so the vehicle gets matched to your job — not the other way around. A studio flat doesn't need a seven-and-a-half-tonne Luton, and a five-bedroom house shouldn't be squeezed into something too small. We bring the right van, every time.",
    "That fleet covers Newbury and Thatcham as one patch, with the same crew, the same fixed pricing and the same standard of care on either side of the A339. The team behind ManyVans has 7+ years' experience moving homes and businesses across this exact area, so your crew already knows the roads, the parking restrictions, and the tight stairwells before they even arrive.",
    "A fixed price, agreed before you book — not an estimate that grows once the van's loaded. That's the confidence we build our name on, and it's why Newbury and Thatcham households keep coming back to ManyVans.",
  ],
  storyVisual: () => <ManyVansFleet tone="dark" className="mx-auto h-auto w-full max-w-xl" />,
  servicesHeading: "Every service. Every van you could need.",
  services: [
    { title: "House Removals", body: "Full house moves anywhere in Newbury and Thatcham, with the right-sized van sent for the job, not a one-size-fits-all guess.", href: "/" },
    { title: "Man and Van", body: "A mover and a van by the hour for smaller jobs, single items or a flat move — the same fleet, scaled down.", href: "/man-and-van" },
    { title: "House Clearance", body: "Full or partial clearances with a fixed price, cleared efficiently by a crew who know how to pack a van properly.", href: "/house-clearance" },
    { title: "Rubbish Removal", body: "Garden waste, old furniture, a garage clear-out — priced by the hour, no skip hire needed.", href: "/rubbish-removal" },
  ],
  faqHeading: "Removals in Newbury & Thatcham — FAQs",
  faqs: [
    { q: "Do you cover Newbury and Thatcham?", a: "Yes — that's exactly what ManyVans is built for. One booking, one crew, one fixed price, whichever town (or both) your move involves." },
    { q: "How much does a removal cost?", a: "Most 2-3 bedroom moves come in between £250 and £550 depending on size and distance. Get your exact fixed price in under 2 minutes with our free quote tool." },
    { q: "Can you move between Newbury and Thatcham directly?", a: "Yes — it's one of the main reasons ManyVans exists. No extra admin, no border fee, just one straightforward fixed price." },
    { q: "What if my move is bigger or smaller than expected?", a: "That's the whole point of running a fleet — we send the right size van for your job, from a small flat to a large family home." },
    { q: "Are you insured?", a: "Fully insured on every single job, no exceptions, covering your belongings from load to unload." },
    { q: "Do you dismantle and reassemble furniture?", a: "Yes — wardrobes, beds, flat-pack units, anywhere in Newbury or Thatcham. Mention it when you book so we bring the right tools." },
    { q: "Can my move date change?", a: "Yes, with reasonable notice and no fee." },
    { q: "Do you provide boxes and packing materials?", a: "Yes — just ask when you book and we'll have them ready." },
    { q: "What if something gets damaged?", a: "Rare, but covered — we're fully insured and will put it right properly." },
    { q: "Do you charge extra for stairs or a cross-town move?", a: "No hidden fees — access and distance across Newbury and Thatcham are both priced into your fixed quote upfront." },
  ],
  ctaHeading: "Your van is ready. Get your fixed price now.",
  ctaSub: "Under 2 minutes, no obligation.",
  quoteHref: "/booking",
  whatsappMessage: "Hi, I'd like a quote for a house removal (Newbury & Thatcham).",
  heroAction: () => (
    <div>
      <HeroCtaButtons quoteHref="/booking" {...base} whatsappMessage="Hi, I'd like a quote for a house removal (Newbury & Thatcham)." />
    </div>
  ),
};

export const manyVansManAndVan: BrandPageContent = {
  layout: "bold",
  eyebrow: "Man and Van — Newbury & Thatcham",
  h1: "Need A Van Fast? We've Got One Spare.",
  subhead:
    "A mover and a van by the hour, ready across Newbury and Thatcham — perfect for a single sofa, a flat move, or a job that doesn't need the full fleet. Same honest pricing, same fully insured crew, scaled to the size of your job.",
  trustPoints: ["£45/hr — 1 man and van", "£75/hr — 2 men and van", "2-hour minimum", "Covers Newbury & Thatcham"],
  storyHeading: "The right van, by the hour, whenever you need it",
  storyParagraphs: [
    "Not every job needs a full removal booked out for the day. A single sofa, a flat-pack wardrobe, a studio flat near either town centre — our Man and Van service covers all of it, in Newbury, Thatcham, or a job that runs between the two, because there's always a van free from our fleet to send.",
    "One man and a van is £45/hr; two men and a van (for stairs, heavier furniture, or multiple rooms) is £75/hr. There's a 2-hour minimum, and after that you only pay for the time the job actually takes.",
    "Same fixed-pricing honesty and full insurance as our removals service — just scaled to a smaller job, wherever in Newbury or Thatcham it is.",
  ],
  storyVisual: () => <ManyVansFleet tone="dark" className="mx-auto h-auto w-full max-w-xl" />,
  servicesHeading: "Other ways we can help",
  services: [
    { title: "Full House Removals", body: "Moving an entire home across Newbury or Thatcham? Our full fleet fits better.", href: "/" },
    { title: "House Clearance", body: "Clearing a property instead of moving it? Get a fixed price from photos.", href: "/house-clearance" },
    { title: "Rubbish Removal", body: "Just rubbish to shift, not furniture to move? Get an instant price by the hour.", href: "/rubbish-removal" },
    { title: "Call Us Direct", body: "Tell us about the job and we'll send the right van for it.", href: brand.phoneHref },
  ],
  faqHeading: "Man and Van — FAQs",
  faqs: [
    { q: "Does this cover Newbury and Thatcham?", a: "Yes, Newbury and Thatcham and everywhere between — it's the whole point of ManyVans." },
    { q: "1 man or 2?", a: "1 man and van (£45/hr) suits light items with easy access. 2 men and van (£75/hr) is the better call for stairs, heavier furniture, or several rooms." },
    { q: "Minimum booking?", a: "2 hours, which covers the vast majority of single-item and small-flat jobs." },
    { q: "What van size do you use?", a: "Whatever size the job needs — we run a fleet, so a small job gets a small van and a bigger job gets a bigger one, not a one-size guess." },
    { q: "Does the clock start before you arrive?", a: "No — billing starts when the crew arrives and starts working." },
    { q: "Can you help move a single large item, like a sofa?", a: "Yes, that's exactly what this service is for, anywhere in Newbury or Thatcham." },
  ],
  ctaHeading: "Book your Man and Van slot",
  ctaSub: "Pick your hours, get an instant price.",
  quoteHref: "/booking/man-and-van",
  whatsappMessage: "Hi, I'd like a quote for Man and Van (Newbury & Thatcham).",
  heroAction: () => (
    <div>
      <HeroCtaButtons quoteHref="/booking/man-and-van" {...base} whatsappMessage="Hi, I'd like a quote for Man and Van (Newbury & Thatcham)." />
    </div>
  ),
};

export const manyVansHouseClearance: BrandPageContent = {
  layout: "bold",
  eyebrow: "House Clearance — Newbury & Thatcham",
  h1: "Any Clearance, Any Size, One Fixed Price",
  subhead:
    "Probate, rental turnarounds, downsizing, hoarding — whatever the scale, our fleet means we never turn up under-prepared. Send a few photos and get a fair fixed price for a clearance anywhere in Newbury or Thatcham.",
  trustPoints: ["Fixed price from photos", "1-hour minimum job", "Responsible disposal", "Covers Newbury & Thatcham"],
  storyHeading: "Cleared properly, wherever you are, whatever the size",
  storyParagraphs: [
    "A clearance is rarely just logistics — it's often a bereavement, a tenancy ending, or years of belongings that need sorting with care. Because we run a full fleet, a single-room clearance and a whole-house clearance both get the right-sized van sent out, so nothing is rushed and nothing is left behind for a second trip.",
    "We handle every clearance across Newbury and Thatcham the same way: no rushing, no judgement, and anything that can be donated or recycled responsibly is. Pick your hours below for an instant estimate on straightforward jobs, or send photos for a fair fixed price on anything bigger. The price quoted is the price paid — in either town.",
  ],
  storyVisual: () => <ManyVansFleet tone="dark" className="mx-auto h-auto w-full max-w-xl" />,
  servicesHeading: "Other ways we can help",
  services: [
    { title: "Full House Removals", body: "Moving house too? We handle the move and the clearance, across Newbury and Thatcham.", href: "/" },
    { title: "Man and Van", body: "Just a few items? Man and Van by the hour, covering Newbury and Thatcham.", href: "/man-and-van" },
    { title: "Rubbish Removal", body: "Just rubbish, not a full clearance? Get an instant price by the hour.", href: "/rubbish-removal" },
    { title: "Call Us Direct", body: "Describe the job and we'll send the right van for it.", href: brand.phoneHref },
  ],
  faqHeading: "House Clearance — FAQs",
  faqs: [
    { q: "Does this cover Newbury and Thatcham?", a: "Yes — Newbury, Thatcham, and everywhere between." },
    { q: "How does pricing work?", a: "Pick your hours below for an instant price on straightforward jobs, or send photos for a fixed price on anything bigger." },
    { q: "Where do cleared items go?", a: "Wherever possible, donated or recycled rather than binned — disposed of responsibly in line with waste regulations." },
    { q: "Do you clear garages, sheds and lofts?", a: "Yes — every part of the property, in either town." },
    { q: "How long does a clearance take?", a: "Most single rooms are same day; a full house usually a day, occasionally two for a very full property — our fleet means we can send extra capacity if the job runs bigger than expected." },
    { q: "Do you handle probate clearances?", a: "Yes, regularly, working sensitively at whatever pace the family needs." },
  ],
  ctaHeading: "Get your fixed clearance price",
  ctaSub: "Instant estimate below, or send photos for a bigger job.",
  quoteHref: "#get-price",
  whatsappMessage: "Hi, I'd like a quote for a house clearance (Newbury & Thatcham).",
  heroAction: () => (
    <div id="get-price" className="max-w-md">
      <InstantHourlyQuoteWidget service="house_clearance" standardRate={45} premiumRate={70} accent="green" minHours={1} allowFixedPrice />
    </div>
  ),
};

export const manyVansRubbishRemoval: BrandPageContent = {
  layout: "bold",
  eyebrow: "Rubbish Removal — Newbury & Thatcham",
  h1: "Rubbish Gone Today, Whichever Town You're In",
  subhead:
    "Garden waste, old furniture, a garage or loft clear-out — pick your hours below for an instant price, no skip hire and no days waiting for a collection slot, anywhere in Newbury or Thatcham.",
  trustPoints: ["Instant hourly price", "1-hour minimum job", "Responsible disposal", "Covers Newbury & Thatcham"],
  storyHeading: "Rubbish gone, without the skip-hire wait",
  storyParagraphs: [
    "A skip means booking it, maybe a road permit, and days with it sitting outside before collection. Because we run a fleet, we do the same job in one visit: tell us roughly what's going, pick your hours below, and a crew turns up, loads it, and takes it away there and then — in Newbury, Thatcham, or a job spanning both.",
    "Garden waste, old furniture, a garage or shed clear-out, small amounts of builder's waste — priced by the hour with a 1-hour minimum, and wherever possible recycled or donated rather than sent straight to landfill.",
  ],
  storyVisual: () => <ManyVansFleet tone="dark" className="mx-auto h-auto w-full max-w-xl" />,
  servicesHeading: "Other ways we can help",
  services: [
    { title: "Full House Removals", body: "Moving house as well as clearing rubbish? We handle both, across Newbury and Thatcham.", href: "/" },
    { title: "Man and Van", body: "A single item or two to shift instead? Man and Van by the hour.", href: "/man-and-van" },
    { title: "House Clearance", body: "A whole property to clear, not just rubbish? Get a fixed price from photos.", href: "/house-clearance" },
    { title: "Call Us Direct", body: "Describe the job and we'll send the right van for it.", href: brand.phoneHref },
  ],
  faqHeading: "Rubbish Removal — FAQs",
  faqs: [
    { q: "Does this cover Newbury and Thatcham?", a: "Yes — Newbury, Thatcham, and everywhere between." },
    { q: "How is the price worked out?", a: "Pick your hours below for an instant price. For a bigger job, send photos and we'll give you a fixed price instead." },
    { q: "Do you take garden waste?", a: "Yes — garden waste, old furniture, general household rubbish, small amounts of builder's waste. Not hazardous materials like asbestos or chemicals." },
    { q: "What happens to what you collect?", a: "Wherever possible it's recycled or donated rather than landfilled — disposed of responsibly in line with waste regulations." },
    { q: "How quickly can you come?", a: "Often same-week, sometimes same-day — call " + brand.phone + " and we'll tell you honestly." },
    { q: "Is there a minimum job?", a: "1 hour minimum, which covers most single-item or small clear-out jobs comfortably." },
  ],
  ctaHeading: "Get your rubbish removal price",
  ctaSub: "Instant estimate below, or send photos for a bigger job.",
  quoteHref: "#get-price",
  whatsappMessage: "Hi, I have rubbish to remove (Newbury & Thatcham). Can I send a photo and get a quote?",
  heroAction: () => (
    <div id="get-price" className="max-w-md">
      <InstantHourlyQuoteWidget service="house_clearance" standardRate={45} premiumRate={70} accent="green" minHours={1} allowFixedPrice />
    </div>
  ),
};

export const manyVansAbout: BrandAboutContent = {
  h1: "A Van Ready When You Are — Newbury & Thatcham",
  intro: "ManyVans exists because one van was never going to be enough. We built a fleet instead.",
  paragraphs: [
    "We're based at 20 Market Street, Newbury, and built specifically to cover Newbury and Thatcham properly, with a working fleet of vans in different sizes so the vehicle gets matched to your job — not the other way around. The team behind ManyVans has 7+ years' experience moving homes and businesses across exactly this patch, either side of the A339.",
    "That means whether your move starts in Speen and ends in Cold Ash, or stays entirely within one town, you're getting a crew that already knows the roads, the parking, and the buildings — and a van from the fleet sized correctly for the job, not a driver guessing their way around with whatever happened to be free that day.",
    "A fixed price, agreed before you book, is the whole deal. No creeping extras once the van's loaded, no separate pricing structure depending on which side of the boundary your move happens to fall, and no apologising for sending the wrong-sized vehicle — because we always have another one ready.",
  ],
  visual: () => <ManyVansFleet tone="dark" className="mx-auto h-auto w-full max-w-xl" />,
  values: [
    { title: "A fleet, not one van", body: "Small jobs get a small van, big jobs get a big one — Newbury and Thatcham, equally, every time." },
    { title: "Fixed price, no surprises", body: "Stairs, distance and access all priced in upfront, wherever the move happens." },
    { title: "One crew, one standard", body: "The same care and the same pricing honesty, whichever side of the A339 you're on." },
  ],
  quoteHref: "/booking",
  whatsappMessage: "Hi, I'd like to know more about ManyVans.",
};

export const manyVansTips: TipArticle[] = [
  {
    slug: "man-and-van-vs-full-removal-which-do-you-need",
    title: "Man and Van vs Full Removal: Which Do You Actually Need?",
    excerpt: "A straight answer to the question we get asked constantly, covering Newbury and Thatcham moves.",
    readingTime: "3 min read",
    publishedAt: "1 November 2026",
    sections: [
      {
        paragraphs: [
          "This is probably the single most common question we get, and the honest answer is: it depends on volume, not on how it feels. Here's the actual rule of thumb.",
        ],
      },
      {
        heading: "When Man and Van is the right call",
        paragraphs: [
          "If what you're moving fits comfortably in a long-wheelbase Luton van with room to spare — a studio or one-bed flat, a handful of large items, a single room — Man and Van is almost always cheaper and faster to book. It's priced by the hour (£45/hr for one man, £75/hr for two), with a 2-hour minimum, so small jobs stay small on the invoice too.",
        ],
      },
      {
        heading: "When a Full Removal makes more sense",
        paragraphs: [
          "Once you're looking at a 2-bed house or larger, or multiple rooms' worth of furniture, a full removal with a fixed price quoted upfront is usually the better value — you're not paying hourly for a job that's going to run long regardless, and you get a dedicated crew sized for the job rather than stretching a smaller booking to cover it.",
        ],
      },
      {
        heading: "Still not sure?",
        paragraphs: [
          "Call us and describe what you're moving — we'll tell you honestly which service actually suits the job, even if it means quoting you the cheaper option. Covers Newbury, Thatcham, or a move between the two.",
        ],
      },
    ],
  },
  {
    slug: "house-clearance-before-a-move-keep-donate-bin",
    title: "House Clearance Before a Move: What to Keep, Donate, or Bin",
    excerpt: "A simple framework for deciding what comes with you and what doesn't — before moving day, not during it.",
    readingTime: "4 min read",
    publishedAt: "31 October 2026",
    sections: [
      {
        paragraphs: [
          "Every move is a natural moment to clear things out, but deciding what to keep under time pressure usually means everything gets kept \"just in case.\" A simple framework fixes that.",
        ],
      },
      {
        heading: "The 12-month test",
        paragraphs: [
          "If you haven't used or worn it in the last 12 months, and it's not seasonal or sentimental, it's a strong candidate to go. This one rule clears more clutter than any other single decision you'll make.",
        ],
      },
      {
        heading: "Keep: things with real, specific use",
        paragraphs: [
          "Items you use regularly, seasonal things that genuinely rotate back into use (winter coats, Christmas decorations), and anything irreplaceable or sentimental. Everything else goes through the next two filters.",
        ],
      },
      {
        heading: "Donate: good condition, no use left for you",
        paragraphs: [
          "Furniture, clothes, books and electronics in decent condition that you simply don't need any more are far better donated than binned — charity shops and local reuse schemes in Newbury and Thatcham will usually collect larger items for free.",
        ],
      },
      {
        heading: "Bin or clear: broken, expired, or beyond saving",
        paragraphs: [
          "Anything genuinely broken, expired, or not worth anyone's time to take on. If there's more of this than you expected, a house clearance before moving day — rather than trying to move it and deal with it later — almost always works out cheaper and less stressful. We cover clearances across Newbury and Thatcham with a fixed price from a few photos.",
        ],
      },
    ],
  },
  {
    slug: "same-day-man-and-van-what-it-actually-means",
    title: "Same-Day Man and Van: What \"Same Day\" Actually Means in Newbury & Thatcham",
    excerpt: "Plenty of sites advertise same-day man and van. Fewer explain what that actually depends on. Here's the honest version.",
    readingTime: "4 min read",
    publishedAt: "3 November 2026",
    sections: [
      {
        paragraphs: [
          "\"Same-day man and van\" gets advertised everywhere. It's almost never explained. So here's the straight version: what actually decides whether we can get to you today, and what doesn't. No vague \"subject to availability\" small print, no quote form that leaves you waiting on an email reply. Just the real mechanics behind the yes or no.",
        ],
      },
      {
        heading: "What decides it: a free van, not a free day",
        paragraphs: [
          "Same-day isn't about whether it's Tuesday or Saturday. It's about whether a van from the fleet is sitting free at the right time. Mornings are the best bet — call before 10am and odds are good. Afternoons work too, if something's just wrapped up nearby. Evenings are tighter, but not impossible. The honest answer every time: call, tell us what's moving and where, and we'll say yes or no straight away. No \"let us check and call you back.\"",
        ],
      },
      {
        heading: "What makes same-day easier",
        paragraphs: [
          "Small jobs move faster through the day than big ones — a sofa or a single room slots into a gap between other bookings far easier than a full flat. Ready-to-go also matters more than people think: if it's boxed, dismantled where needed, and sitting by the door, a same-day job can start the second the van arrives instead of losing the first 40 minutes to packing. And flexibility on exact timing helps — \"anytime after 11\" gets you fitted in a lot easier than \"exactly 2pm or nothing.\"",
        ],
      },
      {
        heading: "What makes it harder",
        paragraphs: [
          "A full house on short notice is the hardest same-day ask there is — not because we won't try, but because a proper fleet-sized job genuinely needs planning, the right van, sometimes a second crew. If that's your situation, we'll tell you straight whether today's realistic or whether tomorrow gets you a better job done properly. Parking restrictions sprung on us last-minute don't help either — a permit zone we don't know about costs real time on the day.",
        ],
      },
      {
        heading: "A realistic Tuesday",
        paragraphs: [
          "8am: a one-bed flat clearance near the station finishes early, van's free by 10. 10:15am: your call comes in — a sofa and a few boxes across town, two hours tops. 10:30am: you're booked for 11. That's not a best-case scenario, that's a fairly ordinary gap in the day. The jobs that don't fit neatly like that are the bigger ones — which is exactly why small, specific requests get the fastest yes.",
        ],
      },
      {
        heading: "Does same-day cost more?",
        paragraphs: [
          "No surcharge for booking today instead of next week. Same £45/hr for one driver, £75/hr for two, same 2-hour minimum. Some companies quietly add a last-minute premium — we don't. The price is the price, whenever you call. The only thing same-day changes is availability, not the rate.",
        ],
      },
      {
        heading: "The job we get asked for most, same-day",
        paragraphs: [
          "Tenancy turnaround. Keys handed back at midday, new tenants moving in that evening, and a tenant who left it later than planned. One room, maybe two, usually a bed and a sofa and a dozen bags. That's a textbook same-day Man and Van job — small, specific, and exactly the kind of thing that slots into a gap in the schedule. Students at the end of term run the same pattern, just with more of them calling on the same day. Book the earliest slot you can get, and it almost always gets sorted.",
        ],
      },
      {
        heading: "Why a fleet beats a single van",
        paragraphs: [
          "One-van companies hit a hard wall on same-day requests: if their one van's out, that's it, full stop, call someone else. A fleet doesn't work like that. We're not checking one driver's diary — we're checking every van we run, across both towns, for the exact window you need. More vans in play means more chances one's free when you call. That's the whole mechanical reason \"same-day\" means something different here than it does from a one-man operation — it's not a sales line, it's just how the maths of running several vans instead of one actually works out in your favour.",
        ],
      },
      {
        heading: "When we'll say no",
        paragraphs: [
          "Straight talk: sometimes the honest answer is \"not today.\" A full house on four hours' notice, every van already out, a job that genuinely needs two crews when we've only got one free — we'd rather tell you that upfront than overpromise and let you down at 4pm with half your flat still packed. What you get instead is a straight answer and, usually, the earliest slot that actually works, even if that's first thing tomorrow instead of this afternoon. A company that always says yes isn't being honest with you, and an overbooked job on moving day is worse than a straight \"no\" on the phone.",
        ],
      },
      {
        heading: "What to have ready when you call",
        paragraphs: [
          "Speeds everything up. Have the postcode you're moving from and to. Know roughly what's moving — \"a sofa and six boxes\" gets you a faster answer than \"not much really.\" Mention stairs, lifts, or parking restrictions straight away, not halfway through the call. And know your earliest and latest acceptable time — \"anytime today\" is easy to slot in, \"exactly 3pm\" is harder. Ninety seconds of detail gets you a real answer instead of a guess.",
        ],
      },
      {
        heading: "Newbury or Thatcham — same fleet, same answer",
        paragraphs: [
          "Doesn't matter which side of the A339 you're on. One fleet covers both towns, so a same-day call gets checked against every van we've got, not just whichever's nearest. Single item, student move-out, last-minute flat clearance before new tenants arrive — this is exactly the kind of job [Man and Van](/man-and-van) was built for, and same-day is the normal way most of it gets booked, not the exception.",
        ],
      },
      {
        heading: "Bottom line",
        paragraphs: [
          "Don't guess. Call " + brand.phone + ", tell us what and where, and you'll know within a minute whether today's on. That's faster than most sites' online quote forms anyway.",
        ],
      },
    ],
  },
  {
    slug: "skip-hire-vs-house-clearance-newbury-thatcham",
    title: "Skip Hire vs a House Clearance Company: Which Is Actually Cheaper in Newbury & Thatcham",
    excerpt: "The honest maths on skip hire vs a clearance crew — including the costs the skip hire calculators conveniently leave out.",
    readingTime: "5 min read",
    publishedAt: "8 November 2026",
    sections: [
      {
        paragraphs: [
          "A skip looks cheaper on paper. That's basically the whole pitch — a flat fee, delivered to your drive, fill it yourself. But \"cheaper on paper\" and \"cheaper in practice\" aren't the same thing, and most skip-hire comparisons conveniently stop adding up costs right where it gets inconvenient for them. Here's the full maths, for Newbury and Thatcham specifically.",
        ],
      },
      {
        heading: "What a skip actually costs once you add the extras",
        paragraphs: [
          "A small skip in this area typically runs £150–£250 for a week's hire. Sounds simple — until you add a permit if it's going on the road rather than a private drive (£20–£40 in most Berkshire council areas, and you'll need to apply ahead of time), the near-certainty that one skip isn't enough once you actually start filling it, and the fact that some materials — mattresses, fridges, certain electricals — aren't allowed in a standard skip at all and need separate, often paid, collection. Add it up and a \"£180 skip\" job regularly ends closer to £300–£400 by the time it's actually full and gone.",
        ],
      },
      {
        heading: "What a clearance crew costs instead",
        paragraphs: [
          "Across Newbury and Thatcham, a comparable clearance — a garage, a few rooms, a full house — runs roughly in line with the skip-plus-extras total, sometimes less, because it's one fixed price covering everything: labour, disposal, recycling, the lot. No permit to sort, no second skip to order when the first one's full by Wednesday.",
        ],
      },
      {
        heading: "The hidden cost skip-hire calculators never show you",
        paragraphs: [
          "Your own time and your own back. A skip means you're the one carrying everything out to it — up the stairs, through the door, across the drive — on your own schedule, around work and everything else going on. A clearance crew does that part. If your time's worth anything to you at all, and most people's is, that's a real cost a skip-hire price comparison simply never puts a number on.",
        ],
      },
      {
        heading: "When a skip genuinely wins",
        paragraphs: [
          "Garden waste, renovation rubble, and general DIY debris — stuff you're already generating steadily over a week or two rather than clearing all at once. If you want it sitting on the drive so you can keep adding to it as you go, a skip is the right tool. That's a genuinely different job to a house clearance, and it's the one case where a skip usually does come out ahead.",
        ],
      },
      {
        heading: "When a clearance crew wins",
        paragraphs: [
          "Anything that needs doing in one go — a house clearance, a garage that's been a dumping ground for a decade, a full property turnaround before a sale or new tenants move in. One visit, one price, and everything's gone the same day rather than sitting outside for a week. Across Newbury and Thatcham, that's the far more common situation people are actually calling about.",
        ],
      },
      {
        heading: "The real comparison, worked through",
        paragraphs: [
          "Take a full garage clear-out: a medium skip plus permit plus a near-certain second skip for the overflow lands around £350–£450 and takes the better part of a week sitting on your drive. The same garage with a crew from our fleet: a fixed quote from photos, usually £150–£300 depending on volume, done in a single visit, nothing left outside your house for the neighbours to wonder about. Cheaper, faster, and nothing to haul yourself.",
        ],
      },
      {
        heading: "What about recycling — does a skip actually do better?",
        paragraphs: [
          "Not necessarily, and this one surprises people. A general skip gets sorted at a waste transfer station after collection, same as most clearance loads, so the recycling outcome is often similar either way — it comes down to the individual waste company's process, not the container. Where a clearance crew does better is sorting as we go: furniture that's still usable gets set aside for donation on the spot, rather than thrown in alongside everything else and sorted later, if at all.",
        ],
      },
      {
        heading: "What people get wrong about skip permits",
        paragraphs: [
          "The permit itself is cheap — it's the planning most people skip that costs them. Local councils around Newbury and Thatcham generally want a permit applied for in advance, not sorted on the day the skip turns up, and a skip placed on the road without one can get you a fine on top of the permit fee you were trying to avoid paying. Private driveway placement avoids this, but then you're limited to however much drive space you've actually got free, which for a lot of houses here is 'not much.' Factor in the few days a permit application can take to clear, and a skip booked for 'this weekend' sometimes turns into a skip booked for next weekend instead.",
        ],
      },
      {
        heading: "The bit the price comparisons leave out entirely",
        paragraphs: [
          "A skip sitting outside for a week is also a week of your house looking like it's mid-clearout to every neighbour and passer-by, and a week of remembering to keep adding to it rather than just being done. A crew clearing the same job in one visit means it's handled and gone the same day — which has a value of its own that doesn't show up on either quote, but tends to matter once people actually compare the experience, not just the number.",
        ],
      },
      {
        heading: "Our honest take",
        paragraphs: [
          "If it's ongoing waste you're adding to over time, hire the skip. If it's a one-off clear-out — a garage, a house, a job you want finished today, not spread over a week — a [house clearance](/house-clearance) booked with us almost always works out cheaper once you count the permit, the second skip, and your own time properly. We'll give you a fixed price from a few photos before you decide either way, covering Newbury and Thatcham the same day you call.",
        ],
      },
    ],
  },
];
