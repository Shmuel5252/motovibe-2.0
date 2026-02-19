function BottomNav({ items, activeTab, onTabChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/90 px-3 pb-3 pt-2 backdrop-blur-xl md:hidden">
      <ul className="mx-auto grid max-w-3xl grid-cols-5 gap-2">
        {items.map((item) => {
          const isActive = item.key === activeTab;
          const isCenter = item.key === "רכיבה";

          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onTabChange(item.key)}
                className={[
                  "w-full rounded-xl px-2 py-2 text-center text-xs transition",
                  isCenter
                    ? "mv-btn-primary text-sm font-semibold shadow-[0_0_24px_rgba(20,184,166,0.35)]"
                    : isActive
                      ? "mv-card text-emerald-200"
                      : "text-slate-300 hover:text-white",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="block text-base leading-none">
                  {item.icon}
                </span>
                <span className="mt-1 block">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default BottomNav;
