import React from 'react';

const PATHS = {
  users: (
    <>
      <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" />
      <circle cx="10" cy="8" r="3.5" />
      <path d="M20 19v-1.4a3.5 3.5 0 0 0-2.6-3.4" />
      <path d="M15.5 5.2a3.5 3.5 0 0 1 0 5.6" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" />
      <path d="m3 12.5 9 4.5 9-4.5" />
      <path d="m3 17 9 4.5L21 17" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  wallet: (
    <>
      <path d="M3.5 8.5A2.5 2.5 0 0 1 6 6h11a2 2 0 0 1 2 2v1" />
      <rect x="3.5" y="8.5" width="17" height="10.5" rx="2.5" />
      <path d="M16.5 13.75h1.75" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path d="M9 20h6M12 16.5V20" />
    </>
  ),
  smartphone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M6 3.5v4a3.5 3.5 0 0 0 7 0v-4" />
      <path d="M6 3.5H4.5M13 3.5h1.5" />
      <path d="M9.5 11v3.5a4.5 4.5 0 0 0 9 0V13" />
      <circle cx="18" cy="10.5" r="2" />
    </>
  ),
  bell: (
    <>
      <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5s1.5-1.5 1.5-5.5Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </>
  ),
  shieldCheck: (
    <>
      <path d="M12 3 5 5.8v5.4c0 4.3 2.9 7.6 7 9.3 4.1-1.7 7-5 7-9.3V5.8L12 3Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  mapPin: (
    <>
      <path d="M12 21s6.5-5.2 6.5-10a6.5 6.5 0 1 0-13 0C5.5 15.8 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.5" />
    </>
  ),
  fileText: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 16.5h4" />
    </>
  ),
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  arrowRight: <path d="M4.5 12h15M13 5.5l6.5 6.5-6.5 6.5" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.8 6.8 8.2 5.7 8.2-5.7" />
    </>
  ),
  phone: (
    <path d="M7.5 3.5h-2A2 2 0 0 0 3.5 5.7c.5 6.9 6 12.4 12.8 12.8a2 2 0 0 0 2.2-2v-2a1.7 1.7 0 0 0-1.4-1.7l-2.3-.4a1.7 1.7 0 0 0-1.7.7l-.6.9a13 13 0 0 1-4.5-4.5l.9-.6a1.7 1.7 0 0 0 .7-1.7L9.2 4.9A1.7 1.7 0 0 0 7.5 3.5Z" />
  ),
  chat: (
    <path d="M20.5 11.8c0 4.2-3.8 7.6-8.5 7.6-1.2 0-2.3-.2-3.3-.6L4 20.5l1.4-3.6a7.2 7.2 0 0 1-1.9-4.9c0-4.2 3.8-7.6 8.5-7.6s8.5 3.4 8.5 7.4Z" />
  ),
  building: (
    <>
      <path d="M4 21V6.5A2.5 2.5 0 0 1 6.5 4h6A2.5 2.5 0 0 1 15 6.5V21" />
      <path d="M15 10h3.5A1.5 1.5 0 0 1 20 11.5V21" />
      <path d="M2.5 21h19" />
      <path d="M7.5 8h4M7.5 11.5h4M7.5 15h4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.75" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  send: (
    <>
      <path d="M20.5 3.5 10.8 13.2" />
      <path d="M20.5 3.5 14 20.5l-3.2-7.3L3.5 10l17-6.5Z" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8.5 10.5V7.75a3.5 3.5 0 0 1 7 0v2.75" />
    </>
  ),
  cloud: (
    <path d="M7 18.5h10.2a3.8 3.8 0 0 0 .5-7.6 5.6 5.6 0 0 0-10.9-1.2A4.2 4.2 0 0 0 7 18.5Z" />
  ),
  headset: (
    <>
      <path d="M4.5 15v-3a7.5 7.5 0 0 1 15 0v3" />
      <rect x="2.75" y="13.5" width="4" height="6.5" rx="2" />
      <rect x="17.25" y="13.5" width="4" height="6.5" rx="2" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7.5" width="18" height="12" rx="2.5" />
      <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
      <path d="M3 12.5h18" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7.5" ry="3" />
      <path d="M4.5 6v12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6" />
      <path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3" />
    </>
  ),
  spark: (
    <path d="m12 4 1.9 5.1L19 11l-5.1 1.9L12 18l-1.9-5.1L5 11l5.1-1.9L12 4Z" />
  ),
  flask: (
    <>
      <path d="M9.5 3h5M10 3v5.2L5.4 17a2 2 0 0 0 1.8 3h9.6a2 2 0 0 0 1.8-3L14 8.2V3" />
      <path d="M7.5 14.5h9" />
    </>
  ),
  pill: (
    <>
      <path d="M10.5 3.5v5.5H5v5.5h5.5V20h3v-5.5H19V9h-5.5V3.5h-3Z" />
    </>
  ),
  ticket: (
    <>
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-2a2.5 2.5 0 0 0 0-5v-2Z" />
      <path d="M13 6v12" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8.5 3v4M15.5 3v4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <path d="M7 20v-5M12 20V8M17 20v-8" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9.5 8h5M9.5 12h5" />
    </>
  ),
  folder: (
    <>
      <path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h3.8l2 2.2h7.2a2 2 0 0 1 2 2v8.3a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2v-10.5Z" />
    </>
  ),
  activity: (
    <path d="M3.5 12h4l2.5-6 4 12 2.5-6h4" />
  ),
};

export function Icon({ name, size = 24, className, strokeWidth = 1.75 }) {
  const paths = PATHS[name];
  if (!paths) return null;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths}
    </svg>
  );
}
