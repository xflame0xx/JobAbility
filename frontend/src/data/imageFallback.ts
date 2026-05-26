import type { SyntheticEvent } from "react";

export const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="360" height="220" viewBox="0 0 360 220">
      <defs>
        <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#4338ca"/>
          <stop offset="1" stop-color="#0ea5e9"/>
        </linearGradient>
      </defs>
      <rect width="360" height="220" rx="18" fill="url(#brand)"/>
      <path d="M136 58h74a22 22 0 0 1 22 22v57h-13V82a11 11 0 0 0-11-11h-55v79l-17 7V58Z" fill="#fff" opacity=".96"/>
      <circle cx="185" cy="94" r="9" fill="#fbbf24"/>
      <path d="M164 139c14-31 42-42 42-9 0 15-11 23-22 27l-20-18Z" fill="#fff"/>
      <text x="180" y="193" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#ffffff">
        JobAbility
      </text>
    </svg>
  `);

export const setFallbackImage = (
  event: SyntheticEvent<HTMLImageElement>,
) => {
  const image = event.currentTarget;

  image.onerror = null;
  image.src = FALLBACK_IMAGE;
};
