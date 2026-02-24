/**
 * HistoryPage — מסך היסטוריית רכיבות.
 * רכיב Stateless: מקבל את כל הנתונים וה-Handlers כ-Props מ-App.jsx.
 */

import { useEffect, useState } from "react";
import {
  GoogleMap,
  MarkerF,
  PolylineF,
} from "@react-google-maps/api";
import Button from "../app/ui/components/Button";
import GlassCard from "../app/ui/components/GlassCard";

/* ─── סגנון מפה כהה (Dark Map Style) ─── */
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0f172a" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#020617" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
];

/* ─── RideHistoryMap — מפה פנימית במודל ─── */

/**
 * מציגה את מסלול הרכיבה ההיסטורי על מפה כהה עם Polyline ירוק-אמרלד,
 * מרקרים A/B בנקודות קצה ו-fitBounds אוטומטי.
 */
function RideHistoryMap({ points, isMapLoaded, mapLoadError }) {
  /* מכיל את instance המפה לצורך fitBounds */
  const [mapInstance, setMapInstance] = useState(null);

  /* התאמת תצוגה (fitBounds) למסלול לאחר טעינת המפה */
  useEffect(() => {
    if (!mapInstance || !window.google || points.length < 2) return;
    try {
      const bounds = new window.google.maps.LatLngBounds();
      points.forEach((p) => bounds.extend(p));
      mapInstance.fitBounds(bounds, /* padding */ 30);
    } catch {
      /* no-op: לא מפילים UI */
    }
  }, [mapInstance, points]);

  if (mapLoadError) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-slate-400">
        שגיאה בטעינת המפה
      </div>
    );
  }

  if (!isMapLoaded) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-slate-400">
        טוען מפה...
      </div>
    );
  }

  /* מפה כהה + Polyline בצבע Emerald */
  return (
    <GoogleMap
      /* מרכז ברירת מחדל — fitBounds ידרוס אותו בכל מקרה */
      center={points[0] ?? { lat: 31.5, lng: 34.75 }}
      zoom={12}
      onLoad={(map) => setMapInstance(map)}
      mapContainerClassName="h-full w-full"
      options={{
        styles: DARK_MAP_STYLE,
        disableDefaultUI: true,
        clickableIcons: false,
        gestureHandling: "cooperative",
      }}
    >
      {/* ציור קו המסלול */}
      {points.length >= 2 && (
        <PolylineF
          path={points}
          options={{
            strokeColor: "#34d399",
            strokeOpacity: 0.9,
            strokeWeight: 4,
          }}
        />
      )}
      {/* מרקר התחלה */}
      {points.length >= 2 && (
        <MarkerF position={points[0]} label="A" title="התחלה" />
      )}
      {/* מרקר סיום */}
      {points.length >= 2 && (
        <MarkerF position={points[points.length - 1]} label="B" title="סיום" />
      )}
    </GoogleMap>
  );
}

/**
 * באנר רכיבה פעילה — מוצג בטאבים שאינם מסך הרכיבה.
 */
function ActiveRideBanner({ isRideActive, isRideMinimized, onNavigate }) {
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
}

/**
 * @param {Object} props
 * @param {boolean} props.isRideActive
 * @param {boolean} props.isRideMinimized
 * @param {Function} props.onNavigate
 * @param {Array} props.historyRides - רשימת הרכיבות להצגה.
 * @param {Array} props.historyFilters - אפשרויות הסינון.
 * @param {string} props.selectedHistoryFilter - סינון נבחר.
 * @param {Function} props.setSelectedHistoryFilter
 * @param {boolean} props.isHistoryFilterMenuOpen
 * @param {Function} props.setIsHistoryFilterMenuOpen
 * @param {Object|null} props.selectedHistoryRide - רכיבה נבחרת לפרטים.
 * @param {Function} props.setSelectedHistoryRide
 * @param {string} props.historyRideNotes
 * @param {Function} props.setHistoryRideNotes
 * @param {string} props.searchQuery
 * @param {Function} props.setSearchQuery
 */
