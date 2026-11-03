import type { BrandPageContent } from "@/components/local/multibrand/BrandPageShell";
import type { BrandAboutContent } from "@/components/local/multibrand/BrandAboutPage";
import type { TipArticle } from "@/components/local/multibrand/BrandTipsPages";
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
    { q: "Do you dismantle and reassemble furniture?", a: "Yes — wardrobes, bed frames, flat-pack units, the usual culprits. Let us know what needs taking apart when you book so we bring the right tools." },
    { q: "What if my move date changes?", a: "Tell us as early as you can and we'll move your slot — no fee for a reschedule with reasonable notice." },
    { q: "Do you provide boxes and packing materials?", a: "Yes, boxes, tape and wrap are available — just mention it when you book and we'll sort you out in advance." },
    { q: "What happens if something gets damaged?", a: "It's rare, but if it happens, our insurance covers it. Tell us straight away and we'll sort it properly — no arguments." },
    { q: "Can you move on a weekend?", a: "Yes, weekends are some of our busiest days precisely because that's when most people move. Book ahead to guarantee your preferred day." },
    { q: "Do you charge extra for stairs or a long carry?", a: "No hidden stair or distance fees within the fixed price you're quoted — we ask about access when you book so there's no surprise on the day." },
  ],
  ctaHeading: "Get your fixed price for a Thatcham move",
  ctaSub: "Takes under 2 minutes. No pushy sales call — just your price.",
  quoteHref: "/booking",
  whatsappMessage: "Hi, I'd like a quote for a house removal in Thatcham.",
  heroAction: () => <HeroCtaButtons quoteHref="/booking" {...base} whatsappMessage="Hi, I'd like a quote for a house removal in Thatcham." />,
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
    { q: "What size van do you use?", a: "A long-wheelbase Luton van as standard — enough for most flat-share moves, single large items, or a few rooms' worth of furniture." },
    { q: "Can you help with a single item, like a sofa or wardrobe?", a: "Yes — single-item jobs are exactly what this service is for. Most take well under the 2-hour minimum, so you're only billed for the minimum." },
    { q: "Do you charge for the time getting to me?", a: "No — the clock starts when we arrive and start working, not before." },
    { q: "Can I book for the same day?", a: "If we've got a van free, yes. The earlier in the day you call, the better the odds." },
  ],
  ctaHeading: "Book your Man and Van slot",
  ctaSub: "Pick your hours and get an instant price — no admin, no waiting for a callback.",
  quoteHref: "/booking/man-and-van",
  whatsappMessage: "Hi, I'd like a quote for Man and Van in Thatcham.",
  heroAction: () => <HeroCtaButtons quoteHref="/booking/man-and-van" {...base} whatsappMessage="Hi, I'd like a quote for Man and Van in Thatcham." />,
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
    { q: "Do you clear garages, sheds and lofts too?", a: "Yes — any part of the property, not just the main living areas." },
    { q: "How quickly can you clear a property?", a: "Most single-room clearances are done same day. A full house usually takes a day, sometimes two for a particularly full property." },
    { q: "Can you give a price without a home visit?", a: "Yes — for most jobs, photos are enough for a fair fixed price. We only need to visit for genuinely unusual or very large jobs." },
    { q: "Do I need to be present during the clearance?", a: "Not necessarily, as long as we've agreed exactly what's being cleared beforehand — many landlords and executors aren't present." },
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

export const thatchamMoversAbout: BrandAboutContent = {
  h1: "A Removal Company That's Actually From Thatcham",
  intro: "Thatcham Movers exists because the town deserved better than a call centre reading a postcode off a screen.",
  paragraphs: [
    "We're based at 17 Thatcham Broadway, RG19 3HX — not a regional depot an hour away, an actual address in the town we move people around. The crew behind Thatcham Movers has spent 7+ years moving homes and businesses in and around Thatcham, which means we already know the roads, the parking, and the blocks of flats with lifts too small for a sofa before we even turn up.",
    "There's no head office script here. When you call, you get someone who can actually answer your question about your move, not read you a policy. When we quote a price, it's the price you pay — no creeping extras for stairs, for a slightly longer carry, for anything we should have accounted for when we quoted you in the first place.",
    "We're small enough to care about getting your specific move right, and experienced enough to handle whatever that move throws at us — a tight staircase, an awkward parking restriction, a piano nobody mentioned until moving day. That combination is the whole reason this company exists.",
  ],
  values: [
    { title: "Fixed price, no surprises", body: "The price we quote is the price you pay — stairs, distance and access are all accounted for upfront." },
    { title: "Genuinely local", body: "Based on Thatcham Broadway, not a depot somewhere else with Thatcham added to a coverage map." },
    { title: "Treat your home like ours", body: "Dust sheets down, furniture wrapped, care taken — every job, not just the big ones." },
  ],
  quoteHref: "/booking",
  whatsappMessage: "Hi, I'd like to know more about Thatcham Movers.",
};

