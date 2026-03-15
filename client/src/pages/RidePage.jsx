/**
 * RidePage — מסך הרכיבה.
 * מכיל את RideActiveMap ו-RideActiveHud כרכיבי עזר פנימיים,
 * ומשתמש ב-RideControlCenter לשלב טרום-הרכיבה.
 */

import { useMemo, useEffect, useState, memo, useRef } from "react";
import { GoogleMap, MarkerF, PolylineF } from "@react-google-maps/api";
import Button from "../app/ui/components/Button";
import GlassCard from "../app/ui/components/GlassCard";
import {
  ISRAEL_DEFAULT_CENTER,
  ISRAEL_DEFAULT_ZOOM,
} from "../app/state/useAppState";
import { Bike } from "lucide-react";
import RideControlCenter from "./RideControlCenter";
import RideActiveCockpit from "./RideActiveCockpit";

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
      sinDLng *
      sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

/* ─── RideActiveMap ─── */

const RideActiveMap = memo(function RideActiveMap({
  center,
  myLocation,
  isMapLoaded,
  mapLoadError,
  routePath,
}) {
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    if (mapInstance && myLocation) {
      if (routePath && routePath.length > 0 && window.google) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(myLocation);
        routePath.forEach((p) => bounds.extend(p));
        mapInstance.fitBounds(bounds);
      } else {
        mapInstance.panTo(myLocation);
      }
    }
  }, [mapInstance, myLocation, routePath]);

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

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
      gestureHandling: "greedy",
    }),
    [],
  );

  const polylineOptions = useMemo(
    () => ({
      strokeColor: "#34d399",
      strokeOpacity: 0.9,
      strokeWeight: 5,
    }),
    [],
  );

  return (
    <GoogleMap
      center={center}
      zoom={ISRAEL_DEFAULT_ZOOM}
      mapContainerClassName="h-full w-full"
      options={mapOptions}
      onLoad={(m) => setMapInstance(m)}
    >
      {myLocation && <MarkerF position={myLocation} title="המיקום שלי" />}

      {/* ציור המסלול באמצעות PolylineF במקום DirectionsRenderer שקורס */}
      {routePath && routePath.length > 0 && (
        <PolylineF path={routePath} options={polylineOptions} />
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
  onCapturePhoto,
  /* סטטיסטיקות בזמן אמת מה-GPS */
  totalDistanceKm,
  currentSpeedKmh,
  maxSpeedKmh,
  gpsAccuracyPct,
}) {
  const [mapCenter, setMapCenter] = useState(ISRAEL_DEFAULT_CENTER);
  const [myLocation, setMyLocation] = useState(null);
  const [isGpsUnavailable, setIsGpsUnavailable] = useState(false);
  const [routePath, setRoutePath] = useState(null);

  /* יצירת לינקים לניווט חיצוני בהתאם לנקודת הסיום של המסלול הנבחר */
  const navLinks = useMemo(() => {
    let wazeUrl = "https://waze.com/ul";
    let googleUrl = "https://maps.google.com/";

    if (selectedRoute) {
      const dest =
        selectedRoute.destination ||
        selectedRoute.toLatLng ||
        selectedRoute.end;
      if (dest?.lat && dest?.lng) {
        wazeUrl = `https://waze.com/ul?ll=${dest.lat},${dest.lng}&navigate=yes`;
        googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`;
      }
    }
    return { waze: wazeUrl, google: googleUrl };
  }, [selectedRoute]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setIsGpsUnavailable(true);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
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

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* שליפת מסלול מג-Directions API כאשר נבחר מסלול והמפה נטענה */
  useEffect(() => {
    if (!selectedRoute) {
      setRoutePath(null);
      return;
    }

    if (!isMapLoaded || !window.google) return;

    // ניסיון לחלץ קואורדינטות מכל פורמט אפשרי של האובייקט
    const origin =
      selectedRoute?.origin ||
      selectedRoute?.fromLatLng ||
      selectedRoute?.start;
    const destination =
      selectedRoute?.destination ||
      selectedRoute?.toLatLng ||
      selectedRoute?.end;

    // אם אין קואורדינטות בכלל, אין טעם להמשיך לגוגל
    if (!origin?.lat || !destination?.lat) {
      console.warn("No coordinates found for route:", selectedRoute);
      return;
    }

    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin: { lat: Number(origin.lat), lng: Number(origin.lng) },
        destination: {
          lat: Number(destination.lat),
          lng: Number(destination.lng),
        },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          const pathPoints = result.routes[0].overview_path.map((p) => ({
            lat: p.lat(),
            lng: p.lng(),
          }));
          setRoutePath(pathPoints);
        } else {
          console.error("Directions API failed:", status);
          // Fallback: אם גוגל נכשל, צייר קו ישר בין ההתחלה לסוף כדי שלא יהיה ריק
          setRoutePath([
            { lat: Number(origin.lat), lng: Number(origin.lng) },
            { lat: Number(destination.lat), lng: Number(destination.lng) },
          ]);
        }
      },
    );
  }, [
    isMapLoaded,
    selectedRoute?.id || selectedRoute?._id || selectedRoute?.title,
  ]);

  const hours = String(Math.floor(rideElapsedSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((rideElapsedSeconds % 3600) / 60)).padStart(
    2,
    "0",
  );
  const seconds = String(rideElapsedSeconds % 60).padStart(2, "0");

  return (
    <section className="relative h-dvh flex flex-col overflow-hidden px-4 pb-4 pt-6 sm:px-6">
      {/* שכבת רקע קולנועית + גריד עדין לדימוי מפה */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(20,184,166,0.22),rgba(2,6,23,0.9)_38%,rgba(2,6,23,1)_78%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[26px_26px] opacity-35" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_78%,rgba(16,185,129,0.14),transparent_52%)]" />

      <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col">
        {/* טיימר מרכזי - גובה קבוע */}
        <div className="flex-none pt-2 text-center sm:pt-6">
          {/* פעולת מזעור: מחזירה למעטפת רגילה בלי לסיים רכיבה */}
          <div className="mb-2 flex items-center justify-end">
            <Button
              variant="ghost"
              size="md"
              onClick={onMinimize}
              className="rounded-full px-3 py-1.5 text-xs text-slate-200"
            >
              מזער
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center space-y-3 mt-8">
            <p className="text-7xl font-mono font-light tracking-widest text-white sm:text-8xl drop-shadow-[0_0_15px_rgba(52,211,153,0.25)]">
              {hours}:{minutes}:{seconds}
            </p>
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 opacity-80 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.4)]" />
              <span className="text-sm font-medium tracking-widest text-slate-300">
                רכיבה פעילה
              </span>
            </div>
          </div>

          {/* מחוון למסלול פעיל */}
          {selectedRoute && (
            <div className="mx-auto mt-4 max-w-sm rounded-2xl border border-white/5 bg-white/5 px-4 py-2.5 text-sm backdrop-blur-md shadow-lg">
              <p className="font-semibold text-emerald-300">
                מסלול: {selectedRoute.title}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {selectedRoute.from} → {selectedRoute.to}
              </p>
            </div>
          )}
        </div>

        {/* 2x2 Telemetry Grid */}
        <div className="mx-auto mt-6 w-full max-w-md flex-1 px-2">
          <div className="grid grid-cols-2 gap-3">
            {/* כרטיסייה 1: מהירות נוכחית */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-lg">
              <svg
                className="h-6 w-6 text-slate-400 mb-2 opacity-70"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="text-4xl font-bold text-emerald-400 tracking-tight">
                {currentSpeedKmh}
              </span>
              <span className="mt-1 text-xs font-medium text-slate-400 uppercase tracking-widest">
                קמ״ש
              </span>
            </div>

            {/* כרטיסייה 2: מרחק */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-lg">
              <svg
                className="h-6 w-6 text-slate-400 mb-2 opacity-70"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <span className="text-4xl font-bold text-emerald-400 tracking-tight">
                {totalDistanceKm.toFixed(1)}
              </span>
              <span className="mt-1 text-xs font-medium text-slate-400 uppercase tracking-widest">
                ק״מ
              </span>
            </div>

            {/* כרטיסייה 3: מהירות שיא */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-lg">
              <svg
                className="h-5 w-5 text-slate-400 mb-2 opacity-80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-2xl font-bold text-emerald-400">
                {maxSpeedKmh}
              </span>
              <span className="mt-1 text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                מהירות שיא
              </span>
            </div>

            {/* כרטיסייה 4: דיוק GPS */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-lg">
              <svg
                className="h-5 w-5 text-slate-400 mb-2 opacity-80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-2xl font-bold text-emerald-400">
                {gpsAccuracyPct !== null ? `${gpsAccuracyPct}%` : "--"}
              </span>
              <span className="mt-1 text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                דיוק GPS
              </span>
            </div>
          </div>

          {/* כפתורי ניווט חיצוניים */}
          <div className="mt-8 flex flex-col items-center w-full px-2">
            <span className="text-xs text-gray-400 mb-3 tracking-widest uppercase">
              נווט עם APPS
            </span>
            <div className="flex w-full gap-3">
              <button
                type="button"
                onClick={() => window.open(navLinks.waze, "_blank")}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-3 text-sm font-medium text-white transition-all hover:bg-white/10 active:scale-95 backdrop-blur-md"
              >
                <svg
                  className="h-4 w-4 text-emerald-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Waze
              </button>
              <button
                type="button"
                onClick={() => window.open(navLinks.google, "_blank")}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-3 text-sm font-medium text-white transition-all hover:bg-white/10 active:scale-95 backdrop-blur-md"
              >
                <svg
                  className="h-4 w-4 text-teal-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                Google Maps
              </button>
            </div>
          </div>
        </div>

        {/* סרגל פעולות תחתון */}
        <div className="flex-none mx-auto w-full max-w-xl pb-2">
          {/* הצגת שגיאת סיום רכיבה — inline מעל הכפתורים */}
          {stopError && (
            <p className="mx-auto mt-2 text-center text-xs text-rose-300">
              {stopError}
            </p>
          )}

          <div className="mv-card mt-2 flex items-center justify-between gap-3 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-4 shadow-2xl">
            <button
              type="button"
              onClick={onFinish}
              className="rounded-2xl bg-linear-to-r from-emerald-500 to-teal-400 px-6 py-3 text-sm font-bold text-white shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all hover:scale-[1.03] active:scale-95"
            >
              סיום ושמירה
            </button>

            <button
              type="button"
              onClick={() => setIsRidePaused((prev) => !prev)}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-95"
            >
              {isRidePaused ? "▶ המשך" : "⏸ השהה"}
            </button>

            <Button
              variant="ghost"
              size="md"
              onClick={onCapturePhoto}
              className="h-12 w-12 flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-0 text-slate-300 hover:text-white transition-colors active:scale-95"
              aria-label="צילום תמונה"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                />
              </svg>
            </Button>
          </div>
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
  const [lastRideId, setLastRideId] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [rideName, setRideName] = useState("");
  const [ridePhotoFile, setRidePhotoFile] = useState(null);
  const [ridePhotoPreview, setRidePhotoPreview] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const ridePhotoInputRef = useRef(null);

  /* נתיב GPS שהוקלט במהלך הרכיבה */
  const [recordedPath, setRecordedPath] = useState([]);
  /* ref לנקודת ה-GPS האחרונה — לחישוב דלתא מרחק ומהירות בלי re-render */
  const lastGpsPointRef = useRef(null);
  /* סטטיסטיקות רכיבה בזמן אמת */
  const [totalDistanceKm, setTotalDistanceKm] = useState(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [maxSpeedKmh, setMaxSpeedKmh] = useState(0); // Track max speed
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
      const accuracyM = pos.coords.accuracy ?? 50;

      /* עדכון דיוק GPS — ממיר מ-מטרים לאחוז ביטחון (תמיד, גם לפני הסינון) */
      setGpsAccuracyPct(
        Math.max(0, Math.min(100, Math.round(100 - accuracyM))),
      );

      /* סינון חכם של עיוותי GPS (רעש במנוחה) */
      if (accuracyM > 20) {
        return; // מדלגים על הנקודה אם הדיוק גרוע מ-20 מטר
      }

      const p = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        t: new Date().toISOString(),
      };

      /* מניעת נקודות כפולות לפי סף מרחק זעיר */
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

        /* סינון החלקות קטנות מ-1 מ' ומרווחי זמן אפסיים */
        if (timeDeltaH > 0 && distKm > 0.001) {
          setTotalDistanceKm((prev) => parseFloat((prev + distKm).toFixed(2)));

          const rawSpeedKmh = distKm / timeDeltaH;
          const newSpeed = rawSpeedKmh < 1.5 ? 0 : Math.round(rawSpeedKmh);
          /* איפוס מהירות במנוחה או הליכה (מתחת 1.5), שומר על מהירות נסיעה איטית */
          setCurrentSpeedKmh(newSpeed);
          if (newSpeed > 0) {
            setMaxSpeedKmh((prev) => Math.max(prev, newSpeed));
          }
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
        const res = await apiClient.post("/rides/stop", {
          path: recordedPath,
          distanceKm: totalDistanceKm,
        });
        /* שמירת מזהה לצורך עדכון שם בפעולה הבאה */
        setLastRideId(res?.data?.ride?._id || null);
        /* מילוי מקדים: שם המסלול הנבחר אם קיים */
        setRideName(rideSelectedRoute?.title || "");
        setRidePhotoFile(null);
        setRidePhotoPreview(null);
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
          setRidePhotoFile(null);
          setRidePhotoPreview(null);
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
        <RideActiveCockpit
          rideElapsedSeconds={rideElapsedSeconds}
          isRidePaused={isRidePaused}
          setIsRidePaused={setIsRidePaused}
          selectedRoute={rideSelectedRoute}
          isMapLoaded={isMapLoaded}
          mapLoadError={mapLoadError}
          stopError={stopError}
          totalDistanceKm={totalDistanceKm}
          currentSpeedKmh={currentSpeedKmh}
          maxSpeedKmh={maxSpeedKmh}
          gpsAccuracyPct={gpsAccuracyPct}
          recordedPath={recordedPath}
          onMinimize={() => {
            setIsRideMinimized(true);
            onNavigate("home");
          }}
          onFinish={handleFinish}
          onCapturePhoto={() => {
            setIsRidePaused(true);
            setStopError("");
            setShowNameModal(true);
            setTimeout(() => ridePhotoInputRef.current?.click(), 100);
          }}
        />

        {/* מודל שמירת שם רכיבה לאחר עצירה */}
        {showNameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-xl">
              <p className="text-base font-semibold text-slate-100 mb-2">
                שמור את הרכיבה
              </p>

              <input
                type="text"
                value={rideName}
                onChange={(e) => setRideName(e.target.value)}
                placeholder="שם הרכיבה (למשל טיול ערב)"
                maxLength={60}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 mb-3"
              />

              {/* העלאת תמונה אופציונלית */}
              <div className="mb-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setRidePhotoFile(file);
                      setRidePhotoPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden"
                  ref={ridePhotoInputRef}
                />

                {ridePhotoPreview ? (
                  <div className="relative mx-auto mt-2 h-32 w-full max-w-50 overflow-hidden rounded-xl border border-white/10">
                    <img
                      src={ridePhotoPreview}
                      alt="תצוגה מקדימה לרכיבה"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setRidePhotoFile(null);
                        setRidePhotoPreview(null);
                        if (ridePhotoInputRef.current)
                          ridePhotoInputRef.current.value = "";
                      }}
                      className="absolute right-2 top-2 rounded-full bg-slate-900/60 p-1 text-xs text-white hover:bg-rose-500/80"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => ridePhotoInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-slate-800/30 py-4 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  >
                    <span>📷 הוסף תמונה לרכיבה</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {/* שמירת שם ותמונה רכיבה בשרת */}
                <button
                  type="button"
                  disabled={isUploadingPhoto}
                  className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold tracking-wide text-white hover:bg-emerald-400 disabled:opacity-50"
                  onClick={async () => {
                    if (lastRideId) {
                      try {
                        let finalImageUrl = "";
                        if (ridePhotoFile) {
                          setIsUploadingPhoto(true);
                          const formData = new FormData();
                          formData.append("image", ridePhotoFile);
                          const uploadRes = await apiClient.post(
                            "/upload",
                            formData,
                            {
                              headers: {
                                "Content-Type": "multipart/form-data",
                              },
                            },
                          );
                          finalImageUrl = uploadRes.data.imageUrl;
                        }

                        const payload = {};
                        if (rideName.trim()) payload.name = rideName.trim();
                        if (finalImageUrl) payload.imageUrl = finalImageUrl;

                        await apiClient.patch(`/rides/${lastRideId}`, payload);
                      } catch (err) {
                        console.error("Failed to save ride details:", err);
                      } finally {
                        setIsUploadingPhoto(false);
                      }
                    }

                    setShowNameModal(false);
                    setIsRideActive(false);
                    setDidStartFromRoute(false);
                    await fetchHistoryFromServer();
                    if (fetchBikesFromServer) await fetchBikesFromServer();
                    onNavigate("routes");
                  }}
                >
                  {isUploadingPhoto ? "מעלה..." : "שמור רכיבה"}
                </button>

                {/* Secondary actions: Save Without Name / Discard */}
                <div className="flex w-full gap-2">
                  <button
                    type="button"
                    disabled={isUploadingPhoto}
                    className="flex-1 rounded-xl border border-white/10 bg-slate-800/40 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white disabled:opacity-50"
                    onClick={async () => {
                      setShowNameModal(false);
                      setIsRideActive(false);
                      setDidStartFromRoute(false);
                      await fetchHistoryFromServer();
                      if (fetchBikesFromServer) await fetchBikesFromServer();
                      onNavigate("routes");
                    }}
                  >
                    ללא שם
                  </button>

                  <button
                    type="button"
                    disabled={isUploadingPhoto}
                    className="flex-1 rounded-xl border border-red-500/20 bg-red-500/5 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                    onClick={() => {
                      /* Completely reset the active ride state locally */
                      setShowNameModal(false);
                      setIsRideActive(false);
                      setDidStartFromRoute(false);
                      setRecordedPath([]);
                      setTotalDistanceKm(0);
                      setCurrentSpeedKmh(0);
                      setMaxSpeedKmh(0);
                      setGpsAccuracyPct(null);
                      lastGpsPointRef.current = null;

                      /* Return the user to the initial Ride page without making any API calls */
                      onNavigate("home");
                    }}
                  >
                    מחק רכיבה
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ─── handler להתחלת רכיבה — מועבר ל-RideControlCenter ─── */
  const handleStartRide = async () => {
    setStartError("");
    try {
      let payload = {};
      if (rideSelectedRoute) {
        const routeId = rideSelectedRoute?._id || rideSelectedRoute?.id;
        if (routeId) payload = { routeId };
      }
      await apiClient.post("/rides/start", payload);
      /* איפוס סטטיסטיקות לרכיבה חדשה */
      setRecordedPath([]);
      lastGpsPointRef.current = null;
      setTotalDistanceKm(0);
      setCurrentSpeedKmh(0);
      setMaxSpeedKmh(0);
      setGpsAccuracyPct(null);
      setIsRidePaused(false);
      setIsRideMinimized(false);
      setIsRideActive(true);
    } catch (error) {
      console.error("Failed to start ride:", error);
      setStartError("שגיאה בהתחלת רכיבה. נסה שוב.");
    }
  };

  return (
    <RideControlCenter
      onStartRide={handleStartRide}
      onSelectRoute={() => onNavigate("routes")}
      selectedRoute={selectedRoute}
      didStartFromRoute={didStartFromRoute}
      setDidStartFromRoute={setDidStartFromRoute}
      startError={startError}
      lastRide={null}
      isMapLoaded={isMapLoaded}
      mapLoadError={mapLoadError}
    />
  );
}
