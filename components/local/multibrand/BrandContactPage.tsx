import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { BrandChrome } from "@/components/local/multibrand/BrandChrome";
import { PhoneTile } from "@/components/local/multibrand/PhoneTile";
import { getBrandTheme } from "@/components/local/multibrand/themes/registry";
import type { Brand } from "@/lib/brands";
import type { ComponentType } from "react";

export function BrandContactPage({
  brand,
  logo: Logo,
  quoteHref,
  whatsappMessage,
}: {
  brand: Brand;
  logo: ComponentType<{ className?: string; variant?: "color" | "white" }>;
  quoteHref: string;
  whatsappMessage: string;
}) {
  const mapQuery = encodeURIComponent(`${brand.address.line1}, ${brand.address.town}, ${brand.address.postcode}`);

  const theme = getBrandTheme(brand.slug);
  if (theme) {
    const { ui } = theme;
    const tile = "flex flex-col items-start gap-2 " + ui.card;
    return (
      <BrandChrome brand={brand} logo={Logo} quoteHref={quoteHref} whatsappMessage={whatsappMessage}>
        <theme.PageHero
          eyebrow="Contact Us"
          title={`Talk to ${brand.name} directly`}
          intro="Call, WhatsApp, or email. A real person answers, not a call centre. Most questions get a straight answer in minutes."
        />
        <section className={ui.section}>
          <div className="grid gap-6 sm:grid-cols-2">
            <PhoneTile phone={brand.phone} phoneHref={brand.phoneHref} className={tile} iconClassName={ui.icon} titleClassName={ui.cardTitle} bodyClassName={ui.cardBody} source={`${brand.slug}_contact_page`} />
            <div className={tile}>
              <Mail className={`h-6 w-6 ${ui.icon}`} />
              <p className={ui.cardTitle}>Email</p>
              <a href={`mailto:${brand.emailAddress}`} className={`${ui.cardBody} break-words underline-offset-4 hover:underline`}>{brand.emailAddress}</a>
            </div>
            <div className={tile}>
              <MapPin className={`h-6 w-6 ${ui.icon}`} />
              <p className={ui.cardTitle}>Based at</p>
              <p className={ui.cardBody}>{brand.address.line1}, {brand.address.town}, {brand.address.postcode}</p>
            </div>
            <div className={tile}>
              <Clock className={`h-6 w-6 ${ui.icon}`} />
              <p className={ui.cardTitle}>Serving</p>
              <p className={ui.cardBody}>{brand.towns.join(" & ")}</p>
            </div>
          </div>
          <div className="mt-10">
            <WhatsAppButton message={whatsappMessage} whatsappNumber={brand.whatsappNumber} />
          </div>
        </section>
        <section className="mx-auto w-full max-w-5xl px-5 pb-20 md:px-8">
          <div className="overflow-hidden border border-black/10">
            <iframe
              title={`${brand.name} location`}
              src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
              width="100%"
              height="380"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
        </section>
      </BrandChrome>
    );
  }

  return (
    <BrandChrome brand={brand} logo={Logo} quoteHref={quoteHref} whatsappMessage={whatsappMessage}>
      <section className="px-6 pb-16 pt-14 text-white" style={{ background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.primaryDark})` }}>
        <div className="container mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide opacity-80">Contact Us</p>
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">Talk to {brand.name} Directly</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg opacity-90">
            Call, WhatsApp, or email — a real person answers, not a call centre. Most questions get a straight answer in minutes.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="container mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <PhoneTile phone={brand.phone} phoneHref={brand.phoneHref} color={brand.colors.primary} source={`${brand.slug}_contact_page`} />
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 p-6 text-center">
            <Mail className="h-6 w-6" style={{ color: brand.colors.primary }} />
            <p className="font-display font-bold text-slate-900">Email</p>
            <a href={`mailto:${brand.emailAddress}`} className="text-sm text-slate-600 hover:underline">{brand.emailAddress}</a>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 p-6 text-center">
            <MapPin className="h-6 w-6" style={{ color: brand.colors.primary }} />
            <p className="font-display font-bold text-slate-900">Based at</p>
            <p className="text-sm text-slate-600">{brand.address.line1}, {brand.address.town}, {brand.address.postcode}</p>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 p-6 text-center">
            <Clock className="h-6 w-6" style={{ color: brand.colors.primary }} />
            <p className="font-display font-bold text-slate-900">Serving</p>
            <p className="text-sm text-slate-600">{brand.towns.join(" & ")}</p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <WhatsAppButton message={whatsappMessage} whatsappNumber={brand.whatsappNumber} />
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="container mx-auto max-w-5xl overflow-hidden rounded-2xl border border-slate-200">
          <iframe
            title={`${brand.name} location`}
            src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
            width="100%"
            height="360"
            style={{ border: 0 }}
            loading="lazy"
          />
        </div>
      </section>
    </BrandChrome>
  );
}
