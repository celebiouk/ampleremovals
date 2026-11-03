import { Fraunces, Hanken_Grotesk } from "next/font/google";

// Thatcham Movers: Fraunces' SOFT/WONK axes give a warm, slightly irregular
// serif that reads as a local firm, not a franchise. Hanken Grotesk is the
// plain-spoken text face.
export const thDisplay = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  variable: "--font-th-display",
  display: "swap",
});

export const thBody = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-th-body",
  display: "swap",
});
