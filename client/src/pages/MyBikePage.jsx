/**
 * MyBikePage — מסך "האופנוע שלי".
 * תמיכה מלאה ב-Single Bike MVP: צפייה, יצירה, עריכה, מחיקה של אופנוע ורשומות תחזוקה.
 */

import { useState, useEffect } from "react";
import Button from "../app/ui/components/Button";
import GlassCard from "../app/ui/components/GlassCard";

/* ─── קבועים ─── */

const SERVICE_TYPES = ["שמן", "שרשרת", "בלמים", "צמיגים", "טסט", "אחר"];

/* ─── ActiveRideBanner ─── */

function ActiveRideBanner({ isRideActive, isRideMinimized, onNavigate }) {
  if (!isRideActive || isRideMinimized) return null;
  return (
    <section className="mv-card mb-5 flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="text-sm text-emerald-200">יש רכיבה פעילה</span>
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
  });

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      make: form.make.trim() || undefined,
      model: form.model.trim() || undefined,
      year: form.year ? Number(form.year) : undefined,
      currentOdometerKm: form.currentOdometerKm !== "" ? Number(form.currentOdometerKm) : undefined,
      engineCc: form.engineCc !== "" ? Number(form.engineCc) : undefined,
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl">
        <p className="text-base font-semibold text-slate-100">
          {initialData ? "ערוך אופנוע" : "הוסף אופנוע"}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {/* שם תצוגה */}
          <div>
            <label className="mb-1 block text-xs text-slate-400">שם / כינוי *</label>
            <input
              required
              value={form.name}
              onChange={set("name")}
              placeholder='למשל: "המסרטה שלי"'
              maxLength={60}
              className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            />
          </div>

          {/* יצרן */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">יצרן</label>
              <input
                value={form.make}
                onChange={set("make")}
                placeholder="Yamaha"
                maxLength={60}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">דגם</label>
              <input
                value={form.model}
                onChange={set("model")}
                placeholder="MT-07"
                maxLength={60}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              />
            </div>
          </div>

          {/* שנה, סמ"ק */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">שנה</label>
              <input
                type="number"
                value={form.year}
                onChange={set("year")}
                placeholder="2023"
                min={1900}
                max={2100}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">סמ״ק (CC)</label>
              <input
                type="number"
                value={form.engineCc}
                onChange={set("engineCc")}
                placeholder="700"
                min={0}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              />
            </div>
          </div>

          {/* קילומטרז' */}
          <div>
            <label className="mb-1 block text-xs text-slate-400">קילומטרז׳ נוכחי</label>
            <input
              type="number"
              value={form.currentOdometerKm}
              onChange={set("currentOdometerKm")}
              placeholder="12500"
              min={0}
              className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            />
          </div>

          {error && <p className="text-xs text-rose-300">{error}</p>}

          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
            >
              {isSaving ? "שומר..." : "שמור"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-slate-300 hover:text-white"
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

function ServiceFormModal({ bikeOdometer, onSave, onClose, isSaving, error }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    type: SERVICE_TYPES[0],
    date: todayStr,
    odometerKm: bikeOdometer ?? "",
    cost: "",
    notes: "",
  });

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      type: form.type,
      date: form.date,
      odometerKm: Number(form.odometerKm),
      cost: form.cost !== "" ? Number(form.cost) : undefined,
      notes: form.notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl">
        <p className="text-base font-semibold text-slate-100">הוסף שירות</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {/* סוג */}
          <div>
            <label className="mb-1 block text-xs text-slate-400">סוג תחזוקה</label>
            <select
              value={form.type}
              onChange={set("type")}
              className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* תאריך + קילומטרז' */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">תאריך</label>
              <input
                required
                type="date"
                value={form.date}
                onChange={set("date")}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">קילומטרז׳</label>
              <input
                required
                type="number"
                value={form.odometerKm}
                onChange={set("odometerKm")}
                min={0}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              />
            </div>
          </div>

          {/* עלות */}
          <div>
            <label className="mb-1 block text-xs text-slate-400">עלות (₪)</label>
            <input
              type="number"
              value={form.cost}
              onChange={set("cost")}
              min={0}
              placeholder="אופציונלי"
              className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
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
              className="w-full resize-none rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            />
          </div>

          {error && <p className="text-xs text-rose-300">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
            >
              {isSaving ? "שומר..." : "הוסף"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-slate-300 hover:text-white"
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
    <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-100">{log.type}</span>
          <span className="text-xs text-slate-400">{date}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
          <span>{log.odometerKm?.toLocaleString("he-IL")} ק״מ</span>
          {log.cost != null && <span>₪{log.cost}</span>}
        </div>
        {log.notes && <p className="mt-1 text-xs text-slate-400">{log.notes}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDelete(log._id)}
        className="shrink-0 rounded-lg p-1 text-slate-500 hover:text-rose-300 focus-visible:ring-2 focus-visible:ring-rose-400"
        aria-label="מחק רשומה"
      >
        🗑
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
}) {
  /* ─── Local UI State ─── */
  const [showBikeForm, setShowBikeForm] = useState(false);
  const [editingBike, setEditingBike] = useState(null); // null = create, bike = edit
  const [bikeFormError, setBikeFormError] = useState("");
  const [bikeFormSaving, setBikeFormSaving] = useState(false);

  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceFormError, setServiceFormError] = useState("");
  const [serviceFormSaving, setServiceFormSaving] = useState(false);

  const [confirmDeleteBike, setConfirmDeleteBike] = useState(false);
  const [bikeDeleteError, setBikeDeleteError] = useState("");

  /* נטען רשומות תחזוקה כשיש אופנוע */
  const bike = bikes?.[0] || null;
  const logs = bike ? (maintenanceLogs?.[bike._id] || []) : [];

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
      setBikeFormError(err?.response?.data?.error?.message || "שגיאה בשמירת האופנוע");
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
      setServiceFormError(err?.response?.data?.error?.message || "שגיאה בשמירת השירות");
    } finally {
      setServiceFormSaving(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    try {
      await deleteMaintenanceLog(bike._id, logId);
    } catch {
      /* שגיאה שקטה — הרשימה לא תתעדכן אבל לפחות לא נקרוס */
    }
  };

  /* ─── Render ─── */

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
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
              {bike ? (bike.name || bike.model || "האופנוע שלי") : "האופנוע שלי"}
            </h1>
            <p className="mt-1 text-base text-slate-300">
              {bike ? "ניהול פרטים ותחזוקה" : "הוסף את האופנוע שלך"}
            </p>
          </div>
          {bike && (
            <Button
              variant="ghost"
              size="md"
              className="text-xs text-emerald-300"
              onClick={() => { setEditingBike(bike); setShowBikeForm(true); }}
            >
              ✏️ ערוך
            </Button>
          )}
        </section>

        {/* שגיאות טעינה */}
        {bikesLoading && <p className="mt-4 text-xs text-slate-400">טוען...</p>}
        {!!bikesError && <p className="mt-4 text-xs text-rose-300">{bikesError}</p>}

        {/* Empty State — אין אופנוע */}
        {!bikesLoading && !bikesError && !bike && (
          <section className="mt-8 flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-slate-900/40 py-14 text-center">
            <span className="text-5xl">🏍️</span>
            <div>
              <p className="text-base font-semibold text-slate-100">עדיין אין אופנוע</p>
              <p className="mt-1 text-sm text-slate-400">הוסף את האופנוע שלך כדי לעקוב אחר תחזוקה</p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => { setEditingBike(null); setBikeFormError(""); setShowBikeForm(true); }}
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
                  <span className="mv-pill px-2.5 py-1 text-xs font-medium text-emerald-200">תקין</span>
                }
              >
                {/* פרטי האופנוע */}
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                  {bike.make && <span>{bike.make}</span>}
                  {bike.model && <span>{bike.model}</span>}
                  {bike.year && <span>{bike.year}</span>}
                  {bike.engineCc && <span>{bike.engineCc} סמ״ק</span>}
                </div>

                {/* תצוגת תמונה / placeholder */}
                <div className="relative mt-4 h-40 overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-slate-900/90 via-slate-800/60 to-emerald-900/25">
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[24px_24px]" />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(20,184,166,0.18),transparent_55%)]" />
                  {bikePhotoPreview ? (
                    <img src={bikePhotoPreview} alt="תמונת אופנוע" className="h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-end p-3">
                      <span className="mv-pill px-2.5 py-1 text-xs text-slate-200">תמונת אופנוע</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <Button variant="ghost" size="md" onClick={() => bikePhotoInputRef.current?.click()}>
                    העלה תמונה
                  </Button>
                  <button
                    type="button"
                    className="text-xs text-rose-400 hover:text-rose-300"
                    onClick={() => { setBikeDeleteError(""); setConfirmDeleteBike(true); }}
                  >
                    מחק אופנוע
                  </button>
                </div>

                {/* input מוסתר לבחירת קובץ */}
                <input
                  ref={bikePhotoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (bikePhotoPreview?.startsWith("blob:")) URL.revokeObjectURL(bikePhotoPreview);
                    setBikePhotoPreview(URL.createObjectURL(file));
                  }}
                />
              </GlassCard>
            </section>

            {/* סטטיסטיקות מהירה */}
            <section className="mt-3 flex flex-wrap gap-2">
              <span className="mv-pill px-3 py-1 text-xs text-slate-200">
                ק״מ: {bike.currentOdometerKm?.toLocaleString("he-IL") ?? "--"}
              </span>
            </section>

            {/* ─── רשומות תחזוקה ─── */}
            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-100">היסטוריית תחזוקה</h2>
                <Button
                  variant="primary"
                  size="md"
                  className="text-xs"
                  onClick={() => { setServiceFormError(""); setShowServiceForm(true); }}
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
                    <p className="text-sm text-slate-300">עדיין אין רשומות תחזוקה</p>
                    <p className="mt-1 text-xs text-slate-400">לחץ "הוסף שירות" כדי להתחיל לתעד</p>
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
          onClose={() => { setShowBikeForm(false); setEditingBike(null); }}
          isSaving={bikeFormSaving}
          error={bikeFormError}
        />
      )}

      {/* מודל אישור מחיקת אופנוע */}
      {confirmDeleteBike && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-xs rounded-2xl border border-white/10 bg-slate-900/95 p-6 text-center shadow-2xl">
            <p className="text-base font-semibold text-slate-100">מחק את האופנוע?</p>
            <p className="mt-1 text-xs text-slate-400">הפעולה תמחק גם את כל רשומות התחזוקה</p>
            {bikeDeleteError && <p className="mt-2 text-xs text-rose-300">{bikeDeleteError}</p>}
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

      {/* מודל הוספת שירות */}
      {showServiceForm && (
        <ServiceFormModal
          bikeOdometer={bike?.currentOdometerKm}
          onSave={handleAddService}
          onClose={() => setShowServiceForm(false)}
          isSaving={serviceFormSaving}
          error={serviceFormError}
        />
      )}
    </div>
  );
}
