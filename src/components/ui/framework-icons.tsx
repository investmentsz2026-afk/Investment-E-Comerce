import type { SVGProps } from "react";

/**
 * Icono vectorial oficial de la app de pagos YAPE (Perú)
 */
export function YapeAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect width="24" height="24" rx="6" fill="#742284" />
      <path
        d="M6.2 7.2L9.6 13.3V17.2H11.9V13.3L15.3 7.2H12.8L10.8 11.1L8.8 7.2H6.2Z"
        fill="#FFFFFF"
      />
      <circle cx="17.2" cy="15.4" r="2.1" fill="#00E5B8" />
      <path
        d="M15.8 9.2L18.6 6.8"
        stroke="#00E5B8"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Icono vectorial oficial de la app de pagos PLIN (Perú)
 */
export function PlinAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect width="24" height="24" rx="6" fill="#00B4CC" />
      <path
        d="M7.5 17V7H12.2C14.5 7 16 8.3 16 10.4C16 12.5 14.5 13.8 12.2 13.8H9.9V17H7.5ZM9.9 11.8H12C13.1 11.8 13.7 11.2 13.7 10.4C13.7 9.5 13.1 9 12 9H9.9V11.8Z"
        fill="#FFFFFF"
      />
      <circle cx="17.4" cy="15.5" r="2" fill="#FFD60A" />
    </svg>
  );
}
