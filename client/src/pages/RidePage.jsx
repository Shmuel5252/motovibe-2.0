/**
 * RidePage — מסך הרכיבה.
 * מכיל את RideActiveMap ו-RideActiveHud כרכיבי עזר פנימיים.
 */

import { useMemo, useEffect, useState, memo, useRef } from "react";
import {
  GoogleMap,
  MarkerF,
  PolylineF,
} from "@react-google-maps/api";
import Button from "../app/ui/components/Button";
import GlassCard from "../app/ui/components/GlassCard";
import { ISRAEL_DEFAULT_CENTER, ISRAEL_DEFAULT_ZOOM } from "../app/state/useAppState";

/* ─── פונקציית עזר: Haversine — מחשבת מרחק בק"מ בין שתי נקודות GPS ─── */

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const c =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

/* ─── RideActiveMap ─── */

const RideActiveMap = memo(function RideActiveMap({ center, myLocation, isMapLoaded, mapLoadError, routePath }) {
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

  const mapOptions = useMemo(() => ({
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false,
    gestureHandling: "greedy",
  }), []);

  const polylineOptions = useMemo(() => ({
    strokeColor: "#34d399",
    strokeOpacity: 0.9,
    strokeWeight: 5,
  }), []);

  return (
    <GoogleMap
      center={center}
      zoom={ISRAEL_DEFAULT_ZOOM}
      mapContainerClassName="h-full w-full"
      options={mapOptions}
    >
      {myLocation && <MarkerF position={myLocation} title="המיקום שלי" />}

      {/* ציור המסלול באמצעות PolylineF במקום DirectionsRenderer שקורס */}
      {routePath && routePath.length > 0 && (
        <PolylineF
          path={routePath}
          options={polylineOptions}
        />
      )}
    </GoogleMap>
  );
});

