import { Image } from "expo-image";

const LOGO = require("../../assets/logo.png");

/** The Ample Removals brand logo. */
export function Logo({ size = 40 }: { size?: number }) {
  return <Image source={LOGO} style={{ width: size, height: size }} contentFit="contain" />;
}
