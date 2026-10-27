import Link from "next/link";
import { Phone, ArrowRight, Truck, PackageOpen, Sofa, KeyRound, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StickyQuoteBar } from "@/components/local/StickyQuoteBar";
import { TrustBar, GuideArticle, ContactSection, FaqSection, COMPANY_ADDRESS, COMPANY_PHONE_DISPLAY, type Guide } from "@/components/local/flagship/FlagshipShared";

const GUIDES: Guide[] = [
  {
    title: "The Ultimate Newbury House Moving Checklist",
    intro: "Moving house in Newbury involves a few local quirks you won't find on a generic checklist — here's the one we actually hand to our own customers.",
    paragraphs: [
      "Eight weeks out: start sorting, not packing. Newbury's a town where a lot of people have lived in the same house for 15-20 years — if that's you, the biggest time sink isn't the move itself, it's deciding what's coming with you. Book your removal date early, especially if you're moving in July or August, our busiest months, or around the start and end of the school term when families with children at St Bartholomew's, The Newbury Academy or Park House School are trying to move during the holidays.",
      "Four weeks out: confirm your new address's access. Newbury has a real mix of housing stock — Victorian terraces around Wash Common and the town centre with no front driveway, 1930s semis in Speen and Donnington with proper driveways, and newer estates toward Greenham and Thatcham Road with allocated parking that sometimes needs a permit for a removal van to use visitor bays. Tell us about access on both ends when you book and we'll plan the van size and parking around it, not guess on the day.",
      "Two weeks out: redirect your post and update your address with the DVLA, your bank, and West Berkshire Council for council tax — Newbury sits entirely within the West Berkshire Council area, so that's the one registration that actually matters locally.",
      "Moving week: defrost the freezer 24 hours before, keep valuables and paperwork with you rather than in the van, and have a 'first night' box packed separately — kettle, mugs, phone chargers, bedding, toilet roll. It sounds obvious until it's 7pm and you can't find any of it.",
    ],
  },
  {
    title: "Parking & Access for Removal Vans in Newbury Town Centre",
    intro: "If your move involves anywhere near the town centre, Bartholomew Street, Northbrook Street or the Wharf, parking is the one thing worth sorting before moving day, not on it.",
    paragraphs: [
      "Newbury town centre has pay-and-display and resident-permit zones, and several of the older terraced streets off Bartholomew Street and around West Mills have no off-street parking at all. If you're on one of these streets, it's worth contacting West Berkshire Council in advance about a temporary dispensation for a removal vehicle, or at minimum letting neighbours know you'll need the space outside your door for a couple of hours.",
      "We've been loading and unloading on these streets for years, so when you book with us, just flag it — we'll tell you honestly whether we think a permit's worth getting, or whether we can manage with a short, well-timed load (early morning before the school run tends to work well on residential streets).",
      "Newer developments around Sandleford Park, Bowling Green and the Hambridge Road estates are generally easier — proper driveways or allocated bays — but can have resident-only visitor parking schemes, so again, a quick heads-up when you book means no surprises.",
    ],
  },
  {
    title: "Best Time of Year to Move House in Newbury",
    intro: "There isn't a bad time to move in Newbury, but there is a quieter one — and if your dates are flexible, it's worth knowing.",
    paragraphs: [
      "Like most of the UK, our busiest months in Newbury are June, July and August, when families time their move around the school summer holiday, and the last week of any month, when most house completions happen. If you can move mid-month and outside summer, you'll generally get a wider choice of dates and, often, a calmer day — less chance of fighting for parking against three other removal vans on the same street.",
      "Winter moves in Newbury are genuinely fine — we're equipped for wet weather and short daylight hours — just worth building in a little extra time for shorter days and the odd frosty driveway.",
    ],
  },
  {
    title: "A Local's Guide to Newbury's Neighbourhoods for New Movers",
    intro: "Newbury isn't one place — it's a collection of genuinely different neighbourhoods, and which one suits you depends on what you're after.",
    paragraphs: [
      "Wash Common sits on the hill south of the centre — mostly Victorian and Edwardian terraces and semis, a five-minute walk from the Showground, and popular with people who want to be close to town without town-centre prices. Speen, on the western edge, is a mix of older cottages and newer estates backing onto Snelsmore Common, good for anyone who wants green space on the doorstep. Greenham, south-east of the centre, has grown up around the old airbase — now open common land and a business park — with a real mix of housing ages.",
      "Closer to the centre, streets around Northbrook Street and the Wharf put you in walking distance of the shops, the Kennet and Avon Canal, and Newbury station (around 45 minutes to London Paddington), which is why this area's popular with commuters. If you've got a young family, Donnington and the areas near Newbury Racecourse tend to have larger, newer family homes with easier parking.",
    ],
  },
  {
    title: "How Much Does a House Removal Cost in Newbury?",
    intro: "Honest answer: it depends on the size of your home and how far you're going — but here's roughly what shapes the number.",
    paragraphs: [
      "For a local Newbury-to-Newbury move, the main cost drivers are the number of bedrooms, how much is being moved, and access at both ends (stairs, parking distance, lift availability). A studio or 1-bed flat move is naturally quicker and cheaper than a 4-bed family house with a garage full of extras.",
      "Rather than guess, we'd rather just show you — enter your postcode and a few details on our booking page and you'll see a real Standard and Premium price before you commit to anything, with a small deposit to lock in your date and the rest due on moving day.",
    ],
  },
];

