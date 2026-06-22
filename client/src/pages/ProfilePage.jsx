/**
 * ProfilePage — פרופיל המשתמש המחובר.
 * מציג שם, אימייל, תמונה (אם יש), ותאריך הצטרפות.
 */
import { useState, useRef } from "react";
import {
  User,
  Mail,
  CalendarDays,
  LogOut,
  Pencil,
  Camera,
  X,
  Check,
  Loader,
} from "lucide-react";
import GlassCard from "../app/ui/components/GlassCard";
import { formatRideDuration } from "../app/utils/formatters";
import { imgSrc } from "../app/utils/imageUrl";

export default function ProfilePage({
  currentUser,
  historyRides = [],
  onLogout,
  onNavigate,
  onUpdateProfile,
  apiClient,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const fileInputRef = useRef(null);

  const openEditModal = () => {
    setEditName(currentUser?.name ?? "");
    setEditAvatarUrl(null);
    setEditAvatarPreview(null);
    setSaveError("");
    setIsEditing(true);
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setEditAvatarPreview(previewUrl);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await apiClient.post("/upload", formData);
      setEditAvatarUrl(data.url);
    } catch {
      setSaveError("העלאת התמונה נכשלה, נסה שוב");
      setEditAvatarPreview(null);
    } finally {
      setIsUploading(false);
    }
    // reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      setSaveError("שם לא יכול להיות ריק");
      return;
    }
    setSaveError("");
    setIsSaving(true);
    try {
      const payload = { name: editName.trim() };
      if (editAvatarUrl !== null) payload.avatarUrl = editAvatarUrl;
      await onUpdateProfile?.(payload);
      setIsEditing(false);
    } catch {
      setSaveError("שמירה נכשלה, נסה שוב");
    } finally {
      setIsSaving(false);
    }
  };
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

  const totalRides = historyRides.length;
  const totalKm = historyRides.reduce((sum, r) => sum + (r.rawKm || 0), 0);
  const totalSeconds = historyRides.reduce(
    (sum, r) => sum + (r.rawSeconds || 0),
    0,
  );

  const stats = [
    {
      label: "רכיבות",
      display: totalRides.toLocaleString("he-IL"),
      accent: "text-emerald-400",
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
    },
    {
      label: "שעות נסיעה",
      display: totalSeconds > 0 ? formatRideDuration(totalSeconds) : "0",
      accent: "text-teal-400",
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
    },
    {
      label: 'ק"מ סה"כ',
      display: parseFloat(totalKm.toFixed(1)).toLocaleString("he-IL"),
      accent: "text-cyan-400",
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
    },
  ];

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

        {/* כפתור ערוך פרופיל */}
        <button
          type="button"
          onClick={openEditModal}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-600/40 to-teal-600/40 border border-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:from-emerald-600/60 hover:to-teal-600/60 active:scale-[0.98]"
        >
          <Pencil size={14} />
          ערוך פרופיל
        </button>
      </GlassCard>

      {/* כרטיסי סטטיסטיקות */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          סטטיסטיקות רכיבה
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/4 backdrop-blur-md px-3 py-4 shadow-lg"
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
        </div>
      </div>

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

      {/* ── Edit Profile Modal ── */}
      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditing(false);
          }}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-slate-900/95 px-5 pb-10 pt-5 shadow-2xl"
            dir="rtl"
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100">
                ערוך פרופיל
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Avatar Upload */}
            <div className="mb-6 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-emerald-500/40 bg-white/5 shadow-lg transition hover:border-emerald-400"
              >
                {editAvatarPreview ? (
                  <img
                    src={editAvatarPreview}
                    alt="תצוגה מקדימה"
                    className="h-full w-full object-cover"
                  />
                ) : avatarSrc ? (
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
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
                  {isUploading ? (
                    <Loader size={22} className="animate-spin text-white" />
                  ) : (
                    <Camera size={22} className="text-white" />
                  )}
                </div>
              </button>
              <span className="text-xs text-slate-500">
                לחץ על התמונה לשינוי
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>

            {/* Name Input */}
            <div className="mb-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">
                שם מלא
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={50}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                placeholder="השם שלך"
              />
            </div>

            {saveError && (
              <p className="mb-3 text-xs text-red-400">{saveError}</p>
            )}

            {/* Actions */}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 active:scale-[0.98]"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isUploading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader size={15} className="animate-spin" />
                ) : (
                  <Check size={15} />
                )}
                שמור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
