import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const baseProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function CircuitIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M8 6h5a3 3 0 0 1 3 3v7M6 8v4a3 3 0 0 0 3 3h7" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return <svg {...baseProps} {...props}><path d="M12 5v14M5 12h14" /></svg>;
}

export function FolderIcon(props: IconProps) {
  return <svg {...baseProps} {...props}><path d="M3.5 7.5v10a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-6l-2-3h-5a2 2 0 0 0-2 2v1Z" /></svg>;
}

export function CloseIcon(props: IconProps) {
  return <svg {...baseProps} {...props}><path d="m7 7 10 10M17 7 7 17" /></svg>;
}

export function ChevronIcon(props: IconProps) {
  return <svg {...baseProps} {...props}><path d="m9 18 6-6-6-6" /></svg>;
}

