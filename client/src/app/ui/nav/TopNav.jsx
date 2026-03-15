/**
 * סרגל ניווט עליון של האפליקציה.
 * מציג מיתוג, כפתור תפריט למובייל, וקישורי ניווט בדסקטופ.
 *
 * @param {Array}    props.items              - פריטי ניווט (key, label, icon)
 * @param {string}   props.activeTab          - הלשונית הפעילה
 * @param {Function} props.onNavigate         - callback(tabKey)
 * @param {Function} props.onMenuClick        - פתיחת מגירת צד
 * @param {Function} [props.onLogout]         - התנתקות
 * @param {boolean}  [props.isAuthenticated]
 * @param {ReactNode} [props.notificationSlot] - רכיב פעמון התראות
 */
function TopNav({
  items,
  activeTab,
  onNavigate,
  onMenuClick,
  onLogout,
  isAuthenticated,
  notificationSlot,
}) {
  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-3 py-2 bg-transparent">
        {/* Right cluster: Hamburger + Bell (RTL: this is the start side) */}
        <div className="flex items-center gap-2">
          {/* Hamburger — opens SideDrawer (hidden above lg) */}
          <button
            type="button"
            className="mv-card inline-flex h-10 w-10 items-center justify-center rounded-xl text-2xl leading-none lg:hidden"
            onClick={onMenuClick}
            aria-label="פתח תפריט"
          >
            ≡
          </button>

          {/* Bell notification slot */}
          {notificationSlot}
        </div>

        {/* Brand */}
        <span className="text-base font-semibold tracking-wide text-white/90 sm:text-lg">
          MotoVibe
        </span>

        {/* Desktop nav links + logout */}
        <nav className="hidden lg:block">
          <ul className="flex items-center gap-2">
            {items.map((item) => {
              const isActive = item.key === activeTab;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.key)}
                    className={[
                      "rounded-xl px-3 py-1.5 text-sm transition",
                      isActive
                        ? "mv-card text-emerald-200"
                        : "text-slate-300 hover:text-white",
                    ].join(" ")}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}

            <li>
              <button
                type="button"
                onClick={() => onNavigate("bike")}
                className="rounded-xl px-3 py-1.5 text-sm text-slate-300 transition hover:text-white"
              >
                הגדרות
              </button>
            </li>

            {isAuthenticated && (
              <li>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-xl px-3 py-1.5 text-sm transition mv-card text-emerald-200"
                >
                  התנתקות
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default TopNav;
