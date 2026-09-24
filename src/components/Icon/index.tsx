import type { ReactNode } from 'react';
import { iconStyles } from './styles';

const paths = {
  select: <path d="M5 3l14 7-6 2-2 6-6-15z" />,
  pan: <path d="M8 12V5.5a1.5 1.5 0 013 0V11m0-6.5a1.5 1.5 0 013 0V11m0-4a1.5 1.5 0 013 0v7a6 6 0 01-6 6h-1a6 6 0 01-5-3l-2-3.5a1.4 1.4 0 012.3-1.5L8 14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  fit: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  undo: <><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 010 12h-3" /></>,
  redo: <><path d="M15 14l5-5-5-5" /><path d="M20 9H10a6 6 0 000 12h3" /></>,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" /></>,
  download: <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />,
  upload: <path d="M12 16V5m0 0L8 9m4-4l4 4M5 20h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  'chevron-down': <path d="M6 9l6 6 6-6" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />,
  swap: <path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M4 17l5-5 4 4 3-3 4 4" /></>,
  code: <path d="M8 8l-4 4 4 4M16 8l4 4-4 4" />,
  file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /></>,
  'dg-usecase': <><ellipse cx="15" cy="12" rx="6" ry="4" /><circle cx="5" cy="8.5" r="1.6" /><path d="M5 10.2V15M2.5 12h5M5 15l-2 3.5M5 15l2 3.5M8 12h1" /></>,
  'dg-class': <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9h16M4 15h16" /></>,
  'dg-er': <><rect x="2.5" y="8" width="7" height="8" rx="1" /><path d="M14.5 12l3.5-4 3.5 4-3.5 4zM9.5 12h5" /></>,
  'dg-logical': <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9h16M4 14h16M10 9v11" /></>,
  'dg-sequence': <><path d="M6 4v16M18 4v16" /><path d="M6 9h11m0 0l-3-2m3 2l-3 2M18 15H7m0 0l3-2m-3 2l3 2" /></>,
  'dg-architecture': <><rect x="3" y="4" width="7" height="6" rx="1.2" /><rect x="14" y="14" width="7" height="6" rx="1.2" /><path d="M10 7h4a3 3 0 013 3v4M15 12l2 2 2-2" /></>,
  'n-box': <><rect x="3.5" y="6" width="17" height="12" rx="2" /><rect x="6" y="8.5" width="5" height="2.5" rx="0.6" /></>,
  'n-actor': <><circle cx="12" cy="6" r="2.5" /><path d="M12 8.5V15M7 11h10M12 15l-3.5 5M12 15l3.5 5" /></>,
  'n-usecase': <ellipse cx="12" cy="12" rx="9" ry="5.5" />,
  'n-system': <rect x="3.5" y="4.5" width="17" height="15" rx="2" strokeDasharray="3 2.5" />,
  'n-note': <><path d="M5 4h10l4 4v12H5z" /><path d="M15 4v4h4M8 12h8M8 15.5h5" /></>,
  'n-class': <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9h16M4 15h16" /></>,
  'n-interface': <><circle cx="8" cy="12" r="3.5" /><path d="M11.5 12H21" /></>,
  'n-enum': <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9h16M8 13h8M8 16.5h5" /></>,
  'n-entity': <rect x="3.5" y="7" width="17" height="10" rx="1.5" />,
  'n-relationship': <path d="M12 4l9 8-9 8-9-8z" />,
  'n-attribute': <><ellipse cx="12" cy="12" rx="8.5" ry="5" /><path d="M8.5 13.5h7" /></>,
  'n-table': <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9h16M4 14h16M10 9v11" /></>,
  'n-participant': <><rect x="5" y="3.5" width="14" height="6" rx="1.5" /><path d="M12 9.5V21" strokeDasharray="2 2.5" /></>,
  'n-fragment': <><rect x="3.5" y="5" width="17" height="14" rx="1.5" /><path d="M3.5 5h7v3.5l-1.5 1.5H3.5" /></>,
  'e-assoc': <path d="M4 12h16" />,
  'e-directed': <path d="M4 12h15M14 8l5 4-5 4" />,
  'e-include': <><path d="M4 12h11" strokeDasharray="3 2.5" /><path d="M14 8l5 4-5 4" /></>,
  'e-extend': <><path d="M20 12H9" strokeDasharray="3 2.5" /><path d="M10 8l-5 4 5 4" /></>,
  'e-inherit': <><path d="M4 12h9" /><path d="M13 7.5l7 4.5-7 4.5z" /></>,
  'e-realize': <><path d="M4 12h9" strokeDasharray="3 2.5" /><path d="M13 7.5l7 4.5-7 4.5z" /></>,
  'e-aggregation': <><path d="M12 12h8" /><path d="M4 12l4-3 4 3-4 3z" /></>,
  'e-composition': <><path d="M12 12h8" /><path d="M4 12l4-3 4 3-4 3z" fill="currentColor" /></>,
  'e-dependency': <><path d="M4 12h11" strokeDasharray="3 2.5" /><path d="M14 8l5 4-5 4" /></>,
  'e-accent': <path d="M4 12h15M14 7.5l5 4.5-5 4.5" strokeWidth={2.4} />,
  'e-api': <><path d="M4 8v8" /><path d="M4 12h15M14 8l5 4-5 4" /></>,
  'e-relation': <path d="M4 12h14M18 12l-4-4M18 12l-4 4M6 8v8" />,
  'e-relation-dashed': <><path d="M4 12h10" strokeDasharray="3 2.5" /><path d="M18 12l-4-4M18 12l-4 4M18 12h-4M6 8v8" /></>,
  'e-sync': <><path d="M4 12h13" /><path d="M17 8.5l4 3.5-4 3.5z" fill="currentColor" /></>,
  'e-async': <path d="M4 12h15M15 8.5l4 3.5-4 3.5" />,
  'e-return': <><path d="M20 12H10" strokeDasharray="3 2.5" /><path d="M11 8.5L7 12l4 3.5" /></>,
  'e-link': <path d="M4 12h16" strokeDasharray="1 3" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
  /** Ícone que carrega significado sozinho recebe título; decorativo fica aria-hidden. */
  title?: string;
}

export function Icon({ name, className = '', size = 16, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${iconStyles.base} ${className}`}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {paths[name]}
    </svg>
  );
}
