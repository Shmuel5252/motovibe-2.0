import { useEffect, useState } from "react";
import BottomNav from "../ui/nav/BottomNav";
import SideDrawer from "../ui/nav/SideDrawer";
import TopNav from "../ui/nav/TopNav";
import NotificationCenter from "../ui/NotificationCenter";

/*
 * תצורת לשוניות הניווט הראשית.
 */
const NAV_ITEMS = [
  { key: "home", label: "בית", icon: "⌂" },
  { key: "ride", label: "רכיבה", icon: "●" },
  { key: "routes", label: "פעילות", icon: "◈" },
  { key: "community", label: "קהילה", icon: "◎" },
  { key: "bike", label: "האופנוע", icon: "⚙" },
];

/**
 * מעטפת הניווט הראשית של האפליקציה.
 */
function AppShell({
  children,
  onLogout,
  isAuthenticated = false,
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
}) {
  const [activeTab, setActiveTab] = useState("home");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRideActive, setIsRideActive] = useState(false);
  const [isRidePaused, setIsRidePaused] = useState(false);
  const [isRideMinimized, setIsRideMinimized] = useState(false);
  const [rideElapsedSeconds, setRideElapsedSeconds] = useState(0);

  const isRideFullscreen = isRideActive && !isRideMinimized;

  /* ride timer */
  useEffect(() => {
    if (!isRideActive || isRidePaused) return undefined;
    const id = window.setInterval(
      () => setRideElapsedSeconds((p) => p + 1),
      1000,
    );
    return () => window.clearInterval(id);
  }, [isRideActive, isRidePaused]);

  const onNavigate = (tabKey) => {
    setActiveTab(tabKey);
    setIsDrawerOpen(false);
    setIsNotifOpen(false);
  };

  const handleRideActiveChange = (isActive) => {
    setIsRideActive(isActive);
    if (isActive) {
      setIsDrawerOpen(false);
      return;
    }
    setIsRidePaused(false);
    setIsRideMinimized(false);
    setRideElapsedSeconds(0);
  };

  const minutes = String(Math.floor(rideElapsedSeconds / 60)).padStart(2, "0");
  const seconds = String(rideElapsedSeconds % 60).padStart(2, "0");

  return (
    <div dir="rtl" className="mv-bg">
      {/* Top nav */}
      {!isRideFullscreen && (
        <TopNav
          items={NAV_ITEMS}
          activeTab={activeTab}
          onNavigate={onNavigate}
          onMenuClick={() => {
            setIsDrawerOpen(true);
            setIsNotifOpen(false);
          }}
          onLogout={onLogout}
          isAuthenticated={isAuthenticated}
          notificationSlot={
            <NotificationCenter
              notifications={notifications}
              unreadCount={unreadCount}
              isOpen={isNotifOpen}
              onToggle={() => setIsNotifOpen((p) => !p)}
              onClose={() => setIsNotifOpen(false)}
              onMarkRead={onMarkRead}
              onMarkAllRead={onMarkAllRead}
              onDelete={onDeleteNotification}
              onNavigate={onNavigate}
            />
          }
        />
      )}

      {/* Side drawer */}
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

      {/* Main content */}
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

      {/* Bottom nav */}
      {!isRideFullscreen && (
        <BottomNav
          items={NAV_ITEMS}
          activeTab={activeTab}
          onNavigate={onNavigate}
        />
      )}

      {/* Minimised ride widget */}
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