export const thatchamMoversTips: TipArticle[] = [
  {
    slug: "how-much-does-a-house-removal-cost-in-thatcham",
    title: "How Much Does a House Removal Cost in Thatcham? A Real Price Guide",
    excerpt: "The honest breakdown of what drives the price of a move in Thatcham, with real ranges by home size.",
    readingTime: "4 min read",
    publishedAt: "1 November 2026",
    sections: [
      {
        paragraphs: [
          "Every removal company says \"it depends\" when you ask for a price, which is true but not very useful. Here's what it actually depends on, and what it typically costs for a move within Thatcham.",
        ],
      },
      {
        heading: "The 3 things that actually set the price",
        paragraphs: [
          "First, how much you're moving — a 1-bed flat and a 5-bed house are obviously different jobs, so crew size and van size scale with it. Second, distance — a move within Thatcham costs less than one to, say, Reading, simply because of the extra driving time. Third, access — stairs, narrow lanes, permit parking and long carries from the van to your front door all add time, which is why we ask about them when you book rather than guessing.",
        ],
      },
      {
        heading: "Typical price ranges",
        paragraphs: [
          "As a rough guide: a 1-bed flat move within Thatcham usually lands around £200–£300. A 2-3 bed house is typically £250–£550. A larger 4-5 bed home can run £450–£800+, depending on how much needs moving. These are ranges, not promises — the only way to get your actual number is a 2-minute quote, which gives you a fixed price before you book, not an estimate that creeps up on the day.",
        ],
      },
      {
        heading: "What makes a quote cheaper",
        paragraphs: [
          "Decluttering before moving day is the single biggest lever you control — fewer items means a smaller van and less time, which means a lower price. Booking a weekday instead of a weekend can also help, since weekends are our busiest days. And having everything boxed and ready before we arrive (rather than packing while we wait) keeps the job moving at the pace it's quoted for.",
        ],
      },
    ],
  },
  {
    slug: "thatcham-moving-day-checklist",
    title: "The Thatcham Moving Day Checklist: 10 Things People Forget",
    excerpt: "The small, boring details that turn moving day from chaos into a non-event.",
    readingTime: "3 min read",
    publishedAt: "31 October 2026",
    sections: [
      {
        paragraphs: [
          "After enough moves in Thatcham, you start noticing the same few things get forgotten over and over. None of them are complicated — they're just easy to miss when you're focused on the bigger stuff.",
        ],
      },
      {
        heading: "Before the van arrives",
        paragraphs: [
          "1. Confirm parking is available right outside, or that you've told us about restrictions. 2. Take meter readings for gas, electric and water before you leave. 3. Charge your phone — you'll need it more than you think. 4. Set aside a \"first night\" box: chargers, toiletries, bedding, kettle, so you're not digging through 40 boxes at 9pm. 5. Keep important documents (passports, ID, paperwork) with you, not in the van.",
        ],
      },
      {
        heading: "On the day",
        paragraphs: [
          "6. Defrost the freezer the night before — nobody remembers this until there's a puddle. 7. Label boxes by room, not by contents, so they land in the right place straight away. 8. Walk the house one last time before the van pulls away — check lofts, sheds, and the back of cupboards. 9. Leave keys and any meter/alarm info for the new owners or landlord somewhere obvious. 10. Have cash or card ready for a tip if the crew's done a good job — never expected, always appreciated.",
        ],
      },
    ],
  },
  {
    slug: "man-and-van-thatcham-how-many-hours-do-you-need",
    title: "Man and Van in Thatcham: How Many Hours Do You Actually Need?",
    excerpt: "A real, job-by-job guide to booking the right number of hours — so you're not stuck paying for extra time, or coming up short halfway through.",
    readingTime: "4 min read",
    publishedAt: "3 November 2026",
    sections: [
      {
        paragraphs: [
          "The question we get asked more than any other when someone calls about Man and Van isn't \"how much,\" it's \"how long will it actually take.\" Fair enough — the rate's easy to find, £45/hr for one man and a van, £75/hr for two, 2-hour minimum either way. What's harder to guess is how many of those hours you'll actually need, so here's a proper answer instead of a shrug.",
        ],
      },
      {
        heading: "A single item or two",
        paragraphs: [
          "A sofa, a wardrobe, a washing machine — one item moving between two addresses in Thatcham, with decent access at both ends, is almost always inside the 2-hour minimum. One man and a van covers it unless it's genuinely heavy or awkward, in which case go with two. Don't overthink this one.",
        ],
      },
      {
        heading: "A studio or 1-bed flat",
        paragraphs: [
          "This is where it starts to depend on the flat. A straightforward ground-floor place with a van that can park right outside is usually 2-3 hours with two men. Anything in the flats around the station, where parking's tighter and there's often a flight of stairs with an awkward turn, tends to push toward the higher end of that — the lifting takes longer, not because there's more stuff, just because getting it out the door takes more trips.",
        ],
      },
      {
        heading: "A 2-bed flat or small house",
        paragraphs: [
          "Realistically 4-5 hours with two men, sometimes more if there's a full kitchen's worth of boxes on top of furniture. This is also the size of job where it's worth us being straight with you: if your place is fully furnished and fully boxed, a [full house removal](/) with a fixed price agreed upfront can work out similar in cost, or cheaper, and you're not watching the clock. We'll always tell you honestly which makes more sense for your specific move.",
        ],
      },
      {
        heading: "What adds time that people forget about",
        paragraphs: [
          "Distance within Thatcham barely matters — it's a small town. What does add time: a long carry from the van to the front door (common out towards Crookham and Cold Ash, where driveways and narrow lanes mean the van can't always get close), stairs with a tight turn, and anything that needs dismantling on the spot because nobody mentioned it when booking. Tell us about any of that upfront and we'll quote the hours accurately instead of guessing low and running over.",
        ],
      },
      {
        heading: "What's actually included in the rate",
        paragraphs: [
          "The hourly rate covers the van, the fuel, and full insurance on your belongings for the whole job — loading, driving, unloading, all of it. Taking apart a bed frame or a flat-pack wardrobe so it fits through a doorway is included too, as long as you mention it when you book rather than it being a surprise once we're on site. What it doesn't include is us guessing what's in a sealed box or behind a door you haven't mentioned — the more accurate the picture you give us up front, the more accurate the hours we quote.",
        ],
      },
      {
        heading: "A real example",
        paragraphs: [
          "A recent job: a one-bed flat move from near the station to a house out past Midgham. Two men and a van, booked for 3 hours based on a flight of stairs at the flat and a longer carry at the new place since the driveway couldn't quite fit the van. Came in bang on 3 hours — £225. A similar flat with ground-floor access both ends, by contrast, would likely have finished closer to the 2-hour minimum at £150. Same amount of stuff, same town, nearly £75 difference — entirely down to access, which is exactly why we ask the questions we do when you book, not because we're being nosy about your furniture.",
        ],
      },
      {
        heading: "Weekday or weekend — does it change anything?",
        paragraphs: [
          "The hourly rate's the same either day. What changes is how far ahead you need to book. Weekends are when most people move, so a Saturday slot in a few weeks' time is easy, but a Saturday booked the night before is a genuine ask — we'll always try, but a weekday gives you far better odds of getting exactly the time you want, especially if the job's bigger than a single item. If your dates have any flexibility at all, a Tuesday or Wednesday move in Thatcham is usually the easiest booking of the week to slot in.",
        ],
      },
      {
        heading: "What if you run over your booked hours?",
        paragraphs: [
          "It happens, usually because a box turns out heavier than expected or a sofa doesn't fit round a corner the first time. You're simply billed for the extra time at the same hourly rate — there's no penalty rate for going over, and we'll tell you honestly as we go if it looks like the job's running longer than booked, rather than springing the extra cost on you at the end. If we can see early on that two hours clearly won't cover it, we'd rather say so after 20 minutes than let you find out when the invoice lands.",
        ],
      },
      {
        heading: "The honest rule of thumb",
        paragraphs: [
          "If in doubt, book slightly more than you think you need rather than less — going under means the job gets rushed, and going over just means we finish early and you've paid a fair hourly rate for the actual time. Or easier still, just call us on " + brand.phone + ", describe what's moving and from where in Thatcham, and we'll give you a straight number. No guessing required.",
        ],
      },
    ],
  },
];
