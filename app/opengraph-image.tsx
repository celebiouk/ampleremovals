import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

/**
 * Site-wide social share image (1200x630) — the Ample Removals logo centred on
 * the brand purple. Next.js picks this up automatically for EVERY page under
 * app/, so any link shared from the site (homepage, a quote page, a location
 * page, anything) shows this image, without each page having to set it.
 *
 * The source logo is square; social platforms crop to ~1.91:1, so rather than
 * letting them crop it badly we compose it ourselves onto a correctly-sized
 * branded canvas.
 */
export const runtime = "nodejs";
export const alt = "Ample Removals — Professional Removal Services UK";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(path.join(process.cwd(), "public", "ampleremovallog.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4c1d95 0%, #6b21a8 55%, #7e22ce 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="" width={420} height={406} />
        <div
          style={{
            marginTop: 28,
            fontSize: 34,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: -0.5,
          }}
        >
          Professional Removals Across the UK
        </div>
        <div style={{ marginTop: 10, fontSize: 24, color: "#d8b4fe" }}>
          Fixed prices · Fully insured · Free quote in minutes
        </div>
      </div>
    ),
    size
  );
}
