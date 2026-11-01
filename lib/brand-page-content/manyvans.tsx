import type { BrandPageContent } from "@/components/local/multibrand/BrandPageShell";
import { HeroCtaButtons } from "@/components/local/multibrand/HeroCtaButtons";
import { InstantHourlyQuoteWidget } from "@/components/local/InstantHourlyQuoteWidget";
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
  eyebrow: "Newbury & Thatcham",
  h1: "A Van Ready When You Are",
  subhead:
    "ManyVans covers house removals across both Newbury and Thatcham — one booking system, a fleet of vans, and a fixed price before you commit to anything.",
  trustPoints: ["Covers Newbury AND Thatcham", "Fixed price, no surprises", "Fully insured on every job", "7+ years' moving experience"],
  storyHeading: "One brand, two towns, no compromise",
  storyParagraphs: [
    "Most removal companies pick a patch and stick to it. ManyVans was built differently — to properly cover both Newbury and Thatcham with the same standard of service, the same fixed pricing, and the same crew either side of the A339.",
    "The team behind ManyVans has 7+ years' experience moving homes and businesses across this exact area, so whether your move starts in Speen and ends in Cold Ash, or it's entirely within one town, you're getting a crew that already knows the roads, the parking, and the buildings.",
    "A fixed price, agreed before you book — not an estimate that grows on the day. That's the whole deal.",
  ],
  servicesHeading: "What we do across Newbury & Thatcham",
  services: [
    { title: "House Removals", body: "Full house moves anywhere in Newbury or Thatcham — or between the two.", href: "/" },
    { title: "Man and Van", body: "A mover and a van by the hour, for smaller jobs across both towns.", href: "/man-and-van" },
    { title: "House Clearance", body: "Full or partial clearances with a fixed price, covering both areas.", href: "/house-clearance" },
  ],
  faqHeading: "Removals across Newbury & Thatcham — FAQs",
  faqs: [
    { q: "Do you cover both Newbury and Thatcham?", a: "Yes — that's exactly what ManyVans is built for. One booking, one crew, whichever town (or both) your move involves." },
    { q: "How much does a removal cost?", a: "Most 2-3 bedroom moves come in between £250 and £550 depending on size and distance. Get your exact fixed price in under 2 minutes with our free quote tool." },
    { q: "Can you move between Newbury and Thatcham directly?", a: "Yes — that's one of the main reasons ManyVans exists. No extra admin for crossing between the two towns." },
    { q: "Are you insured?", a: "Fully insured on every single job, no exceptions, covering your belongings from load to unload." },
  ],
  ctaHeading: "Get your fixed price, covering Newbury & Thatcham",
  ctaSub: "Under 2 minutes, no obligation.",
  quoteHref: "/booking",
  whatsappMessage: "Hi, I'd like a quote for a house removal (Newbury/Thatcham).",
  heroAction: () => <HeroCtaButtons quoteHref="/booking" {...base} whatsappMessage="Hi, I'd like a quote for a house removal (Newbury/Thatcham)." />,
};

