import { Gabarito, Figtree } from "next/font/google";

// Newbury Removals: Gabarito is a friendly, rounded-geometric display face with
// real character at heavy weights; Figtree keeps long copy open and easy to read.
export const nbDisplay = Gabarito({
  subsets: ["latin"],
  variable: "--font-nb-display",
  display: "swap",
});

export const nbBody = Figtree({
  subsets: ["latin"],
  variable: "--font-nb-body",
  display: "swap",
});
