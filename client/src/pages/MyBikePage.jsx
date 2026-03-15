/**
 * MyBikePage — מסך "האופנוע שלי".
 * תמיכה מלאה ב-Single Bike MVP: צפייה, יצירה, עריכה, מחיקה של אופנוע ורשומות תחזוקה.
 */

import { useState, useEffect } from "react";
import Button from "../app/ui/components/Button";
import GlassCard from "../app/ui/components/GlassCard";
import { Bike, Pencil, Trash2, ChevronDown, Bell } from "lucide-react";

/* ─── קבועים ─── */

const SERVICE_TYPES = ["שמן", "שרשרת", "בלמים", "צמיגים", "טסט", "אחר"];

const ALERT_TYPES = ["שמן", "שרשרת", "בלמים", "צמיגים", "טסט", "כללי", "אחר"];
const TYPE_ICONS = {
  שמן: "◈",
  שרשרת: "⚙",
  בלמים: "◉",
  צמיגים: "◎",
  טסט: "◻",
  כללי: "⌖",
  אחר: "◇",
};

const IMG_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
  "http://localhost:5000";
function imgSrc(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${IMG_BASE}${url}`;
}

/* ─── MileageAlertModal ─── */

function MileageAlertModal({ bike, onSave, onClose, isSaving }) {
  const [alerts, setAlerts] = useState(
    bike?.mileageAlerts?.map((a) => ({
      type: a.type,
      targetKm: a.targetKm,
      note: a.note || "",
    })) || [],
  );
  const [newType, setNewType] = useState(ALERT_TYPES[0]);
  const [newTargetKm, setNewTargetKm] = useState("");
  const [newNote, setNewNote] = useState("");
  const [typeDropOpen, setTypeDropOpen] = useState(false);

  const handleAdd = () => {
    if (!newTargetKm) return;
    setAlerts((prev) => [
      ...prev,
      { type: newType, targetKm: Number(newTargetKm), note: newNote.trim() },
    ]);
    setNewTargetKm("");
    setNewNote("");
  };

  const handleRemove = (idx) =>
    setAlerts((prev) => prev.filter((_, i) => i !== idx));

  const inputCls =
    "w-full transition-all rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-emerald-500/50 focus:bg-white/12 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-0 sm:px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative z-10 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl border-t border-white/8 sm:border bg-[#080e1f] shadow-[0_-20px_60px_rgba(0,0,0,0.7)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* ─ Header ─ */}
        <div className="px-6 pt-6 pb-4 shrink-0 border-b border-white/6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-white">
                התראות קילומטראז׳
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 tracking-wide">
                קבל התראה כשהאופנוע מגיע ליעד שתגדיר
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ─ Alert List ─ */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-2 min-h-15">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span className="text-3xl opacity-30">◈</span>
              <p className="text-xs text-slate-500 tracking-widest uppercase">
                אין התראות פעילות
              </p>
            </div>
          ) : (
            alerts.map((a, i) => (
              <div
                key={i}
                className="group flex items-center gap-3 rounded-2xl border border-white/6 bg-white/3 px-4 py-3 hover:bg-white/5 transition"
              >
                <span className="text-emerald-500/60 text-base shrink-0 font-light">
                  {TYPE_ICONS[a.type] ?? "◈"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-200 tracking-tight">
                    {a.type}
                    <span className="mr-2 text-emerald-400 font-semibold tabular-nums">
                      {Number(a.targetKm).toLocaleString("he-IL")}
                      <span className="text-slate-500 font-normal text-[11px] mr-0.5">
                        {" "}
                        ק״מ
                      </span>
                    </span>
                  </p>
                  {a.note && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5 tracking-wide">
                      {a.note}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-slate-600 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* ─ Add Form ─ */}
        <div className="px-6 pb-6 pt-4 shrink-0 border-t border-white/6 space-y-3">
          <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-widest">
            הוספת התראה חדשה
          </p>

          {/* סוג */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setTypeDropOpen((p) => !p)}
              className="w-full bg-white/8 border border-white/15 rounded-2xl px-4 py-3 text-sm text-slate-100 flex justify-between items-center focus:outline-none hover:bg-white/12 transition-all tracking-wide"
            >
              <span className="flex items-center gap-2.5">
                <span className="text-emerald-500/60">
                  {TYPE_ICONS[newType] ?? "◈"}
                </span>
                {newType}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${typeDropOpen ? "rotate-180" : ""}`}
              />
            </button>
            {typeDropOpen && (
              <ul className="absolute left-0 right-0 bottom-full mb-1.5 z-999 bg-[#0a1220]/98 backdrop-blur-2xl border border-white/8 rounded-2xl shadow-2xl overflow-hidden">
                {ALERT_TYPES.map((t) => (
                  <li
                    key={t}
                    onClick={() => {
                      setNewType(t);
                      setTypeDropOpen(false);
                    }}
                    className="px-4 py-3 text-sm text-slate-200 hover:bg-white/10 hover:text-white cursor-pointer flex items-center gap-3 transition"
                  >
                    <span className="text-emerald-500/50 text-base">
                      {TYPE_ICONS[t] ?? "◈"}
                    </span>
                    <span className="tracking-wide">{t}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ק"מ + הערה */}
          <input
            type="number"
            value={newTargetKm}
            onChange={(e) => setNewTargetKm(e.target.value)}
            placeholder={`יעד קילומטראז׳  ·  כגון ${((bike?.currentOdometerKm || 0) + 1000).toLocaleString("he-IL")} ק״מ`}
            min={0}
            className={inputCls}
          />
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="הערה  ·  אופציונלי"
            maxLength={200}
            className={inputCls}
          />

          <button
            type="button"
            onClick={handleAdd}
            disabled={!newTargetKm}
            className="w-full rounded-2xl border border-emerald-500/20 bg-emerald-500/8 py-3 text-sm font-medium text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/30 transition-all tracking-wide disabled:opacity-30 disabled:cursor-not-allowed"
          >
            + הוסף
          </button>

          <button
            type="button"
            onClick={() => onSave({ mileageAlerts: alerts })}
            disabled={isSaving}
            className="w-full rounded-2xl bg-linear-to-r from-emerald-500 to-teal-400 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.01] transition-all tracking-wide disabled:opacity-50"
          >
            {isSaving ? "שומר..." : "שמור שינויים"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── ActiveRideBanner ─── */

function ActiveRideBanner({ isRideActive, isRideMinimized, onNavigate }) {
  if (!isRideActive || isRideMinimized) return null;
  return (
    <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg mb-5 flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="text-sm font-bold text-emerald-400">יש רכיבה פעילה</span>
      <Button variant="ghost" size="md" onClick={() => onNavigate("ride")}>
        חזור לרכיבה
      </Button>
    </section>
  );
}

/* ─── BikeFormModal — הוסף / ערוך אופנוע ─── */

function BikeFormModal({ initialData, onSave, onClose, isSaving, error }) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    make: initialData?.make || "",
    model: initialData?.model || "",
    year: initialData?.year || "",
    currentOdometerKm: initialData?.currentOdometerKm ?? "",
    engineCc: initialData?.engineCc ?? "",
    testValidity: initialData?.testValidity
      ? initialData.testValidity.split("T")[0]
      : "",
  });

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const generatedName =
      `${form.make.trim()} ${form.model.trim()}`.trim() || "האופנוע שלי";
    const payload = {
      name: generatedName,
      make: form.make.trim() || undefined,
      model: form.model.trim() || undefined,
      year: form.year ? Number(form.year) : undefined,
      currentOdometerKm:
        form.currentOdometerKm !== ""
          ? Number(form.currentOdometerKm)
          : undefined,
      engineCc: form.engineCc !== "" ? Number(form.engineCc) : undefined,
      testValidity: form.testValidity || undefined,
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-[#0B132B]/90 backdrop-blur-2xl p-6 shadow-2xl">
        <p className="text-base font-semibold text-slate-100">
          {initialData ? "ערוך אופנוע" : "הוסף אופנוע"}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {/* יצרן */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-400">
                יצרן
              </label>
              <input
                value={form.make}
                onChange={set("make")}
                placeholder="Yamaha"
                maxLength={60}
                className="w-full transition-all rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-transparent focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-400">
                דגם
              </label>
              <input
                value={form.model}
                onChange={set("model")}
                placeholder="MT-07"
                maxLength={60}
                className="w-full transition-all rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-transparent focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* שנה, סמ"ק */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-400">
                שנה
              </label>
              <input
                type="number"
                value={form.year}
                onChange={set("year")}
                placeholder="2023"
                min={1900}
                max={2100}
                className="w-full transition-all rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-transparent focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-400">
                סמ״ק (CC)
              </label>
              <input
                type="number"
                value={form.engineCc}
                onChange={set("engineCc")}
                placeholder="700"
                min={0}
                className="w-full transition-all rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-transparent focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* קילומטרז' וטסט */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-400">
                קילומטרז׳ נוכחי
              </label>
              <input
                type="number"
                value={form.currentOdometerKm}
                onChange={set("currentOdometerKm")}
                placeholder="12500"
                min={0}
                className="w-full transition-all rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-transparent focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-400">
                תוקף טסט
              </label>
              <input
                type="date"
                value={form.testValidity}
                onChange={set("testValidity")}
                className="w-full transition-all rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-transparent focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {error && <p className="text-xs text-rose-300">{error}</p>}

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {isSaving ? "שומר..." : "שמור"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-gray-300 transition-all hover:bg-white/10 hover:text-white"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── ServiceFormModal — הוסף רשומת תחזוקה ─── */

function ServiceFormModal({
  bikeOdometer,
  onSave,
  onClose,
  isSaving,
  error,
  apiClient,
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    type: SERVICE_TYPES[0],
    date: todayStr,
    odometerKm: bikeOdometer ?? "",
    cost: "",
    notes: "",
    customServiceType: "",
    receiptUrl: "",
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await apiClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((p) => ({ ...p, receiptUrl: res.data.imageUrl }));
    } catch {
      setUploadError("שגיאה בהעלאת חשבונית");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      type: form.type,
      date: form.date,
      odometerKm: Number(form.odometerKm),
      cost: form.cost !== "" ? Number(form.cost) : undefined,
      notes: form.notes.trim() || undefined,
      customServiceType:
        form.type === "אחר" ? form.customServiceType.trim() : undefined,
      receiptUrl: form.receiptUrl || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0B132B]/90 backdrop-blur-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <p className="text-base font-semibold text-slate-100 shrink-0 mb-4">
          הוסף שירות
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* גוף נגלל */}
          <div className="flex-1 overflow-y-auto pr-2 pb-32 space-y-4 custom-scrollbar">
            {/* סוג */}
            <div className="relative">
              <label className="mb-1 block text-xs text-slate-400">
                סוג תחזוקה
              </label>

              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="w-full relative bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 flex justify-between items-center cursor-pointer focus:outline-none focus:bg-white/10 focus-visible:ring-2 focus-visible:ring-emerald-300 transition-all text-right"
              >
                {form.type}
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <ul className="absolute left-0 right-0 w-full mt-2 z-[999] bg-[#0B132B]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden max-h-[200px] overflow-y-auto custom-scrollbar">
                  {SERVICE_TYPES.map((t) => (
                    <li
                      key={t}
                      onClick={() => {
                        setForm((prev) => ({ ...prev, type: t }));
                        setIsDropdownOpen(false);
                      }}
                      className="px-4 py-3 text-sm text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Custom Type */}
            {form.type === "אחר" && (
              <div>
                <input
                  required
                  type="text"
                  placeholder="פרט את סוג הטיפול..."
                  value={form.customServiceType}
                  onChange={set("customServiceType")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:bg-white/10 focus-visible:ring-2 focus-visible:ring-emerald-300 transition-all"
                />
              </div>
            )}

            {/* תאריך + קילומטרז' */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  תאריך
                </label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={set("date")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:bg-white/10 focus-visible:ring-2 focus-visible:ring-emerald-300 transition-all"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  קילומטרז׳
                </label>
                <input
                  required
                  type="number"
                  value={form.odometerKm}
                  onChange={set("odometerKm")}
                  min={0}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:bg-white/10 focus-visible:ring-2 focus-visible:ring-emerald-300 transition-all"
                />
              </div>
            </div>

            {/* עלות */}
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                עלות (₪)
              </label>
              <input
                type="number"
                value={form.cost}
                onChange={set("cost")}
                min={0}
                placeholder="אופציונלי"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:bg-white/10 focus-visible:ring-2 focus-visible:ring-emerald-300 transition-all"
              />
            </div>

            {/* הערות */}
            <div>
              <label className="mb-1 block text-xs text-slate-400">הערות</label>
              <textarea
                value={form.notes}
                onChange={set("notes")}
                maxLength={400}
                rows={2}
                placeholder="פרטים נוספים..."
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:bg-white/10 focus-visible:ring-2 focus-visible:ring-emerald-300 transition-all"
              />
            </div>

            {/* העלאת קבלה */}
            <div className="pt-1">
              <label className="mb-1.5 block text-xs text-slate-400">
                חשבונית מעקב (אופציונלי)
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs bg-white/5 border border-white/10 py-1.5"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("receipt-upload").click();
                  }}
                  disabled={isUploading}
                >
                  {isUploading ? "מעלה..." : "📸 הוסף צילום חשבונית"}
                </Button>
                {form.receiptUrl && (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    ✓ הועלה
                  </span>
                )}
              </div>
              <input
                type="file"
                id="receipt-upload"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleReceiptUpload}
              />
              {uploadError && (
                <p className="text-xs text-rose-400 mt-1">{uploadError}</p>
              )}
            </div>

            {error && <p className="text-xs text-rose-300">{error}</p>}
          </div>

          {/* פעולות שמירה - קבוע בתחתית (Sticky Footer) */}
          <div className="mt-auto pt-4 border-t border-white/10 flex gap-3 shrink-0">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {isSaving ? "שומר..." : "הוסף"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── MaintenanceLogRow — שורת רשומת תחזוקה בודדת ─── */

function MaintenanceLogRow({ log, onDelete }) {
  const date = log.date ? new Date(log.date).toLocaleDateString("he-IL") : "";
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-sm px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-100">
            {log.type === "אחר" && log.customServiceType
              ? log.customServiceType
              : log.type}
          </span>
          <span className="text-xs text-emerald-400 font-bold">{date}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
          <span>
            <span className="text-emerald-400 font-bold">
              {log.odometerKm?.toLocaleString("he-IL")}
            </span>{" "}
            ק״מ
          </span>
          {log.cost != null && (
            <span>
              <span className="text-emerald-400 font-bold">₪{log.cost}</span>
            </span>
          )}
        </div>
        {log.notes && (
          <p className="mt-1 text-xs text-slate-400">{log.notes}</p>
        )}
        {log.receiptUrl && (
          <a
            href={imgSrc(log.receiptUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-colors inline-flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-emerald-500/20 w-fit"
          >
            <span className="text-lg leading-none">🧾</span> צפה בחשבונית
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDelete(log._id)}
        className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-rose-400 transition focus-visible:ring-2 focus-visible:ring-rose-400"
        aria-label="מחק רשומה"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─── MyBikePage ─── */

/**
 * @param {Object} props
 * @param {boolean} props.isRideActive
 * @param {boolean} props.isRideMinimized
 * @param {Function} props.onNavigate
 * @param {Array}    props.bikes
 * @param {boolean}  props.bikesLoading
 * @param {string}   props.bikesError
 * @param {Function} props.createBike
 * @param {Function} props.updateBike
 * @param {Function} props.deleteBike
 * @param {Object}   props.maintenanceLogs   — { [bikeId]: Log[] }
 * @param {boolean}  props.maintenanceLoading
 * @param {Function} props.fetchMaintenance
 * @param {Function} props.addMaintenanceLog
 * @param {Function} props.deleteMaintenanceLog
 * @param {string}   props.bikePhotoPreview
 * @param {Function} props.setBikePhotoPreview
 * @param {React.RefObject} props.bikePhotoInputRef
 */
export default function MyBikePage({
  isRideActive,
  isRideMinimized,
  onNavigate,
  bikes,
  bikesLoading,
  bikesError,
  createBike,
  updateBike,
  deleteBike,
  maintenanceLogs,
  maintenanceLoading,
  fetchMaintenance,
  addMaintenanceLog,
  deleteMaintenanceLog,
  bikePhotoPreview,
  setBikePhotoPreview,
  bikePhotoInputRef,
  apiClient,
  fetchBikesFromServer,
}) {
  /* ─── Local UI State ─── */
  const [showBikeForm, setShowBikeForm] = useState(false);
  const [editingBike, setEditingBike] = useState(null); // null = create, bike = edit
  const [bikeFormError, setBikeFormError] = useState("");
  const [bikeFormSaving, setBikeFormSaving] = useState(false);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertSaving, setAlertSaving] = useState(false);

  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceFormError, setServiceFormError] = useState("");
  const [serviceFormSaving, setServiceFormSaving] = useState(false);

  const [confirmDeleteBike, setConfirmDeleteBike] = useState(false);
  const [bikeDeleteError, setBikeDeleteError] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  /* נטען רשומות תחזוקה כשיש אופנוע */
  const bike = bikes?.[0] || null;
  const logs = bike ? maintenanceLogs?.[bike._id] || [] : [];

  useEffect(() => {
    if (bike && !maintenanceLogs?.[bike._id]) {
      fetchMaintenance(bike._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bike?._id]);

  /* ─── Handlers ─── */

  const handleSaveBike = async (payload) => {
    setBikeFormError("");
    setBikeFormSaving(true);
    try {
      if (editingBike) {
        await updateBike(editingBike._id, payload);
      } else {
        const created = await createBike(payload);
        /* טעינת תחזוקה לאופנוע החדש */
        await fetchMaintenance(created._id);
      }
      setShowBikeForm(false);
      setEditingBike(null);
    } catch (err) {
      setBikeFormError(
        err?.response?.data?.error?.message || "שגיאה בשמירת האופנוע",
      );
    } finally {
      setBikeFormSaving(false);
    }
  };

  const handleDeleteBike = async () => {
    setBikeDeleteError("");
    try {
      await deleteBike(bike._id);
      setConfirmDeleteBike(false);
    } catch (err) {
      setBikeDeleteError("שגיאה במחיקת האופנוע");
    }
  };

  const handleAddService = async (payload) => {
    setServiceFormError("");
    setServiceFormSaving(true);
    try {
      await addMaintenanceLog(bike._id, payload);
      setShowServiceForm(false);
    } catch (err) {
      setServiceFormError(
        err?.response?.data?.error?.message || "שגיאה בשמירת השירות",
      );
    } finally {
      setServiceFormSaving(false);
    }
  };

  const handleSaveAlerts = async (payload) => {
    setAlertSaving(true);
    try {
      await updateBike(bike._id, payload);
      setShowAlertModal(false);
    } catch {
      /* שגיאה שקטה */
    } finally {
      setAlertSaving(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    try {
      await deleteMaintenanceLog(bike._id, logId);
    } catch {
      /* שגיאה שקטה — הרשימה לא תתעדכן אבל לפחות לא נקרוס */
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set local preview immediately for UX
    if (bikePhotoPreview?.startsWith("blob:"))
      URL.revokeObjectURL(bikePhotoPreview);
    setBikePhotoPreview(URL.createObjectURL(file));

    if (!bike?._id) return; // Cannot upload if bike doesn't exist yet

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("image", file); // Backend expects "image" field

      // 1. Upload the image to the server
      const uploadRes = await apiClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newUrl = uploadRes.data.imageUrl;

      // 2. Patch the bike record with the new imageUrl
      await apiClient.patch(`/bikes/${bike._id}`, { imageUrl: newUrl });

      // 3. Refresh bike data
      await fetchBikesFromServer();
    } catch (err) {
      console.error(
        "🚨 IMAGE UPLOAD FAILED 🚨",
        err.response?.data || err.message,
      );
      setUploadError("שגיאה בהעלאת תמונה למערכת");
    } finally {
      setIsUploading(false);
    }
  };

  /* ─── Render ─── */
  const displayImage = bikePhotoPreview || imgSrc(bike?.imageUrl);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6 bg-transparent">
      <main className="mt-6 flex-1">
        <ActiveRideBanner
          isRideActive={isRideActive}
          isRideMinimized={isRideMinimized}
          onNavigate={onNavigate}
        />

        {/* כותרת ראשית */}
        <section className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              {bike ? bike.name || bike.model || "האופנוע שלי" : "האופנוע שלי"}
            </h1>
            <p className="mt-1 text-base text-slate-300">
              {bike ? "ניהול פרטים ותחזוקה" : "הוסף את האופנוע שלך"}
            </p>
          </div>
          {bike && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="md"
                className="text-xs text-amber-300 flex items-center gap-1.5"
                onClick={() => setShowAlertModal(true)}
                title="הגדר התראות קילומטראז׳"
              >
                <Bell className="w-3.5 h-3.5" /> התראה
              </Button>
              <Button
                variant="ghost"
                size="md"
                className="text-xs text-emerald-300 flex items-center gap-1.5"
                onClick={() => {
                  setEditingBike(bike);
                  setShowBikeForm(true);
                }}
              >
                <Pencil className="w-3.5 h-3.5" /> ערוך
              </Button>
            </div>
          )}
        </section>

        {/* שגיאות טעינה */}
        {bikesLoading && <p className="mt-4 text-xs text-slate-400">טוען...</p>}
        {!!bikesError && (
          <p className="mt-4 text-xs text-rose-300">{bikesError}</p>
        )}

        {/* Empty State — אין אופנוע */}
        {!bikesLoading && !bikesError && !bike && (
          <section className="mt-8 flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-sm py-14 text-center">
            <div className="flex justify-center mb-2">
              <Bike className="w-12 h-12 text-slate-500 opacity-50" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-100">
                עדיין אין אופנוע
              </p>
              <p className="mt-1 text-sm text-slate-400">
                הוסף את האופנוע שלך כדי לעקוב אחר תחזוקה
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setEditingBike(null);
                setBikeFormError("");
                setShowBikeForm(true);
              }}
            >
              הוסף אופנוע
            </Button>
          </section>
        )}

        {/* תצוגת אופנוע */}
        {bike && (
          <>
            {/* כרטיס ראשי */}
            <section className="mt-5">
              <GlassCard
                title={bike.name || bike.model || "האופנוע שלי"}
                right={
                  <span className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-lg px-2.5 py-1 text-xs font-bold text-emerald-400">
                    תקין
                  </span>
                }
              >
                {/* פרטי האופנוע */}
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                  {bike.make && <span>{bike.make}</span>}
                  {bike.model && <span>{bike.model}</span>}
                  {bike.year && <span>{bike.year}</span>}
                  {bike.engineCc && <span>{bike.engineCc} סמ״ק</span>}
                </div>

                {bike.testValidity && (
                  <div className="mt-2 text-xs font-semibold">
                    <span className="text-gray-400">תוקף טסט: </span>
                    <span
                      className={
                        new Date(bike.testValidity) <=
                        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                          ? "text-rose-400"
                          : "text-emerald-400"
                      }
                    >
                      {new Date(bike.testValidity).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                )}

                {/* תצוגת תמונה / placeholder */}
                <div className="relative mt-4 h-48 md:h-64 overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-slate-900/90 via-slate-800/60 to-emerald-900/25">
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[24px_24px]" />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(20,184,166,0.18),transparent_55%)]" />
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt="תמונת אופנוע"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-end p-3">
                      <span className="bg-black/60 backdrop-blur-md rounded-full shadow-sm px-3 py-1.5 text-xs font-semibold text-white">
                        תמונת אופנוע
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => bikePhotoInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? "מעלה..." : "העלה תמונה"}
                    </Button>
                    <button
                      type="button"
                      className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-rose-400 focus-visible:ring-2 focus-visible:ring-rose-400 transition"
                      onClick={() => {
                        setBikeDeleteError("");
                        setConfirmDeleteBike(true);
                      }}
                      aria-label="מחק אופנוע"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  {uploadError && (
                    <p className="text-xs text-rose-400">{uploadError}</p>
                  )}
                </div>

                {/* input מוסתר לבחירת קובץ */}
                <input
                  ref={bikePhotoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </GlassCard>
            </section>

            <section className="mt-3 flex flex-wrap gap-2">
              <span className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full shadow-lg px-3 py-1 text-xs text-gray-400">
                ק״מ:{" "}
                <span className="text-emerald-400 font-bold">
                  {bike.currentOdometerKm?.toLocaleString("he-IL") ?? "--"}
                </span>
              </span>
              {bike.mileageAlerts?.map((a, i) => (
                <span
                  key={i}
                  className="bg-white/5 backdrop-blur-md border border-amber-500/30 rounded-full shadow-lg px-3 py-1 text-xs text-gray-400"
                >
                  {TYPE_ICONS[a.type] ?? "🔔"} {a.type}:{" "}
                  <span className="text-amber-400 font-bold">
                    {Number(a.targetKm).toLocaleString("he-IL")}
                  </span>{" "}
                  ק״מ
                </span>
              ))}
            </section>

            {/* ─── רשומות תחזוקה ─── */}
            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-100">
                  היסטוריית תחזוקה
                </h2>
                <Button
                  variant="primary"
                  size="md"
                  className="text-xs"
                  onClick={() => {
                    setServiceFormError("");
                    setShowServiceForm(true);
                  }}
                >
                  + הוסף שירות
                </Button>
              </div>

              <div className="mt-4">
                {maintenanceLoading && (
                  <p className="text-xs text-slate-400">טוען רשומות...</p>
                )}
                {!maintenanceLoading && logs.length === 0 && (
                  <GlassCard>
                    <p className="text-sm text-slate-300">
                      עדיין אין רשומות תחזוקה
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      לחץ "הוסף שירות" כדי להתחיל לתעד
                    </p>
                  </GlassCard>
                )}
                {logs.length > 0 && (
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <MaintenanceLogRow
                        key={log._id}
                        log={log}
                        onDelete={handleDeleteLog}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* ─── מודלים ─── */}

      {/* מודל טופס אופנוע */}
      {showBikeForm && (
        <BikeFormModal
          initialData={editingBike}
          onSave={handleSaveBike}
          onClose={() => {
            setShowBikeForm(false);
            setEditingBike(null);
          }}
          isSaving={bikeFormSaving}
          error={bikeFormError}
        />
      )}

      {/* מודל אישור מחיקת אופנוע */}
      {confirmDeleteBike && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-xs rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-2xl p-6 text-center shadow-2xl">
            <p className="text-base font-semibold text-slate-100">
              מחק את האופנוע?
            </p>
            <p className="mt-1 text-xs text-slate-400">
              הפעולה תמחק גם את כל רשומות התחזוקה
            </p>
            {bikeDeleteError && (
              <p className="mt-2 text-xs text-rose-300">{bikeDeleteError}</p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleDeleteBike}
                className="flex-1 rounded-xl bg-rose-600 py-2 text-sm font-semibold text-white hover:bg-rose-500"
              >
                מחק
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteBike(false)}
                className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-slate-300 hover:text-white"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* מודל התראות קילומטראז' */}
      {showAlertModal && (
        <MileageAlertModal
          bike={bike}
          onSave={handleSaveAlerts}
          onClose={() => setShowAlertModal(false)}
          isSaving={alertSaving}
        />
      )}

      {/* מודל הוספת שירות */}
      {showServiceForm && (
        <ServiceFormModal
          bikeOdometer={bike?.currentOdometerKm}
          onSave={handleAddService}
          onClose={() => setShowServiceForm(false)}
          isSaving={serviceFormSaving}
          error={serviceFormError}
          apiClient={apiClient}
        />
      )}
    </div>
  );
}
