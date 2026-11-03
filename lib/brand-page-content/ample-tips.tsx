import type { TipArticle } from "@/components/local/multibrand/BrandTipsPages";

/**
 * Ample Removals' own Tips & Advice articles — same shape and same
 * daily-post workflow as the 3 white-label brands (see
 * tasks/brand-playbook.md, "Daily blog posts"), just not wrapped in
 * BrandChrome since Ample keeps its existing Navbar/Footer. Add new
 * posts here the same way as the other brands' *-tips.tsx files.
 */
export const ampleTips: TipArticle[] = [
  {
    slug: "how-to-choose-a-removal-company-in-newbury-or-thatcham",
    title: "How to Choose a Removal Company in Newbury or Thatcham",
    excerpt: "The questions worth asking before you book anyone — what actually separates a good removal company from a risky one.",
    readingTime: "4 min read",
    publishedAt: "2 November 2026",
    sections: [
      {
        paragraphs: [
          "Newbury and Thatcham have no shortage of removal companies listed online, and most of them look fine on the surface — a nice website, a few good reviews, a reasonable-sounding price. The problem is that the things which actually determine whether your move goes smoothly rarely show up on the homepage. Here's what's worth checking before you commit.",
        ],
      },
      {
        heading: "Ask about insurance specifically, not generally",
        paragraphs: [
          "\"Are you insured?\" almost always gets a yes. The better question is what the insurance actually covers — goods in transit, public liability, and whether there's a claims excess that makes a small breakage not worth claiming for. A company that answers this precisely, without hesitating, is one that's actually checked their own policy recently.",
        ],
      },
      {
        heading: "Fixed price vs estimate",
        paragraphs: [
          "An estimate can grow on the day; a fixed price, confirmed before you book, can't. Ask directly: \"Is this a fixed price, or could it change?\" Any extra cost — stairs, a long carry from the van, a narrow lane — should be priced in before moving day, not discovered on it.",
        ],
      },
      {
        heading: "Local knowledge is a real advantage, not just marketing",
        paragraphs: [
          "A crew that already knows Newbury's race-day traffic patterns or Thatcham's permit-parking streets plans around them automatically. A company based an hour away is learning your street for the first time on your moving day. It's a fair question to ask directly: \"How many moves have you done in this specific area?\"",
        ],
      },
      {
        heading: "What a fair price actually looks like",
        paragraphs: [
          "As a rough guide, a 2-3 bedroom house move within Newbury or Thatcham typically costs between £250 and £550, depending on distance and volume. If a quote comes in dramatically below that range, ask what's excluded — it's rarely free, just deferred to moving day.",
        ],
      },
    ],
  },
  {
    slug: "what-a-man-and-van-booking-actually-includes",
    title: "What a Man and Van Booking Actually Includes (and What It Doesn't)",
    excerpt: "The parts of a Man and Van job most quotes gloss over — what counts toward your hours, what's included as standard, and where the small print usually hides.",
    readingTime: "5 min read",
    publishedAt: "3 November 2026",
    sections: [
      {
        paragraphs: [
          "Search \"man and van Newbury\" or \"man and van Thatcham\" and you'll mostly get a wall of hourly rates — £20 here, £45 there — with very little explanation of what you're actually buying for that money. The rate only tells you the price per hour. Here's what's genuinely included in a proper Man and Van booking, where the boundaries usually sit, and the handful of things worth asking before you book rather than discovering on the day.",
        ],
      },
      {
        heading: "What's included as standard",
        paragraphs: [
          "You're choosing between two crew sizes — one driver working alone, or two if the job needs more muscle — with the van, fuel and mileage within the local area already built into the hourly rate rather than charged separately. Insurance covers your belongings for the whole job, not just the drive between addresses, so loading and unloading are covered too. Basic dismantling of flat-pack furniture — bed frames, wardrobes, that kind of thing — is normally included if you mention it when you book, not an add-on sprung on you with the van outside. Reassembly at the other end usually works the same way.",
        ],
      },
      {
        heading: "What actually counts toward your hours",
        paragraphs: [
          "The clock should start when the crew arrives and starts working, not from whenever they left their depot — worth confirming directly, because not every provider does it that way. Loading, the drive, and unloading at the destination all count toward your booked time. What doesn't disappear from the clock is waiting: for keys to be handed over, for a lift that's out of order, for a seller who isn't quite ready to leave. That's the single most common reason a job quoted at two hours runs to three, and it's rarely the crew's fault.",
        ],
      },
      {
        heading: "Worth clarifying before the day, not on it",
        paragraphs: [
          "Parking matters more than most people expect. A van forced to park two streets away because of restrictions near the address adds carrying time that eats into your paid hours for nothing — mention any permit zones or likely double-yellow problems when you book. If either address has stairs, a tight turn on the landing, or a lift that might not take a sofa, say so in advance, since it genuinely changes whether one person is enough or two is the safer call. And flag anything properly fragile or high-value — a piano, an antique cabinet, specialist electronics — because it may need handling differently from a standard load of boxes.",
        ],
      },
      {
        heading: "When it stops making sense as Man and Van",
        paragraphs: [
          "Somewhere around a full two-bedroom house — furniture in every room, boxes stacked waist-high — the arithmetic flips. A job that would genuinely take four or five hours on an hourly rate often ends up costing about the same, sometimes less, as a [full house removal](/) with a fixed price agreed before anyone turns up, and you're not watching a clock tick while it happens. If you're not sure which side of that line your move sits on, describing the job over the phone usually settles it in under a minute — a good company will tell you honestly, even if it means quoting the cheaper option.",
        ],
      },
      {
        heading: "The short version",
        paragraphs: [
          "A fair Man and Van quote should cover crew size, what counts toward the clock, parking and access, and what happens if the job runs long — all before you book, not after. If a quote you've been given doesn't answer those questions without you having to ask, that's worth noticing. It usually tells you something about how the rest of the job will go too.",
        ],
      },
    ],
  },
];
