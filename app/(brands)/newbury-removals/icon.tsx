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
          background: "#14532d",
          borderRadius: 7,
        }}
      >
        <span style={{ color: "#ca8a04", fontSize: 20, fontWeight: 800, fontFamily: "Arial, sans-serif" }}>N</span>
      </div>
    ),
    size
  );
}
