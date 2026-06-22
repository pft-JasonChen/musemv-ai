export function CreditPill({ credits }: { credits: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-bold"
      style={{ background: "rgba(245,158,11,.18)", color: "var(--gold)" }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <circle cx="12" cy="12" r="9" opacity="0.25" />
        <circle cx="12" cy="12" r="6" />
      </svg>
      {credits}
    </span>
  );
}
