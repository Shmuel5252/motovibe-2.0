/**
 * ProfilePage — פרופיל המשתמש המחובר.
 * מציג שם, אימייל, תמונה (אם יש), ותאריך הצטרפות.
 */
import { User, Mail, CalendarDays, LogOut } from "lucide-react";
import GlassCard from "../app/ui/components/GlassCard";

const IMG_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
  "http://localhost:5000";

function imgSrc(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${IMG_BASE}${url}`;
}

export default function ProfilePage({ currentUser, onLogout, onNavigate }) {
  const joinDate = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString("he-IL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const avatarSrc = imgSrc(currentUser?.avatarUrl ?? currentUser?.imageUrl);
  const initials = (currentUser?.name ?? "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8"
      dir="rtl"
    >
      {/* כרטיס avatar + שם */}
      <GlassCard>
        <div className="flex flex-col items-center gap-4 py-4">
          {/* תמונת פרופיל / אינישיאלס */}
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-emerald-500/40 bg-white/5 shadow-lg">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="תמונת פרופיל"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-emerald-400">
                {initials || <User size={36} className="text-slate-400" />}
              </div>
            )}
          </div>

          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-100">
              {currentUser?.name ?? "משתמש"}
            </h1>
            {currentUser?.role === "admin" && (
              <span className="mt-1 inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                מנהל
              </span>
            )}
          </div>
        </div>

        {/* פרטים */}
        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 text-sm text-slate-300">
          <div className="flex items-center gap-3">
            <Mail size={16} className="shrink-0 text-emerald-400" />
            <span>{currentUser?.email ?? "—"}</span>
          </div>
          {joinDate && (
            <div className="flex items-center gap-3">
              <CalendarDays size={16} className="shrink-0 text-emerald-400" />
              <span>הצטרף ב-{joinDate}</span>
            </div>
          )}
        </div>
      </GlassCard>

      {/* פעולות */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onNavigate?.("settings")}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 active:scale-[0.98]"
        >
          <span>הגדרות חשבון</span>
          <span className="text-slate-500">›</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onLogout?.();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 active:scale-[0.98]"
        >
          <LogOut size={15} />
          התנתקות
        </button>
      </div>
    </div>
  );
}
