import Link from "next/link";
import { Phone, ArrowRight, Truck, PackageOpen, Sofa, KeyRound, Sparkles, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StickyQuoteBar } from "@/components/local/StickyQuoteBar";
import { TrustBar, GuideArticle, ContactSection, FaqSection, COMPANY_ADDRESS, COMPANY_PHONE_DISPLAY, type Guide } from "@/components/local/flagship/FlagshipShared";

const GUIDES: Guide[] = [
  {
    title: "Moving to Thatcham: A Newcomer's Guide",
    intro: "If you're moving to Thatcham for the first time, here's what we wish every new arrival knew — written by the team that's actually based here.",
    paragraphs: [
      "Thatcham is one of the oldest continuously inhabited places in Britain — Mesolithic flint tools found near the Kennet have been dated to roughly 10,000 years ago, making this stretch of the Kennet valley genuinely ancient ground. You wouldn't necessarily guess it walking round the modern Broadway shopping parade, but it's a nice bit of trivia for your first pub quiz as a new local.",
      "For day-to-day life, Thatcham railway station puts you on the same Paddington line as Newbury, with journey times only a few minutes longer — handy if you're commuting and chose Thatcham for the slightly lower house prices. The Broadway has your essentials (Waitrose, Boots, a proper high street feel), and Colthrop Retail Park covers the bigger weekly shop and DIY needs.",
      "Thatcham Nature Discovery Centre, right on the edge of town, is one of the area's best-kept secrets — a nature reserve with lakes and reed beds that most Newbury residents don't even know exists. Worth a walk once you've unpacked.",
      "For council and bin collections, Thatcham falls under West Berkshire Council, same as Newbury — one registration covers both if you're moving between the two.",
    ],
  },
  {
    title: "Thatcham vs Newbury: Where Should You Move?",
    intro: "We get asked this a lot, being based in one and moving people constantly between both — here's an honest comparison, not a sales pitch for either.",
    paragraphs: [
      "Newbury has the bigger town centre, a wider choice of shops and restaurants, and Newbury Racecourse for the odd race day out. It's also generally a touch more expensive for equivalent housing, and the town centre streets can be tighter for parking.",
      "Thatcham tends to offer more house for your money, particularly in the newer developments around Dunston Park and Crookham, with easier parking and a quieter, more residential feel. You trade a bit of the town-centre buzz for a shorter commute to the station and, usually, a bigger garden.",
      "Honestly, for most families we move, the decision comes down to which specific street and school catchment works — both towns are a genuinely short drive apart (we do it most days), so you're not cutting yourself off from either by choosing one.",
    ],
  },
  {
    title: "Removal Day Parking Near Thatcham Station and the Broadway",
    intro: "Thatcham's generally easier for removal-van parking than Newbury town centre, but the streets right around the station and Broadway still need a bit of planning.",
    paragraphs: [
      "Houses on the older streets near the Broadway and station — Northfield Road, Chamberhouse Road and similar — can have on-street parking that fills up fast, especially on weekday mornings when commuters are heading for the train. If that's you, an early start before the commuter rush tends to work best.",
      "Newer estates around Crookham, Dunston Park and Pinchington generally have driveways or allocated parking, which makes removal day considerably simpler — just let us know if there's a shared access road or a visitor-permit scheme so we bring the right size van.",
    ],
  },
  {
    title: "Best Thatcham Neighbourhoods for Families",
    intro: "Thatcham's grown a lot over the last couple of decades, and different parts of town suit different stages of family life.",
    paragraphs: [
      "Crookham and Dunston Park, on the eastern side, are mostly newer-build estates popular with young families — good-sized gardens, allocated parking, and close to Kennet School. Henwick, closer to the centre, mixes older housing with some newer infill, a short walk to the Broadway and primary schools. Colthrop, nearer the retail park, is more mixed residential and light industrial — practical rather than picturesque, but handy for the shops.",
      "If you want to be close to Thatcham Moor and the Discovery Centre's green space, the streets on the northern edge of town back onto genuinely pleasant countryside without sacrificing a short walk into the centre.",
    ],
  },
  {
    title: "How Much Does a House Removal Cost in Thatcham?",
    intro: "Since we're literally based here, Thatcham moves are often some of our most efficiently priced jobs — less drive time means more of the quote goes toward the actual move.",
    paragraphs: [
      "As with any move, the main factors are home size, how much is being moved, and access at both ends. A Thatcham-to-Thatcham move, or a short hop to Newbury, tends to be quicker than a long-distance relocation simply because there's less travel time involved.",
      "Enter your postcode and a few details on our booking page for a real Standard and Premium price instantly — no waiting for a callback, and a small deposit secures your date.",
    ],
  },
];

const FAQS = [
  { q: "Are you actually based in Thatcham?", a: "Yes — our office is at 41 Rosedale Garden, Thatcham. We're a genuinely local team, not a national firm with a call centre elsewhere." },
  { q: "How long have you been serving Thatcham?", a: "Over 7 years. We've moved families and businesses across Thatcham, from the Broadway to Crookham and Dunston Park, since 2019." },
  { q: "Do you cover Crookham, Henwick, Colthrop and Dunston Park?", a: "Yes — every part of Thatcham, plus the wider West Berkshire area including Newbury." },
  { q: "Can I get a same-day quote?", a: "Yes — enter a few details on our booking page and see a real price instantly, no waiting for a callback." },
  { q: "Do you also cover Newbury?", a: "Yes, constantly — Newbury's a few minutes from our Thatcham base and one of the areas we serve most." },
];

