import type { BrandPageContent } from "@/components/local/multibrand/BrandPageShell";
import type { BrandAboutContent } from "@/components/local/multibrand/BrandAboutPage";
import type { TipArticle } from "@/components/local/multibrand/BrandTipsPages";
import { HeroCtaButtons } from "@/components/local/multibrand/HeroCtaButtons";
import { InstantHourlyQuoteWidget } from "@/components/local/InstantHourlyQuoteWidget";
import { BRAND_BY_SLUG } from "@/lib/brands";

const brand = BRAND_BY_SLUG["newbury-removals"];
const base = {
  accent: brand.colors.accent,
  whatsappNumber: brand.whatsappNumber,
  phone: brand.phone,
  phoneHref: brand.phoneHref,
};

export const newburyRemovalsRemovals: BrandPageContent = {
  layout: "split",
  eyebrow: "Newbury's local removal specialists",
  h1: "House Removals in Newbury, From Local Movers",
  subhead:
    "A fixed price before you book, a crew that actually knows Newbury's one-way systems and awkward parking, and your home moved without the stress. That's Newbury Removals.",
  trustPoints: ["Based at 4 Market Place, Newbury", "Fully insured, every move", "Fixed price, no surprises", "7+ years' moving experience behind the brand"],
  storyHeading: "A Newbury removal company, built by people who already know Newbury",
  storyParagraphs: [
    "Newbury Removals is a dedicated local brand, but the crew behind it has spent 7+ years moving homes and businesses across Newbury and the surrounding villages. We know the racecourse-weekend traffic, the parking permit streets near the town centre, and the new-builds out towards Hambridge Road that always seem to have a lift that's slightly too small.",
    "We quote a fixed price before anything's booked — not an estimate that creeps up on the day. One crew, one van, one invoice, no hidden extras for stairs, distance within the quote, or wrapping your furniture properly. That's just how we move people.",
    "Whether it's a studio flat near the town centre or a 5-bedroom family home out towards Speen, we treat the job with the same level of care — because reputation in a town this size is everything.",
  ],
  servicesHeading: "What we do in Newbury",
  services: [
    { title: "House Removals", body: "Full house moves of any size, anywhere in Newbury and the surrounding area.", href: "/" },
    { title: "Man and Van", body: "A mover and a van by the hour, for smaller jobs and single items.", href: "/man-and-van" },
    { title: "House Clearance", body: "Full or partial clearances with a fair, fixed price from photos.", href: "/house-clearance" },
    { title: "Rubbish Removal", body: "Garden waste, old furniture, a garage clear-out — priced by the hour, no skip hire needed.", href: "/rubbish-removal" },
  ],
  faqHeading: "Removals in Newbury — common questions",
  faqs: [
    { q: "How much does a removal cost in Newbury?", a: "Most 2-3 bedroom moves within Newbury run between £250 and £550, depending on distance and how much you're moving. Use our free quote tool for your exact fixed price in under 2 minutes." },
    { q: "Do you cover villages around Newbury too?", a: "Yes — Speen, Thatcham, Hungerford, Kintbury and the villages around Newbury are all within our normal working area." },
    { q: "Are you insured for the move?", a: "Fully insured on every job, with no exceptions — your belongings are covered the whole way through." },
    { q: "How soon can you move me?", a: "Often within the same week. Call " + brand.phone + " and we'll tell you honestly whether we've got a van free when you need it." },
    { q: "Do you dismantle and reassemble furniture?", a: "Yes — wardrobes, beds, flat-pack units. Mention it when you book so we bring the right tools." },
    { q: "Can I reschedule my move date?", a: "Yes, with reasonable notice and no fee — just let us know as early as you can." },
    { q: "Do you supply boxes and packing materials?", a: "Yes — ask when you book and we'll sort boxes, tape and wrap in advance." },
    { q: "What happens if something's damaged during the move?", a: "It's rare, but you're covered — we're fully insured and will put it right properly, no arguments." },
    { q: "Do you move on race weekends?", a: "Yes, though traffic around the racecourse can be heavier — we plan around it and factor it into timing when we quote you." },
    { q: "Is there an extra charge for stairs or a long carry?", a: "No hidden extras — access is accounted for in your fixed price upfront, not added on the day." },
  ],
  ctaHeading: "Get your fixed price for a Newbury move",
  ctaSub: "Under 2 minutes, no obligation, no pushy follow-up call.",
  quoteHref: "/booking",
  whatsappMessage: "Hi, I'd like a quote for a house removal in Newbury.",
  heroAction: () => <HeroCtaButtons quoteHref="/booking" {...base} whatsappMessage="Hi, I'd like a quote for a house removal in Newbury." />,
};