/* ─── RideActiveHud ─── */

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
  /* סטטיסטיקות בזמן אמת מה-GPS */
  totalDistanceKm,
  currentSpeedKmh,
  gpsAccuracyPct,
}) {
  const [mapCenter, setMapCenter] = useState(ISRAEL_DEFAULT_CENTER);
  const [myLocation, setMyLocation] = useState(null);
  const [isGpsUnavailable, setIsGpsUnavailable] = useState(false);
  const [routePath, setRoutePath] = useState(null); // <-- שומרים רק את מערך הנקודות

  const hasGoogleMapsApiKey = Boolean(mapApiKey);

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

  /* שליפת מסלול מג-Directions API כאשר נבחר מסלול והמפה נטענה */
  useEffect(() => {
    if (!selectedRoute) {
      setRoutePath(null);
      return;
    }

    if (!isMapLoaded || !window.google) return;

    // ניסיון לחלץ קואורדינטות מכל פורמט אפשרי של האובייקט
    const origin = selectedRoute?.origin || selectedRoute?.fromLatLng || selectedRoute?.start;
    const destination = selectedRoute?.destination || selectedRoute?.toLatLng || selectedRoute?.end;

    // אם אין קואורדינטות בכלל, אין טעם להמשיך לגוגל
    if (!origin?.lat || !destination?.lat) {
      console.warn("No coordinates found for route:", selectedRoute);
      return;
    }

    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin: { lat: Number(origin.lat), lng: Number(origin.lng) },
        destination: { lat: Number(destination.lat), lng: Number(destination.lng) },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          const pathPoints = result.routes[0].overview_path.map(p => ({
            lat: p.lat(),
            lng: p.lng()
          }));
          setRoutePath(pathPoints);
        } else {
          console.error("Directions API failed:", status);
          // Fallback: אם גוגל נכשל, צייר קו ישר בין ההתחלה לסוף כדי שלא יהיה ריק
          setRoutePath([
            { lat: Number(origin.lat), lng: Number(origin.lng) },
            { lat: Number(destination.lat), lng: Number(destination.lng) }
          ]);
        }
      },
    );
  }, [isMapLoaded, selectedRoute?.id || selectedRoute?._id || selectedRoute?.title]);

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
                  routePath={routePath}
                />
              )}
            </div>
          </div>
        </div>

        {/* KPI צף בסגנון נקי: 3 עמודות עם אייקון, ערך גדול ותווית קטנה */}
        {/* ערכי placeholder — יוחלפו בנתוני GPS ומחשוב אמיתיים */}
        <div className="mx-auto mt-8 w-full max-w-3xl border-y border-white/10 py-5">
          {/* סדר עמודות לוגי: דיוק → מהירות → מרחק */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {/* דיוק GPS באחוזים */}
            <div className="flex flex-col items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm">
                🧭
              </span>
              <span className="text-2xl font-semibold leading-none text-white">
                {gpsAccuracyPct !== null ? `${gpsAccuracyPct}%` : "--"}
              </span>
              <span className="text-xs text-slate-400">דיוק</span>
            </div>

            {/* מהירות נוכחית בקמ"ש */}
            <div className="flex flex-col items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm">
                ⏱️
              </span>
              <span className="text-2xl font-semibold leading-none text-white">
                {currentSpeedKmh > 0 ? currentSpeedKmh : "--"}
              </span>
              <span className="text-xs text-slate-400">מהירות (קמ״ש)</span>
            </div>

            {/* מרחק מצטבר בק"מ */}
            <div className="flex flex-col items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm">
                📍
              </span>
              <span className="text-2xl font-semibold leading-none text-white">
                {totalDistanceKm > 0 ? totalDistanceKm.toFixed(1) : "--"}
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
  fetchBikesFromServer,
}) {
  /* מציגים מסלול רק אם המשתמש התחיל רכיבה מתוך מסך Routes. */
  const rideSelectedRoute =
    didStartFromRoute && selectedRoute ? selectedRoute : null;

  const [startError, setStartError] = useState("");
  const [stopError, setStopError] = useState("");
  /* מונע לחיצה כפולה על כפתור סיום */
  const [isStopping, setIsStopping] = useState(false);
  /* מזהה הרכיבה האחרונה שנעצרה — לשמירת שם */
  const [lastRideId, setLastRideId] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [rideName, setRideName] = useState("");
  /* נתיב GPS שהוקלט במהלך הרכיבה */
  const [recordedPath, setRecordedPath] = useState([]);
  /* ref לנקודת ה-GPS האחרונה — לחישוב דלתא מרחק ומהירות בלי re-render */
  const lastGpsPointRef = useRef(null);
  /* סטטיסטיקות רכיבה בזמן אמת */
  const [totalDistanceKm, setTotalDistanceKm] = useState(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  /* gpsAccuracyPct: null = טרם נמדד, 0–100 = אחוז ביטחון */
  const [gpsAccuracyPct, setGpsAccuracyPct] = useState(null);

  /* מעקב GPS רציף: פעיל כשהרכיבה פעילה ולא מושהית */
  /* מעקב GPS: מנסה watchPosition, ואם נכשל — fallback לפולינג עם getCurrentPosition */
  useEffect(() => {
    if (!isRideActive || isRidePaused) return;
    if (!navigator.geolocation) return;

    let watchId = null;
    let pollId = null;

    const pushPoint = (pos) => {
      const p = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        t: new Date().toISOString(),
      };

      /* עדכון דיוק GPS — ממיר מ-מטרים לאחוז ביטחון (100m → 0%, 0m → 100%) */
      const accuracyM = pos.coords.accuracy ?? 50;
      setGpsAccuracyPct(Math.max(0, Math.min(100, Math.round(100 - accuracyM))));

      /* מניעת נקודות כפולות/רעש GPS לפי סף מרחק מינימלי */
      const last = lastGpsPointRef.current;
      if (
        last &&
        Math.abs(last.lat - p.lat) < 0.00005 &&
        Math.abs(last.lng - p.lng) < 0.00005
      ) {
        return;
      }

      /* חישוב דלתא מרחק ומהירות מהנקודה הקודמת */
      if (last) {
        const distKm = haversineKm(last, p);
        const timeDeltaH =
          (new Date(p.t).getTime() - new Date(last.t).getTime()) / 3_600_000;
        /* מסנן החלקות קטנות מ-1 מ' ומרווחי זמן אפסיים */
        if (timeDeltaH > 0 && distKm > 0.001) {
          setTotalDistanceKm((prev) =>
            parseFloat((prev + distKm).toFixed(2))
          );
          setCurrentSpeedKmh(Math.round(distKm / timeDeltaH));
        }
      }

      /* שמירת נקודה חדשה כאחרונה ועדכון מסלול מוקלט */
      lastGpsPointRef.current = p;
      setRecordedPath((prev) => [...prev, p]);
    };

    // 1) ניסיון watchPosition
    watchId = navigator.geolocation.watchPosition(
      pushPoint,
      (err) => {
        console.error("GPS watch failed:", err);
        // 2) fallback: פולינג כל 8 שניות
        if (!pollId) {
          pollId = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
              pushPoint,
              (e) => console.error("GPS poll failed:", e),
              { enableHighAccuracy: false, timeout: 15000, maximumAge: 5000 },
            );
          }, 8000);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );

    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      if (pollId != null) clearInterval(pollId);
    };
  }, [isRideActive, isRidePaused]);
  if (isRideActive && !isRideMinimized) {
    /* סיום רכיבה: עצירה בשרת, רענון היסטוריה, ניווט */
    const handleFinish = async () => {
      /* מניעת לחיצה כפולה */
      if (isStopping) return;
      setIsStopping(true);
      setStopError("");
      try {
        /* שליחת נתיב GPS ומרחק לשרת יחד עם עצירת הרכיבה */
        const res = await apiClient.post("/rides/stop", { path: recordedPath, distanceKm: totalDistanceKm });
        /* שמירת מזהה לצורך עדכון שם בפעולה הבאה */
        setLastRideId(res?.data?.ride?._id || null);
        /* מילוי מקדים: שם המסלול הנבחר אם קיים */
        setRideName(rideSelectedRoute?.title || "");
        setShowNameModal(true);
        /* הקפאת הטיימר בזמן שהמודל פתוח */
        setIsRidePaused(true);
      } catch (error) {
        /* 409 = הרכיבה כבר נעצרה בשרת — ממשיכים לזרימת UI רגילה */
        if (error?.response?.status === 409) {
          console.warn("Ride already stopped (409). Proceeding to finish UI.");
          setLastRideId(null);
          /* מילוי מקדים גם במקרה של 409 */
          setRideName(rideSelectedRoute?.title || "");
          setShowNameModal(true);
          setIsRidePaused(true);
        } else {
          console.error("Stop ride error:", error);
          setStopError("שגיאה בסיום הרכיבה.");
        }
      } finally {
        setIsStopping(false);
      }
    };

    return (
      <>
        <RideActiveHud
          rideElapsedSeconds={rideElapsedSeconds}
          isRidePaused={isRidePaused}
          setIsRidePaused={setIsRidePaused}
          selectedRoute={rideSelectedRoute}
          mapApiKey={mapApiKey}
          isMapLoaded={isMapLoaded}
          mapLoadError={mapLoadError}
          stopError={stopError}
          totalDistanceKm={totalDistanceKm}
          currentSpeedKmh={currentSpeedKmh}
          gpsAccuracyPct={gpsAccuracyPct}
          onMinimize={() => {
            setIsRideMinimized(true);
            onNavigate("home");
          }}
          onFinish={handleFinish}
        />

        {/* מודל שמירת שם רכיבה לאחר עצירה */}
        {showNameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-xl">
              <p className="text-base font-semibold text-slate-100">שם לרכיבה שלך</p>
              <input
                type="text"
                value={rideName}
                onChange={(e) => setRideName(e.target.value)}
                placeholder="למשל: טיול ערב לחוף"
                maxLength={60}
                className="mt-3 w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              />
              <div className="mt-4 flex gap-2">
                {/* שמירת שם רכיבה בשרת */}
                <button
                  type="button"
                  className="flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
                  onClick={async () => {
                    setShowNameModal(false);
                    setIsRideActive(false);
                    setDidStartFromRoute(false);
                    if (lastRideId && rideName.trim()) {
                      try {
                        await apiClient.patch(`/rides/${lastRideId}`, { name: rideName.trim() });
                      } catch (err) {
                        console.error("Failed to save ride name:", err);
                      }
                    }
                    /* רענון היסטוריה ואופנוע לאחר שמירה */
                    await fetchHistoryFromServer();
                    if (fetchBikesFromServer) await fetchBikesFromServer();
                    onNavigate("history");
                  }}
                >
                  שמור
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-slate-300 hover:text-white"
                  onClick={async () => {
                    setShowNameModal(false);
                    setIsRideActive(false);
                    setDidStartFromRoute(false);
                    await fetchHistoryFromServer();
                    if (fetchBikesFromServer) await fetchBikesFromServer();
                    onNavigate("history");
                  }}
                >
                  דלג
                </button>
              </div>
            </div>
          </div>
        )}
      </>
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
                  /* איפוס מסלול מוקלט וסטטיסטיקות לרכיבה חדשה */
                  setRecordedPath([]);
                  lastGpsPointRef.current = null;
                  setTotalDistanceKm(0);
                  setCurrentSpeedKmh(0);
                  setGpsAccuracyPct(null);
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
