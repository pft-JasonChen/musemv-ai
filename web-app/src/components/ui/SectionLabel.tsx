export function SectionLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.06em]" style={{ color: "var(--text)" }}>
      {children}
      {required && (
        <span className="ml-1.5 font-medium normal-case tracking-normal" style={{ color: "var(--text-2)" }}>
          (Required)
        </span>
      )}
    </div>
  );
}
