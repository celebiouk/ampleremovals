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
];
