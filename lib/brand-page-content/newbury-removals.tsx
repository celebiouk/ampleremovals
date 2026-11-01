import type { BrandPageContent } from "@/components/local/multibrand/BrandPageShell";
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
  ],
  faqHeading: "Removals in Newbury — common questions",
  faqs: [
    { q: "How much does a removal cost in Newbury?", a: "Most 2-3 bedroom moves within Newbury run between £250 and £550, depending on distance and how much you're moving. Use our free quote tool for your exact fixed price in under 2 minutes." },
    { q: "Do you cover villages around Newbury too?", a: "Yes — Speen, Thatcham, Hungerford, Kintbury and the villages around Newbury are all within our normal working area." },
    { q: "Are you insured for the move?", a: "Fully insured on every job, with no exceptions — your belongings are covered the whole way through." },
    { q: "How soon can you move me?", a: "Often within the same week. Call " + brand.phone + " and we'll tell you honestly whether we've got a van free when you need it." },
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
    { title: "Call Us Direct", body: "Not sure which fits your job? Tell us about it and we'll point you the right way.", href: brand.phoneHref },
  ],
  faqHeading: "Man and Van in Newbury — FAQs",
  faqs: [
    { q: "What's the minimum booking length?", a: "2 hours — enough for the vast majority of single-item or small-flat jobs in Newbury." },
    { q: "Should I book 1 man or 2?", a: "1 man and van (£45/hr) suits light items with easy access. 2 men and van (£75/hr) is the better call for stairs, heavy furniture, or several rooms' worth." },
    { q: "Can I get a same-day Man and Van?", a: "Often, yes — being local to Newbury means we can usually find a slot quickly. Call " + brand.phone + " to check availability." },
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
    { title: "Call Us Direct", body: "Describe the job over the phone and we'll point you the right way.", href: brand.phoneHref },
  ],
  faqHeading: "House Clearance in Newbury — FAQs",
  faqs: [
    { q: "How does pricing work?", a: "Pick your hours below for an instant price on straightforward jobs. For anything bigger, send photos and we'll give you a fair fixed price with no visit needed." },
    { q: "Where do cleared items go?", a: "Wherever possible, usable items are donated or recycled rather than binned — we dispose of everything responsibly and in line with waste regulations." },
    { q: "Do you handle probate clearances?", a: "Yes, regularly — working sensitively, at whatever pace the family needs, including liaising with executors or solicitors where it helps." },
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
