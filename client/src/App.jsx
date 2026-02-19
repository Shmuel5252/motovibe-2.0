import Button from "./app/ui/components/Button";
import GlassCard from "./app/ui/components/GlassCard";
import AppShell from "./app/layouts/AppShell";

/**
 * מסך הבית הראשי במבנה RTL.
 * מציג את אזורי ה־Hero, הכרטיסים והסטטיסטיקות בתוך מעטפת הניווט.
 * @returns {JSX.Element} מסך ראשי מלא בגובה viewport.
 */
function App() {
  return (
    <AppShell>
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-6 pt-5 sm:px-6">
        {/* תוכן המסך הראשי ללא מיתוג, כדי שהלוגו יופיע רק ב־TopNav */}
        <main className="mt-6 flex-1">
          {/* אזור Hero: פתיח וכפתור פעולה ראשי */}
          <section>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              שלום שמואל
            </h1>
            <p className="mt-2 text-lg text-slate-300">מוכן לרכיבה</p>
            <Button variant="primary" size="lg" className="mt-6">
              התחל רכיבה
            </Button>
          </section>

          {/* כרטיסי מידע מרכזיים */}
          <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <GlassCard
              title="מסלולים אחרונים"
              right={
                <button
                  type="button"
                  className="text-xs text-emerald-300 hover:text-emerald-200"
                >
                  ראה הכל
                </button>
              }
            />

            <GlassCard
              title="האופנוע שלי"
              right={
                <span className="mv-pill px-2.5 py-1 text-xs font-medium text-emerald-200">
                  תקין
                </span>
              }
            />
          </section>
        </main>

        {/* פס סטטיסטיקות תחתון */}
        <section className="mv-card mt-6 px-4 py-3">
          <div className="flex items-center justify-between gap-2 text-sm text-slate-200">
            <span className="mv-pill px-3 py-1">4 רכיבות</span>
            <span className="text-white/30">|</span>
            <span className="mv-pill px-3 py-1">3:15 שעות</span>
            <span className="text-white/30">|</span>
            <span className="mv-pill px-3 py-1">215 ק״מ</span>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default App;