export const newburyRemovalsManAndVan: BrandPageContent = {
  layout: "split",
  eyebrow: "Man and Van — Newbury",
  h1: "Man and Van in Newbury, By the Hour",
  subhead:
    "One sofa, a single room, a student flat move near the college — not every job needs a full removal crew. Book a mover and a van by the hour instead.",
  trustPoints: ["£45/hr — 1 man and van", "£75/hr — 2 men and van", "2-hour minimum", "Based in Newbury town centre"],
  storyHeading: "The right-sized service for a smaller job",
  storyParagraphs: [
    "A lot of moves in Newbury don't need a full removal team — just a reliable van and someone strong enough to carry a wardrobe down two flights of stairs. That's exactly what our Man and Van service is built for.",
    "One man and a van comes in at £45/hr; if the job needs more muscle — stairs, heavy furniture, multiple rooms — two men and a van is £75/hr. Either way there's a 2-hour minimum, and you only pay for the time the job actually takes beyond that.",
    "Same fixed-pricing honesty and insurance as our full house removals — just scaled to fit a smaller job and a smaller budget.",
  ],
  servicesHeading: "Other ways we can help",
  services: [
    { title: "Full House Removals", body: "Moving an entire home instead? Our full removals service fits better.", href: "/" },
    { title: "House Clearance", body: "Clearing a property rather than moving it? Get a fixed price from photos.", href: "/house-clearance" },
    { title: "Rubbish Removal", body: "Just rubbish to shift, not furniture to move? Get an instant price by the hour.", href: "/rubbish-removal" },
    { title: "Call Us Direct", body: "Not sure which fits your job? Tell us about it and we'll point you the right way.", href: brand.phoneHref },
  ],
  faqHeading: "Man and Van in Newbury — FAQs",
  faqs: [
    { q: "What's the minimum booking length?", a: "2 hours — enough for the vast majority of single-item or small-flat jobs in Newbury." },
    { q: "Should I book 1 man or 2?", a: "1 man and van (£45/hr) suits light items with easy access. 2 men and van (£75/hr) is the better call for stairs, heavy furniture, or several rooms' worth." },
    { q: "Can I get a same-day Man and Van?", a: "Often, yes — being local to Newbury means we can usually find a slot quickly. Call " + brand.phone + " to check availability." },
    { q: "What size van do you use?", a: "A long-wheelbase Luton van — enough for most single-room or flat-share moves." },
    { q: "Is there a call-out charge before the clock starts?", a: "No — you're only billed from when the crew arrives and starts working." },
    { q: "Can you help move just one or two large items?", a: "Yes, that's exactly what this service is built for — most single-item jobs fall within the 2-hour minimum." },
  ],
  ctaHeading: "Book your Man and Van slot",
  ctaSub: "Pick your hours, get an instant price, no waiting on a callback.",
  quoteHref: "/booking/man-and-van",
  whatsappMessage: "Hi, I'd like a quote for Man and Van in Newbury.",
  heroAction: () => <HeroCtaButtons quoteHref="/booking/man-and-van" {...base} whatsappMessage="Hi, I'd like a quote for Man and Van in Newbury." />,
};

