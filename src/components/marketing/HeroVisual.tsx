export function HeroVisual() {
  return (
    <div
      className="relative aspect-[14/13] w-full overflow-hidden rounded-2xl border border-border-subtle bg-surface bg-blueprint-grid"
      aria-hidden
    >
      {/* Top corner label */}
      <div className="absolute left-6 top-6 flex flex-col gap-1 rounded-lg border border-border-subtle bg-inset px-3.5 py-3">
        <span className="text-[11px] font-bold tracking-[0.16em] text-brand">
          DL-2024-A0142
        </span>
        <span className="text-[11px] font-medium text-fg-secondary">
          Чертёж детали · М 1:2
        </span>
      </div>

      {/* Drawing — main rectangle */}
      <svg
        viewBox="0 0 560 520"
        className="absolute inset-0 size-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Main part outline */}
        <rect
          x="140"
          y="170"
          width="280"
          height="180"
          rx="4"
          fill="none"
          stroke="var(--brand)"
          strokeWidth="2"
        />
        {/* Two holes */}
        <circle cx="210" cy="260" r="30" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />
        <circle cx="350" cy="260" r="30" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />

        {/* Centerlines — dashed */}
        <line x1="140" y1="260" x2="420" y2="260" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
        <line x1="210" y1="170" x2="210" y2="350" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
        <line x1="350" y1="170" x2="350" y2="350" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />

        {/* Dimension line */}
        <line x1="140" y1="380" x2="420" y2="380" stroke="var(--brand)" strokeWidth="1" />
        <line x1="140" y1="374" x2="140" y2="386" stroke="var(--brand)" strokeWidth="1" />
        <line x1="420" y1="374" x2="420" y2="386" stroke="var(--brand)" strokeWidth="1" />
        <text x="280" y="398" textAnchor="middle" fontSize="11" fontWeight="500" fill="var(--brand)">
          280
        </text>
      </svg>

      {/* GOST stamp bottom left */}
      <div className="absolute bottom-6 left-6 rounded border border-brand bg-[color:oklch(0.69_0.16_70/0.12)] px-3.5 py-2.5">
        <span className="text-[11px] font-bold tracking-[0.08em] text-brand">
          ГОСТ 2.305-2008
        </span>
      </div>
    </div>
  );
}
