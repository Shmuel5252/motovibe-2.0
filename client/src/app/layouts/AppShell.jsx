import { useState } from "react";
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
 * @param {React.ReactNode | ((state: { activeTab: "home" | "routes" | "ride" | "history" | "bike" }) => React.ReactNode)} props.children
 * - תוכן העמוד הפעיל או פונקציית render prop שמקבלת את activeTab.
 * @returns {JSX.Element} שלד ניווט מלא עם תמיכה ב־RTL.
 */
function AppShell({ children }) {
  const [activeTab, setActiveTab] = useState("home");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  /*
   * עדכון לשונית פעילה וסגירת המגירה לאחר בחירה.
   * אין כאן החלפת מסכים עדיין — רק סטייט תצוגה.
   */
  const onNavigate = (tabKey) => {
    setActiveTab(tabKey);
    setIsDrawerOpen(false);
  };

  return (
    <div dir="rtl" className="mv-bg">
      {/* סרגל עליון עם מותג, לשוניות דסקטופ והמבורגר למובייל */}
      <TopNav
        items={NAV_ITEMS}
        activeTab={activeTab}
        onNavigate={onNavigate}
        onMenuClick={() => setIsDrawerOpen(true)}
      />

      {/* מגירת ניווט צדדית עם Overlay למצב מובייל */}
      <SideDrawer
        open={isDrawerOpen}
        items={NAV_ITEMS}
        activeTab={activeTab}
        onNavigate={onNavigate}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* אזור תוכן עם ריווח תחתון כדי למנוע חפיפה עם BottomNav במובייל */}
      <main className="pb-24 md:pb-8">
        {typeof children === "function" ? children({ activeTab }) : children}
      </main>

      {/* פס ניווט תחתון למובייל בלבד */}
      <BottomNav
        items={NAV_ITEMS}
        activeTab={activeTab}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export default AppShell;
