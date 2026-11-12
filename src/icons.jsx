// Line-art icon set used across the public marketing pages (converted from js/landing.js's `I` object)
function svg(children, color = 'currentColor', strokeWidth = '1.5') {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export const Icon = {
  building: (c) => svg(<><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="15" y2="6" /><line x1="9" y1="10" x2="15" y2="10" /><line x1="9" y1="14" x2="12" y2="14" /></>, c),
  chart: (c) => svg(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>, c),
  shield: (c) => svg(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />, c),
  box: (c) => svg(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><line x1="12" y1="22.08" x2="12" y2="12" /></>, c),
  dollar: (c) => svg(<><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>, c),
  check: (c, sw = '1.5') => svg(<><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>, c, sw),
  bot: (c) => svg(<><rect x="3" y="7" width="18" height="13" rx="2" /><line x1="8" y1="7" x2="8" y2="5" /><line x1="16" y1="7" x2="16" y2="5" /><circle cx="12" cy="14" r="1.5" /></>, c),
  file: (c) => svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>, c),
  users: (c) => svg(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>, c),
  megaphone: (c) => svg(<><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></>, c),
  pie: (c) => svg(<><circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10H12V2z" /></>, c),
  credit: (c) => svg(<><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></>, c),
  lock: (c) => svg(<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>, c),
  settings: (c) => svg(<><circle cx="12" cy="12" r="3" /><path d="M12 1v2m0 18v2m-7.07-2.93l1.41-1.41m12.73-12.73l1.41-1.41M1 12h2m18 0h2M4.93 4.93l1.41 1.41m12.73 12.73l1.41 1.41" /></>, c),
  bell: (c) => svg(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>, c),
  mail: (c) => svg(<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 4L12 13 2 4" /></>, c),
  phone: (c) => svg(<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />, c),
  map: (c) => svg(<><circle cx="12" cy="10" r="3" /><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" /></>, c),
  plus: (c) => svg(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>, c, '2'),
};
