/**
 * מגירת ניווט צדדית (RTL) למובייל ודסקטופ צר.
 * מציגה שכבת overlay, רשימת ניווט, אזור הגדרות וכפתור התנתקות מושבת.
 * @param {Object} props - מאפייני הקומפוננטה.
 * @param {boolean} props.open - האם המגירה פתוחה.
 * @param {Array<{key: string, label: string, icon: string}>} props.items - פריטי ניווט.
 * @param {string} props.activeTab - הלשונית הפעילה.
 * @param {(tabKey: string) => void} props.onTabChange - עדכון לשונית פעילה.
 * @param {() => void} props.onClose - סגירת המגירה.
 * @returns {JSX.Element} overlay + מגירה ימנית עם תוכן ניווט.
 */
function SideDrawer({ open, items, activeTab, onTabChange, onClose }) {
  return (
    <>
      {/* שכבת overlay כהה לסגירה בלחיצה מחוץ למגירה */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={onClose}
        /* נגישות: ה־overlay אינו תוכן אינטראקטיבי בפני עצמו */
        aria-hidden="true"
      />

      {/* פאנל מגירה הנכנס מימין ב־RTL */}
      <aside
        className={[
          "fixed inset-y-0 right-0 z-50 w-80 max-w-[86vw] transform transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        /* נגישות: מסמן לקוראי מסך אם המגירה מוסתרת */
        aria-hidden={!open}
      >
        <div className="flex h-full flex-col border-l border-white/10 bg-slate-950/95 p-4 text-white backdrop-blur-xl">
          {/* אזור עליון: מיתוג יחיד + כפתור סגירה */}
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-wide">MotoVibe</h2>
            <button
              type="button"
              className="mv-card inline-flex h-9 w-9 items-center justify-center rounded-xl"
              onClick={onClose}
              aria-label="סגור"
            >
              ✕
            </button>
          </header>

          {/* רשימת ניווט ראשית */}
          <nav>
            <ul className="space-y-2">
              {items.map((item) => {
                const isActive = item.key === activeTab;
                return (
                  <li key={item.key}>
                    {/* נגישות: שמירה על מבנה כפתורים ברור לכל יעד ניווט */}
                    <button
                      type="button"
                      onClick={() => onTabChange(item.key)}
                      className={[
                        "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition",
                        isActive
                          ? "mv-card text-emerald-200"
                          : "text-slate-200 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <span>{item.label}</span>
                      <span className="text-base leading-none">
                        {item.icon}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* מקטע הגדרות בסיסי (Placeholder) */}
          <section className="mt-6">
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-400">
              הגדרות
            </h3>
            <div className="mv-card space-y-2 rounded-xl p-3 text-sm text-slate-200">
              <p>חשבון</p>
              <p>התראות</p>
            </div>
          </section>

          {/* כפתור התנתקות מושבת עד חיבור לוגיקה */}
          <button
            type="button"
            disabled
            className="mt-auto cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-500"
          >
            התנתקות (בקרוב)
          </button>
        </div>
      </aside>
    </>
  );
}

export default SideDrawer;
