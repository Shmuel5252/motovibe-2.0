import Button from "./app/ui/components/Button";
import GlassCard from "./app/ui/components/GlassCard";
import AppShell from "./app/layouts/AppShell";

/**
 * מסך ה־Home/Dashboard הראשי במבנה RTL.
 * מרנדר Hero, באנר רכיבה פעילה (placeholder), כרטיסי מידע וסטטיסטיקות
 * בתוך AppShell המשתמש ב־mv-bg כרקע הגלובלי.
 * @returns {JSX.Element} מסך ראשי מלא בגובה viewport.
 */
function App() {
  const hasActiveRide = false;

  return (
    <AppShell>
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-6 pt-5 sm:px-6">
        {/* תוכן דשבורד ראשי */}
        <main className="mt-6 flex-1">
          {/* באנר רכיבה פעילה (מוסתר כברירת מחדל עד חיבור לוגיקה אמיתית) */}
          {hasActiveRide && (
            <section className="mv-card mb-6 flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm font-medium text-emerald-200">יש רכיבה פעילה</span>
              <Button variant="ghost" size="md">
                המשך רכיבה
              </Button>
            </section>
          )}

          {/* אזור Hero: טקסט פתיחה + אזור ויזואלי מדמה תמונת אופנוע */}
          <section className="grid grid-cols-1 items-center gap-5 md:grid-cols-2">
            <div>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                שלום שמואל
              </h1>
              <p className="mt-2 text-lg text-slate-300">מוכן לרכיבה</p>
              <Button variant="primary" size="lg" className="mt-6">
                התחל רכיבה
              </Button>
            </div>

            <div className="mv-card relative min-h-44 overflow-hidden rounded-2xl md:min-h-56">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(20,184,166,0.28),rgba(15,23,42,0.18)_40%,rgba(2,6,23,0.1)_75%)]" />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 to-transparent" />
              <div className="relative flex h-full items-end p-4">
                <span className="mv-pill px-3 py-1 text-xs text-slate-200">אזור תמונת אופנוע</span>
              </div>
            </div>
          </section>

          {/* שורת כרטיסים מרכזיים */}
          <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
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
            >
              <div className="space-y-3">
                <div className="h-28 rounded-xl bg-slate-900/80 ring-1 ring-white/10" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    רמת השרון למסילת איילון
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">42 ק״מ • 45 דק׳</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard
              title="האופנוע שלי"
              right={
                <span className="mv-pill px-2.5 py-1 text-xs font-medium text-emerald-200">
                  תקין
                </span>
              }
            >
              <div className="space-y-3">
                <div className="h-28 rounded-xl bg-linear-to-br from-slate-900/90 via-slate-800/60 to-emerald-900/30 ring-1 ring-white/10" />
                <p className="text-sm text-slate-300">טיפול הבא: 800 ק״מ</p>
              </div>
            </GlassCard>
          </section>
        </main>

        {/* פס סטטיסטיקות תחתון בסגנון glass pill */}
        <section className="mv-pill mt-6 px-4 py-3">
          <div className="flex items-center justify-between gap-2 text-sm text-slate-200">
            <span>4 רכיבות</span>
            <span className="text-white/30">|</span>
            <span>3:15 שעות</span>
            <span className="text-white/30">|</span>
            <span>215 ק״מ</span>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default App;
