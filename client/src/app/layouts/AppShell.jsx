import { useState } from "react";
import BottomNav from "../ui/nav/BottomNav";
import SideDrawer from "../ui/nav/SideDrawer";
import TopNav from "../ui/nav/TopNav";

const NAV_ITEMS = [
  { key: "בית", label: "בית", icon: "⌂" },
  { key: "מסלולים", label: "מסלולים", icon: "⌁" },
  { key: "רכיבה", label: "רכיבה", icon: "●" },
  { key: "היסטוריה", label: "היסטוריה", icon: "◷" },
  { key: "האופנוע שלי", label: "האופנוע שלי", icon: "⚙" },
];

function AppShell({ children }) {
  const [activeTab, setActiveTab] = useState("בית");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setIsDrawerOpen(false);
  };

  return (
    <div dir="rtl" className="mv-bg">
      <TopNav
        items={NAV_ITEMS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onMenuClick={() => setIsDrawerOpen(true)}
      />

      <SideDrawer
        open={isDrawerOpen}
        items={NAV_ITEMS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onClose={() => setIsDrawerOpen(false)}
      />

      <main className="pb-24 md:pb-8">{children}</main>

      <BottomNav
        items={NAV_ITEMS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
}

export default AppShell;
