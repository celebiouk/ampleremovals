import type { BrandPageContent } from "@/components/local/multibrand/BrandPageShell";
import { HeroCtaButtons } from "@/components/local/multibrand/HeroCtaButtons";
import { InstantHourlyQuoteWidget } from "@/components/local/InstantHourlyQuoteWidget";
import { BRAND_BY_SLUG } from "@/lib/brands";

const brand = BRAND_BY_SLUG["thatcham-movers"];
const base = {
  accent: brand.colors.accent,
  whatsappNumber: brand.whatsappNumber,
  phone: brand.phone,
  phoneHref: brand.phoneHref,
};

export const thatchamMoversRemovals: BrandPageContent = {
  layout: "classic",
  eyebrow: "Thatcham's own removal company",
  h1: "House Removals in Thatcham, Done Properly",
  subhead:
    "A local crew, a van outside your door on time, and every box where it should be by the end of the day. That's the whole pitch — no gimmicks, no surprise charges.",
  trustPoints: ["Based at 17 Thatcham Broadway", "Fully insured on every job", "Fixed price before you book", "7+ years' moving experience"],
  storyHeading: "Why Thatcham Movers exists",
  storyParagraphs: [
    "Thatcham Movers was built for one reason: Thatcham deserves a removal company that's actually from Thatcham, not a national franchise reading your postcode off a screen. We're based right on Thatcham Broadway — RG19 3HX — and the crew behind this brand has been moving families and businesses around Newbury and Thatcham for 7+ years.",
    "That matters more than it sounds. We know which roads near Crookham, Cold Ash and Henwick Worthy turn into a nightmare at 4pm. We know which blocks of flats have lifts that are too small for a sofa (and bring the right trolley anyway). Local knowledge is the difference between a move that runs to plan and one that doesn't.",
    "We quote you a fair, fixed price before anything is booked, turn up with a dust sheet-ready, fully-equipped van, and treat your home like it's ours. That's it. That's the whole service.",
  ],
  servicesHeading: "What we do in Thatcham",
  services: [
    { title: "House Removals", body: "Full house moves, any size, anywhere in Thatcham and the surrounding villages.", href: "/" },
    { title: "Man and Van", body: "One or two movers and a van by the hour — for smaller moves, single items, or a quick job.", href: "/man-and-van" },
    { title: "House Clearance", body: "A full or partial property clearance with same-day fixed pricing from photos.", href: "/house-clearance" },
  ],
  faqHeading: "Removals in Thatcham — common questions",
  faqs: [
    { q: "How much does a house removal cost in Thatcham?", a: "It depends on the size of your home and how far you're moving, but most 2-3 bedroom moves within Thatcham come in between £250 and £550. Get your exact fixed price in under 2 minutes with our free quote tool — no obligation." },
    { q: "Are you insured?", a: "Yes — fully insured on every single job, no exceptions. Your belongings are covered from the moment we load the van to the moment the last box is in your new home." },
    { q: "Can you move me the same week?", a: "Usually, yes. Thatcham's a small enough patch that we can often slot in a move within a few days — call us on " + brand.phone + " and we'll tell you straight away if we're free." },
    { q: "Do you cover villages near Thatcham, not just the town centre?", a: "Yes — Crookham, Cold Ash, Henwick Worthy, Midgham and everywhere else within a few miles of Thatcham is core territory for us." },
  ],
  ctaHeading: "Get your fixed price for a Thatcham move",
  ctaSub: "Takes under 2 minutes. No pushy sales call — just your price.",
  quoteHref: "/booking",
  whatsappMessage: "Hi, I'd like a quote for a house removal in Thatcham.",
  heroAction: () => <HeroCtaButtons quoteHref="/booking" align="center" {...base} whatsappMessage="Hi, I'd like a quote for a house removal in Thatcham." />,
};

