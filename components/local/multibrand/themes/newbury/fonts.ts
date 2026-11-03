import { Bodoni_Moda, Jost } from "next/font/google";

// Newbury Removals: Bodoni Moda's high-contrast didone is the face of racecards
// and members' badges; Jost (a Futura cousin) keeps the supporting text crisp.
export const nbDisplay = Bodoni_Moda({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--font-nb-display",
  display: "swap",
});

export const nbBody = Jost({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-nb-body",
  display: "swap",
});
