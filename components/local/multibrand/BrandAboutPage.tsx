import { BrandChrome } from "@/components/local/multibrand/BrandChrome";
import type { Brand } from "@/lib/brands";
import type { ComponentType } from "react";

export interface BrandAboutContent {
  h1: string;
  intro: string;
  paragraphs: string[];
  values: { title: string; body: string }[];
  quoteHref: string;
  whatsappMessage: string;
}

export function BrandAboutPage({
  brand,
  logo: Logo,
  content,
}: {
  brand: Brand;
  logo: ComponentType<{ className?: string; variant?: "color" | "white" }>;
  content: BrandAboutContent;
}) {
  return (
    <BrandChrome brand={brand} logo={Logo} quoteHref={content.quoteHref} whatsappMessage={content.whatsappMessage}>
      <section className="px-6 pb-16 pt-14 text-white" style={{ background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.primaryDark})` }}>
        <div className="container mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide opacity-80">About Us</p>
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">{content.h1}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg opacity-90">{content.intro}</p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="container mx-auto max-w-3xl space-y-4 text-slate-700">
          {content.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-16">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-bold text-slate-900">What matters to us</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {content.values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="font-display text-lg font-bold text-slate-900">{v.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </BrandChrome>
  );
}
