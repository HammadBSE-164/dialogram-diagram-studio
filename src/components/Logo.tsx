export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M6 4h20a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H14l-6 5v-5H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <circle cx="11" cy="10" r="1.6" />
      <circle cx="21" cy="11" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
      <path d="M11 11.5v6M12.5 9.8l7 1M13.5 18l6.5-5.5" />
    </svg>
  );
}