export const newburyRemovalsHouseClearance: BrandPageContent = {
  layout: "split",
  eyebrow: "House Clearance — Newbury",
  h1: "House Clearance in Newbury, Fixed Price",
  subhead:
    "Probate, rental turnarounds, downsizing, hoarding — whatever the situation, send a few photos and get a fair fixed price with no awkward home visit required.",
  trustPoints: ["Fixed price from photos", "1-hour minimum job", "Responsible disposal", "Same trusted crew, every job"],
  storyHeading: "Cleared properly, not just emptied",
  storyParagraphs: [
    "A house clearance in Newbury is rarely a simple job logistically — it's often tied to a bereavement, a tenancy ending, or years of belongings that need sorting with care. We handle every clearance with that in mind: no rushing, no judgement, and anything that can be donated or recycled responsibly is, rather than everything going straight to landfill.",
    "Pick your hours below for an instant estimate on straightforward jobs, or send a few photos for a proper fixed price on anything larger — a full house, a loft full of decades of belongings, a probate clearance. The price we quote is the price you pay.",
  ],
  servicesHeading: "Other ways we can help",
  services: [
    { title: "Full House Removals", body: "Moving house as well? We handle both the move and the clearance.", href: "/" },
    { title: "Man and Van", body: "Just a few items, not a full clearance? Man and Van by the hour.", href: "/man-and-van" },
    { title: "Rubbish Removal", body: "Just rubbish, not a full clearance? Get an instant price by the hour.", href: "/rubbish-removal" },
    { title: "Call Us Direct", body: "Describe the job over the phone and we'll point you the right way.", href: brand.phoneHref },
  ],
  faqHeading: "House Clearance in Newbury — FAQs",
  faqs: [
    { q: "How does pricing work?", a: "Pick your hours below for an instant price on straightforward jobs. For anything bigger, send photos and we'll give you a fair fixed price with no visit needed." },
    { q: "Where do cleared items go?", a: "Wherever possible, usable items are donated or recycled rather than binned — we dispose of everything responsibly and in line with waste regulations." },
    { q: "Do you handle probate clearances?", a: "Yes, regularly — working sensitively, at whatever pace the family needs, including liaising with executors or solicitors where it helps." },
    { q: "Do you clear garages, sheds and lofts?", a: "Yes — every part of the property, not just living areas." },
    { q: "How long does a clearance take?", a: "Most single rooms are same day; a full house usually takes a day, occasionally two for a very full property." },
    { q: "Do I need to be there during the clearance?", a: "Not necessarily, provided we've agreed exactly what's being cleared beforehand — common for landlords and executors." },
  ],
  ctaHeading: "Get your fixed clearance price",
  ctaSub: "Instant estimate below, or send photos for a bigger job.",
  quoteHref: "#get-price",
  whatsappMessage: "Hi, I'd like a quote for a house clearance in Newbury.",
  heroAction: () => (
    <div id="get-price" className="max-w-md">
      <InstantHourlyQuoteWidget service="house_clearance" standardRate={45} premiumRate={70} accent="green" minHours={1} allowFixedPrice />
    </div>
  ),
};

export const newburyRemovalsRubbishRemoval: BrandPageContent = {
  layout: "split",
  eyebrow: "Rubbish Removal — Newbury",
  h1: "Rubbish Gone Today, Fixed Price",
  subhead:
    "Garden waste, old furniture, a garage or loft clear-out — pick your hours below for an instant price, no skip hire and no days waiting for a collection slot.",
  trustPoints: ["Instant hourly price", "1-hour minimum job", "Responsible disposal", "Based in Newbury"],
  storyHeading: "Rubbish gone, without the skip-hire wait",
  storyParagraphs: [
    "A skip means booking it, possibly a road permit, and days with it sitting outside before collection. We do the same job in one visit: tell us roughly what's going, pick your hours below, and a crew in Newbury turns up, loads it, and takes it away there and then.",
    "Garden waste, old furniture, a garage or shed clear-out, small amounts of builder's waste — priced by the hour with a 1-hour minimum, and wherever possible recycled or donated rather than sent straight to landfill.",
  ],
  servicesHeading: "Other ways we can help",
  services: [
    { title: "Full House Removals", body: "Moving house as well as clearing rubbish? We handle both.", href: "/" },
    { title: "Man and Van", body: "A single item or two to shift instead? Man and Van by the hour.", href: "/man-and-van" },
    { title: "House Clearance", body: "A whole property to clear, not just rubbish? Get a fixed price from photos.", href: "/house-clearance" },
    { title: "Call Us Direct", body: "Describe the job and we'll tell you honestly what it'll take.", href: brand.phoneHref },
  ],
  faqHeading: "Rubbish Removal in Newbury — FAQs",
  faqs: [
    { q: "How is the price worked out?", a: "Pick your hours below for an instant price. For a bigger job, send photos and we'll give you a fixed price instead." },
    { q: "Do you take garden waste?", a: "Yes — garden waste, old furniture, general household rubbish, small amounts of builder's waste. Not hazardous materials like asbestos or chemicals." },
    { q: "Do I need to be there?", a: "It helps, but if you've told us exactly what's going and left it accessible, we can usually manage without you present." },
    { q: "What happens to what you collect?", a: "Wherever possible it's recycled or donated rather than landfilled — disposed of responsibly in line with waste regulations." },
    { q: "How quickly can you come?", a: "Often same-week, sometimes same-day — call " + brand.phone + " and we'll tell you honestly." },
    { q: "Is there a minimum job?", a: "1 hour minimum, which covers most single-item or small clear-out jobs comfortably." },
  ],
  ctaHeading: "Get your rubbish removal price",
  ctaSub: "Instant estimate below, or send photos for a bigger job.",
  quoteHref: "#get-price",
  whatsappMessage: "Hi, I have rubbish to remove in Newbury. Can I send a photo and get a quote?",
  heroAction: () => (
    <div id="get-price" className="max-w-md">
      <InstantHourlyQuoteWidget service="house_clearance" standardRate={45} premiumRate={70} accent="green" minHours={1} allowFixedPrice />
    </div>
  ),
};

