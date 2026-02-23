/**
 * RidePage — מסך הרכיבה.
 * מכיל את RideActiveMap ו-RideActiveHud כרכיבי עזר פנימיים.
 * רכיב Stateless: מקבל את כל הנתונים וה-Handlers כ-Props מ-App.jsx.
 */

import { useEffect, useState } from "react";
import {
  GoogleMap,
  MarkerF,
} from "@react-google-maps/api";
import Button from "../app/ui/components/Button";
import GlassCard from "../app/ui/components/GlassCard";
import { ISRAEL_DEFAULT_CENTER, ISRAEL_DEFAULT_ZOOM } from "../app/state/useAppState";

/* ─── RideActiveMap ─── */

/**
 * שכבת מפה לרכיבה פעילה כאשר קיים מפתח Google Maps.
 * @param {{lat: number, lng: number}} center - מרכז המפה הנוכחי.
 * @param {{lat: number, lng: number} | null} myLocation - מיקום המשתמש למרקר.
 * @param {boolean} isMapLoaded - האם Google Maps נטען.
 * @param {Error|null} mapLoadError - שגיאת טעינה.
 */
function RideActiveMap({ center, myLocation, isMapLoaded, mapLoadError }) {
  if (mapLoadError) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-900/60 text-sm text-slate-200">
        שגיאה בטעינת המפה
      </div>
    );
  }

  if (!isMapLoaded) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-900/60 text-sm text-slate-200">
        טוען מפה...
      </div>
    );
  }

  return (
    <GoogleMap
      center={center}
      zoom={ISRAEL_DEFAULT_ZOOM}
      mapContainerClassName="h-full w-full"
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        gestureHandling: "greedy",
      }}
    >
      {/* מרקר "המיקום שלי" מוצג רק לאחר הצלחת GPS. */}
      {myLocation && <MarkerF position={myLocation} title="המיקום שלי" />}
    </GoogleMap>
  );
}

/* ─── RideActiveHud ─── */

/**
 * שכבת HUD לרכיבה פעילה במסך מלא.
 * כוללת טיימר גלובלי, נתוני סטטוס ופעולות שליטה תחתונות.
 * @param {number} rideElapsedSeconds - זמן רכיבה מצטבר בשניות.
 * @param {boolean} isRidePaused - האם הרכיבה במצב השהיה.
 * @param {Function} setIsRidePaused - עדכון מצב השהיה.
 * @param {Object|null} selectedRoute - מסלול שנבחר מראש.
 * @param {Function} onMinimize - מזעור HUD וחזרה למעטפת רגילה.
 * @param {Function} onFinish - סיום רכיבה פעילה.
 * @param {string} mapApiKey - מפתח Google Maps.
 * @param {boolean} isMapLoaded - האם Google Maps נטען.
 * @param {Error|null} mapLoadError - שגיאת טעינה.
 */