export function ThatchamPage() {
  const whatsappMessage = "Hi, I'm looking to book a removal in Thatcham. Can you help?";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MovingCompany",
        name: "Ample Removals — Thatcham",
        description: "Removals, man and van, house clearance, rubbish removal and end-of-tenancy cleaning based in Thatcham, Berkshire, serving the town and surrounding West Berkshire area for over 7 years.",
        address: { "@type": "PostalAddress", streetAddress: "41 Rosedale Garden", addressLocality: "Thatcham", postalCode: "RG19 3LE", addressCountry: "GB" },
        areaServed: [{ "@type": "City", name: "Thatcham" }, { "@type": "City", name: "Newbury" }],
        telephone: "+443335772070",
        email: "hello@ampleremovals.com",
        priceRange: "££",
        url: "https://www.ampleremovals.com/locations/thatcham",
        foundingDate: "2019",
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      ...GUIDES.map((g) => ({
        "@type": "Article",
        headline: g.title,
        articleSection: "Thatcham Moving Guides",
        about: "House removals in Thatcham, Berkshire",
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
      <section className="bg-gradient-to-br from-brand-green-800 via-brand-green-700 to-brand-purple-900 px-6 pb-16 pt-28 text-white lg:pt-36">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="mb-3 inline-flex items-center gap-1.5 font-sans text-sm font-semibold uppercase tracking-wide text-brand-green-200">
            <Home className="h-4 w-4" /> Our home town · Thatcham, Berkshire · RG18 / RG19
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Thatcham&apos;s Own Removal Company — Based Right Here, for Over 7 Years
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-brand-green-50">
            Ample Removals isn&apos;t a national firm that happens to cover Thatcham — this is where we&apos;re actually based. 41 Rosedale Garden, Thatcham, RG19 3LE. Over 7 years moving local families and businesses, with the same crew, the same van, the same honest pricing every time.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-brand-green-800 hover:bg-brand-green-50">
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
          <h2 className="font-display text-3xl font-bold text-slate-900">Proudly Based in Thatcham</h2>
          <div className="mt-6 space-y-4 text-slate-700">
            <p>
              Most removal companies you'll find online are based somewhere else entirely — a depot in Reading, a head office in another county, a van dispatched from wherever's convenient for them. Ample Removals is different: our office is at 41 Rosedale Garden, right here in Thatcham. This is genuinely where we live, where our van is parked overnight, and where we've built a business over the past 7-plus years one local move at a time.
            </p>
            <p>
              Being based in Thatcham means we know the town properly — which streets near the Broadway get busy at commuter times, which estates in Crookham and Dunston Park have easy parking, and how to get a van in and out of the older housing near the station without a fuss. It also means when something changes last-minute — a date shifts, access turns out trickier than expected — you're dealing with a team round the corner, not a call centre three counties away.
            </p>
            <p>
              We're committed to Thatcham and the wider West Berkshire area because it's our home, not a market we expanded into. Every job — whether it's a family moving a few streets over in Thatcham or a full house clearance in Newbury — gets the same fully insured, properly planned treatment.
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-slate-50 px-6 py-16">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-bold text-slate-900">Our Services in Thatcham</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {[
              { icon: Truck, title: "House Removals", href: "/booking", body: "Full-service house moves starting right here in Thatcham — packing, protection, loading and careful placement in your new home, with a real Standard or Premium price before you book." },
              { icon: Sofa, title: "Man and Van", href: "/booking/man-and-van", body: "Flexible, hourly-priced help for smaller Thatcham moves, single items, or student relocations — £45/hr for one man and a van." },
              { icon: PackageOpen, title: "House Clearance", href: "/house-clearance/newbury/cold-ash", body: "Garage, shed, loft, garden and full-property clearances across Thatcham, including probate and landlord turnarounds — licensed waste carrier, responsible disposal." },
              { icon: KeyRound, title: "End of Tenancy Cleaning", href: "/booking/end-of-tenancy", body: "Deposit-back-standard cleaning for Thatcham renters and landlords, meeting letting-agent checkout requirements." },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <s.icon className="h-8 w-8 text-brand-green-700" />
                <h3 className="mt-3 font-display text-xl font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.body}</p>
                <Link href={s.href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-green-700 hover:underline">
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
            <h2 className="font-display text-3xl font-bold text-slate-900">Thatcham Moving Guides</h2>
          </div>
          <p className="mb-8 text-slate-600">
            Written by the team that&apos;s actually based in Thatcham — not generic advice copied from somewhere else.
          </p>
          <div className="space-y-6">
            {GUIDES.map((g) => <GuideArticle key={g.title} guide={g} />)}
          </div>
        </div>
      </section>

      <FaqSection title="Removals in Thatcham — Questions" faqs={FAQS} />
      <ContactSection town="Thatcham" whatsappMessage={whatsappMessage} />

      <section className="bg-brand-purple-900 px-6 py-14 text-center text-white">
        <div className="container mx-auto max-w-2xl">
          <h2 className="font-display text-2xl font-bold">Ready to move in Thatcham?</h2>
          <p className="mt-2 text-brand-purple-200">Get your free, no-obligation quote — usually back to you in minutes.</p>
          <Button asChild size="lg" className="mt-6 bg-brand-green-600 hover:bg-brand-green-500">
            <Link href="/booking">Get a free Quote <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <p className="sr-only">
        Based in Thatcham, Berkshire, RG19 — serving the Broadway, Crookham, Henwick, Colthrop, Dunston Park and Pinchington, plus nearby Newbury. {COMPANY_ADDRESS}.
      </p>
    </div>
  );
}
