import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LOCATIONS, LOCATION_MAP, SERVICE_KEYWORDS } from "@/lib/locations";
import { Phone, Mail, MapPin, CheckCircle2, ArrowRight, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function generateStaticParams() {
  return LOCATIONS.map((location) => ({
    location: location.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ location: string }> }): Promise<Metadata> {
  const { location: slug } = await params;
  const location = LOCATION_MAP[slug];

  if (!location) {
    return {
      title: "Location Not Found",
    };
  }

  const title = `Professional Removal Services in ${location.name} | Ample Removals`;
  const description = `Looking for reliable house removals, man and van, or cleaning services in ${location.name}, ${location.county}? Ample Removals offers professional moving services covering ${location.name} and surrounding areas. Get your free quote today!`;

  const keywords = [
    `removals ${location.name}`,
    `house removals ${location.name}`,
    `man and van ${location.name}`,
    `removal company ${location.name}`,
    `movers ${location.name}`,
    `house clearance ${location.name}`,
    `cleaning services ${location.name}`,
    ...location.nearbyAreas.map(area => `removals near ${area}`),
  ];

  return {
    title,
    description,
    keywords: keywords.join(", "),
    openGraph: {
      title,
      description,
      url: `https://www.ampleremovals.com/locations/${slug}`,
      siteName: "Ample Removals",
      type: "website",
      locale: "en_GB",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://www.ampleremovals.com/locations/${slug}`,
    },
  };
}

export default async function LocationPage({ params }: { params: Promise<{ location: string }> }) {
  const { location: slug } = await params;
  const location = LOCATION_MAP[slug];

  if (!location) {
    notFound();
  }

  const services = [
    {
      title: "House & Business Removals",
      slug: "removals",
      description: `Professional house and office removals in ${location.name}. We handle everything from packing to unpacking with care and efficiency.`,
      keywords: SERVICE_KEYWORDS.removals,
    },
    {
      title: "Man and Van",
      slug: "man-and-van",
      description: `Affordable man and van services in ${location.name}. Perfect for small moves, single items, or student relocations.`,
      keywords: SERVICE_KEYWORDS.man_and_van,
    },
    {
      title: "House Clearance",
      slug: "house-clearance",
      description: `Complete house clearance services in ${location.name}. We clear, clean, and dispose of unwanted items responsibly.`,
      keywords: SERVICE_KEYWORDS.house_clearance,
    },
    {
      title: "House Cleaning",
      slug: "house-cleaning",
      description: `Professional house cleaning services in ${location.name}. Deep cleaning, regular cleaning, and one-off cleans available.`,
      keywords: SERVICE_KEYWORDS.house_cleaning,
    },
    {
      title: "End of Tenancy Cleaning",
      slug: "end-of-tenancy",
      description: `End of tenancy cleaning in ${location.name}. Guaranteed to meet landlord standards and help you get your deposit back.`,
      keywords: SERVICE_KEYWORDS.end_of_tenancy,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-purple-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-purple-800 to-brand-purple-950 py-20 text-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm backdrop-blur-sm">
              <MapPin className="h-4 w-4" />
              <span>{location.county}, {location.region}</span>
            </div>

            <h1 className="font-display text-4xl font-extrabold leading-tight md:text-6xl mb-6">
              Professional Removal Services in {location.name}
            </h1>

            <p className="text-xl text-purple-100 mb-8 max-w-2xl">
              Looking for reliable house removals, man and van, or cleaning services in {location.name}?
              Ample Removals is your trusted local removal company serving {location.name} and the surrounding {location.county} area.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/booking/removals">
                <Button size="lg" className="w-full sm:w-auto bg-brand-green-600 hover:bg-brand-green-500 text-white font-semibold">
                  Get Free Quote
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="tel:07344683477">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white bg-white/10 text-white hover:bg-white hover:text-brand-purple-800 backdrop-blur-sm">
                  <Phone className="mr-2 h-5 w-5" />
                  Call: 07344683477
                </Button>
              </a>
            </div>
          </div>

          {/* Right Column - Hero Image */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20">
              <Image
                src="/heroimage.png"
                alt={`Ample Removals professional movers in ${location.name}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Our Services in {location.name}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We offer a complete range of removal and cleaning services to homes and businesses across {location.name} and {location.county}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.slug} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-brand-purple-100 flex items-center justify-center mb-4">
                  <Truck className="h-6 w-6 text-brand-purple-700" />
                </div>

                <h3 className="font-display text-xl font-bold text-slate-900 mb-3">
                  {service.title}
                </h3>

                <p className="text-slate-600 mb-4 text-sm">
                  {service.description}
                </p>

                <Link href={`/booking/${service.slug}`}>
                  <Button variant="outline" className="w-full border-brand-purple-200 text-brand-purple-700 hover:bg-brand-purple-50">
                    Get Quote
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                {/* SEO Keywords - Hidden but indexed */}
                <div className="sr-only">
                  {service.keywords.slice(0, 5).map((keyword) => (
                    <span key={keyword}>{keyword} {location.name}, </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-slate-900 mb-8 text-center">
              Why Choose Ample Removals in {location.name}?
            </h2>

            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { title: "Local Knowledge", desc: `We know ${location.name} and ${location.county} inside out` },
                { title: "Fully Insured", desc: "Your belongings are protected throughout the move" },
                { title: "Professional Team", desc: "Experienced, uniformed, and friendly removal experts" },
                { title: "Competitive Prices", desc: "Transparent pricing with no hidden costs" },
                { title: "Flexible Service", desc: "We work around your schedule, including evenings and weekends" },
                { title: "Full Service Options", desc: "Packing, unpacking, storage, and cleaning available" },
              ].map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{benefit.title}</h3>
                    <p className="text-sm text-slate-600">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Area */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl font-bold text-slate-900 mb-6">
              Areas We Cover Near {location.name}
            </h2>

            <p className="text-slate-600 mb-8">
              Based in {location.name}, we provide removal services throughout {location.county} and the wider {location.region} region.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {location.nearbyAreas.map((area) => (
                <span key={area} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple-50 text-brand-purple-700 rounded-full text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  {area}
                </span>
              ))}
            </div>

            {/* SEO Content - Coverage */}
            <div className="mt-12 text-left bg-slate-50 rounded-xl p-8">
              <h3 className="font-display text-2xl font-bold text-slate-900 mb-4">
                Removals {location.name} - Professional Moving Services
              </h3>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 leading-relaxed mb-4">
                  Ample Removals is a trusted <strong>removal company in {location.name}</strong> offering professional <strong>house removals</strong>,
                  <strong> man and van services</strong>, and <strong>house clearance</strong> throughout {location.county}.
                  Whether you&apos;re moving home within {location.name}, relocating to nearby {location.nearbyAreas[0] || "areas"},
                  or need <strong>commercial removals</strong> for your business, our experienced team is here to help.
                </p>
                <p className="text-slate-700 leading-relaxed mb-4">
                  Our <strong>removal services in {location.name}</strong> include full packing and unpacking, furniture disassembly and reassembly,
                  secure transportation, and storage solutions. We serve residential and commercial clients across {location.region},
                  providing the same high standard of service whether you&apos;re moving a one-bedroom flat or a large family home.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Looking for <strong>affordable removals in {location.name}</strong>? Get your free, no-obligation quote today.
                  Call us on <strong>07344683477</strong> or book online in minutes. We&apos;re available 7 days a week to make your move stress-free.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-purple-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to Move in {location.name}?
          </h2>
          <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
            Get your free quote in under 2 minutes. No hidden fees, no obligations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking/removals">
              <Button size="lg" className="w-full sm:w-auto bg-brand-green-600 hover:bg-brand-green-500 text-white font-semibold">
                Get Free Quote Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="tel:07344683477">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white bg-white/10 text-white hover:bg-white hover:text-brand-purple-900 backdrop-blur-sm">
                <Phone className="mr-2 h-5 w-5" />
                07344683477
              </Button>
            </a>
            <a href="mailto:hello@ampleremovals.com">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white bg-white/10 text-white hover:bg-white hover:text-brand-purple-900 backdrop-blur-sm">
                <Mail className="mr-2 h-5 w-5" />
                Email Us
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
