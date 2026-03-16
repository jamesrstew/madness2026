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
          background: "#8B6914",
          borderRadius: "6px",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Basketball outline */}
          <circle cx="12" cy="12" r="10" stroke="#FAFAF7" strokeWidth="1.5" />
          {/* Horizontal seam */}
          <line x1="2" y1="12" x2="22" y2="12" stroke="#FAFAF7" strokeWidth="1" />
          {/* Vertical seam */}
          <line x1="12" y1="2" x2="12" y2="22" stroke="#FAFAF7" strokeWidth="1" />
          {/* Left curve */}
          <path d="M9 2.5C9 8 9 16 9 21.5" stroke="#FAFAF7" strokeWidth="1" strokeLinecap="round" />
          {/* Right curve */}
          <path d="M15 2.5C15 8 15 16 15 21.5" stroke="#FAFAF7" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
