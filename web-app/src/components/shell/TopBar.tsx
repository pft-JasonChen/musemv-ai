import { HeaderActions } from "./HeaderActions";

export function TopBar() {
  return (
    // `hidden md:flex`: below the 768px cutover this is replaced entirely by
    // MobileHeader (plan CH5). It used to render its own wordmark under `sm:hidden`
    // for that case; MobileHeader owns that now, so showing both would double the
    // chrome. This whole component is transitional — DP has no global top bar, and
    // per-route RoomNavbar/DetailNavbar retire it screen by screen (CH2).
    <header
      className="sticky top-0 z-30 hidden md:flex items-center justify-between gap-3 border-b px-4 h-14"
      style={{
        borderColor: "var(--border)",
        background: "color-mix(in srgb, var(--bg) 82%, transparent)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="ml-auto">
        <HeaderActions />
      </div>
    </header>
  );
}