const FAQS = [
  { q: "Do you offer same-day or next-day removals in Newbury?", a: "Often, yes — we're based a few miles away in Thatcham, so same-day or next-day is usually possible. Call us and we'll tell you honestly whether today's doable." },
  { q: "How far is Newbury from your depot?", a: "Just a few miles — we're based in Thatcham, right next door, so a van's usually in Newbury faster than you'd expect from a bigger national company." },
  { q: "Do you cover Speen, Greenham, Wash Common and the rest of Newbury?", a: "Yes — every part of Newbury, plus the surrounding villages like Donnington, Cold Ash and Chieveley." },
  { q: "Do I need a parking permit for removal day in Newbury town centre?", a: "Some of the older streets near the centre have no off-street parking, so it's worth asking West Berkshire Council about a temporary dispensation. Tell us your address when you book and we'll advise honestly." },
  { q: "Is there a minimum job size?", a: "No — from a single item to a full house, we quote on what you actually need moved." },
];

export function NewburyPage() {
  const whatsappMessage = "Hi, I'm looking to book a removal in Newbury. Can you help?";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MovingCompany",
        name: "Ample Removals — Newbury",
        description: "Removals, man and van, house clearance, rubbish removal and end-of-tenancy cleaning covering Newbury, Berkshire — based a few miles away in Thatcham, serving the area for over 7 years.",
        address: { "@type": "PostalAddress", streetAddress: "41 Rosedale Garden", addressLocality: "Thatcham", postalCode: "RG19 3LE", addressCountry: "GB" },
        areaServed: [{ "@type": "City", name: "Newbury" }, { "@type": "City", name: "Thatcham" }],
        telephone: "+443335772070",
        email: "hello@ampleremovals.com",
        priceRange: "££",
        url: "https://www.ampleremovals.com/locations/newbury",
        foundingDate: "2019",
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      ...GUIDES.map((g) => ({
        "@type": "Article",
        headline: g.title,
        articleSection: "Newbury Moving Guides",
        about: "House removals in Newbury, Berkshire",
        author: { "@type": "Organization", name: "Ample Removals" },
        publisher: { "@type": "Organization", name: "Ample Removals" },
      })),
    ],
  };

  return (
    <div className="pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <StickyQuoteBar quoteHref="/booking" whatsappMessage={whatsappMessage} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-purple-900 via-brand-purple-800 to-brand-purple-950 px-6 pb-16 pt-28 text-white lg:pt-36">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-brand-purple-200">
            Newbury, Berkshire · RG14 / RG18 / RG19 / RG20
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Removals in Newbury, From a Team That&apos;s Right Next Door in Thatcham
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-brand-purple-100">
            For over 7 years, Ample Removals has been moving Newbury families and businesses — house moves, man and van, house clearance and end-of-tenancy cleaning — all from our base a few miles away in Thatcham. We&apos;re not a national call centre; we&apos;re the team that actually turns up.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-brand-green-600 hover:bg-brand-green-500">
              <Link href="/booking">Get a free Quote <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <a href="tel:03335772070" className="inline-flex items-center gap-2 rounded-xl border border-white px-6 py-3 font-semibold text-white hover:bg-white/10">
              <Phone className="h-4 w-4" /> {COMPANY_PHONE_DISPLAY}
            </a>
          </div>
          <div className="mt-10">
            <TrustBar />
          </div>
        </div>
      </section>

      {/* Our story / local commitment — long-form narrative */}
      <section className="px-6 py-16">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-slate-900">A Newbury Removal Company That&apos;s Genuinely Local</h2>
          <div className="mt-6 space-y-4 text-slate-700">
            <p>
              Ample Removals is based at 41 Rosedale Garden in Thatcham — a few miles down the A4 from Newbury town centre. We&apos;ve been serving Newbury for over 7 years now, and in that time we&apos;ve moved people out of Victorian terraces off Bartholomew Street, into new-build family homes near Sandleford Park, across town from Speen to Wash Common, and everywhere in between.
            </p>
            <p>
              That local base matters more than it sounds. A national removals firm might dispatch a van from Reading, Swindon or further afield, with a crew that&apos;s never driven Newbury&apos;s one-way system or dealt with the narrow terraced streets near West Mills. We&apos;re a few minutes away. We know which streets need a smaller van, which postcodes need a parking dispensation sorted in advance, and which routes avoid the worst of the Newbury bypass at rush hour.
            </p>
            <p>
              We&apos;re committed to this patch — Newbury and Thatcham are where we live and work, not a territory on a map. That&apos;s reflected in how we operate: fully insured on every job, a real phone number answered by a real person, and a crew that treats a house move in Greenham with the same care as one in Donnington or right here in Thatcham.
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-slate-50 px-6 py-16">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-bold text-slate-900">Our Services in Newbury</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {[
              { icon: Truck, title: "House Removals", href: "/house-removals/newbury/wash-common", body: "Full-service house moves across Newbury — packing, protection, loading and careful placement in your new home, with a real Standard or Premium price before you book." },
              { icon: Sofa, title: "Man and Van", href: "/man-and-van/newbury/wash-common", body: "Flexible, hourly-priced help for smaller moves, single items, or student relocations around Newbury — £45/hr for one man and a van." },
              { icon: PackageOpen, title: "House Clearance", href: "/house-clearance/newbury/wash-common", body: "Garage, shed, loft, garden and full-property clearances across Newbury, including probate and landlord turnarounds — licensed waste carrier, responsible disposal." },
              { icon: KeyRound, title: "End of Tenancy Cleaning", href: "/booking/end-of-tenancy", body: "Deposit-back-standard cleaning for Newbury renters and landlords, meeting letting-agent checkout requirements." },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <s.icon className="h-8 w-8 text-brand-purple-700" />
                <h3 className="mt-3 font-display text-xl font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.body}</p>
                <Link href={s.href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-purple-700 hover:underline">
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local guides / blog section */}
      <section className="px-6 py-16">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-green-600" />
            <h2 className="font-display text-3xl font-bold text-slate-900">Newbury Moving Guides</h2>
          </div>
          <p className="mb-8 text-slate-600">
            Real, local advice from a team that actually moves people around Newbury every week — not generic tips lifted from somewhere else.
          </p>
          <div className="space-y-6">
            {GUIDES.map((g) => <GuideArticle key={g.title} guide={g} />)}
          </div>
        </div>
      </section>

      <FaqSection title="Removals in Newbury — Questions" faqs={FAQS} />
      <ContactSection town="Newbury" whatsappMessage={whatsappMessage} />

      <section className="bg-brand-green-700 px-6 py-14 text-center text-white">
        <div className="container mx-auto max-w-2xl">
          <h2 className="font-display text-2xl font-bold">Ready to move in Newbury?</h2>
          <p className="mt-2 text-brand-green-100">Get your free, no-obligation quote — usually back to you in minutes.</p>
          <Button asChild size="lg" className="mt-6 bg-white text-brand-green-800 hover:bg-brand-green-50">
            <Link href="/booking">Get a free Quote <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <p className="sr-only">
        Serving Newbury, Berkshire including RG14, RG18, RG19 and RG20 — Wash Common, Speen, Donnington, Greenham, Cold Ash, Chieveley, Shaw, West Mills and Newbury Racecourse. {COMPANY_ADDRESS}.
      </p>
    </div>
  );
}
