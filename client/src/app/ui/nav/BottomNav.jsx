/**
 * ניווט תחתון גלאסמורפי למובייל — 4 טאבים בלבד, ללא לוגיקת "עוד".
 * לוגיקת תפריט "עוד" עברה ל-AppShell + TopNav.
 *
 * @param {Object}   props
 * @param {Array}    props.items       - פריטי ניווט (key, label, icon)
 * @param {string}   props.activeTab   - מפתח הלשונית הפעילה
 * @param {Function} props.onNavigate  - callback(tabKey)
 */
function BottomNav({ items, activeTab, onNavigate }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden" dir="rtl">
      {/* glassmorphic pill container */}
      <div className="mx-3 mb-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0B132B]/80 backdrop-blur-md shadow-[0_-4px_30px_rgba(0,0,0,0.4)]">
        <ul className="grid grid-cols-5">
          {items.map((item) => {
            const isActive = item.key === activeTab;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.key)}
                  aria-current={isActive ? "page" : undefined}
                  className="flex w-full flex-col items-center gap-1 py-3 px-1 transition"
                >
                  {/* icon */}
                  <span
                    className={[
                      "text-xl leading-none transition",
                      isActive ? "text-emerald-400" : "text-slate-400",
                    ].join(" ")}
                  >
                    {item.icon}
                  </span>

                  {/* label */}
                  <span
                    className={[
                      "text-[10px] font-medium transition",
                      isActive ? "text-emerald-400" : "text-slate-500",
                    ].join(" ")}
                  >
                    {item.label}
                  </span>

                  {/* active indicator dot */}
                  <span
                    className={[
                      "h-1 w-1 rounded-full transition-all duration-200",
                      isActive
                        ? "bg-emerald-400 scale-100"
                        : "scale-0 bg-transparent",
                    ].join(" ")}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

export default BottomNav;