export const newburyRemovalsAbout: BrandAboutContent = {
  h1: "Newbury's Own Removal Specialists",
  intro: "Newbury Removals was built for one town, by people who already knew it inside out.",
  paragraphs: [
    "We're based at 4 Market Place, right in Newbury — not a regional depot with Newbury added to a coverage map after the fact. The team behind Newbury Removals has spent 7+ years moving homes and businesses in and around the town, which means the racecourse-weekend traffic, the permit-parking streets near the centre, and the new-build flats with lifts a touch too small for a sofa are all things we've already planned around before you even call.",
    "We quote a fixed price before anything's booked, and that's the price you pay — not an estimate that grows once the van's loaded. One crew, one van, one invoice, with stairs, distance and awkward access all accounted for up front.",
    "Newbury's a town where word travels — which is exactly why we treat a studio flat move with the same care as a five-bedroom family home. Reputation here is earned one move at a time.",
  ],
  values: [
    { title: "Fixed price, no surprises", body: "Stairs, distance and access are priced in from the start, not added once you've already booked." },
    { title: "Genuinely local", body: "Based at 4 Market Place, Newbury — not a depot elsewhere with the town added to a map." },
    { title: "Care on every job", body: "The same attention to detail whether it's a studio flat or a five-bedroom house." },
  ],
  quoteHref: "/booking",
  whatsappMessage: "Hi, I'd like to know more about Newbury Removals.",
};

