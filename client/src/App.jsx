import { useState } from "react";
import Button from "./app/ui/components/Button";
import GlassCard from "./app/ui/components/GlassCard";
import AppShell from "./app/layouts/AppShell";

/**
 * מסך האפליקציה הראשי.
 * רינדור המסך מתבצע לפי activeTab שמנוהל ב־AppShell (ללא Router בשלב זה).
 * @returns {JSX.Element} מעטפת ניווט עם תוכן דינמי לפי לשונית פעילה.
 */
function App() {
  const [selectedChip, setSelectedChip] = useState("הכל");

  /*
   * המסלול הנבחר לתצוגת פרטים בתוך מסך המסלולים.
   * כאשר null מוצגת רשימת המסלולים, וכאשר יש ערך מוצג Route Details.
   */
  const [selectedRoute, setSelectedRoute] = useState(null);

  /*
   * פילטר מקומי למסך היסטוריה (UI בלבד ללא סינון נתונים אמיתי בשלב זה).
   */
  const [selectedHistoryFilter, setSelectedHistoryFilter] = useState("הכל");
  const [isHistoryFilterMenuOpen, setIsHistoryFilterMenuOpen] = useState(false);

  /*
   * טקסט חיפוש מקומי למסך היסטוריה (ללא API).
   */
  const [searchQuery, setSearchQuery] = useState("");

  /*
   * Placeholder לנתוני מסלולים.
   * נקודת הרחבה עתידית: החלפה בנתונים מהשרת + חיפוש/פילטור אמיתי.
   */
  const routes = [
    {
      id: "route-1",
      title: "רמת השרון → תל אביב",
      from: "רמת השרון",
      to: "תל אביב",
      distanceKm: 42,
      etaMin: 45,
      tags: ["כביש", "לילה", "מהיר"],
    },
    {
      id: "route-2",
      title: "כביש החוף → חיפה",
      from: "כביש החוף",
      to: "חיפה",
      distanceKm: 96,
      etaMin: 70,
      tags: ["כביש", "לילה", "מהיר"],
    },
    {
      id: "route-3",
      title: "הרי ירושלים → בית שמש",
      from: "הרי ירושלים",
      to: "בית שמש",
      distanceKm: 38,
      etaMin: 52,
      tags: ["כביש", "לילה", "מהיר"],
    },
  ];

  const filterChips = ["הכל", "קצר", "בינוני", "ארוך", "שטח"];

  const historyFilters = ["הכל", "שבוע", "חודש", "שנה"];

  /*
   * נתוני דמו למסך היסטוריית רכיבות.
   * בהמשך יוחלפו בנתונים אמיתיים מהשרת.
   */
  const historyRides = [
    { id: "ride-1", title: "טיול רכיבה ביום שבת", date: "03.12.25", duration: "1:45", distance: "72 ק״מ" },
    { id: "ride-2", title: "נסיעה לעבודה", date: "28.11.25", duration: "0:55", distance: "21 ק״מ" },
    { id: "ride-3", title: "טיול לילה בהרים", date: "21.11.25", duration: "2:10", distance: "94 ק״מ" },
    { id: "ride-4", title: "סיבוב חוף ערב", date: "18.11.25", duration: "1:20", distance: "48 ק״מ" },
  ];

  /**
   * באנר רכיבה פעילה לטאבים שאינם רכיבה.
   * @param {Object} params - מאפייני הבאנר.
   * @param {boolean} params.isRideActive - האם רכיבה פעילה כרגע.
   * @param {boolean} params.isRideMinimized - האם הרכיבה כרגע במצב מזעור.
   * @param {(tabKey: "home" | "routes" | "ride" | "history" | "bike") => void} params.onNavigate - ניווט בין טאבים.
   * @returns {JSX.Element | null} באנר חזרה לרכיבה או null.
   */
  const renderActiveRideBanner = ({
    isRideActive,
    isRideMinimized,
    onNavigate,
  }) => {
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
  };

  /**
   * שכבת HUD לרכיבה פעילה במסך מלא.
   * כוללת טיימר גלובלי, נתוני סטטוס ופעולות שליטה תחתונות.
   * @param {Object} props - מאפייני הקומפוננטה.
   * @param {number} props.rideElapsedSeconds - זמן רכיבה מצטבר בשניות.
   * @param {boolean} props.isRidePaused - האם הרכיבה במצב השהיה.
   * @param {(value: boolean) => void} props.setIsRidePaused - עדכון מצב השהיה.
   * @param {() => void} props.onMinimize - מזעור HUD וחזרה למעטפת רגילה.
   * @param {() => void} props.onFinish - סיום רכיבה פעילה וחזרה למצב רגיל.
   * @returns {JSX.Element} מסך רכיבה פעילה Fullscreen.
   */
  function RideActiveHud({
    rideElapsedSeconds,
    isRidePaused,
    setIsRidePaused,
    onMinimize,
    onFinish,
  }) {
    const hours = String(Math.floor(rideElapsedSeconds / 3600)).padStart(
      2,
      "0",
    );
    const minutes = String(
      Math.floor((rideElapsedSeconds % 3600) / 60),
    ).padStart(2, "0");
    const seconds = String(rideElapsedSeconds % 60).padStart(2, "0");

    return (
      <section className="relative min-h-screen overflow-hidden px-4 pb-6 pt-6 sm:px-6">
        {/* שכבת רקע קולנועית + גריד עדין לדימוי מפה */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(20,184,166,0.22),rgba(2,6,23,0.9)_38%,rgba(2,6,23,1)_78%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[26px_26px] opacity-35" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_78%,rgba(16,185,129,0.14),transparent_52%)]" />

        <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col justify-between">
          {/* טיימר מרכזי */}
          <div className="pt-10 text-center sm:pt-14">
            {/* פעולת מזעור: מחזירה למעטפת רגילה בלי לסיים רכיבה */}
            <div className="mb-5 flex items-center justify-end">
              <Button
                variant="ghost"
                size="md"
                onClick={onMinimize}
                className="rounded-full px-3 py-1.5 text-xs text-slate-200"
              >
                מזער
              </Button>
            </div>

            <p className="text-6xl font-bold tracking-wider text-white sm:text-7xl">
              {hours}:{minutes}:{seconds}
            </p>
          </div>

          {/* KPI צף בסגנון נקי: 3 עמודות עם אייקון, ערך גדול ותווית קטנה */}
          <div className="mx-auto mt-8 w-full max-w-3xl border-y border-white/10 py-5">
            {/* סדר עמודות לוגי: דיוק → מהירות → מרחק */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="flex flex-col items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm">
                  🧭
                </span>
                <span className="text-2xl font-semibold leading-none text-white">
                  82%
                </span>
                <span className="text-xs text-slate-400">דיוק</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm">
                  ⏱️
                </span>
                <span className="text-2xl font-semibold leading-none text-white">
                  84
                </span>
                <span className="text-xs text-slate-400">מהירות (קמ״ש)</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm">
                  📍
                </span>
                <span className="text-2xl font-semibold leading-none text-white">
                  12.4
                </span>
                <span className="text-xs text-slate-400">מרחק (ק״מ)</span>
              </div>
            </div>
          </div>

          {/* סרגל פעולות תחתון */}
          <div className="mv-card mt-8 flex items-center justify-between gap-2 rounded-2xl px-3 py-3">
            <Button
              variant="ghost"
              size="md"
              onClick={onFinish}
              className="rounded-xl border-rose-300/30 bg-rose-500/80 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              סיום
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => setIsRidePaused((prev) => !prev)}
              className="rounded-xl px-6 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              {isRidePaused ? "המשך" : "השהה"}
            </Button>

            <Button
              variant="ghost"
              size="md"
              className="h-10 w-10 rounded-xl p-0 text-base text-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-300"
              aria-label="צילום רגע"
            >
              📷
            </Button>
          </div>
        </div>
      </section>
    );
  }

  /**
   * מסך Home/Dashboard זמני.
   * @returns {JSX.Element} בלוק בית עם hero, כרטיסים וסטטיסטיקות.
   */
  const renderHomeScreen = ({
    isRideActive,
    isRideMinimized,
    setIsRideActive,
    setIsRidePaused,
    setIsRideMinimized,
    onNavigate,
  }) => (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
      <main className="mt-6 flex-1">
        {renderActiveRideBanner({ isRideActive, isRideMinimized, onNavigate })}

        {/* Hero ראשי למסך הבית */}
        <section className="grid grid-cols-1 items-center gap-5 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              שלום שמואל
            </h1>
            <p className="mt-2 text-lg text-slate-300">מוכן לרכיבה</p>
            <Button
              variant="primary"
              size="lg"
              className="mt-6"
              onClick={() => {
                /* זרימת התחלה ישירה מהבית: הפעלה, איפוס מצבי ביניים ומעבר ללשונית רכיבה. */
                setIsRideActive(true);
                setIsRidePaused(false);
                setIsRideMinimized(false);
                onNavigate("ride");
              }}
            >
              התחל רכיבה
            </Button>
          </div>

          <div className="mv-card relative min-h-44 overflow-hidden rounded-2xl md:min-h-56">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(20,184,166,0.28),rgba(15,23,42,0.18)_40%,rgba(2,6,23,0.1)_75%)]" />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 to-transparent" />
            <div className="relative flex h-full items-end p-4">
              <span className="mv-pill px-3 py-1 text-xs text-slate-200">
                אזור תמונת אופנוע
              </span>
            </div>
          </div>
        </section>

        {/* כרטיסי מידע מרכזיים */}
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

      {/* פס סטטיסטיקות תחתון */}
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
  );

  /**
   * מסך Routes זמני עם פילטרים וכרטיסי מסלול.
   * @returns {JSX.Element} רשימת מסלולים עם פעולות Placeholder.
   */
  const renderRoutesScreen = ({
    isRideActive,
    isRideMinimized,
    onNavigate,
  }) => (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
      <main className="mt-6 flex-1">
        {renderActiveRideBanner({ isRideActive, isRideMinimized, onNavigate })}

        {/* כותרת מסך + שורת חיפוש */}
        <section className="transition-all duration-300 ease-out">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            מסלולים
          </h1>
          <p className="mt-2 text-base text-slate-300 sm:text-lg">
            בחר מסלול וצא לרכיבה
          </p>

          <div className="mv-card mt-5 p-2">
            <input
              type="search"
              placeholder="חפש מסלול..."
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            />
          </div>

          {/* שבבי פילטר מקומיים בלבד (ללא לוגיקת סינון אמיתית עדיין) */}
          <div className="mt-4 flex flex-wrap gap-2">
            {filterChips.map((chip) => {
              const isSelected = selectedChip === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSelectedChip(chip)}
                  className={[
                    "mv-pill px-3 py-1 text-xs font-medium transition",
                    isSelected
                      ? "text-emerald-200 ring-1 ring-emerald-300/40"
                      : "text-slate-300 hover:text-white",
                  ].join(" ")}
                  aria-pressed={isSelected}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </section>

        {/*
          בלוק רשימת המסלולים.
          מוסתר כאשר יש selectedRoute כדי לפנות מקום לתצוגת פרטים.
        */}
        <section
          className={[
            "mt-6 space-y-4 transition-all duration-300 ease-out",
            selectedRoute
              ? "pointer-events-none h-0 translate-y-2 overflow-hidden opacity-0"
              : "translate-y-0 opacity-100",
          ].join(" ")}
        >
          {routes.map((route) => (
            <GlassCard
              key={route.id}
              right={
                <button
                  type="button"
                  className="mv-pill inline-flex h-8 w-8 items-center justify-center text-sm text-slate-300 hover:text-white"
                  aria-label="מחק מסלול"
                >
                  ✕
                </button>
              }
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,220px)_1fr] md:items-center">
                <div className="relative h-28 overflow-hidden rounded-xl bg-slate-900/80 ring-1 ring-white/10">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.14)_1px,transparent_1px)] bg-size-[22px_22px]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(20,184,166,0.24),transparent_58%)]" />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    {route.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {route.distanceKm} ק״מ • {route.etaMin} דק׳
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {route.tags.map((tag) => (
                      <span
                        key={`${route.id}-${tag}`}
                        className="mv-pill px-2.5 py-1 text-xs text-slate-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* פעולות מסלול: מעבר לפרטים או התחלת רכיבה (Placeholder) */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setSelectedRoute(route)}
                    >
                      צפה
                    </Button>
                    <Button variant="ghost" size="md">
                      התחל רכיבה
                    </Button>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </section>

        {/*
          תצוגת פרטי מסלול.
          מוצגת רק לאחר בחירה של Route מתוך הרשימה.
        */}
        <section
          className={[
            "mt-6 transition-all duration-300 ease-out",
            selectedRoute
              ? "translate-y-0 opacity-100"
              : "pointer-events-none h-0 -translate-y-2 overflow-hidden opacity-0",
          ].join(" ")}
        >
          {selectedRoute && (
            <div className="space-y-4">
              <button
                type="button"
                className="mv-pill inline-flex items-center gap-2 px-3 py-1.5 text-sm text-slate-200 hover:text-white"
                onClick={() => setSelectedRoute(null)}
              >
                <span aria-hidden="true">←</span>
                <span>חזרה למסלולים</span>
              </button>

              <div className="mv-card relative aspect-[16/7] overflow-hidden rounded-2xl border border-white/10">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-size-[26px_26px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(20,184,166,0.22),transparent_60%)]" />
                <svg
                  viewBox="0 0 100 40"
                  className="absolute inset-0 h-full w-full"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6,30 C20,8 28,36 42,20 C55,8 66,28 78,18 C86,12 92,16 96,10"
                    fill="none"
                    stroke="rgba(52,211,153,0.9)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <GlassCard title={selectedRoute.title}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2 text-sm text-slate-300 sm:grid-cols-3">
                    <p>מרחק: {selectedRoute.distanceKm} ק״מ</p>
                    <p>זמן משוער: {selectedRoute.etaMin} דק׳</p>
                    <p>קושי: בינוני</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedRoute.tags.map((tag) => (
                      <span
                        key={`detail-${selectedRoute.id}-${tag}`}
                        className="mv-pill px-2.5 py-1 text-xs text-slate-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" size="md">
                      התחל רכיבה
                    </Button>
                    <Button variant="ghost" size="md" disabled>
                      מחק מסלול
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </section>
      </main>

      {/* FAB ליצירת מסלול (UI בלבד, ללא פעולה כרגע) */}
      <div className="pointer-events-none fixed bottom-24 left-4 z-30 flex items-center gap-2 md:bottom-8 md:left-6">
        <span className="mv-pill px-3 py-1 text-xs text-slate-200">
          צור מסלול
        </span>
        <button
          type="button"
          className="pointer-events-auto mv-card inline-flex h-12 w-12 items-center justify-center rounded-full text-2xl text-emerald-200 shadow-[0_0_24px_rgba(20,184,166,0.35)]"
          aria-label="צור מסלול"
        >
          +
        </button>
      </div>
    </div>
  );

  /**
   * מסך רכיבה בלשונית ride: מצב מוכן או HUD פעיל במסך מלא.
   * @param {Object} params - מאפייני תצוגה.
   * @param {boolean} params.isRideActive - האם רכיבה פעילה כרגע.
   * @param {boolean} params.isRidePaused - האם רכיבה בהשהיה.
   * @param {boolean} params.isRideMinimized - האם הרכיבה במצב מזעור.
   * @param {number} params.rideElapsedSeconds - זמן רכיבה מצטבר בשניות.
   * @param {(value: boolean) => void} params.setIsRideActive - עדכון מצב רכיבה פעילה.
   * @param {(value: boolean) => void} params.setIsRidePaused - עדכון מצב השהיה.
   * @param {(value: boolean) => void} params.setIsRideMinimized - עדכון מצב מזעור HUD.
   * @param {(tabKey: "home" | "routes" | "ride" | "history" | "bike") => void} params.onNavigate - ניווט בין טאבים.
   * @returns {JSX.Element} מסך ride בהתאם למצב הפעילות.
   */
  const renderRideScreen = ({
    isRideActive,
    isRidePaused,
    isRideMinimized,
    rideElapsedSeconds,
    setIsRideActive,
    setIsRidePaused,
    setIsRideMinimized,
    onNavigate,
  }) => {
    if (isRideActive && !isRideMinimized) {
      return (
        <RideActiveHud
          rideElapsedSeconds={rideElapsedSeconds}
          isRidePaused={isRidePaused}
          setIsRidePaused={setIsRidePaused}
          onMinimize={() => {
            setIsRideMinimized(true);
            onNavigate("home");
          }}
          onFinish={() => {
            setIsRideActive(false);
          }}
        />
      );
    }

    return (
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
        <main className="mt-6 flex flex-1 items-center justify-center">
          {/* מסך מוכנות לרכיבה לפני כניסה ל־HUD */}
          <GlassCard
            className="w-full max-w-xl text-center"
            title="מוכן לרכיבה?"
          >
            <p className="text-sm text-slate-300">
              הפעל מצב רכיבה פעילה לממשק מלא ללא ניווט.
            </p>

            {/* שורת סטטוס קצרה לפני יציאה לרכיבה */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="mv-pill px-3 py-1 text-xs font-medium text-emerald-200">
                GPS: מוכן
              </span>
              <span className="mv-pill px-3 py-1 text-xs text-slate-200">
                דיוק משוער: גבוה
              </span>
            </div>

            {/* בחירת מסלול אופציונלית: שני קונטרולים מאותה משפחת עיצוב (pill/glass) */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm">
              <span className="text-slate-300">מסלול</span>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {/* בסיס משותף לשני הכפתורים: pill/glass זהה לגובה, רדיוס ויישור */}
                <Button
                  variant="ghost"
                  size="md"
                  className="rounded-full bg-white/5 border border-white/10 text-sm px-4 py-2 leading-none backdrop-blur whitespace-nowrap w-auto border-emerald-400/40 text-emerald-200"
                >
                  ללא מסלול
                </Button>
                {/* מודיפייר ניטרלי: אותו בסיס בדיוק, בלי הדגשת בחירה */}
                <Button
                  variant="ghost"
                  size="md"
                  className="rounded-full bg-white/5 border border-white/10 text-sm px-4 py-2 leading-none backdrop-blur whitespace-nowrap w-auto text-white/80 hover:text-white"
                >
                  בחר מסלול
                </Button>
              </div>
            </div>

            {/* הערת בטיחות לפני התחלת רכיבה */}
            <p className="mt-4 text-xs text-slate-400">
              טיפ: בדוק קסדה ואורות לפני יציאה
            </p>

            <Button
              variant="primary"
              size="lg"
              className="mt-6 w-full"
              onClick={() => {
                /* כניסה לרכיבה פעילה תמיד מתחילה במצב לא מושהה. */
                setIsRidePaused(false);
                setIsRideMinimized(false);
                setIsRideActive(true);
              }}
            >
              התחל רכיבה
            </Button>
          </GlassCard>
        </main>
      </div>
    );
  };

  /**
   * מסך History עם פילטרים, סטטיסטיקות ורשימת רכיבות אחרונות.
   * @param {Object} params - מאפייני תצוגה למסך.
   * @param {boolean} params.isRideActive - האם רכיבה פעילה כרגע.
   * @param {boolean} params.isRideMinimized - האם רכיבה במצב מזעור.
   * @param {(tabKey: "home" | "routes" | "ride" | "history" | "bike") => void} params.onNavigate - מעבר בין טאבים.
   * @returns {JSX.Element} מסך היסטוריית רכיבות בתצוגת MotoVibe.
   */
  const renderHistoryScreen = ({ isRideActive, isRideMinimized, onNavigate }) => {
    /* סינון מקומי פשוט לפי שם רכיבה (case-insensitive). */
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const visibleHistoryRides = historyRides.filter((ride) =>
      ride.title.toLowerCase().includes(normalizedSearch),
    );

    return (
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
        <main className="mt-6 flex-1">
          {renderActiveRideBanner({ isRideActive, isRideMinimized, onNavigate })}

          {/* כותרת מסך + כלי חיפוש/סינון מקומיים */}
          <section>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">היסטוריית רכיבות</h1>
            <p className="mt-2 text-base text-slate-300 sm:text-lg">
              כל הרכיבות האחרונות שלך במקום אחד
            </p>

            {/* שורת חיפוש + כפתור סינון קומפקטי */}
            <div className="mt-4 flex items-center gap-2">
              <div className="mv-card relative flex-1 p-2">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  🔎
                </span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="חפש רכיבה..."
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2 pe-3 ps-9 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                />
              </div>

              {/* בקרת סינון יחידה: כפתור אייקון + תפריט נפתח */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsHistoryFilterMenuOpen((prev) => !prev)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  aria-label="סינון"
                  aria-expanded={isHistoryFilterMenuOpen}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 6h16l-6.5 7.2v4.8l-3 1.8v-6.6L4 6Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {isHistoryFilterMenuOpen && (
                  <div className="absolute right-0 top-full z-40 mt-2 w-40 rounded-2xl border border-white/10 bg-slate-900/85 p-2 shadow-[0_10px_35px_rgba(2,6,23,0.55)] backdrop-blur-md">
                    {historyFilters.map((filter) => {
                      const isSelected = selectedHistoryFilter === filter;
                      return (
                        <button
                          key={`menu-${filter}`}
                          type="button"
                          onClick={() => {
                            setSelectedHistoryFilter(filter);
                            setIsHistoryFilterMenuOpen(false);
                          }}
                          className={[
                            "mb-1 inline-flex w-full items-center justify-center rounded-xl border px-3 py-1.5 text-sm transition last:mb-0",
                            isSelected
                              ? "border-emerald-300/40 text-emerald-200"
                              : "border-transparent text-slate-200 hover:border-white/10 hover:text-white",
                          ].join(" ")}
                        >
                          {filter}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* שכבת סגירה בלחיצה מחוץ לתפריט הסינון */}
            {isHistoryFilterMenuOpen && (
              <button
                type="button"
                aria-label="סגור תפריט סינון"
                className="fixed inset-0 z-30 cursor-default"
                onClick={() => setIsHistoryFilterMenuOpen(false)}
              />
            )}

            {/* סיכום מסנן נבחר (ללא שורת צ'יפים כפולה) */}
            <div className="mt-3">
              <span className="mv-pill px-3 py-1 text-xs text-slate-200">
                טווח: {selectedHistoryFilter}
              </span>
            </div>
          </section>

          {/* פס סטטיסטיקות חדש: מספרים גדולים ומחיצות אנכיות עדינות */}
          <section className="mv-card mt-6 px-4 py-3">
            <div className="grid grid-cols-3 gap-0 text-center">
              <div className="border-e border-white/10 px-2">
                <p className="text-2xl font-semibold leading-none text-white">12</p>
                <p className="mt-1 text-xs text-slate-400">רכיבות</p>
              </div>
              <div className="border-e border-white/10 px-2">
                <p className="text-2xl font-semibold leading-none text-white">14:30</p>
                <p className="mt-1 text-xs text-slate-400">שעות</p>
              </div>
              <div className="px-2">
                <p className="text-2xl font-semibold leading-none text-white">615</p>
                <p className="mt-1 text-xs text-slate-400">ק״מ</p>
              </div>
            </div>
          </section>

          {/* רשימת רכיבות אחרונות */}
          <section className="mt-6 space-y-4">
            {visibleHistoryRides.map((ride) => (
            <GlassCard
              key={ride.id}
              right={
                <Button variant="ghost" size="md" className="h-8 w-8 rounded-full p-0 text-base">
                  &gt;
                </Button>
              }
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_130px] md:items-center">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">{ride.title}</h3>
                  <p className="mt-1 text-xs text-slate-400">{ride.date}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                    <span>⏱️ {ride.duration}</span>
                    <span>📍 {ride.distance}</span>
                  </div>
                </div>

                <div className="h-24 overflow-hidden rounded-xl bg-linear-to-br from-slate-900/90 via-slate-800/65 to-emerald-900/30 ring-1 ring-white/10" />
              </div>
            </GlassCard>
            ))}

            {/*
              מצב ריק עתידי:
              כאשר historyRides יהיה מערך ריק, ניתן לרנדר כאן GlassCard עם הודעה
              כמו "אין רכיבות להצגה" וכפתור CTA להתחלת רכיבה חדשה.
            */}
          </section>
        </main>
      </div>
    );
  };

  /**
   * Placeholder למסכים שטרם מומשו.
   * @param {string} title - כותרת המסך.
   * @param {string} subtitle - תיאור קצר למסך.
   * @returns {JSX.Element} מסך זכוכית בסיסי עם תוכן זמני.
   */
  const renderPlaceholderScreen = (
    title,
    subtitle,
    { isRideActive, isRideMinimized, onNavigate },
  ) => (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
      <main className="mt-6 flex-1">
        {renderActiveRideBanner({ isRideActive, isRideMinimized, onNavigate })}

        <section>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-base text-slate-300 sm:text-lg">{subtitle}</p>
        </section>

        <section className="mt-6">
          <GlassCard
            title="בקרוב"
            right={<span className="mv-pill px-2.5 py-1 text-xs">Preview</span>}
          >
            <p className="text-sm text-slate-300">
              המסך בתהליך חיבור נתונים ולוגיקה. בינתיים זהו Placeholder ויזואלי
              בלבד.
            </p>
          </GlassCard>
        </section>
      </main>
    </div>
  );

  return (
    <AppShell>
      {({
        activeTab,
        isRideActive,
        setIsRideActive,
        isRidePaused,
        setIsRidePaused,
        isRideMinimized,
        setIsRideMinimized,
        rideElapsedSeconds,
        onNavigate,
      }) => {
        /* מיפוי תצוגה לפי הטאב הפעיל (ללא Router בשלב זה). */
        if (activeTab === "home") {
          return renderHomeScreen({
            isRideActive,
            isRideMinimized,
            setIsRideActive,
            setIsRidePaused,
            setIsRideMinimized,
            onNavigate,
          });
        }

        if (activeTab === "routes") {
          return renderRoutesScreen({
            isRideActive,
            isRideMinimized,
            onNavigate,
          });
        }

        if (activeTab === "ride") {
          return renderRideScreen({
            isRideActive,
            isRidePaused,
            isRideMinimized,
            rideElapsedSeconds,
            setIsRideActive,
            setIsRidePaused,
            setIsRideMinimized,
            onNavigate,
          });
        }

        if (activeTab === "history") {
          return renderHistoryScreen({
            isRideActive,
            isRideMinimized,
            onNavigate,
          });
        }

        return renderPlaceholderScreen(
          "האופנוע שלי",
          "כאן תנהל תחזוקה ומצב כלי",
          { isRideActive, isRideMinimized, onNavigate },
        );
      }}
    </AppShell>
  );
}

export default App;
