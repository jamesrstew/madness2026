import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #A67D1A 0%, #8B6914 100%)",
          borderRadius: "36px",
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Basketball outline */}
          <circle cx="12" cy="12" r="10" stroke="#FAFAF7" strokeWidth="1.2" />
          {/* Horizontal seam */}
          <line x1="2" y1="12" x2="22" y2="12" stroke="#FAFAF7" strokeWidth="0.8" />
          {/* Vertical seam */}
          <line x1="12" y1="2" x2="12" y2="22" stroke="#FAFAF7" strokeWidth="0.8" />
          {/* Left curve */}
          <path d="M9 2.5C9 8 9 16 9 21.5" stroke="#FAFAF7" strokeWidth="0.8" strokeLinecap="round" />
          {/* Right curve */}
          <path d="M15 2.5C15 8 15 16 15 21.5" stroke="#FAFAF7" strokeWidth="0.8" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
