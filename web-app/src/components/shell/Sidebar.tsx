"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: React.ReactNode };

function Icon({ d }: { d: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: <Icon d="M3 11.5 12 4l9 7.5M5 10v10h5v-6h4v6h5V10" /> },
  { href: "/mv/room", label: "Create MV", icon: <Icon d="M15 10l4.5-2.5v9L15 14M3 7h12v10H3zM3 7l4-3h6" /> },
  { href: "/song/create", label: "Create Song", icon: <Icon d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /> },
  { href: "/history", label: "History", icon: <Icon d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5M12 7v5l3 2" /> },
  { href: "/profile", label: "Profile", icon: <Icon d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" /> },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop rail */}
      <nav
        aria-label="Primary"
        className="hidden sm:flex flex-col gap-1 w-[220px] shrink-0 border-r p-3"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="px-3 py-4">
          <span className="text-[20px] font-extrabold tracking-tight">
            MuseMV<span style={{ color: "var(--accent)" }}>.ai</span>
          </span>
        </div>
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-colors"
              style={{
                background: active ? "var(--card-2)" : "transparent",
                color: active ? "var(--text)" : "var(--text-2)",
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom bar */}
      <nav
        aria-label="Primary"
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 flex justify-around border-t py-2"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-semibold"
              style={{ color: active ? "var(--accent)" : "var(--text-2)" }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
