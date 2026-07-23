import { HeaderActions } from "./HeaderActions";

export function TopBar() {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 h-14"
      style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--bg) 82%, transparent)", backdropFilter: "blur(8px)" }}
    >
      <span className="sm:hidden text-[17px] font-extrabold tracking-tight">
        YouCam <span style={{ color: "var(--accent)" }}>Muse</span>
      </span>
      <div className="ml-auto">
        <HeaderActions />
      </div>
    </header>
  );
}
