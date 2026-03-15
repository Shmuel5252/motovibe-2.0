/**
 * AppSettingsPage — הגדרות אפליקציה.
 * מכיל placeholders להגדרות התראות, פרטיות וניהול חשבון.
 */
import { Bell, Lock, Trash2, ChevronLeft } from "lucide-react";
import GlassCard from "../app/ui/components/GlassCard";

function SettingRow({ icon: Icon, title, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <Icon size={16} className="text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-100">{title}</p>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={[
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
        enabled ? "bg-emerald-500" : "bg-white/10",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200",
          enabled ? "-translate-x-5" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

import { useState } from "react";

export default function AppSettingsPage({ currentUser, onLogout, onNavigate }) {
  const [notifyRides, setNotifyRides] = useState(true);
  const [notifyEvents, setNotifyEvents] = useState(true);
  const [notifyMaintenance, setNotifyMaintenance] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8"
      dir="rtl"
    >
      {/* כותרת */}
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate?.("profile")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-slate-200 transition"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-100">הגדרות</h1>
          <p className="text-xs text-slate-500">ניהול העדפות האפליקציה</p>
        </div>
      </header>

      {/* התראות */}
      <GlassCard title="התראות">
        <div className="divide-y divide-white/5">
          <SettingRow
            icon={Bell}
            title="התראות רכיבה"
            description="קבל עדכונים על רכיבות שהצטרפת אליהן"
          >
            <Toggle enabled={notifyRides} onChange={setNotifyRides} />
          </SettingRow>
          <SettingRow
            icon={Bell}
            title="אירועי קהילה"
            description="רכיבות קבוצתיות חדשות בקהילה"
          >
            <Toggle enabled={notifyEvents} onChange={setNotifyEvents} />
          </SettingRow>
          <SettingRow
            icon={Bell}
            title="תזכורות תחזוקה"
            description="כשהאופנוע צריך טיפול"
          >
            <Toggle
              enabled={notifyMaintenance}
              onChange={setNotifyMaintenance}
            />
          </SettingRow>
        </div>
      </GlassCard>

      {/* פרטיות */}
      <GlassCard title="פרטיות">
        <div className="divide-y divide-white/5">
          <SettingRow
            icon={Lock}
            title="מסלולים ציבוריים"
            description="כברירת מחדל מסלולים חדשים יהיו פרטיים"
          >
            <span className="text-xs text-slate-500">ניתן לשנות בכל מסלול</span>
          </SettingRow>
        </div>
      </GlassCard>

      {/* ניהול חשבון */}
      <GlassCard title="ניהול חשבון">
        <div className="flex flex-col gap-3 pt-1">
          <div className="rounded-xl border border-white/5 bg-white/3 px-3 py-2.5 text-sm">
            <p className="text-xs text-slate-500 mb-0.5">שם</p>
            <p className="text-slate-200">{currentUser?.name ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/3 px-3 py-2.5 text-sm">
            <p className="text-xs text-slate-500 mb-0.5">אימייל</p>
            <p className="text-slate-200">{currentUser?.email ?? "—"}</p>
          </div>

          {/* מחיקת חשבון — placeholder */}
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-2 flex items-center gap-2 self-start rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
            >
              <Trash2 size={13} />
              מחיקת חשבון
            </button>
          ) : (
            <div className="mt-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 space-y-2">
              <p className="text-xs text-red-300 font-medium">
                מחיקת חשבון היא פעולה בלתי הפיכה. כל הנתונים יימחקו.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs text-slate-300 hover:text-white transition"
                >
                  ביטול
                </button>
                <button
                  type="button"
                  onClick={() => alert("בקרוב — מחיקת חשבון")}
                  className="flex-1 rounded-lg bg-red-600/80 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition"
                >
                  מחק חשבון
                </button>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