export const thatchamMoversManAndVan: BrandPageContent = {
  layout: "classic",
  eyebrow: "Man and Van — Thatcham",
  h1: "Man and Van in Thatcham, By the Hour",
  subhead:
    "Need a sofa moved, a single room shifted, or an extra pair of hands for a few hours? One or two movers and a van, priced by the hour, no minimum-day nonsense.",
  trustPoints: ["£45/hr — 1 man and van", "£75/hr — 2 men and van", "2-hour minimum", "Based in Thatcham"],
  storyHeading: "Built for the jobs a full removal is overkill for",
  storyParagraphs: [
    "Not every move needs a full crew and a day booked out. Sometimes it's one sofa, a student moving out of a flat share near the station, or a flat-pack wardrobe that needs two people and a strong back. That's exactly what our Man and Van service in Thatcham is for.",
    "Book one man and a van at £45/hr, or two men and a van at £75/hr if there's heavier lifting involved — stairs, a piano, anything awkward. Either way, you only pay for the hours you actually use, with a 2-hour minimum so a quick job stays a quick job on the invoice too.",
    "Same local crew, same insurance, same fixed pricing honesty as our full removals — just scaled down to fit a smaller job.",
  ],
  servicesHeading: "Other ways we can help",
  services: [
    { title: "Full House Removals", body: "Moving an entire home? Our full removals service is the better fit.", href: "/" },
    { title: "House Clearance", body: "Clearing a whole property or just a room? Get a fixed price from photos.", href: "/house-clearance" },
    { title: "Call Us Direct", body: "Not sure which service fits your job? Just call and we'll tell you honestly.", href: brand.phoneHref },
  ],
  faqHeading: "Man and Van in Thatcham — FAQs",
  faqs: [
    { q: "What's the minimum booking?", a: "2 hours, whether it's one man and a van or two. Most single-item or small-flat jobs fit comfortably inside that." },
    { q: "Do I need 1 man or 2?", a: "If it's one or two medium items with easy access, 1 man and van (£45/hr) is usually plenty. Stairs, heavy furniture, or multiple rooms — go with 2 men and van (£75/hr)." },
    { q: "Can you do same-day bookings?", a: "Often, yes — being local to Thatcham means we can usually fit in a short job the same day if we have a van free. Call " + brand.phone + " to check." },
  ],
  ctaHeading: "Book your Man and Van slot",
  ctaSub: "Pick your hours and get an instant price — no admin, no waiting for a callback.",
  quoteHref: "/booking/man-and-van",
  whatsappMessage: "Hi, I'd like a quote for Man and Van in Thatcham.",
  heroAction: () => <HeroCtaButtons quoteHref="/booking/man-and-van" align="center" {...base} whatsappMessage="Hi, I'd like a quote for Man and Van in Thatcham." />,
};

export const thatchamMoversHouseClearance: BrandPageContent = {
  layout: "classic",
  eyebrow: "House Clearance — Thatcham",
  h1: "House Clearance in Thatcham, Fixed Price",
  subhead:
    "Full or partial property clearance — probate, rental turnarounds, hoarding, downsizing, anything. Send a few photos, get a fair fixed price, no estimate guesswork.",
  trustPoints: ["Fixed price from photos", "1-hour minimum job", "Responsible disposal", "Same local crew as every job"],
  storyHeading: "Clearances done with respect, not a skip-and-run",
  storyParagraphs: [
    "House clearances are often tied to something hard — a bereavement, a tenant who's left a mess behind, a parent downsizing after decades in one house. We treat every clearance in Thatcham with that in mind: no judgement, no rushing, and anything that can be donated or recycled responsibly is — not everything has to end up in landfill.",
    "You can get an instant hourly estimate below for straightforward jobs, or send us a few photos for a proper fixed price on anything bigger or more unusual. Either way, the price you're quoted is the price you pay.",
  ],
  servicesHeading: "Other ways we can help",
  services: [
    { title: "Full House Removals", body: "Moving house as well as clearing one? We do both.", href: "/" },
    { title: "Man and Van", body: "Just a few items to shift, not a full clearance? Man and Van by the hour.", href: "/man-and-van" },
    { title: "Call Us Direct", body: "Describe the job over the phone and we'll point you the right way.", href: brand.phoneHref },
  ],
  faqHeading: "House Clearance in Thatcham — FAQs",
  faqs: [
    { q: "How is the price worked out?", a: "For straightforward jobs, pick your hours below for an instant price. For anything bigger — a full house, a hoarding situation, probate — send photos and we'll give you a fair fixed price, no visit needed." },
    { q: "What happens to the items you clear?", a: "Wherever possible, usable items are donated or recycled rather than landfilled. We handle disposal responsibly and in line with waste regulations." },
    { q: "Can you do probate clearances?", a: "Yes, regularly. We're used to working sensitively and at whatever pace the family needs, including coordinating with executors and solicitors where helpful." },
  ],
  ctaHeading: "Get your fixed clearance price",
  ctaSub: "Instant estimate below, or send photos for a bigger job.",
  quoteHref: "#get-price",
  whatsappMessage: "Hi, I'd like a quote for a house clearance in Thatcham.",
  heroAction: () => (
    <div id="get-price" className="max-w-md">
      <InstantHourlyQuoteWidget service="house_clearance" standardRate={45} premiumRate={70} accent="green" minHours={1} allowFixedPrice />
    </div>
  ),
};