export const newburyRemovalsTips: TipArticle[] = [
  {
    slug: "moving-house-in-newbury-race-weekends-and-parking",
    title: "Moving House in Newbury: What to Expect on Race Weekends and Parking Permit Streets",
    excerpt: "The two things that trip up most Newbury moves — timing around the racecourse, and permit parking.",
    readingTime: "4 min read",
    publishedAt: "1 November 2026",
    sections: [
      {
        paragraphs: [
          "Two things catch people out when moving in Newbury more than anything else: race days, and permit parking near the town centre. Neither is a big deal if you plan for it — both can genuinely slow a move down if you don't.",
        ],
      },
      {
        heading: "Race weekends",
        paragraphs: [
          "Newbury Racecourse pulls serious traffic on race days, particularly around the A339 and routes into town. If your move date happens to land on a race day, it's not a reason to panic — it just means we build in extra time for the drive and plan the route around it in advance rather than discovering the queue on the day. Worth mentioning when you book if you know your date coincides.",
        ],
      },
      {
        heading: "Permit parking",
        paragraphs: [
          "Several streets close to the town centre run resident permit schemes, which matters because a removal van needs somewhere legal to park directly outside for the duration of the job. If you're on one of these streets, it's worth checking with the council about a temporary visitor permit or dispensation for moving day — and definitely worth telling us in advance, since it changes how we plan parking and access, not the price you've been quoted.",
        ],
      },
      {
        heading: "The simple fix",
        paragraphs: [
          "Tell us your postcode and move date when you get your quote, and we'll flag anything we already know about that street or that date. It takes thirty seconds and avoids any surprises on the day.",
        ],
      },
    ],
  },
  {
    slug: "how-to-pack-a-house-in-newbury-in-one-weekend",
    title: "How to Pack a House in Newbury in One Weekend (Room-by-Room Guide)",
    excerpt: "A realistic plan for getting a whole house packed in two days, without losing your mind.",
    readingTime: "5 min read",
    publishedAt: "31 October 2026",
    sections: [
      {
        paragraphs: [
          "Packing an entire house in a weekend sounds impossible until you break it down room by room with a plan. Here's the order that actually works, based on what we see go smoothly versus what causes last-minute chaos.",
        ],
      },
      {
        heading: "Saturday morning: the rooms you don't use daily",
        paragraphs: [
          "Start with the spare room, loft, garage and anywhere storing things you won't touch before moving day — decorations, seasonal items, books. There's no downside to packing these first since nothing there is in daily use.",
        ],
      },
      {
        heading: "Saturday afternoon: living areas",
        paragraphs: [
          "Living room and dining room next — ornaments, books, non-essential electronics, anything that isn't the TV you'll watch that evening. Leave one box open and unsealed for last-minute additions.",
        ],
      },
      {
        heading: "Sunday: kitchen and bedrooms last",
        paragraphs: [
          "Kitchen and bedrooms go last because you need them functioning right up until moving day. Pack everything except what you'll use for breakfast and one night's sleep — that goes in a clearly labelled \"last box,\" loaded onto the van last and unloaded first at the other end.",
        ],
      },
      {
        heading: "The one rule that saves everyone's sanity",
        paragraphs: [
          "Label every box with the room it's going to, not a detailed inventory of contents — \"Kitchen\" beats \"mugs, plates, random drawer stuff.\" It means boxes land in the right room straight away instead of cluttering the hallway while you work out where everything goes.",
        ],
      },
    ],
  },
  {
    slug: "man-and-van-newbury-one-driver-or-two",
    title: "Man and Van in Newbury: One Driver or Two? It Changes More Than the Price",
    excerpt: "A proper look at when one mover is genuinely enough, and when paying for a second changes how the job actually goes — by property type, not guesswork.",
    readingTime: "4 min read",
    publishedAt: "3 November 2026",
    sections: [
      {
        paragraphs: [
          "Most people booking Man and Van in Newbury treat the choice between one driver and two as purely a question of budget — £45 an hour against £75. It's a fair instinct, but it's not quite the right question. The size of the crew changes how long the job takes, how carefully things get handled, and whether you end up helping carry a wardrobe down your own stairs. Here's how to get it right by property type, rather than guessing.",
        ],
      },
      {
        heading: "Town-centre terraces and Georgian conversions",
        paragraphs: [
          "A good deal of Newbury's housing near the centre is older — narrower staircases, tighter turns on the landing, doorways that weren't built with modern furniture in mind. One driver can manage a handful of light items here, but anything with real weight — a sofa, a chest of drawers, a double bed frame — genuinely needs two people, not because the item's unusually heavy, but because the geometry of the building makes a solo lift either slow or risky to your walls and banisters. This is the case where the second driver pays for itself in time saved, not just effort.",
        ],
      },
      {
        heading: "New-builds near Hambridge Road",
        paragraphs: [
          "The newer developments out towards Hambridge Road tend to have wider doorways, and often a lift — which genuinely changes the calculation. A one-bedroom flat here with modern, modestly-sized furniture is usually a comfortable job for a single driver, provided there's somewhere legal to park close to the entrance. Where it tips toward two is volume rather than access: if you're moving a full flat's worth of furniture plus several boxes, a second pair of hands shortens the job enough to be worth the extra rate.",
        ],
      },
      {
        heading: "Student and shared flats near the college",
        paragraphs: [
          "Most student moves — a single room, a desk, a bed frame, a handful of boxes — sit comfortably within the 2-hour minimum with one driver, and there's rarely a reason to pay for a second. The exception is move-out day at the end of term, when parking near the college gets genuinely difficult; if that's your situation, mention it when you book so we can plan the timing rather than lose half an hour circling for a space.",
        ],
      },
      {
        heading: "Villages around Newbury — Speen, Hungerford, Kintbury",
        paragraphs: [
          "Outside the town itself, access tends to be easier — more driveways, fewer parking restrictions — but distances between rooms and the van can be longer, particularly in older farmhouse-style properties. Here the decision comes down less to the building and more to volume: a single large item still suits one driver, but a proper clearout of a family home is worth the second pair of hands even if the access itself is straightforward.",
        ],
      },
      {
        heading: "What the second driver buys you, beyond speed",
        paragraphs: [
          "It's tempting to think of the second person purely as extra muscle, but the actual benefit is more specific than that. With two people, one can steady a piece of furniture round a tight corner while the other guides it — the kind of manoeuvre that, done solo, risks a scraped door frame or a dropped corner on a stair edge. It also changes the pace: a single driver working alone has to put items down, walk back, and start again, where two people moving in sequence barely stop. For anything you'd genuinely mind if it got marked or dented, that difference in handling is worth more than the extra £30 an hour suggests.",
        ],
      },
      {
        heading: "The cost comparison in practice",
        paragraphs: [
          "Take a one-bedroom flat near the town centre with a flight of stairs — bed, sofa, a chest of drawers, a dozen boxes. One driver alone would likely take 4-5 hours to manage it safely, working in stages; at £45/hr that's £180-£225. Two drivers typically clear the same flat in 2.5-3 hours at £75/hr — £188-£225. The total cost ends up similar either way, but the two-driver booking finishes sooner, handles the furniture more carefully on the stairs, and doesn't leave you lifting anything yourself. That's usually the more telling number, not just the headline hourly rate.",
        ],
      },
      {
        heading: "What's included, whichever you choose",
        paragraphs: [
          "One driver or two, the rate includes the van, fuel, and full insurance cover on your belongings from the moment loading starts to the moment the last item's through the door. Basic dismantling — bed frames, flat-pack wardrobes — is included too, provided you mention it when booking rather than it coming up as a surprise once the crew's on site. The only thing that genuinely changes between one driver and two is the pace and the handling, not what's covered.",
          "It's also worth saying plainly: the rate doesn't change whether you're in a town-centre flat or one of the villages. We don't charge a premium for Newbury's more awkward streets, and we don't discount for an easier job out near Speen or Kintbury either. The number you're quoted reflects the hours the job genuinely needs, worked out from what you tell us when you book — not where on the map you happen to be.",
        ],
      },
      {
        heading: "If you're still not sure",
        paragraphs: [
          "Describe what you're moving and where from when you book, and we'll recommend one driver or two honestly — not whichever earns more. For anything approaching a full two-bedroom house, it's also worth asking about a [full removal](/) instead; past a certain volume, a fixed-price crew sized properly for the job tends to work out better value than an hourly rate stretched to cover it.",
        ],
      },
    ],
  },
  {
    slug: "clearing-a-loved-ones-home-in-newbury-guide-for-executors",
    title: "Clearing a Loved One's Home in Newbury: A Practical Guide for Executors",
    excerpt: "What to actually expect when you're the one responsible for clearing a family home — the legal parts, the emotional parts, and a sensible order to do them in.",
    readingTime: "5 min read",
    publishedAt: "8 November 2026",
    sections: [
      {
        paragraphs: [
          "If you're reading this because you've just been made an executor and now have to clear a parent's or relative's Newbury home, we're sorry for your loss, and we'll keep this practical rather than sentimental — because right now, practical is probably what helps most. There's a legal side to get right and an emotional side that doesn't follow a schedule, and the two don't always sit comfortably together. Here's a sensible order to approach it in.",
        ],
      },
      {
        heading: "What you're actually responsible for as executor",
        paragraphs: [
          "Legally, you're responsible for the estate's assets until probate is granted and everything is properly distributed — which means a house shouldn't be cleared and emptied casually before that's settled, however tempting it is to just get it done. Photograph the property and its contents before anything is moved, keep receipts for clearance costs (they're usually recoverable from the estate), and if there's any doubt about whether something has value — furniture, jewellery, art, even an old watch in a drawer — get it looked at before it goes anywhere. Executors have occasionally found themselves personally liable for mistakes made clearing an estate too quickly, so a little caution upfront is worth it.",
        ],
      },
      {
        heading: "The order that actually works",
        paragraphs: [
          "First, secure the property — locks changed if needed, insurance confirmed, post redirected. Second, locate and safeguard paperwork: wills, bank statements, deeds, anything that matters for probate, before a single box gets moved. Third, identify anything of significant value and have it assessed. Only after those three steps does the actual clearance make sense to book — not before, however much pressure there is to have the house ready for sale or handover.",
        ],
      },
      {
        heading: "What to value before anything is cleared",
        paragraphs: [
          "Furniture rarely holds the value people expect, but a handful of things often do: jewellery, watches, coins, original artwork, antique or well-made furniture pieces, and anything with genuine age to it. A quick valuation, even an informal one from a local auction house, costs little and prevents something genuinely worth money ending up in a clearance van by mistake. It's also worth checking lofts and garages specifically — they're where overlooked valuables most often turn up, tucked away and forgotten decades ago.",
        ],
      },
      {
        heading: "When family members disagree about what to keep",
        paragraphs: [
          "This is often the hardest part, and it's rarely about the item itself. A practical approach that tends to defuse it: photograph everything before the clearance, circulate the photos to anyone with an interest, and give a clear, reasonable deadline for claims — a week, not a month — before the clearance crew comes in. It moves the decision away from 'whoever shouts loudest in the room' and gives everyone a fair, documented chance, which matters more for keeping the peace than it does for the furniture itself.",
        ],
      },
      {
        heading: "What a Newbury clearance typically costs in this situation",
        paragraphs: [
          "Probate clearances in Newbury are priced the same way as any other — by volume and access — though they're often larger than an average job simply because they cover a whole life's worth of belongings rather than a few years'. A typical 3-bedroom family home runs £350–£650, a larger property with a garage and loft fully used can run £600–£1,000. We quote from photos wherever possible, specifically so you're not having to host a stranger walking through a parent's home during an already difficult time.",
        ],
      },
      {
        heading: "Dealing with sentimental items that have no financial value",
        paragraphs: [
          "Not everything worth keeping is worth money — a handwritten recipe card, old photographs, a worn-out armchair nobody else would look at twice. These are easy to overlook when the focus is on paperwork and valuations, but they're often the things people regret clearing without a second thought. Setting aside a single box for exactly this category before the main clearance, even if nobody's sure yet what should go in it, tends to prevent that particular regret.",
        ],
      },
      {
        heading: "If the house needs to be sold or handed back quickly",
        paragraphs: [
          "Sometimes there's real time pressure — a rental property needs returning to a landlord, or an estate agent wants the house empty before photographs and viewings. That's manageable, but it's worth saying plainly: the paperwork and valuables step still needs its moment, even if that moment is compressed into a single afternoon rather than a week. Rushing a clearance before probate items are safeguarded is the one shortcut that genuinely can come back on you as executor, so even under time pressure, do that part properly first and let the clearance itself move quickly once it does. An estate agent's deadline is real, but it's their deadline, not a legal one — it can usually flex by a day or two if you need it to.",
        ],
      },
      {
        heading: "A short, honest note on cost versus speed",
        paragraphs: [
          "A clearance booked with more notice is almost always a little cheaper and a little easier to schedule exactly when you want it, simply because we can plan the right crew and van size in advance. A genuinely urgent same-week clearance is still entirely possible — we do them regularly — but it's fair to expect slightly less flexibility on the exact day and time. If your situation allows even a few days' notice, it tends to go more smoothly for everyone, including you.",
        ],
      },
      {
        heading: "When to call us in",
        paragraphs: [
          "Once paperwork and valuables are secured and any family claims have had their fair chance, that's the point to book a [house clearance](/house-clearance). We handle probate clearances regularly, at whatever pace suits the family — some want it done within days, others need a few weeks to come to terms with it first, and both are entirely normal. We'll never rush you, and we'll always treat what's left with the respect it deserves, not as a job to get through quickly.",
        ],
      },
    ],
  },
];
