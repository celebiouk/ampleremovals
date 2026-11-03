import { Archivo, Instrument_Sans } from "next/font/google";

// ManyVans: Archivo's width axis lets us set lettering in the extra-wide black
// cut that looks like van-door signwriting. Instrument Sans keeps long copy calm.
export const mvDisplay = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-mv-display",
  display: "swap",
});

export const mvBody = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-mv-body",
  display: "swap",
});