function RideActiveHud({
  rideElapsedSeconds,
  isRidePaused,
  setIsRidePaused,
  selectedRoute,
  onMinimize,
  onFinish,
  mapApiKey,
  isMapLoaded,
  mapLoadError,
  stopError,
}) {
  /* אתחול מפה: מרכז ברירת מחדל בישראל וזום ראשוני. */
  const [mapCenter, setMapCenter] = useState(ISRAEL_DEFAULT_CENTER);

  /* מרקר מיקום משתמש יוצג רק אם GPS חזר בהצלחה. */
  const [myLocation, setMyLocation] = useState(null);

  /* סטטוס GPS במקרה של דחייה/חוסר תמיכה. */
  const [isGpsUnavailable, setIsGpsUnavailable] = useState(false);

  /* אם אין מפתח — לא טוענים Google Maps ומציגים הודעת fallback בעברית. */
  const hasGoogleMapsApiKey = Boolean(mapApiKey);

  /* GPS חד־פעמי: ניסיון יחיד לקבלת מיקום נוכחי בזמן mount. */
  useEffect(() => {
    if (!navigator.geolocation) {
      setIsGpsUnavailable(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMapCenter(nextPosition);
        setMyLocation(nextPosition);
        setIsGpsUnavailable(false);
      },
      () => {
        setIsGpsUnavailable(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, []);

  const hours = String(Math.floor(rideElapsedSeconds / 3600)).padStart(2, "0");
  const minutes = String(
    Math.floor((rideElapsedSeconds % 3600) / 60),
  ).padStart(2, "0");
  const seconds = String(rideElapsedSeconds % 60).padStart(2, "0");

  return (
    <section className="relative min-h-screen overflow-hidden px-4 pb-6 pt-6 sm:px-6">
      {/* שכבת רקע קולנועית + גריד עדין לדימוי מפה */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(20,184,166,0.22),rgba(2,6,23,0.9)_38%,rgba(2,6,23,1)_78%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[26px_26px] opacity-35" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_78%,rgba(16,185,129,0.14),transparent_52%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col justify-between">
        {/* טיימר מרכזי */}
        <div className="pt-10 text-center sm:pt-14">
          {/* פעולת מזעור: מחזירה למעטפת רגילה בלי לסיים רכיבה */}
          <div className="mb-5 flex items-center justify-end">
            <Button
              variant="ghost"
              size="md"
              onClick={onMinimize}
              className="rounded-full px-3 py-1.5 text-xs text-slate-200"
            >
              מזער
            </Button>
          </div>

          <p className="text-6xl font-bold tracking-wider text-white sm:text-7xl">
            {hours}:{minutes}:{seconds}
          </p>

          {/* אינדיקציה למסלול פעיל גם בזמן HUD במסך מלא */}
          <div className="mx-auto mt-4 max-w-md rounded-xl border border-white/10 bg-slate-900/45 px-3 py-2 text-sm">
            <p className="text-slate-200">
              מסלול נבחר: {selectedRoute ? selectedRoute.title : "ללא"}
            </p>
            {selectedRoute && (
              <p className="mt-1 text-xs text-slate-400">
                {selectedRoute.from} → {selectedRoute.to}
              </p>
            )}
          </div>
        </div>

        {/* UI מפה: כרטיס ייעודי תחת הטיימר עם תמיכת fallback למפתח חסר. */}
        <div className="mx-auto mt-6 w-full max-w-4xl">
          <div className="mv-card overflow-hidden rounded-2xl border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <span className="text-xs text-slate-200">מפת רכיבה</span>
              {isGpsUnavailable && (
                <span className="mv-pill px-2.5 py-1 text-xs text-amber-200">
                  GPS: לא זמין
                </span>
              )}
            </div>

            <div className="relative h-56 sm:h-64 md:h-72">
              {!hasGoogleMapsApiKey ? (
                <div className="flex h-full items-center justify-center bg-slate-900/60 px-4 text-sm text-slate-200">
                  חסר מפתח Google Maps
                </div>
              ) : (
                <RideActiveMap
                  center={mapCenter}
                  myLocation={myLocation}
                  isMapLoaded={isMapLoaded}
                  mapLoadError={mapLoadError}
                />
              )}
            </div>
          </div>
        </div>

        {/* KPI צף בסגנון נקי: 3 עמודות עם אייקון, ערך גדול ותווית קטנה */}
        <div className="mx-auto mt-8 w-full max-w-3xl border-y border-white/10 py-5">
          {/* סדר עמודות לוגי: דיוק → מהירות → מרחק */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="flex flex-col items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm">
                🧭
              </span>
              <span className="text-2xl font-semibold leading-none text-white">
                82%
              </span>
              <span className="text-xs text-slate-400">דיוק</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm">
                ⏱️
              </span>
              <span className="text-2xl font-semibold leading-none text-white">
                84
              </span>
              <span className="text-xs text-slate-400">מהירות (קמ״ש)</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm">
                📍
              </span>
              <span className="text-2xl font-semibold leading-none text-white">
                12.4
              </span>
              <span className="text-xs text-slate-400">מרחק (ק״מ)</span>
            </div>
          </div>
        </div>

        {/* סרגל פעולות תחתון */}
        {/* הצגת שגיאת סיום רכיבה — inline מעל הכפתורים */}
        {stopError && (
          <p className="mx-auto mt-6 text-center text-xs text-rose-300">{stopError}</p>
        )}

        <div className="mv-card mt-2 flex items-center justify-between gap-2 rounded-2xl px-3 py-3">
          <Button
            variant="ghost"
            size="md"
            onClick={onFinish}
            className="rounded-xl border-rose-300/30 bg-rose-500/80 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 focus-visible:ring-2 focus-visible:ring-rose-300"
          >
            סיום
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsRidePaused((prev) => !prev)}
            className="rounded-xl px-6 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            {isRidePaused ? "המשך" : "השהה"}
          </Button>

          <Button
            variant="ghost"
            size="md"
            className="h-10 w-10 rounded-xl p-0 text-base text-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-300"
            aria-label="צילום רגע"
          >
            📷
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ─── RidePage ─── */

/**
 * @param {Object} props
 * @param {boolean} props.isRideActive
 * @param {boolean} props.isRidePaused
 * @param {boolean} props.isRideMinimized
 * @param {number} props.rideElapsedSeconds
 * @param {Function} props.setIsRideActive
 * @param {Function} props.setIsRidePaused
 * @param {Function} props.setIsRideMinimized
 * @param {Object|null} props.selectedRoute
 * @param {boolean} props.didStartFromRoute
 * @param {Function} props.setDidStartFromRoute
 * @param {Function} props.onNavigate
 * @param {string} props.mapApiKey
 * @param {boolean} props.isMapLoaded
 * @param {Error|null} props.mapLoadError
 */
export default function RidePage({
  isRideActive,
  isRidePaused,
  isRideMinimized,
  rideElapsedSeconds,
  setIsRideActive,
  setIsRidePaused,
  setIsRideMinimized,
  selectedRoute,
  didStartFromRoute,
  setDidStartFromRoute,
  onNavigate,
  mapApiKey,
  isMapLoaded,
  mapLoadError,
  apiClient,
  fetchHistoryFromServer,
}) {
  /* מציגים מסלול רק אם המשתמש התחיל רכיבה מתוך מסך Routes. */
  const rideSelectedRoute =
    didStartFromRoute && selectedRoute ? selectedRoute : null;

  const [startError, setStartError] = useState("");
  const [stopError, setStopError] = useState("");

  if (isRideActive && !isRideMinimized) {
    /* סיום רכיבה: עצירה בשרת, רענון היסטוריה, ניווט */
    const handleFinish = async () => {
      setStopError("");
      try {
        await apiClient.post("/rides/stop");
        await fetchHistoryFromServer();
        setIsRideActive(false);
        setIsRidePaused(false);
        setDidStartFromRoute(false);
        setIsRideMinimized(false);
        onNavigate("history");
      } catch {
        setStopError("שגיאה בסיום הרכיבה.");
      }
    };

    return (
      <RideActiveHud
        rideElapsedSeconds={rideElapsedSeconds}
        isRidePaused={isRidePaused}
        setIsRidePaused={setIsRidePaused}
        selectedRoute={rideSelectedRoute}
        mapApiKey={mapApiKey}
        isMapLoaded={isMapLoaded}
        mapLoadError={mapLoadError}
        stopError={stopError}
        onMinimize={() => {
          setIsRideMinimized(true);
          onNavigate("home");
        }}
        onFinish={handleFinish}
      />
    );
  }

  return (
    <>
      {/* overflow-x-hidden מונע גלילה אופקית/חיתוך כאשר הדרופדאון קרוב לקצה המסך */}
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col overflow-x-hidden px-4 pb-10 pt-5 sm:px-6">
        <main className="mt-6 flex flex-1 items-center justify-center">
          {/* מסך מוכנות לרכיבה לפני כניסה ל־HUD */}
          <GlassCard
            className="w-full max-w-xl text-center"
            title="מוכן לרכיבה?"
          >
            <p className="text-sm text-slate-300">
              הפעל מצב רכיבה פעילה לממשק מלא ללא ניווט.
            </p>

            {/* אינדיקציה למסלול שנבחר ממסך המסלולים */}
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm">
              <p className="text-slate-200">
                מסלול נבחר:{" "}
                {rideSelectedRoute ? rideSelectedRoute.title : "ללא"}
              </p>
              {rideSelectedRoute && (
                <p className="mt-1 text-xs text-slate-400">
                  {rideSelectedRoute.from} → {rideSelectedRoute.to}
                </p>
              )}
            </div>

            {/* שורת סטטוס קצרה לפני יציאה לרכיבה */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="mv-pill px-3 py-1 text-xs font-medium text-emerald-200">
                GPS: מוכן
              </span>
              <span className="mv-pill px-3 py-1 text-xs text-slate-200">
                דיוק משוער: גבוה
              </span>
            </div>

            {/* בחירת מסלול אופציונלית */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm">
              <span className="text-slate-300">מסלול</span>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {/* ניקוי מסלול באופן מפורש מהמשתמש */}
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setDidStartFromRoute(false);
                  }}
                  className={[
                    "rounded-full bg-white/5 border text-sm px-4 py-2 leading-none backdrop-blur whitespace-nowrap w-auto",
                    !rideSelectedRoute
                      ? "border-emerald-300/40 text-emerald-200"
                      : "border-white/10 text-white/80 hover:text-white",
                  ].join(" ")}
                >
                  ללא מסלול
                </Button>

                {/* מעבר יזום למסך מסלולים לבחירה */}
                <Button
                  variant="ghost"
                  size="md"
                  className="rounded-full bg-white/5 border border-white/10 text-sm px-4 py-2 leading-none backdrop-blur whitespace-nowrap w-auto text-white/80 hover:text-white"
                  onClick={() => onNavigate("routes")}
                >
                  בחר מסלול
                </Button>
              </div>
            </div>

            {/* הערת בטיחות לפני התחלת רכיבה */}
            <p className="mt-4 text-xs text-slate-400">
              טיפ: בדוק קסדה ואורות לפני יציאה
            </p>

            {/* הצגת שגיאת התחלת רכיבה */}
            {startError && (
              <p className="mt-3 text-center text-xs text-rose-300">{startError}</p>
            )}

            {/* התחלת רכיבה: קריאת API ואז הפעלת UI */}
            <Button
              variant="primary"
              size="lg"
              className="mt-6 w-full"
              onClick={async () => {
                setStartError("");
                try {
                  const payload = rideSelectedRoute ? { routeId: rideSelectedRoute._id || rideSelectedRoute.id } : {};
                  await apiClient.post("/rides/start", payload);

                  setIsRidePaused(false);
                  setIsRideMinimized(false);
                  setIsRideActive(true);
                } catch (error) {
                  // השארנו רק הדפסה שקטה מאחורי הקלעים למקרה שמשהו ישתבש בעתיד
                  console.error("Failed to start ride:", error);
                  setStartError("שגיאה בהתחלת רכיבה. נסה שוב.");
                }
              }}
            >
              התחל רכיבה
            </Button>
          </GlassCard>
        </main>
      </div>
    </>
  );
}
