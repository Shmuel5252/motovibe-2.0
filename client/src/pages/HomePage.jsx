/**
 * HomePage — מסך הבית.
 * רכיב Stateless: מקבל את כל הנתונים וה-Handlers כ-Props מ-App.jsx.
 */
import { useEffect } from "react";
import Button from "../app/ui/components/Button";
import GlassCard from "../app/ui/components/GlassCard";
import { formatRideDuration } from "../app/utils/formatters";
import { imgSrc } from "../app/utils/imageUrl";

/**
 * באנר רכיבה פעילה לטאבים שאינם מסך הרכיבה.
 * מוצג רק כאשר יש רכיבה פעילה שאינה ממוזערת.
 */
function ActiveRideBanner({ isRideActive, isRideMinimized, onNavigate }) {
  if (!isRideActive || isRideMinimized) {
    return null;
  }

  return (
    <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg mb-5 flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="text-sm font-bold text-emerald-400">יש רכיבה פעילה</span>
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
  historyRides = [],
  recentRoutes,
  isRideActive,
  isRideMinimized,
  setIsRideActive,
  setIsRidePaused,
  setIsRideMinimized,
  setSelectedRoute,
  setDidStartFromRoute,
  onNavigate,
  bikes = [],
  fetchBikesFromServer,
}) {
  useEffect(() => {
    if (fetchBikesFromServer && bikes.length === 0) {
      fetchBikesFromServer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bike = bikes?.[0] || null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col pb-10 pt-5 text-slate-100">
      {/* תמונת רגע רקע לכל הדף */}
      <div className="pointer-events-none fixed inset-0 z-0 h-screen w-screen overflow-hidden bg-transparent">
        <img
          src="/assets/motorcycle-hero.jpg"
          alt="רקע אופנוע"
          className="absolute top-0 w-full object-cover opacity-60 h-[70vh] object-[center_bottom] sm:h-screen sm:object-[center_60%] mask-[linear-gradient(to_bottom,black_40%,transparent_100%)]"
          loading="eager"
        />
        {/* רדיאל ירוק/כחלחל שנותן אווירות 'Motovibe' למראה הסופי */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.15),transparent_60%)]" />
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
                    className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-3 shadow-sm"
                  >
                    <h3 className="text-sm font-semibold text-slate-100">
                      {route.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-400">
                      {route.from} → {route.to}
                    </p>
                    <p className="mt-1 text-xs text-gray-300">
                      <span className="text-emerald-400 font-bold">
                        {route.distanceKm}
                      </span>{" "}
                      ק״מ •{" "}
                      <span className="text-emerald-400 font-bold">
                        {route.etaMin}
                      </span>{" "}
                      דק׳
                    </p>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <div
            onClick={() => onNavigate("bike")}
            className="cursor-pointer group"
          >
            <GlassCard
              title={
                bike ? bike.name || bike.model || "האופנוע שלי" : "האופנוע שלי"
              }
              right={
                bike ? (
                  <span className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-lg px-2.5 py-1 text-xs font-bold text-emerald-400 group-hover:bg-white/10 transition-colors">
                    תקין
                  </span>
                ) : null
              }
              className="group-hover:bg-white/8 transition-all duration-300 h-full"
            >
              {bike ? (
                <div className="space-y-3">
                  <div className="relative h-28 overflow-hidden rounded-xl border border-white/10 bg-linear-to-br from-slate-900/90 via-slate-800/60 to-emerald-900/25 shadow-inner">
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[24px_24px]" />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(20,184,166,0.18),transparent_55%)]" />
                    {imgSrc(bike.imageUrl) ? (
                      <img
                        src={imgSrc(bike.imageUrl)}
                        alt="תמונת אופנוע"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-semibold text-slate-400">
                          {bike.make || ""} {bike.model || "האופנוע שלי"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">סה״כ ק״מ:</p>
                    <p className="text-emerald-400 font-bold">
                      {bike.currentOdometerKm != null
                        ? bike.currentOdometerKm.toLocaleString("he-IL")
                        : "--"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center space-y-2 py-4">
                  <p className="text-sm font-semibold text-slate-100">
                    אין אופנוע שמור
                  </p>
                  <p className="text-xs text-slate-400">
                    לחץ כאן כדי להוסיף את האופנוע שלך
                  </p>
                </div>
              )}
            </GlassCard>
          </div>
        </section>
      </main>

      {/* כרטיסי סטטיסטיקות */}
      {(() => {
        const totalRides = historyRides.length;
        const totalKm = historyRides.reduce(
          (sum, r) => sum + (r.rawKm || 0),
          0,
        );
        const totalSeconds = historyRides.reduce(
          (sum, r) => sum + (r.rawSeconds || 0),
          0,
        );

        const stats = [
          {
            label: "רכיבות",
            value: totalRides,
            display: totalRides.toLocaleString("he-IL"),
            icon: (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            ),
            accent: "text-emerald-400",
            glow: "shadow-emerald-500/10",
          },
          {
            label: "שעות נסיעה",
            value: totalSeconds,
            display: totalSeconds > 0 ? formatRideDuration(totalSeconds) : "--",
            icon: (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ),
            accent: "text-teal-400",
            glow: "shadow-teal-500/10",
          },
          {
            label: 'ק"מ סה"כ',
            value: totalKm,
            display: parseFloat(totalKm.toFixed(1)).toLocaleString("he-IL"),
            icon: (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            ),
            accent: "text-cyan-400",
            glow: "shadow-cyan-500/10",
          },
        ];

        return (
          <section className="mx-4 mt-6 grid grid-cols-3 gap-3 sm:mx-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/4 backdrop-blur-md px-3 py-4 shadow-lg ${s.glow}`}
              >
                <span className={`mb-1.5 ${s.accent}`}>{s.icon}</span>
                <span
                  className={`text-xl font-bold tabular-nums leading-none ${s.accent}`}
                >
                  {s.display}
                </span>
                <span className="mt-1.5 text-[10px] font-medium uppercase tracking-widest text-slate-500">
                  {s.label}
                </span>
              </div>
            ))}
          </section>
        );
      })()}
    </div>
  );
}
