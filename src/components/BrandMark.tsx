import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

export default function BrandMark({ className, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <rect x="6.5" y="7" width="10.5" height="8.5" rx="1.5" fill="white" />
      <path
        d="M9 10.25h5.5M9 12.5h3.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
      <rect x="15" y="16.5" width="10.5" height="8.5" rx="1.5" fill="white" />
      <path
        d="M17.5 19.75h5.5M17.5 22h3.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M15 11.25h3.25a2 2 0 0 1 2 2v3.25"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="15" cy="11.25" r="1.3" fill="#93c5fd" />
    </svg>
  );
}
