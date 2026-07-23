// Minimal stroke icons for nav (blue per mockup 1). 24x24 viewBox.
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const HomeIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M10 21v-6h4v6" />
  </svg>
);

export const PlaneIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M10.5 13.5 3 11l1.5-2 6.5 1L16 4.5c.6-.6 1.6-.6 2.1 0 .6.6.6 1.5 0 2.1L13 12l1 6.5-2 1.5-2.5-7.5z" />
  </svg>
);

export const HotelIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M3 20V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14" />
    <path d="M1 20h22" />
    <path d="M8 8h2v2H8zM14 8h2v2h-2zM8 13h2v2H8zM14 13h2v2h-2z" />
  </svg>
);

export const PalmIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M12 21c0-6 .5-10 2-13" />
    <path d="M14 8c-3-2.5-6-2.5-9-.5 3 .5 5 1.5 6.5 3" />
    <path d="M14 8c0-3 2-5 5-5.5-1 2-1.5 3.5-1.5 5" />
    <path d="M14 8c3-1.5 5.5-1 7.5 1-2.5 0-4.5.5-6 1.5" />
    <path d="M4 21h16" />
  </svg>
);

export const CheckIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <path d="m8.5 12 2.5 2.5 5-5" />
  </svg>
);

export const CoinsIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <circle cx="9" cy="9" r="6" />
    <path d="M9 6.5v5M7 8h4" />
    <path d="M15.5 8.5a6 6 0 1 1-7 7" />
  </svg>
);

export const BulbIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-4 10.5c.8.7 1 1.5 1 2.5h6c0-1 .2-1.8 1-2.5A6 6 0 0 0 12 3z" />
  </svg>
);

export const BotIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <rect x="5" y="8" width="14" height="10" rx="3" />
    <path d="M12 8V5M12 5a1.5 1.5 0 1 0-.01-3.01A1.5 1.5 0 0 0 12 5z" />
    <path d="M9 13h.01M15 13h.01" />
    <path d="M10 15.5c.6.5 1.3.7 2 .7s1.4-.2 2-.7" />
  </svg>
);

export const GearIcon = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
  </svg>
);