export default function HistoryPage({
  isRideActive,
  isRideMinimized,
  onNavigate,
  historyRides,
  historyFilters,
  selectedHistoryFilter,
  setSelectedHistoryFilter,
  isHistoryFilterMenuOpen,
  setIsHistoryFilterMenuOpen,
  selectedHistoryRide,
  setSelectedHistoryRide,
  historyRideNotes,
  setHistoryRideNotes,
  searchQuery,
  setSearchQuery,
  apiClient,
  fetchHistoryFromServer,
  fetchRoutesFromServer,
  /* map props */
  mapApiKey,
  isMapLoaded,
  mapLoadError,
}) {
  /* שם לעריכה במודל הפרטים */
  const [editName, setEditName] = useState("");
  /* שגיאה מקומית במודל */
  const [modalError, setModalError] = useState("");
  /* שגיאת המרה למסלול */
  const [convertError, setConvertError] = useState("");
  const [convertSuccess, setConvertSuccess] = useState(false);

  /* אתחול editName כשנפתחת רכיבה חדשה */
  const openRide = (ride) => {
    setEditName(ride.name || ride.title || "");
    setModalError("");
    setConvertError("");
    setConvertSuccess(false);
    setSelectedHistoryRide(ride);
  };

  const closeModal = () => {
    setSelectedHistoryRide(null);
    setModalError("");
    setConvertError("");
    setConvertSuccess(false);
  };

  /* סינון מקומי פשוט לפי שם רכיבה (case-insensitive). */
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleHistoryRides = historyRides.filter((ride) =>
    ride.title.toLowerCase().includes(normalizedSearch),
  );
  const closeDropdown = () => setIsHistoryFilterMenuOpen(false);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
      <main className="mt-6 flex-1">
        <ActiveRideBanner
          isRideActive={isRideActive}
          isRideMinimized={isRideMinimized}
          onNavigate={onNavigate}
        />

        {/* כותרת מסך + כלי חיפוש/סינון מקומיים */}
        <section>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            היסטוריית רכיבות
          </h1>
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

            {/* הדרופדאון אבסולוטי כדי לא לדחוף את ה-layout */}
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
                <>
                  {/* שכבת סגירה קבועה מאחורי התפריט, לא תופסת מקום בזרימה */}
                  <button
                    type="button"
                    className="fixed inset-0 z-40"
                    onClick={closeDropdown}
                    aria-label="סגור סינון"
                  />

                  {/* עיגון חכם: ימין בדסקטופ רחב, ושמאל ברוחב צפוף כדי למנוע חיתוך/חריגה מהמסך */}
                  <div className="absolute z-50 top-full mt-2 left-0 lg:left-auto lg:right-0 w-44 max-w-[min(320px,calc(100vw-24px))] rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg p-2">
                    {historyFilters.map((filter) => {
                      const isSelected = selectedHistoryFilter === filter;
                      return (
                        <button
                          key={`menu-${filter}`}
                          type="button"
                          onClick={() => {
                            setSelectedHistoryFilter(filter);
                            closeDropdown();
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
                </>
              )}
            </div>
          </div>

          {/* סיכום מסנן נבחר */}
          <div className="mt-3">
            <span className="mv-pill px-3 py-1 text-xs text-slate-200">
              טווח: {selectedHistoryFilter}
            </span>
          </div>
        </section>

        {/* פס סטטיסטיקות: מספרים גדולים ומחיצות אנכיות עדינות */}
        <section className="mv-card mt-6 px-4 py-3">
          <div className="grid grid-cols-3 gap-0 text-center">
            <div className="border-e border-white/10 px-2">
              <p className="text-2xl font-semibold leading-none text-white">
                12
              </p>
              <p className="mt-1 text-xs text-slate-400">רכיבות</p>
            </div>
            <div className="border-e border-white/10 px-2">
              <p className="text-2xl font-semibold leading-none text-white">
                14:30
              </p>
              <p className="mt-1 text-xs text-slate-400">שעות</p>
            </div>
            <div className="px-2">
              <p className="text-2xl font-semibold leading-none text-white">
                615
              </p>
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
                <Button
                  variant="ghost"
                  size="md"
                  className="h-8 w-8 rounded-full p-0 text-base"
                  onClick={() => openRide(ride)}
                >
                  &gt;
                </Button>
              }
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_130px] md:items-center">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    {ride.title}
                  </h3>
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
        </section>

        {/* מודל פרטי רכיבה: שכבה קבועה עם סגירה בלחיצה על הרקע */}
        {selectedHistoryRide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
              onClick={closeModal}
              aria-label="סגור פרטי רכיבה"
            />

            {/* תוכן המודל: פרטים בסיסיים ופעולות */}
            <div className="relative z-10 w-full max-w-md">
              <GlassCard title="פרטי רכיבה">
                {/* כותרת קומפקטית: שם רכיבה + תאריך */}
                <div className="mb-4 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-100">
                    {selectedHistoryRide.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {selectedHistoryRide.date}
                  </p>
                </div>

                {/* גריד סטטיסטיקות מקצועי לשלושת המדדים המרכזיים */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="mv-card rounded-xl px-2 py-2 text-center">
                    <p className="text-[11px] text-slate-400">משך</p>
                    <p className="mt-1 text-sm font-semibold text-slate-100">
                      {selectedHistoryRide.duration}
                    </p>
                  </div>
                  <div className="mv-card rounded-xl px-2 py-2 text-center">
                    <p className="text-[11px] text-slate-400">מרחק</p>
                    <p className="mt-1 text-sm font-semibold text-slate-100">
                      {selectedHistoryRide.distance}
                    </p>
                  </div>
                  <div className="mv-card rounded-xl px-2 py-2 text-center">
                    <p className="text-[11px] text-slate-400">תאריך</p>
                    <p className="mt-1 text-sm font-semibold text-slate-100">
                      {selectedHistoryRide.date}
                    </p>
                  </div>
                </div>

                {/* ─── מפת מסלול הרכיבה ─── */}
                {(() => {
                  /* חישוב נקודות למסלול (path / polyline / start-end) */
                  const raw = selectedHistoryRide?.raw || selectedHistoryRide;
                  const path = Array.isArray(raw?.path) ? raw.path : [];
                  const snap = raw?.routeSnapshot;

                  let points = [];

                  if (path.length >= 2) {
                    /* עדיפות: נתיב GPS מוקלט */
                    points = path.map((p) => ({ lat: p.lat, lng: p.lng }));
                  } else if (snap?.start && snap?.end) {
                    /* fallback: נקודות התחלה/סיום מה-snapshot */
                    points = [
                      { lat: snap.start.lat, lng: snap.start.lng },
                      { lat: snap.end.lat, lng: snap.end.lng },
                    ];
                  }

                  return (
                    <div className="mv-card mt-4 overflow-hidden rounded-xl border border-white/10">
                      <p className="border-b border-white/10 px-3 py-1.5 text-xs text-slate-400">
                        מפת מסלול
                      </p>
                      {/* גובה: 220px מובייל, 280px דסקטופ */}
                      <div className="relative h-[220px] sm:h-[280px]">
                        {!mapApiKey?.trim() ? (
                          <div className="flex h-full items-center justify-center text-xs text-slate-400">
                            חסר מפתח Google Maps
                          </div>
                        ) : points.length < 2 ? (
                          <div className="flex h-full items-center justify-center text-xs text-slate-400">
                            אין מספיק נתונים להצגת מסלול
                          </div>
                        ) : (
                          /* מפה כהה + Polyline בצבע Emerald */
                          <RideHistoryMap
                            points={points}
                            isMapLoaded={isMapLoaded}
                            mapLoadError={mapLoadError}
                          />
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* שדה עריכת שם רכיבה */}
                <div className="mv-card mt-4 rounded-xl px-3 py-3">
                  <p className="text-sm font-semibold text-slate-100">ערוך שם</p>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={60}
                    placeholder="שם לרכיבה..."
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  />
                </div>

                {/* שגיאה inline */}
                {modalError && (
                  <p className="mt-2 text-xs text-rose-300">{modalError}</p>
                )}

                {/* שורת פעולות תחתונה */}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {/* שמירת שם רכיבה בשרת */}
                  <Button
                    variant="primary"
                    size="md"
                    onClick={async () => {
                      setModalError("");
                      const rideId = selectedHistoryRide._id || selectedHistoryRide.id;
                      try {
                        await apiClient.patch(`/rides/${rideId}`, { name: editName.trim() });
                        await fetchHistoryFromServer();
                        closeModal();
                      } catch (err) {
                        console.error("PATCH ride error:", err?.response?.status, err?.message);
                        setModalError("שגיאה בשמירה");
                      }
                    }}
                  >
                    שמור
                  </Button>

                  {/* מחיקת רכיבה */}
                  <Button
                    variant="ghost"
                    size="md"
                    className="border-rose-300/30 text-rose-300 hover:text-rose-200"
                    onClick={async () => {
                      if (!window.confirm("האם אתה בטוח שברצונך למחוק רכיבה זו?")) return;
                      setModalError("");
                      const rideId = selectedHistoryRide._id || selectedHistoryRide.id;
                      try {
                        await apiClient.delete(`/rides/${rideId}`);
                        await fetchHistoryFromServer();
                        closeModal();
                      } catch (err) {
                        console.error("DELETE ride error:", err?.response?.status, err?.message);
                        setModalError("שגיאה במחיקה");
                      }
                    }}
                  >
                    מחק רכיבה
                  </Button>

                  {/* המרת רכיבה למסלול קבוע */}
                  <Button
                    variant="ghost"
                    size="md"
                    className="border-emerald-300/30 text-emerald-300 hover:text-emerald-200"
                    onClick={async () => {
                      setConvertError("");
                      setConvertSuccess(false);

                      /* גישה לנתונים הגולמיים מהשרת */
                      const raw = selectedHistoryRide.raw || selectedHistoryRide;
                      const snap = raw.routeSnapshot;
                      const path = Array.isArray(raw.path) ? raw.path : [];

                      let payload;

                      if (snap?.start && snap?.end) {
                        /* מקרה 1: routeSnapshot עם נקודות ידועות */
                        payload = {
                          title: (
                            raw.name || raw.title || snap.title || "מסלול חדש"
                          ).trim(),
                          start: snap.start,
                          end: snap.end,
                        };
                      } else if (path.length >= 2) {
                        /* מקרה 2: רכיבה חופשית עם נתיב GPS מוקלט */
                        const first = path[0];
                        const last = path[path.length - 1];
                        payload = {
                          title: (
                            raw.name || raw.title || snap?.title || "רכיבה חופשית"
                          ).trim(),
                          start: { lat: first.lat, lng: first.lng, label: "נקודת התחלה" },
                          end: { lat: last.lat, lng: last.lng, label: "יעד" },
                        };
                      } else {
                        /* מקרה 3: אין מספיק נתונים */
                        setConvertError("אין מספיק נתונים להפוך למסלול");
                        return;
                      }

                      try {
                        await apiClient.post("/routes", payload);
                        await fetchRoutesFromServer();
                        setConvertSuccess(true);
                      } catch (err) {
                        console.error("המרה למסלול נכשלה:", err?.response?.status, err?.message);
                        setConvertError("שגיאה בשמירה כמסלול");
                      }
                    }}
                  >
                    הפוך למסלול קבוע
                  </Button>

                  {/* סגירת המודל */}
                  <Button variant="ghost" size="md" onClick={closeModal}>
                    סגור
                  </Button>
                </div>

                {/* המרה למסלול: שגיאה/הצלחה */}
                {convertError && (
                  <p className="mt-2 text-xs text-rose-300">{convertError}</p>
                )}
                {convertSuccess && (
                  <p className="mt-2 text-xs text-emerald-300">נשמר כמסלול ✅</p>
                )}
              </GlassCard>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
