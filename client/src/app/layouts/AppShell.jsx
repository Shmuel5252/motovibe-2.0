import { useEffect, useState } from "react";
import BottomNav from "../ui/nav/BottomNav";
import SideDrawer from "../ui/nav/SideDrawer";
import TopNav from "../ui/nav/TopNav";

/*
 * תצורת לשוניות הניווט הראשית.
 * נשמרת כקונפיגורציה אחת כדי לשמור עקביות בין TopNav, BottomNav ו־SideDrawer.
 */
const NAV_ITEMS = [
  { key: "home", label: "בית", icon: "⌂" },
  { key: "routes", label: "מסלולים", icon: "⌁" },
  { key: "ride", label: "רכיבה", icon: "●" },
  { key: "history", label: "היסטוריה", icon: "◷" },
  { key: "bike", label: "האופנוע שלי", icon: "⚙" },
];

/**
 * מעטפת הניווט הראשית של האפליקציה.
 * מרנדרת TopNav עליון, מגירת צד, ניווט תחתון למובייל ואזור תוכן מרכזי.
 * @param {Object} props - מאפייני הקומפוננטה.
 * @param {React.ReactNode | ((state: {
 * activeTab: "home" | "routes" | "ride" | "history" | "bike",
 * isRideActive: boolean,
 * setIsRideActive: (value: boolean) => void,
 * isRidePaused: boolean,
 * setIsRidePaused: (value: boolean) => void,
 * isRideMinimized: boolean,
 * setIsRideMinimized: (value: boolean) => void,
 * rideElapsedSeconds: number,
 * onNavigate: (tabKey: "home" | "routes" | "ride" | "history" | "bike") => void,
 * }) => React.ReactNode)} props.children
 * - תוכן העמוד הפעיל או פונקציית render prop עם מצב ניווט ורכיבה פעילה.
 * @returns {JSX.Element} שלד ניווט מלא עם תמיכה ב־RTL.
 */
function AppShell({ children, onLogout }) {
  const [activeTab, setActiveTab] = useState("home");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  /*
   * מצב רכיבה פעילה גלובלי לשכבת ה־UI.
   * כשהוא פעיל, המסך עובר ל־Fullscreen HUD ומסתיר ניווט עליון/תחתון.
   */
  const [isRideActive, setIsRideActive] = useState(false);

  /*
   * מצב השהיה גלובלי לרכיבה פעילה.
   * נשמר ב־Shell כדי שכל המסכים יקבלו אמת מצב אחת בזמן Fullscreen.
   */
  const [isRidePaused, setIsRidePaused] = useState(false);

  /*
   * האם שכבת הרכיבה ממוזערת לווידג׳ט צף.
   * כאשר true, הניווט הרגיל חוזר וה־HUD המלא מוסתר.
   */
  const [isRideMinimized, setIsRideMinimized] = useState(false);

  /*
   * טיימר רכיבה גלובלי (בשניות) עבור HUD + ווידג׳ט ממוזער.
   */
  const [rideElapsedSeconds, setRideElapsedSeconds] = useState(0);

  /*
   * Fullscreen אמיתי רק כאשר רכיבה פעילה ואינה ממוזערת.
   */
  const isRideFullscreen = isRideActive && !isRideMinimized;

  /*
   * ספירת זמן רכיבה כאשר פעיל ולא מושהה.
   */
  useEffect(() => {
    if (!isRideActive || isRidePaused) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setRideElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRideActive, isRidePaused]);

  /*
   * עדכון לשונית פעילה וסגירת המגירה לאחר בחירה.
   * אין כאן החלפת מסכים עדיין — רק סטייט תצוגה.
   */
  const onNavigate = (tabKey) => {
    setActiveTab(tabKey);
    setIsDrawerOpen(false);
  };

  /*
   * מעטפת עדכון למצב רכיבה: סוגרת מגירה כדי למנוע חפיפה ב־Fullscreen.
   * @param {boolean} isActive - האם רכיבה פעילה כרגע.
   */
  const handleRideActiveChange = (isActive) => {
    setIsRideActive(isActive);
    if (isActive) {
      setIsDrawerOpen(false);
      return;
    }

    /* איפוס מלא ביציאה מרכיבה פעילה. */
    setIsRidePaused(false);
    setIsRideMinimized(false);
    setRideElapsedSeconds(0);
  };

  /* תצוגת זמן קצרה לווידג׳ט ממוזער בפורמט mm:ss. */
  const minutes = String(Math.floor(rideElapsedSeconds / 60)).padStart(2, "0");
  const seconds = String(rideElapsedSeconds % 60).padStart(2, "0");

  return (
    <div dir="rtl" className="mv-bg">
      {/* ניווט עליון מוצג רק כשאין רכיבה פעילה */}
      {!isRideFullscreen && (
        <TopNav
          items={NAV_ITEMS}
          activeTab={activeTab}
          onNavigate={onNavigate}
          onMenuClick={() => setIsDrawerOpen(true)}
        />
      )}

      {/* מגירת צד מבוטלת בזמן רכיבה פעילה כדי למנוע הסחות */}
      {!isRideFullscreen && (
        <SideDrawer
          open={isDrawerOpen}
          items={NAV_ITEMS}
          activeTab={activeTab}
          onNavigate={onNavigate}
          onClose={() => setIsDrawerOpen(false)}
          onLogout={onLogout}
        />
      )}

      {/* אזור תוכן עם ריווח תחתון כדי למנוע חפיפה עם BottomNav במובייל */}
      <main className={isRideFullscreen ? "p-0" : "pb-24 md:pb-8"}>
        {typeof children === "function"
          ? children({
              activeTab,
              isRideActive,
              setIsRideActive: handleRideActiveChange,
              isRidePaused,
              setIsRidePaused,
              isRideMinimized,
              setIsRideMinimized,
              rideElapsedSeconds,
              onNavigate,
            })
          : children}
      </main>

      {/* פס ניווט תחתון מוסתר בזמן רכיבה פעילה */}
      {!isRideFullscreen && (
        <BottomNav
          items={NAV_ITEMS}
          activeTab={activeTab}
          onNavigate={onNavigate}
        />
      )}

      {/* ווידג׳ט רכיבה ממוזער: יעד מגע גדול ונוח יותר ללחיצה במובייל */}
      {isRideActive && isRideMinimized && (
        <button
          type="button"
          className="mv-card fixed bottom-24 right-4 z-40 flex h-14 min-w-40 items-center justify-between gap-3 rounded-full px-4 py-2.5 text-base text-slate-100 shadow-[0_10px_35px_rgba(2,6,23,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 md:bottom-6"
          onClick={() => {
            setIsRideMinimized(false);
            onNavigate("ride");
          }}
        >
          <span className="font-mono text-base font-semibold tracking-wide">
            {minutes}:{seconds}
          </span>
          <span
            className={[
              "mv-pill px-2.5 py-1 text-xs",
              isRidePaused ? "text-amber-200" : "text-emerald-200",
            ].join(" ")}
          >
            {isRidePaused ? "מושהה" : "פעיל"}
          </span>
        </button>
      )}
    </div>
  );
}

export default AppShell;
