export default function EmptyStateArt() {
  return (
    <div className="mx-auto w-full max-w-[250px] text-ink" aria-hidden="true">
      <svg viewBox="0 0 260 180" fill="none" className="w-full">
        {/* users table */}
        <g>
          <rect
            x="8"
            y="18"
            width="112"
            height="94"
            rx="6"
            fill="var(--color-surface)"
            stroke="var(--color-line)"
          />
          <path
            d="M8 42h112"
            stroke="var(--color-line)"
            fill="var(--color-surface-subtle)"
          />
          <rect
            x="8"
            y="24"
            width="112"
            height="18"
            rx="6"
            fill="var(--color-surface-subtle)"
          />
          <rect
            x="8"
            y="36"
            width="112"
            height="6"
            fill="var(--color-surface-subtle)"
          />
          <circle cx="20" cy="33" r="3" fill="var(--color-primary)" />
          <text
            x="28"
            y="36"
            fill="currentColor"
            fontFamily="var(--font-geist-sans), sans-serif"
            fontSize="7.5"
            fontWeight="600"
          >
            users
          </text>
          <text
            x="108"
            y="36"
            fill="var(--color-ink-subtle)"
            fontFamily="var(--font-geist-sans), sans-serif"
            fontSize="6"
            textAnchor="end"
          >
            4 cols
          </text>

          <circle cx="20" cy="56" r="2.5" fill="var(--color-pk)" />
          <text
            x="28"
            y="59"
            fill="currentColor"
            fontFamily="var(--font-geist-mono), monospace"
            fontSize="6"
          >
            id
          </text>
          <text
            x="110"
            y="59"
            fill="var(--color-ink-subtle)"
            fontFamily="var(--font-geist-mono), monospace"
            fontSize="5.5"
            textAnchor="end"
          >
            INT
          </text>

          <text
            x="28"
            y="76"
            fill="var(--color-ink-muted)"
            fontFamily="var(--font-geist-mono), monospace"
            fontSize="6"
          >
            email
          </text>
          <text
            x="110"
            y="76"
            fill="var(--color-ink-subtle)"
            fontFamily="var(--font-geist-mono), monospace"
            fontSize="5.5"
            textAnchor="end"
          >
            VARCHAR
          </text>

          <text
            x="28"
            y="93"
            fill="var(--color-ink-muted)"
            fontFamily="var(--font-geist-mono), monospace"
            fontSize="6"
          >
            created_at
          </text>
          <text
            x="110"
            y="93"
            fill="var(--color-ink-subtle)"
            fontFamily="var(--font-geist-mono), monospace"
            fontSize="5.5"
            textAnchor="end"
          >
            TIMESTAMP
          </text>
        </g>

        {/* orders table */}
        <g>
          <rect
            x="140"
            y="68"
            width="112"
            height="94"
            rx="6"
            fill="var(--color-surface)"
            stroke="var(--color-line)"
          />
          <rect
            x="140"
            y="74"
            width="112"
            height="18"
            rx="6"
            fill="var(--color-surface-subtle)"
          />
          <rect
            x="140"
            y="86"
            width="112"
            height="6"
            fill="var(--color-surface-subtle)"
          />
          <circle cx="152" cy="83" r="3" fill="var(--color-primary)" />
          <text
            x="160"
            y="86"
            fill="currentColor"
            fontFamily="var(--font-geist-sans), sans-serif"
            fontSize="7.5"
            fontWeight="600"
          >
            orders
          </text>
          <text
            x="240"
            y="86"
            fill="var(--color-ink-subtle)"
            fontFamily="var(--font-geist-sans), sans-serif"
            fontSize="6"
            textAnchor="end"
          >
            3 cols
          </text>

          <circle cx="152" cy="106" r="2.5" fill="var(--color-pk)" />
          <text
            x="160"
            y="109"
            fill="currentColor"
            fontFamily="var(--font-geist-mono), monospace"
            fontSize="6"
          >
            id
          </text>
          <text
            x="240"
            y="109"
            fill="var(--color-ink-subtle)"
            fontFamily="var(--font-geist-mono), monospace"
            fontSize="5.5"
            textAnchor="end"
          >
            INT
          </text>

          <circle cx="152" cy="124" r="2.5" fill="var(--color-fk)" />
          <text
            x="160"
            y="127"
            fill="var(--color-fk)"
            fontFamily="var(--font-geist-mono), monospace"
            fontSize="6"
          >
            user_id
          </text>
          <text
            x="240"
            y="127"
            fill="var(--color-ink-subtle)"
            fontFamily="var(--font-geist-mono), monospace"
            fontSize="5.5"
            textAnchor="end"
          >
            INT
          </text>

          <text
            x="160"
            y="145"
            fill="var(--color-ink-muted)"
            fontFamily="var(--font-geist-mono), monospace"
            fontSize="6"
          >
            total
          </text>
          <text
            x="240"
            y="145"
            fill="var(--color-ink-subtle)"
            fontFamily="var(--font-geist-mono), monospace"
            fontSize="5.5"
            textAnchor="end"
          >
            INT
          </text>
        </g>

        {/* relationship */}
        <path
          d="M120 63h12c8 0 8 26 8 26"
          stroke="var(--color-primary)"
          strokeWidth="1.5"
        />
        <circle cx="120" cy="63" r="2.5" fill="var(--color-primary)" />
        <rect
          x="127"
          y="50"
          width="21"
          height="14"
          rx="3"
          fill="var(--color-surface)"
          stroke="var(--color-primary)"
        />
        <text
          x="137.5"
          y="59.5"
          fill="var(--color-primary)"
          fontFamily="var(--font-geist-sans), sans-serif"
          fontSize="6.5"
          fontWeight="600"
          textAnchor="middle"
        >
          1:N
        </text>
      </svg>
    </div>
  );
}