export const manyVansManAndVan: BrandPageContent = {
  layout: "bold",
  eyebrow: "Man and Van — Newbury & Thatcham",
  h1: "Man and Van, Covering Both Towns",
  subhead:
    "A mover and a van by the hour, available across Newbury and Thatcham — perfect for smaller jobs, single items, or a flat move that doesn't need a full crew.",
  trustPoints: ["£45/hr — 1 man and van", "£75/hr — 2 men and van", "2-hour minimum", "Covers Newbury AND Thatcham"],
  storyHeading: "One service, two towns, hourly pricing",
  storyParagraphs: [
    "Not every job needs a full removal booked out for the day. A single sofa, a flat-pack wardrobe, a studio flat near either town centre — our Man and Van service covers all of it, in Newbury, Thatcham, or a job that moves between the two.",
    "One man and a van is £45/hr; two men and a van (for stairs, heavier furniture, or multiple rooms) is £75/hr. There's a 2-hour minimum, and after that you only pay for the time the job takes.",
    "Same fixed-pricing honesty and insurance as our full removals service — just scaled to a smaller job, wherever in Newbury or Thatcham it is.",
  ],
  servicesHeading: "Other ways we can help",
  services: [
    { title: "Full House Removals", body: "Moving an entire home across Newbury or Thatcham? Our full service fits better.", href: "/" },
    { title: "House Clearance", body: "Clearing a property instead of moving it? Get a fixed price from photos.", href: "/house-clearance" },
    { title: "Call Us Direct", body: "Tell us about the job and we'll point you to the right service.", href: brand.phoneHref },
  ],
  faqHeading: "Man and Van — FAQs",
  faqs: [
    { q: "Does this cover both Newbury and Thatcham?", a: "Yes, both towns and everywhere between — it's the whole point of ManyVans." },
    { q: "1 man or 2?", a: "1 man and van (£45/hr) suits light items with easy access. 2 men and van (£75/hr) is the better call for stairs, heavier furniture, or several rooms." },
    { q: "Minimum booking?", a: "2 hours, which covers the vast majority of single-item and small-flat jobs." },
  ],
  ctaHeading: "Book your Man and Van slot",
  ctaSub: "Pick your hours, get an instant price.",
  quoteHref: "/booking/man-and-van",
  whatsappMessage: "Hi, I'd like a quote for Man and Van (Newbury/Thatcham).",
  heroAction: () => <HeroCtaButtons quoteHref="/booking/man-and-van" {...base} whatsappMessage="Hi, I'd like a quote for Man and Van (Newbury/Thatcham)." />,
};

export const manyVansHouseClearance: BrandPageContent = {
  layout: "bold",
  eyebrow: "House Clearance — Newbury & Thatcham",
  h1: "House Clearance, Fixed Price, Both Towns",
  subhead:
    "Probate, rental turnarounds, downsizing, hoarding — send a few photos and get a fair fixed price for a clearance anywhere in Newbury or Thatcham.",
  trustPoints: ["Fixed price from photos", "1-hour minimum job", "Responsible disposal", "Covers Newbury AND Thatcham"],
  storyHeading: "Cleared properly, wherever you are",
  storyParagraphs: [
    "A clearance is rarely just logistics — it's often a bereavement, a tenancy ending, or years of belongings that need sorting with care. We handle every clearance across Newbury and Thatcham the same way: no rushing, no judgement, and anything that can be donated or recycled responsibly is.",
    "Pick your hours below for an instant estimate on straightforward jobs, or send photos for a fair fixed price on anything bigger. The price quoted is the price paid — in either town.",
  ],
  servicesHeading: "Other ways we can help",
  services: [
    { title: "Full House Removals", body: "Moving house too? We handle the move and the clearance, across both towns.", href: "/" },
    { title: "Man and Van", body: "Just a few items? Man and Van by the hour, covering Newbury and Thatcham.", href: "/man-and-van" },
    { title: "Call Us Direct", body: "Describe the job and we'll point you the right way.", href: brand.phoneHref },
  ],
  faqHeading: "House Clearance — FAQs",
  faqs: [
    { q: "Does this cover both towns?", a: "Yes — Newbury, Thatcham, and everywhere between." },
    { q: "How does pricing work?", a: "Pick your hours below for an instant price on straightforward jobs, or send photos for a fixed price on anything bigger." },
    { q: "Where do cleared items go?", a: "Wherever possible, donated or recycled rather than binned — disposed of responsibly in line with waste regulations." },
  ],
  ctaHeading: "Get your fixed clearance price",
  ctaSub: "Instant estimate below, or send photos for a bigger job.",
  quoteHref: "#get-price",
  whatsappMessage: "Hi, I'd like a quote for a house clearance (Newbury/Thatcham).",
  heroAction: () => (
    <div id="get-price" className="max-w-md">
      <InstantHourlyQuoteWidget service="house_clearance" standardRate={45} premiumRate={70} accent="green" minHours={1} allowFixedPrice />
    </div>
  ),
};
