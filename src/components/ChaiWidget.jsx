export default function ChaiWidget() {
  return (
    <a
      href="https://www.chai4.me/mohitbelokar"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed top-5 right-5 z-50 group animate-scale-in"
      aria-label="Buy me a chai"
    >
      <div className="relative flex items-center gap-2.5 pl-3.5 pr-4 sm:pr-5 py-2.5 rounded-full bg-gradient-to-r from-accent to-accent-dark text-white shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 hover:scale-105 transition-all duration-300 cursor-pointer">
        {/* Chai cup icon with steam */}
        <div className="relative w-6 h-6 flex-shrink-0">
          {/* Steam wisps */}
          <svg
            className="absolute -top-2.5 left-1 w-4 h-3 text-white/60 group-hover:text-white/90 transition-colors duration-300"
            viewBox="0 0 16 12"
            fill="none"
          >
            <path
              d="M4 11C4 8 2 7 2 4"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="group-hover:animate-steam-1"
            />
            <path
              d="M8 10C8 7 10 6 10 3"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="group-hover:animate-steam-2"
            />
            <path
              d="M12 11C12 8.5 11 7 11 5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="group-hover:animate-steam-3"
            />
          </svg>
          {/* Cup */}
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h12a2 2 0 012 2v0a6 6 0 01-6 6H9a6 6 0 01-6-6v0a2 2 0 012-2z"
              fill="currentColor"
              fillOpacity="0.25"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M17 14h1a3 3 0 010 6h-1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line x1="4" y1="22" x2="18" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        {/* Text — hidden on mobile */}
        <span className="hidden sm:inline text-sm font-medium tracking-wide whitespace-nowrap">
          Buy me a chai
        </span>
      </div>
    </a>
  );
}
