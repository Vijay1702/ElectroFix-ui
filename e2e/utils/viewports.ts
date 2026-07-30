// The app has exactly one responsive breakpoint, Tailwind's default `md`
// (768px, min-width) — confirmed in AppLayout.tsx/Sidebar.tsx, no custom
// theme.screens override in src/index.css. Below it: sidebar becomes an
// off-canvas drawer behind a hamburger, and Customers/Repairs/Onboarding/etc.
// swap their DataTable+toolbar for a hidden-toolbar mobile card list. At/above
// it: static sidebar rail, full desktop toolbar.
export const VIEWPORTS = {
  mobile: { width: 375, height: 812 }, // below the md breakpoint
  tablet: { width: 768, height: 1024 }, // exactly at md — triggers desktop-style layout
  desktop: { width: 1440, height: 900 },
} as const;

export type ViewportName = keyof typeof VIEWPORTS;
