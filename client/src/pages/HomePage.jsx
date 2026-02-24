/**
 * HomePage — מסך הבית.
 * רכיב Stateless: מקבל את כל הנתונים וה-Handlers כ-Props מ-App.jsx.
 */

import Button from "../app/ui/components/Button";
import GlassCard from "../app/ui/components/GlassCard";

/**
 * באנר רכיבה פעילה לטאבים שאינם מסך הרכיבה.
 * מוצג רק כאשר יש רכיבה פעילה שאינה ממוזערת.
 */
function ActiveRideBanner({ isRideActive, isRideMinimized, onNavigate }) {
  if (!isRideActive || isRideMinimized) {
    return null;
  }

  return (
    <section className="mv-card mb-5 flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="text-sm text-emerald-200">יש רכיבה פעילה</span>
      <Button variant="ghost" size="md" onClick={() => onNavigate("ride")}>
        חזור לרכיבה
      </Button>
    </section>
  );
}

/**
 * @param {Object} props
 * @param {Object|null} props.currentUser - נתוני המשתמש המחובר.
 * @param {Array} props.recentRoutes - 3 המסלולים האחרונים.
 * @param {boolean} props.isRideActive - האם רכיבה פעילה.
 * @param {boolean} props.isRideMinimized - האם רכיבה ממוזערת.
 * @param {Function} props.setIsRideActive
 * @param {Function} props.setIsRidePaused
 * @param {Function} props.setIsRideMinimized
 * @param {Function} props.setSelectedRoute
 * @param {Function} props.setDidStartFromRoute
 * @param {Function} props.onNavigate - ניווט בין טאבים.
 */
export default function HomePage({
  currentUser,
  recentRoutes,
  isRideActive,
  isRideMinimized,
  setIsRideActive,
  setIsRidePaused,
  setIsRideMinimized,
  setSelectedRoute,
  setDidStartFromRoute,
  onNavigate,
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col pb-10 pt-5 text-slate-100">
      {/* תמונת רגע רקע לכל הדף */}
      <div className="pointer-events-none fixed inset-0 z-0 h-screen w-screen overflow-hidden bg-[#020617]">
        <img
          src="/assets/motorcycle-hero.jpg"
          alt="רקע אופנוע"
          className="absolute top-0 w-full object-cover opacity-85 h-[70vh] object-[center_bottom] sm:h-screen sm:object-[center_60%]"
          loading="eager"
        />
        {/* גרדיאנט למובייל: משלב את חיתוך ה-70vh בצורה חלקה לתוך הרקע */}
        <div
          className="pointer-events-none absolute inset-0 sm:hidden"
          style={{
            background: [
              "linear-gradient(to bottom, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0) 25%, rgba(2,6,23,0.2) 55%, #020617 70%, #020617 100%)",
              "linear-gradient(to right, rgba(2,6,23,0.95) 0%, transparent 20%, transparent 80%, rgba(2,6,23,0.95) 100%)",
            ].join(", "),
          }}
        />
        {/* גרדיאנט לדסקטופ: פריסה רחבה על כל המסך */}
        <div
          className="pointer-events-none absolute inset-0 hidden sm:block"
          style={{
            background: [
              "linear-gradient(to bottom, rgba(2,6,23,0.8) 0%, rgba(2,6,23,0) 20%, rgba(2,6,23,0.2) 65%, #020617 95%, #020617 100%)",
              "linear-gradient(to right, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.1) 20%, rgba(2,6,23,0.1) 80%, rgba(2,6,23,0.95) 100%)",
            ].join(", "),
          }}
        />
        {/* רדיאל ירוק/כחלחל שנותן אווירות 'Motovibe' למראה הסופי */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.15),transparent_60%)] sm:bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.18),transparent_70%)]" />
      </div>

      {/* אזור תוכן עיקרי של דף הבית */}
      <main className="relative z-10 flex-1 px-4 sm:px-6">
        <ActiveRideBanner
          isRideActive={isRideActive}
          isRideMinimized={isRideMinimized}
          onNavigate={onNavigate}
        />

        {/* פתיח ראשי (Hero Content) צף על גבי הרקע */}
        <section className="mt-8 px-2 sm:mt-16">
          <h1 className="text-4xl font-bold leading-tight tracking-wide drop-shadow-2xl sm:text-6xl">
            {currentUser?.name ? `שלום ${currentUser.name}` : "שלום רוכב"}
          </h1>
          <p className="mt-2 text-lg font-medium text-emerald-100/90 drop-shadow-md sm:text-2xl">
            הדרך מחכה לך
          </p>
          <Button
            variant="primary"
            size="lg"
            className="mt-6 rounded-full shadow-[0_4px_30px_rgba(16,185,129,0.3)] transition-transform hover:scale-105 sm:mt-8 sm:px-10 sm:py-3.5 sm:text-xl"
            onClick={() => onNavigate("ride")}
          >
            התחל רכיבה
          </Button>
        </section>

        {/* כרטיסי מידע מרכזיים */}
        <section className="mt-12 grid grid-cols-1 gap-5 lg:mt-20 lg:grid-cols-2">
          {/* מסלולים אחרונים: מציג עד 3 מסלולים אמיתיים מה-state. */}
          <GlassCard
            title="מסלולים אחרונים"
            right={
              /* מעבר למסך מסלולים המלא מתוך דף הבית. */
              <button
                type="button"
                onClick={() => onNavigate("routes")}
                className="text-xs text-emerald-300 hover:text-emerald-200"
              >
                ראה הכל
              </button>
            }
          >
            {recentRoutes.length === 0 ? (
              <div className="space-y-1 py-3">
                <p className="text-sm font-semibold text-slate-100">
                  אין עדיין מסלולים
                </p>
                <p className="text-xs text-slate-400">
                  צור מסלול ראשון במסך מסלולים
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="rounded-xl bg-slate-900/40 px-3 py-2 ring-1 ring-white/10"
                  >
                    <h3 className="text-sm font-semibold text-slate-100">
                      {route.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {route.from} → {route.to}
                    </p>
                    <p className="mt-1 text-xs text-slate-300">
                      {route.distanceKm} ק״מ • {route.etaMin} דק׳
                    </p>
                  </div>
                ))}
              </div>
            )}
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

      {/* פס סטטיסטיקות תחתון */}
      {/* ערכי placeholder — יוחלפו בסטטיסטיקות אמיתיות מהשרת */}
      <section className="mv-pill mx-4 mt-6 px-4 py-3 sm:mx-6">
        <div className="flex items-center justify-between gap-2 text-sm text-slate-200">
          <span>-- רכיבות</span>
          <span className="text-white/30">|</span>
          <span>-- שעות</span>
          <span className="text-white/30">|</span>
          <span>-- ק״מ</span>
        </div>
      </section>
    </div>
  );
}
