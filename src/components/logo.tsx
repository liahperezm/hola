/** The "hola" wordmark with its smile, in the current text color. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 34" className={className} role="img" aria-label="Hola">
      <text
        x="32"
        y="20"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Lato, sans-serif"
        fontWeight="700"
        fontSize="23"
        letterSpacing="-0.5"
      >
        hola
      </text>
      <path
        d="M22 25.5 Q32 33 42 25.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
