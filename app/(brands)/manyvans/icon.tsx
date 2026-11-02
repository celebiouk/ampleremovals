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
          background: "#1e293b",
          borderRadius: 7,
        }}
      >
        <span style={{ color: "#dc2626", fontSize: 18, fontWeight: 800, fontFamily: "Arial, sans-serif" }}>MV</span>
      </div>
    ),
    size
  );
}
