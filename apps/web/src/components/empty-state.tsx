export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-black/10 bg-white/50 px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-(--color-teal-100) text-(--color-teal-700)">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="9" strokeLinecap="round" />
        </svg>
      </div>
      <p className="mt-4 font-display text-lg font-semibold text-(--color-teal-900)">{title}</p>
      <p className="mt-1 text-sm text-(--color-ink)/50">{detail}</p>
    </div>
  );
}
