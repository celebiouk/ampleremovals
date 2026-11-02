import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#581c87",
          borderRadius: 7,
        }}
      >
        <span style={{ color: "#16a34a", fontSize: 20, fontWeight: 800, fontFamily: "Arial, sans-serif" }}>L</span>
      </div>
    ),
    size
  );
}
