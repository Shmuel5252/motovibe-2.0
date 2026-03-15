/**
 * ActivityPage — דף פעילות משולב (היסטוריית רכיבות + מסלולים שמורים).
 * מחליף את HistoryPage ואת RoutesPage (תצוגת רשימה).
 * מוצג כ-Dashboard עם כותרת סטטיסטיקות וגיליון תחתון עם טאבים.
 */

import { useEffect, useState } from "react";
import {
  DirectionsRenderer,
  GoogleMap,
  MarkerF,
  PolylineF,
} from "@react-google-maps/api";
import Button from "../app/ui/components/Button";
import GlassCard from "../app/ui/components/GlassCard";
import { formatRideDuration } from "../app/utils/formatters";
import {
  ISRAEL_DEFAULT_CENTER,
  ISRAEL_DEFAULT_ZOOM,
} from "../app/state/useAppState";
import {
  Bike,
  Map as MapIcon,
  MapPin,
  Plus,
  Camera,
  Trash2,
  Timer,
  Infinity,
  ChevronDown,
  Globe,
  Lock,
  CalendarPlus,
  Users,
} from "lucide-react";

/* ─── constants ─────────────────────────────────────────────────────── */

const IMG_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
  "http://localhost:5000";

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
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
];

/* ─── helper: normalise image URL ──────────────────────────────────── */

function imgSrc(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${IMG_BASE}${url}`;
}

/* ─── CustomSelect ─────────────────────────────────────────────────── */

function CustomSelect({
  value,
  onChange,
  options,
  className,
  direction = "down",
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative flex flex-col ${className}`}>
      <button
        type="button"
        className="w-full h-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-inner text-sm text-slate-100 hover:bg-white/5 transition-all text-right"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <span>{value}</span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${isOpen && direction === "down" ? "rotate-180" : ""} ${direction === "up" ? "rotate-180" : ""} ${isOpen && direction === "up" ? "rotate-0" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div
            className={`absolute ${direction === "up" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"} right-0 w-full z-50 overflow-hidden rounded-xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-3xl shadow-2xl`}
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`w-full text-right px-4 py-3 text-sm transition-colors hover:bg-white/10 ${value === opt ? "bg-[#00FFA3]/10 text-[#00FFA3] font-bold" : "text-slate-300"}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(opt);
                  setIsOpen(false);
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── ModalBackdrop ──────────────────────────────────────────────── */

function ModalBackdrop({ onClose, children, className = "bg-transparent" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-0 sm:px-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
        onClick={onClose}
        aria-label="סגור"
      />
      <div
        className={`relative z-10 w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto custom-scrollbar rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── HistoryRideMap ─────────────────────────────────────────────── */

function HistoryRideMap({ points, isMapLoaded, mapLoadError }) {
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    if (!mapInstance || !window.google || points.length < 2) return;
    const t = setTimeout(() => {
      try {
        const bounds = new window.google.maps.LatLngBounds();
        points.forEach((p) => {
          if (p && typeof p.lat === "number" && typeof p.lng === "number")
            bounds.extend(p);
        });
        mapInstance.fitBounds(bounds, 30);
      } catch {
        /* no-op */
      }
    }, 100);
    return () => clearTimeout(t);
  }, [mapInstance, points]);

  if (mapLoadError)
    return (
      <div className="flex h-full items-center justify-center text-xs text-slate-400">
        שגיאה בטעינת המפה
      </div>
    );
  if (!isMapLoaded)
    return (
      <div className="flex h-full items-center justify-center text-xs text-slate-400">
        טוען מפה...
      </div>
    );

  return (
    <GoogleMap
      center={points[0] ?? { lat: 31.5, lng: 34.75 }}
      zoom={12}
      onLoad={(m) => setMapInstance(m)}
      mapContainerStyle={{ width: "100%", height: "100%" }}
      options={{
        styles: DARK_MAP_STYLE,
        disableDefaultUI: true,
        clickableIcons: false,
        gestureHandling: "cooperative",
      }}
    >
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
      {points.length >= 2 && (
        <MarkerF position={points[0]} label="A" title="התחלה" />
      )}
      {points.length >= 2 && (
        <MarkerF position={points[points.length - 1]} label="B" title="סיום" />
      )}
    </GoogleMap>
  );
}

/* ─── RouteDetailMap ─────────────────────────────────────────────── */

function RouteDetailMap({
  route,
  isMapLoaded,
  mapLoadError,
  isValidMapPoint,
  getSafePolylinePath,
  getRoutePolylinePath,
}) {
  const [mapInstance, setMapInstance] = useState(null);
  const [directionsResult, setDirectionsResult] = useState(null);
  const [directionsStatus, setDirectionsStatus] = useState("ממתין...");

  const path = getRoutePolylinePath(route);
  const safePath = getSafePolylinePath(path);
  const origin = isValidMapPoint(
    route?.start || route?.origin || route?.fromLatLng,
  )
    ? route?.start || route?.origin || route?.fromLatLng
    : null;
  const destination = isValidMapPoint(
    route?.end || route?.destination || route?.toLatLng,
  )
    ? route?.end || route?.destination || route?.toLatLng
    : null;

  useEffect(() => {
    if (
      !isMapLoaded ||
      !window.google ||
      !mapInstance ||
      !origin ||
      !destination
    ) {
      return;
    }
    try {
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
            setDirectionsResult(result);
            setDirectionsStatus("OK");
          } else {
            setDirectionsResult(null);
            setDirectionsStatus(String(status ?? "ERROR"));
          }
        },
      );
    } catch {
      /* no-op */
    }
  }, [isMapLoaded, mapInstance, origin, destination]);

  useEffect(() => {
    if (!isMapLoaded || !window.google || !mapInstance || safePath.length < 2)
      return;
    try {
      const bounds = new window.google.maps.LatLngBounds();
      safePath.forEach((p) => bounds.extend(p));
      mapInstance.fitBounds(bounds);
    } catch {
      /* no-op */
    }
  }, [isMapLoaded, mapInstance, safePath]);

  if (!isMapLoaded)
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        טוען מפה...
      </div>
    );
  if (mapLoadError)
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        שגיאה בטעינת המפה
      </div>
    );

  return (
    <GoogleMap
      center={ISRAEL_DEFAULT_CENTER}
      zoom={ISRAEL_DEFAULT_ZOOM}
      onLoad={(m) => setMapInstance(m)}
      mapContainerClassName="h-full w-full"
      options={{
        styles: DARK_MAP_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
      }}
    >
      {directionsResult ? (
        <DirectionsRenderer
          directions={directionsResult}
          options={{
            polylineOptions: {
              strokeColor: "#00FFA3",
              strokeOpacity: 0.85,
              strokeWeight: 5,
            },
          }}
        />
      ) : (
        safePath.length >= 2 && (
          <PolylineF
            path={safePath}
            options={{
              strokeColor: "#00FFA3",
              strokeOpacity: 0.85,
              strokeWeight: 5,
            }}
          />
        )
      )}
      {origin && <MarkerF position={origin} title="התחלה" />}
      {destination && <MarkerF position={destination} title="סיום" />}
    </GoogleMap>
  );
}

/* ─── HistoryDetailModal ─────────────────────────────────────────── */

function HistoryDetailModal({
  ride,
  onClose,
  apiClient,
  fetchHistoryFromServer,
  fetchRoutesFromServer,
  isMapLoaded,
  mapLoadError,
  mapApiKey,
}) {
  const [editName, setEditName] = useState(ride.name || ride.title || "");
  const [modalError, setModalError] = useState("");
  const [convertError, setConvertError] = useState("");
  const [convertSuccess, setConvertSuccess] = useState(false);

  const [localImageUrl, setLocalImageUrl] = useState(ride.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    setLocalImageUrl(ride.imageUrl || null);
  }, [ride.imageUrl]);

  const raw = ride.raw || ride;
  const path = Array.isArray(raw?.path) ? raw.path : [];
  const snap = raw?.routeSnapshot;
  let points = [];
  if (path.length >= 2) {
    points = path.map((p) => ({ lat: p.lat, lng: p.lng }));
  } else if (snap?.start && snap?.end) {
    points = [
      { lat: snap.start.lat, lng: snap.start.lng },
      { lat: snap.end.lat, lng: snap.end.lng },
    ];
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("image", file); // Backend expects "image"

      const uploadRes = await apiClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newUrl = uploadRes.data.imageUrl;
      const rideId = ride._id || ride.id;

      await apiClient.patch(`/rides/${rideId}`, { imageUrl: newUrl });

      setLocalImageUrl(newUrl);
      await fetchHistoryFromServer();
    } catch (err) {
      console.error("Upload Error:", err);
      setUploadError("שגיאה בהעלאת תמונה");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setModalError("");
    const rideId = ride._id || ride.id;
    try {
      await apiClient.patch(`/rides/${rideId}`, { name: editName.trim() });
      await fetchHistoryFromServer();
      onClose();
    } catch {
      setModalError("שגיאה בשמירה");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("האם אתה בטוח שברצונך למחוק רכיבה זו?")) return;
    setModalError("");
    const rideId = ride._id || ride.id;
    try {
      await apiClient.delete(`/rides/${rideId}`);
      await fetchHistoryFromServer();
      onClose();
    } catch {
      setModalError("שגיאה במחיקה");
    }
  };

  const handleConvert = async () => {
    setConvertError("");
    setConvertSuccess(false);
    let payload;
    if (snap?.start && snap?.end) {
      payload = {
        title: (raw.name || raw.title || snap.title || "מסלול חדש").trim(),
        start: snap.start,
        end: snap.end,
      };
    } else if (path.length >= 2) {
      const first = path[0],
        last = path[path.length - 1];
      payload = {
        title: (raw.name || raw.title || "רכיבה חופשית").trim(),
        start: { lat: first.lat, lng: first.lng, label: "נקודת התחלה" },
        end: { lat: last.lat, lng: last.lng, label: "יעד" },
      };
    } else {
      setConvertError("אין מספיק נתונים להפוך למסלול");
      return;
    }
    try {
      await apiClient.post("/routes", payload);
      await fetchRoutesFromServer();
      setConvertSuccess(true);
    } catch {
      setConvertError("שגיאה בשמירה כמסלול");
    }
  };

  return (
    <ModalBackdrop
      onClose={onClose}
      className="bg-slate-950/80 backdrop-blur-2xl border border-white/10 shadow-2xl"
    >
      <div className="p-5 space-y-5">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xl font-bold text-white drop-shadow-md">
              {ride.title}
            </p>
            <p className="mt-1 text-xs text-slate-400 font-medium">
              {ride.date}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/5 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition backdrop-blur-md"
          >
            ✕
          </button>
        </div>

        {/* image section */}
        {localImageUrl ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-lg group">
            <img
              src={imgSrc(localImageUrl)}
              alt="תמונת רכיבה"
              className="h-48 w-full object-cover"
            />
            <label className="absolute right-3 top-3 flex cursor-pointer items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition hover:bg-black/80">
              {isUploading ? (
                <span>מעלה...</span>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5 text-slate-300" />
                  <span>שנה תמונה</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </label>
          </div>
        ) : (
          <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-sm">
            <label className="flex cursor-pointer flex-col items-center gap-2 transition hover:opacity-80">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300 backdrop-blur-md shadow-sm border border-emerald-400/20">
                {isUploading ? (
                  "מעלה..."
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    הוסף תמונה לרכיבה
                  </>
                )}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </label>
            {uploadError && (
              <p className="mt-2 text-xs text-rose-300">{uploadError}</p>
            )}
          </div>
        )}

        {/* stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            ["משך", ride.duration],
            ["מרחק", ride.distance],
            ["תאריך", ride.date],
          ].map(([label, val]) => (
            <div
              key={label}
              className="rounded-xl border border-white/5 bg-white/5 p-3 text-center shadow-sm backdrop-blur-md"
            >
              <p className="text-[11px] text-slate-400 font-medium">{label}</p>
              <p className="mt-1 text-sm font-bold text-slate-100">{val}</p>
            </div>
          ))}
        </div>

        {/* map */}
        {mapApiKey?.trim() && points.length >= 2 && (
          <div className="overflow-hidden rounded-xl border border-white/5 bg-white/5 backdrop-blur-md shadow-sm">
            <p className="border-b border-white/5 px-3 py-2 text-xs font-semibold text-slate-300">
              מפת מסלול
            </p>
            <div className="h-[200px]">
              <HistoryRideMap
                points={points}
                isMapLoaded={isMapLoaded}
                mapLoadError={mapLoadError}
              />
            </div>
          </div>
        )}

        {/* edit name */}
        <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-md">
          <p className="text-sm font-semibold text-slate-200">ערוך שם רכיבה</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={60}
              placeholder="שם לרכיבה..."
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
            />
            <button
              type="button"
              onClick={handleSave}
              className="whitespace-nowrap rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/20 hover:text-white transition"
            >
              שמור
            </button>
          </div>
        </div>

        {modalError && (
          <p className="text-xs text-rose-400 text-center">{modalError}</p>
        )}

        {/* actions */}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleConvert}
            className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            הפוך למסלול
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-6 py-3.5 text-sm font-bold text-rose-300 hover:bg-rose-500/20 transition backdrop-blur-sm"
          >
            מחק
          </button>
        </div>

        {convertError && (
          <p className="text-xs text-rose-400 text-center mt-1">
            {convertError}
          </p>
        )}
        {convertSuccess && (
          <p className="text-xs text-emerald-400 text-center mt-1">
            נשמר כמסלול ✅
          </p>
        )}
      </div>
    </ModalBackdrop>
  );
}

/* ─── RouteDetailModal ───────────────────────────────────────────── */

function RouteDetailModal({
  route,
  onClose,
  onStartRide,
  isMapLoaded,
  mapLoadError,
  mapApiKey,
  isValidMapPoint,
  getSafePolylinePath,
  getRoutePolylinePath,
  setIsRideActive,
  setIsRidePaused,
  setIsRideMinimized,
  onNavigate,
  apiClient,
  authToken,
  fetchRoutesFromServer,
  source = "activity",
  currentUserId = "",
  onNavigateToCommunity = null,
}) {
  const [deleteError, setDeleteError] = useState("");
  const [visibility, setVisibility] = useState(route?.visibility ?? "private");
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishToast, setPublishToast] = useState(null); // {type: 'ok'|'err', msg: string}
  const [cloneLoading, setCloneLoading] = useState(false);

  // ── Create group ride form ──
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [eventMeetingPoint, setEventMeetingPoint] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventMaxParticipants, setEventMaxParticipants] = useState("");
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState(null);

  // owner check:
  // - if currentUserId is known, compare directly against route.owner
  // - if unknown (empty), fall back: activity-page routes are always the user's own
  const ownerId = String(route?.owner?._id ?? route?.owner ?? "");
  const isOwner = currentUserId
    ? ownerId === String(currentUserId)
    : source === "activity";

  const routeStyle =
    route?.routeType || route?.style || route?.routeStyle || "עירוני";
  const routeDifficulty = route?.difficulty || "בינוני";
  const routeNote = route?.note || "מסלול זורם ומתאים לרכיבה יומית.";

  const handleStart = () => {
    setIsRidePaused(false);
    setIsRideMinimized(false);
    setIsRideActive(true);
    onNavigate("ride", { source: "routeStart" });
    onStartRide(); // ONLY close the modal, keep selectedRoute intact
  };

  const handleToggleVisibility = async () => {
    if (!isOwner) return; // guard — non-owners must never reach this
    const newVisibility = visibility === "public" ? "private" : "public";
    const routeId = route._id || route.id;
    setPublishLoading(true);
    setPublishToast(null);
    try {
      await apiClient.patch(
        `/routes/${routeId}`,
        { visibility: newVisibility },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      setVisibility(newVisibility);
      await fetchRoutesFromServer(authToken);
      setPublishToast({
        type: "ok",
        msg:
          newVisibility === "public"
            ? "✅ המסלול פורסם לקהילה!"
            : "🔒 המסלול הוסתר מהקהילה",
      });
      setTimeout(() => setPublishToast(null), 3500);
    } catch {
      setPublishToast({ type: "err", msg: "שגיאה בשמירת השינוי, נסה שוב" });
    } finally {
      setPublishLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("האם אתה בטוח שברצונך למחוק מסלול זה?")) return;
    setDeleteError("");
    const routeId = route._id || route.id;
    try {
      await apiClient.delete(`/routes/${routeId}`);
      await fetchRoutesFromServer(authToken);
      onClose();
    } catch {
      setDeleteError("שגיאה במחיקת מסלול");
    }
  };

  const handleCreateEvent = async () => {
    if (!eventDate) {
      setEventError("בחר תאריך ושעה לרכיבה");
      return;
    }
    setEventLoading(true);
    setEventError(null);
    const routeId = route._id || route.id;
    const descParts = [];
    if (eventMeetingPoint.trim())
      descParts.push(`נקודת מפגש: ${eventMeetingPoint.trim()}`);
    if (eventDescription.trim()) descParts.push(eventDescription.trim());
    try {
      await apiClient.post(
        "/events",
        {
          title: `רכיבה: ${route.title}`,
          scheduledAt: new Date(eventDate).toISOString(),
          description: descParts.join("\n") || undefined,
          maxParticipants: eventMaxParticipants
            ? Number(eventMaxParticipants)
            : undefined,
          route: routeId,
        },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      setPublishToast({
        type: "ok",
        msg: "🏍️ הרכיבה נוצרה! עוברים לרכיבות קבוצתיות...",
      });
      setTimeout(() => {
        onClose();
        onNavigateToCommunity?.("events");
      }, 1200);
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ??
        err?.response?.data?.error?.details?.[0]?.msg;
      setEventError(msg || "שגיאה ביצירת הרכיבה, נסה שוב");
    } finally {
      setEventLoading(false);
    }
  };

  const handleCloneRoute = async () => {
    setCloneLoading(true);
    setPublishToast(null);
    try {
      await apiClient.post(
        "/routes",
        {
          title: route.title,
          start: route.start,
          end: route.end,
          originLabel: route.originLabel,
          destinationLabel: route.destinationLabel,
          routeType: route.routeType,
          difficulty: route.difficulty,
          isTwisty: route.isTwisty ?? false,
          distanceKm: route.distanceKm,
          etaMinutes: route.etaMinutes,
          visibility: "private",
        },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      await fetchRoutesFromServer(authToken);
      setPublishToast({
        type: "ok",
        msg: "✅ המסלול נשמר בהצלחה בפרופיל שלך!",
      });
      setTimeout(() => setPublishToast(null), 3500);
    } catch {
      setPublishToast({ type: "err", msg: "שגיאה בשמירת המסלול" });
    } finally {
      setCloneLoading(false);
    }
  };

  return (
    <ModalBackdrop
      onClose={onClose}
      className="bg-[#0b1120]/90 backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] custom-scrollbar"
    >
      <div className="p-6 space-y-6">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-black text-white tracking-tight drop-shadow-md">
              {route.title}
            </p>
            <p className="mt-1.5 text-xs text-slate-400 font-semibold">
              {route.from} &rarr; {route.to}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/5 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition backdrop-blur-md"
          >
            ✕
          </button>
        </div>

        {/* route image */}
        {route?.imageUrl && (
          <div className="overflow-hidden rounded-2xl border border-white/10 shadow-lg">
            <img
              src={imgSrc(route.imageUrl)}
              alt="תמונת מסלול"
              className="h-48 w-full object-cover"
            />
          </div>
        )}

        {/* map */}
        {mapApiKey?.trim() && (
          <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl relative">
            {/* Seamless inner glass effect overlay over the map edges */}
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                background:
                  "radial-gradient(circle at center, transparent 30%, rgba(11,17,32,0.8) 120%)",
              }}
            />
            <div className="h-[240px]">
              <RouteDetailMap
                route={route}
                isMapLoaded={isMapLoaded}
                mapLoadError={mapLoadError}
                isValidMapPoint={isValidMapPoint}
                getSafePolylinePath={getSafePolylinePath}
                getRoutePolylinePath={getRoutePolylinePath}
              />
            </div>
          </div>
        )}

        {deleteError && (
          <p className="text-xs font-medium text-rose-400 text-center">
            {deleteError}
          </p>
        )}

        {/* Publish toast */}
        {publishToast && (
          <div
            className={[
              "rounded-xl border px-4 py-2.5 text-sm font-medium text-center transition-all",
              publishToast.type === "ok"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/30 bg-red-500/10 text-red-400",
            ].join(" ")}
          >
            {publishToast.msg}
          </div>
        )}

        {/* Glass stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            ["מרחק", `${route.distanceKm} ק״מ`],
            ["זמן", `${route.etaMinutes} דק׳`],
            ["סוג", routeStyle],
          ].map(([label, val]) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 py-4 px-2 shadow-sm backdrop-blur-md"
            >
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                {label}
              </p>
              <p className="mt-1.5 text-[15px] font-bold text-white tracking-wide">
                {val}
              </p>
            </div>
          ))}
        </div>

        {/* elements grid (Difficulty & Twisty) */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
          <span className="rounded-full bg-[#00FFA3]/10 border border-[#00FFA3]/30 px-3.5 py-1.5 text-[11px] uppercase tracking-wider font-bold text-[#00FFA3] shadow-sm backdrop-blur-sm">
            קושי: {routeDifficulty}
          </span>
          {route?.isTwisty && (
            <span className="flex items-center gap-1.5 rounded-full bg-[#00FFA3]/10 border border-[#00FFA3]/30 px-3.5 py-1 text-[11px] uppercase tracking-wider font-bold text-[#00FFA3] shadow-sm backdrop-blur-sm">
              מפותל <Infinity size={14} strokeWidth={2.5} />
            </span>
          )}
        </div>

        {/* note */}
        {routeNote && (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-xl shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">
              הערות על המסלול
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              {routeNote}
            </p>
          </div>
        )}

        {/* Create group ride — owner only */}
        {isOwner && !showEventForm && (
          <button
            type="button"
            onClick={() => setShowEventForm(true)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 py-3 text-sm font-bold text-violet-300 hover:bg-violet-500/15 transition active:scale-95"
          >
            <CalendarPlus size={16} />
            צור רכיבה קבוצתית
          </button>
        )}

        {isOwner && showEventForm && (
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-violet-300 flex items-center gap-2">
                <CalendarPlus size={15} /> רכיבה קבוצתית חדשה
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowEventForm(false);
                  setEventError(null);
                }}
                className="rounded-full bg-white/5 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            {/* Date/Time */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                תאריך ושעה *
              </label>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 scheme-dark"
              />
            </div>

            {/* Meeting point */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                נקודת מפגש
              </label>
              <input
                type="text"
                value={eventMeetingPoint}
                onChange={(e) => setEventMeetingPoint(e.target.value)}
                placeholder="לדוגמה: חניון כיכר רבין"
                maxLength={120}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                תיאור קצר
              </label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="לדוגמה: רכיבה רגועה, עוצרים לקפה בסוף"
                maxLength={300}
                rows={2}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50"
              />
            </div>

            {/* Max participants */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                מקסימום משתתפים{" "}
                <span className="text-slate-600 normal-case font-normal">
                  (אופציונלי)
                </span>
              </label>
              <input
                type="number"
                value={eventMaxParticipants}
                onChange={(e) => setEventMaxParticipants(e.target.value)}
                placeholder="ללא הגבלה"
                min={2}
                max={200}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50"
              />
            </div>

            {eventError && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400">
                {eventError}
              </p>
            )}

            <button
              type="button"
              onClick={handleCreateEvent}
              disabled={eventLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500 active:scale-95 transition disabled:opacity-50"
            >
              {eventLoading ? (
                "שולח..."
              ) : (
                <>
                  <CalendarPlus size={15} /> שלח הזמנה לקהילה
                </>
              )}
            </button>
          </div>
        )}

        {/* Premium Actions Glass Pill */}
        <div
          className="flex items-center gap-2.5 rounded-full border border-white/10 px-3 py-3 mt-4 transition-all duration-300"
          style={{
            background:
              "linear-gradient(180deg, rgba(11,19,43,0.7), rgba(11,19,43,0.9))",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            boxShadow:
              "0 10px 40px rgba(0,0,0,0.6), 0 -1px 0 rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {source === "activity" && isOwner ? (
            /* ── Owner (activity tab) actions ── */
            <>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center justify-center rounded-full px-5 py-3.5 text-sm font-semibold transition-all hover:bg-white/10 active:scale-95"
              >
                <Trash2 size={16} strokeWidth={2} className="text-rose-400" />
              </button>

              {/* Publish toggle */}
              <button
                type="button"
                onClick={handleToggleVisibility}
                disabled={publishLoading}
                title={visibility === "public" ? "הסתר מהקהילה" : "פרסם לקהילה"}
                className={[
                  "flex items-center gap-1.5 rounded-full px-4 py-3.5 text-xs font-bold uppercase tracking-wide transition-all hover:brightness-110 active:scale-95 disabled:opacity-50",
                  visibility === "public"
                    ? "border border-teal-500/40 bg-teal-500/15 text-teal-300"
                    : "border border-white/10 bg-white/5 text-slate-400",
                ].join(" ")}
              >
                {publishLoading ? (
                  "..."
                ) : visibility === "public" ? (
                  <>
                    <Lock size={13} /> פרטי
                  </>
                ) : (
                  <>
                    <Globe size={13} /> פרסם
                  </>
                )}
              </button>
            </>
          ) : (
            /* ── Non-owner / community actions ── */
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 rounded-full px-4 py-3.5 text-xs font-semibold transition-all hover:bg-white/10 active:scale-95 border border-white/10 bg-white/5 text-slate-300"
              >
                <ChevronDown size={14} className="rotate-90" />
                {source === "community" ? "לקהילה" : "למסלולים"}
              </button>

              {/* Clone / save to my routes */}
              <button
                type="button"
                onClick={handleCloneRoute}
                disabled={cloneLoading}
                className="flex items-center gap-1.5 rounded-full px-4 py-3.5 text-xs font-bold uppercase tracking-wide transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 border border-indigo-500/40 bg-indigo-500/15 text-indigo-300"
              >
                {cloneLoading ? (
                  "..."
                ) : (
                  <>
                    <Globe size={13} /> שמור
                  </>
                )}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleStart}
            className="flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-sm font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 bg-gradient-to-r from-emerald-500 to-teal-400"
            style={{
              color: "#020617",
              boxShadow: `0 0 15px rgba(16,185,129,0.4), inset 0 2px 4px rgba(255,255,255,0.4)`,
            }}
          >
            התחל רכיבה
            <Bike size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

/* ─── AddRouteModal ──────────────────────────────────────────────── */

function AddRouteModal({
  onClose,
  /* form state */
  newRouteTitle,
  setNewRouteTitle,
  newOriginLabel,
  setNewOriginLabel,
  newOriginLatLng,
  setNewOriginLatLng,
  newDestinationLabel,
  setNewDestinationLabel,
  newDestinationLatLng,
  setNewDestinationLatLng,
  newRouteType,
  setNewRouteType,
  newRouteDifficulty,
  setNewRouteDifficulty,
  newRouteIsTwisty,
  setNewRouteIsTwisty,
  /* map */
  activeMapPickField,
  setActiveMapPickField,
  mapPickCenter,
  setMapPickCenter,
  mapPickStatus,
  setMapPickStatus,
  mapPickRequestIdRef,
  isMapLoaded,
  mapLoadError,
  mapApiKey,
  isValidMapPoint,
  /* autocomplete */
  originSuggestions,
  setOriginSuggestions,
  destinationSuggestions,
  setDestinationSuggestions,
  activeSuggestionField,
  setActiveSuggestionField,
  newRouteLocationError,
  setNewRouteLocationError,
  isPlacesSuggestionsReady,
  /* save */
  apiClient,
  authToken,
  fetchRoutesFromServer,
  getAdjustedDifficultyForTwisty,
  handleUnauthorized,
}) {
  const isPlacesApiReady =
    isMapLoaded &&
    !mapLoadError &&
    typeof window !== "undefined" &&
    Boolean(window.google?.maps?.places);

  const resolveSuggestionToPoint = (suggestion) =>
    new Promise((resolve) => {
      if (!window.google?.maps?.places) {
        resolve(null);
        return;
      }
      const placeId = suggestion?.place_id;
      if (!placeId) {
        resolve(null);
        return;
      }
      const fallbackLabel = suggestion?.description || "";
      const onGeoFallback = () => {
        if (!window.google?.maps?.Geocoder) {
          resolve(null);
          return;
        }
        new window.google.maps.Geocoder().geocode(
          { placeId },
          (results, status) => {
            if (status === "OK" && results?.[0]?.geometry?.location) {
              const l = results[0].geometry.location;
              resolve({
                point: { lat: l.lat(), lng: l.lng() },
                label: fallbackLabel,
              });
            } else {
              resolve(null);
            }
          },
        );
      };
      try {
        const svc = new window.google.maps.places.PlacesService(
          document.createElement("div"),
        );
        svc.getDetails(
          { placeId, fields: ["geometry", "name", "formatted_address"] },
          (place, status) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              place?.geometry?.location
            ) {
              const l = place.geometry.location;
              resolve({
                point: { lat: l.lat(), lng: l.lng() },
                label: place.formatted_address || place.name || fallbackLabel,
              });
            } else {
              onGeoFallback();
            }
          },
        );
      } catch {
        onGeoFallback();
      }
    });

  const applySuggestion = async (target, suggestion) => {
    const label = suggestion?.description || "";
    if (target === "from") {
      setNewOriginLabel(label);
      setOriginSuggestions([]);
    } else {
      setNewDestinationLabel(label);
      setDestinationSuggestions([]);
    }
    setActiveSuggestionField(null);
    const resolved = await resolveSuggestionToPoint(suggestion);
    if (!resolved?.point) return;
    if (target === "from") {
      setNewOriginLatLng(resolved.point);
      setNewOriginLabel(label || resolved.label);
    } else {
      setNewDestinationLatLng(resolved.point);
      setNewDestinationLabel(label || resolved.label);
    }
    setNewRouteLocationError("");
  };

  const openMapPicker = (target) => {
    setActiveMapPickField(target);
    const existing = target === "from" ? newOriginLatLng : newDestinationLatLng;
    const labelText = (
      target === "from" ? newOriginLabel : newDestinationLabel
    ).trim();
    const nextId = mapPickRequestIdRef.current + 1;
    mapPickRequestIdRef.current = nextId;
    if (isValidMapPoint(existing)) {
      setMapPickCenter(existing);
      setMapPickStatus("");
      return;
    }
    setMapPickCenter(ISRAEL_DEFAULT_CENTER);
    if (
      !labelText ||
      !isMapLoaded ||
      mapLoadError ||
      !window.google?.maps?.Geocoder
    ) {
      setMapPickStatus("");
      return;
    }
    setMapPickStatus("מחפש מיקום...");
    new window.google.maps.Geocoder().geocode(
      { address: labelText },
      (results, status) => {
        if (mapPickRequestIdRef.current !== nextId) return;
        if (status === "OK" && results?.[0]?.geometry?.location) {
          const l = results[0].geometry.location;
          setMapPickCenter({ lat: l.lat(), lng: l.lng() });
          setMapPickStatus("");
        } else {
          setMapPickCenter(ISRAEL_DEFAULT_CENTER);
          setMapPickStatus("לא נמצא מיקום — בחר ידנית");
        }
      },
    );
  };

  const closeMapPicker = () => {
    mapPickRequestIdRef.current += 1;
    setMapPickStatus("");
    setActiveMapPickField(null);
  };

  const handleSubmit = async () => {
    const title = newRouteTitle.trim();
    const from = newOriginLabel.trim();
    const to = newDestinationLabel.trim();
    if (!title || !from || !to) {
      setNewRouteLocationError("יש למלא שם, מוצא ויעד");
      return;
    }
    if (!authToken) {
      setNewRouteLocationError("נדרש אימות משתמש לשמירה בשרת");
      return;
    }
    if (!newOriginLatLng || !newDestinationLatLng) {
      setNewRouteLocationError("לשמירה בשרת יש לבחור מוצא ויעד במפה");
      return;
    }
    setNewRouteLocationError("");
    try {
      await apiClient.post(
        "/routes",
        {
          title,
          start: {
            lat: newOriginLatLng.lat,
            lng: newOriginLatLng.lng,
            label: from,
          },
          end: {
            lat: newDestinationLatLng.lat,
            lng: newDestinationLatLng.lng,
            label: to,
          },
          routeType: newRouteType,
          difficulty: newRouteIsTwisty
            ? getAdjustedDifficultyForTwisty(newRouteDifficulty)
            : newRouteDifficulty,
          isTwisty: newRouteIsTwisty,
        },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      await fetchRoutesFromServer(authToken);
      /* clear form */
      setNewRouteTitle("");
      setNewOriginLabel("");
      setNewOriginLatLng(null);
      setNewDestinationLabel("");
      setNewDestinationLatLng(null);
      setNewRouteType("עירוני");
      setNewRouteDifficulty("בינוני");
      setNewRouteIsTwisty(false);
      setOriginSuggestions([]);
      setDestinationSuggestions([]);
      setActiveSuggestionField(null);
      closeMapPicker();
      onClose();
    } catch (error) {
      if (error?.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.error("Failed to create route", error);
      setNewRouteLocationError("שמירת מסלול נכשלה");
    }
  };

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-inner px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00FFA3]/50 transition-all";

  return (
    <ModalBackdrop
      onClose={onClose}
      className="bg-[#0b1120]/90 backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] custom-scrollbar"
    >
      <div className="p-6 space-y-6">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-black text-white tracking-tight drop-shadow-md flex items-center gap-2">
              <Plus className="w-6 h-6 text-[#00FFA3]" strokeWidth={3} />
              הוסף מסלול
            </p>
            <p className="mt-1 text-xs text-slate-400 font-semibold">
              צור נתיב חדש ושמור אותו באוסף שלך
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/5 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition backdrop-blur-md"
          >
            ✕
          </button>
        </div>

        {/* route title */}
        <input
          type="text"
          value={newRouteTitle}
          onChange={(e) => setNewRouteTitle(e.target.value)}
          placeholder="שם מסלול"
          className={inputCls}
        />

        {/* origin / destination cards */}
        <div className="space-y-3">
          {/* Origin */}
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-xl shadow-sm space-y-2 relative z-10">
            <label className="text-[10px] uppercase tracking-wider font-bold text-[#00FFA3]">
              מוצא
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newOriginLabel}
                  onFocus={() => setActiveSuggestionField("from")}
                  onChange={(e) => {
                    setNewOriginLabel(e.target.value);
                    setActiveSuggestionField("from");
                  }}
                  placeholder="חפש מוצא..."
                  className={inputCls}
                />
                {isPlacesApiReady &&
                  activeSuggestionField === "from" &&
                  originSuggestions.length > 0 && (
                    <div className="absolute right-0 top-full z-100 mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a] shadow-2xl">
                      {originSuggestions.slice(0, 5).map((s) => (
                        <button
                          key={s.place_id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applySuggestion("from", s)}
                          className="block w-full border-b border-white/5 px-4 py-3 text-right text-sm text-slate-300 hover:text-white transition hover:bg-white/10 last:border-b-0"
                        >
                          {s.description}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
              <button
                type="button"
                onClick={() => openMapPicker("from")}
                className="flex items-center justify-center shrink-0 rounded-xl bg-white/5 border border-white/10 aspect-square w-12 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <MapPin size={20} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Destination */}
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-xl shadow-sm space-y-2 relative">
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              יעד
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newDestinationLabel}
                  onFocus={() => setActiveSuggestionField("to")}
                  onChange={(e) => {
                    setNewDestinationLabel(e.target.value);
                    setActiveSuggestionField("to");
                  }}
                  placeholder="חפש יעד..."
                  className={inputCls}
                />
                {isPlacesApiReady &&
                  activeSuggestionField === "to" &&
                  destinationSuggestions.length > 0 && (
                    <div className="absolute right-0 top-full z-100 mt-2 w-full rounded-xl border border-white/10 bg-[#0f172a] shadow-2xl">
                      {destinationSuggestions.slice(0, 5).map((s) => (
                        <button
                          key={s.place_id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applySuggestion("to", s)}
                          className="block w-full border-b border-white/5 px-4 py-3 text-right text-sm text-slate-300 hover:text-white transition hover:bg-white/10 last:border-b-0"
                        >
                          {s.description}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
              <button
                type="button"
                onClick={() => openMapPicker("to")}
                className="flex items-center justify-center shrink-0 rounded-xl bg-white/5 border border-white/10 aspect-square w-12 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <MapPin size={20} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* inline map picker */}
        {activeMapPickField && mapApiKey?.trim() && (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase font-bold text-[#00FFA3]">
                בחירת {activeMapPickField === "from" ? "מוצא" : "יעד"} במפה
              </p>
              <button
                type="button"
                onClick={closeMapPicker}
                className="text-xs text-slate-400 hover:text-white transition font-medium"
              >
                סגור מפה
              </button>
            </div>
            {isMapLoaded && !mapLoadError ? (
              <div className="h-64 overflow-hidden rounded-xl border border-white/10 shadow-inner relative">
                <div
                  className="pointer-events-none absolute inset-0 z-10"
                  style={{
                    background:
                      "radial-gradient(circle at center, transparent 30%, rgba(11,17,32,0.8) 120%)",
                  }}
                />
                <GoogleMap
                  center={mapPickCenter}
                  zoom={11}
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  onLoad={() => {}}
                  onClick={(event) => {
                    const lat = event.latLng?.lat();
                    const lng = event.latLng?.lng();
                    if (typeof lat !== "number" || typeof lng !== "number")
                      return;
                    const point = { lat, lng };
                    if (activeMapPickField === "from") {
                      setNewOriginLatLng(point);
                      setNewOriginLabel("נקודה נבחרה");
                    } else {
                      setNewDestinationLatLng(point);
                      setNewDestinationLabel("נקודה נבחרה");
                    }
                    setNewRouteLocationError("");
                  }}
                  options={{
                    styles: DARK_MAP_STYLE,
                    disableDefaultUI: true,
                    zoomControl: true,
                    gestureHandling: "greedy",
                  }}
                >
                  {newOriginLatLng && (
                    <MarkerF position={newOriginLatLng} title="מוצא" />
                  )}
                  {newDestinationLatLng && (
                    <MarkerF position={newDestinationLatLng} title="יעד" />
                  )}
                </GoogleMap>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-5">
                {mapLoadError ? "שגיאה בטעינת מפה" : "טוען מפה..."}
              </p>
            )}
            {mapPickStatus && (
              <p className="text-[11px] font-semibold text-amber-300 text-center">
                {mapPickStatus}
              </p>
            )}
          </div>
        )}

        {/* type + difficulty + twisty */}
        <div className="grid grid-cols-3 gap-3 pt-2 h-[88px]">
          <div className="flex flex-col gap-1.5 h-full relative z-50">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
              סוג
            </span>
            <CustomSelect
              value={newRouteType}
              onChange={setNewRouteType}
              options={["עירוני", "בין־עירוני", "שטח", "נוף"]}
              className="flex-1"
              direction="up"
            />
          </div>
          <div className="flex flex-col gap-1.5 h-full relative z-40">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
              קושי
            </span>
            <CustomSelect
              value={newRouteDifficulty}
              onChange={setNewRouteDifficulty}
              options={["קל", "בינוני", "קשה"]}
              className="flex-1"
              direction="up"
            />
          </div>
          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 py-3 cursor-pointer hover:bg-white/10 transition group mt-[22px] z-10">
            <input
              type="checkbox"
              checked={newRouteIsTwisty}
              onChange={(e) => {
                const v = e.target.checked;
                setNewRouteIsTwisty(v);
                if (v)
                  setNewRouteDifficulty(
                    getAdjustedDifficultyForTwisty(newRouteDifficulty),
                  );
              }}
              className="h-5 w-5 rounded border-none bg-black/50 text-[#00FFA3] focus:ring-0 cursor-pointer"
            />
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 group-hover:text-white transition">
              מפותל <Infinity size={14} strokeWidth={2.5} />
            </span>
          </label>
        </div>

        {newRouteLocationError && (
          <p className="text-xs font-semibold text-rose-400 text-center mt-2">
            {newRouteLocationError}
          </p>
        )}

        {/* submit */}
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 bg-gradient-to-r from-emerald-500 to-teal-400 mt-4"
          style={{
            color: "#020617",
            boxShadow:
              "0 0 20px rgba(16,185,129,0.3), inset 0 2px 4px rgba(255,255,255,0.4)",
          }}
        >
          שמור מסלול חדש
        </button>
      </div>
    </ModalBackdrop>
  );
}

/* ─── ActivityPage ───────────────────────────────────────────────── */

/**
 * דף פעילות ראשי: כותרת + גיליון תחתון עם טאבים (היסטוריה / מסלולים שמורים).
 */
export default function ActivityPage({
  /* ride */
  isRideActive,
  isRideMinimized,
  setIsRideActive,
  setIsRidePaused,
  setIsRideMinimized,
  setDidStartFromRoute,
  onNavigate,
  /* map */
  mapApiKey,
  isMapLoaded,
  mapLoadError,
  /* routes */
  routes,
  selectedRoute,
  setSelectedRoute,
  isRoutesLoading,
  routesLoadError,
  routesSearchQuery,
  setRoutesSearchQuery,
  selectedRoutesFilter,
  setSelectedRoutesFilter,
  isRoutesFilterMenuOpen,
  setIsRoutesFilterMenuOpen,
  routesFilterOptions,
  getRouteLengthCategory,
  getAdjustedDifficultyForTwisty,
  getRoutePolylinePath,
  isValidMapPoint,
  getSafePolylinePath,
  fetchRoutesFromServer,
  authToken,
  apiClient,
  /* new-route form */
  newRouteTitle,
  setNewRouteTitle,
  newOriginLabel,
  setNewOriginLabel,
  newOriginLatLng,
  setNewOriginLatLng,
  newDestinationLabel,
  setNewDestinationLabel,
  newDestinationLatLng,
  setNewDestinationLatLng,
  newRouteType,
  setNewRouteType,
  newRouteDifficulty,
  setNewRouteDifficulty,
  newRouteIsTwisty,
  setNewRouteIsTwisty,
  isAddRouteExpanded,
  setIsAddRouteExpanded,
  activeMapPickField,
  setActiveMapPickField,
  mapPickCenter,
  setMapPickCenter,
  mapPickStatus,
  setMapPickStatus,
  mapPickRequestIdRef,
  originSuggestions,
  setOriginSuggestions,
  destinationSuggestions,
  setDestinationSuggestions,
  activeSuggestionField,
  setActiveSuggestionField,
  newRouteLocationError,
  setNewRouteLocationError,
  isPlacesSuggestionsReady,
  handleUnauthorized,
  /* history */
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
  fetchHistoryFromServer,
  /* community route open */
  currentUserId = "",
  communityPendingRoute = null,
  onCommunityRouteClear,
  onNavigateToCommunity = null,
}) {
  /* local tab state — default to history */
  const [activeTab, setActiveTab] = useState("history");
  /* route detail modal */
  const [modalRoute, setModalRoute] = useState(null);
  /* source of modal open — "activity" OR "community" */
  const [modalSource, setModalSource] = useState("activity");
  /* history detail modal */
  const [modalRide, setModalRide] = useState(null);
  /* add-route modal */
  const [showAddRoute, setShowAddRoute] = useState(false);

  /* open community route when parent provides one */
  useEffect(() => {
    if (communityPendingRoute) {
      setModalRoute(communityPendingRoute);
      setModalSource("community");
      onCommunityRouteClear?.();
    }
  }, [communityPendingRoute]);

  /* computed stats */
  const totalKm = historyRides.reduce((s, r) => s + (r.rawKm || 0), 0);
  const totalRoutes = routes.length;

  /* filtered rides */
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleRides = historyRides.filter((r) =>
    r.title.toLowerCase().includes(normalizedSearch),
  );

  /* filtered routes */
  const normalizedRouteSearch = routesSearchQuery.trim().toLowerCase();
  const visibleRoutes = routes.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(normalizedRouteSearch);
    const matchesFilter =
      selectedRoutesFilter === "הכל" ||
      getRouteLengthCategory(r.distanceKm) === selectedRoutesFilter;
    return matchesSearch && matchesFilter;
  });

  const openRide = (ride) => {
    setModalRide(ride);
  };

  const openRoute = (route) => {
    setSelectedRoute(route);
    setModalRoute(route);
    setModalSource("activity");
  };

  return (
    <div className="relative min-h-screen bg-transparent" dir="rtl">
      {/* ── Active-Ride Banner ── */}
      {isRideActive && !isRideMinimized && (
        <div className="mx-4 mt-4 flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-900/20 px-4 py-3">
          <span className="text-sm text-emerald-200">יש רכיבה פעילה</span>
          <button
            type="button"
            onClick={() => onNavigate("ride")}
            className="text-xs text-emerald-300 underline underline-offset-2"
          >
            חזור לרכיבה
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TOP SECTION — Stats & Actions
      ══════════════════════════════════════════════ */}
      <div className="flex-1 px-4 relative z-10 pt-6">
        {/* page title visible only here */}
        <h1 className="text-3xl font-bold text-white mb-5 drop-shadow-md">
          פעילות רכיבה
        </h1>

        {/* Glassmorphic Stats Container */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-around text-center">
            <div className="flex flex-col items-center">
              <MapIcon className="w-6 h-6 mb-2 text-slate-400 opacity-80" />
              <p className="text-3xl font-black leading-none text-white">
                {totalRoutes}
              </p>
              <p className="mt-1.5 text-[11px] font-medium tracking-wide text-slate-400">
                מסלולים
              </p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="mb-1.5 text-xl opacity-80">📏</span>
              <p className="text-3xl font-black leading-none text-white">
                {parseFloat(totalKm.toFixed(0))}
              </p>
              <p className="mt-1.5 text-[11px] font-medium tracking-wide text-slate-400">
                סה״כ ק״מ
              </p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="flex flex-col items-center">
              <Bike className="w-6 h-6 mb-2 text-slate-400 opacity-80" />
              <p className="text-3xl font-black leading-none text-white">
                {historyRides.length}
              </p>
              <p className="mt-1.5 text-[11px] font-medium tracking-wide text-slate-400">
                רכיבות
              </p>
            </div>
          </div>
        </div>

        {/* Glowing Premium 'Add Route' Button */}
        <div className="mt-6 flex justify-center pb-8">
          <button
            type="button"
            onClick={() => setShowAddRoute(true)}
            className="group relative flex w-full max-w-[280px] items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] hover:shadow-emerald-500/40 active:scale-95"
          >
            <span className="text-lg leading-none drop-shadow-sm">＋</span>
            <span>מסלול חדש</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          BOTTOM SHEET — raised card
      ══════════════════════════════════════════════ */}
      <div className="relative -mt-8 rounded-t-3xl bg-transparent border-t border-white/10 min-h-[60vh] pb-32">
        {/* drag handle */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20" />

        {/* iOS-Style Segmented Tab Toggle */}
        <div className="mx-4 mt-5 flex rounded-full bg-black/40 p-1 backdrop-blur-md border border-white/5">
          {[
            { key: "history", label: "היסטוריה" },
            { key: "routes", label: "מסלולים שמורים" },
          ].map(({ key, label }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={[
                  "flex-1 rounded-full py-2.5 text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "bg-white/10 text-white shadow-lg border border-white/10"
                    : "text-slate-500 hover:text-slate-300",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ── History list ── */}
        {activeTab === "history" && (
          <div className="px-4 mt-6 space-y-3">
            {/* search bar */}
            <div className="relative mb-4">
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                🔎
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש רכיבה..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pe-3 ps-10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 backdrop-blur-md transition"
              />
            </div>

            {/* empty state */}
            {visibleRides.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center opacity-80">
                <div className="mb-4 flex justify-center">
                  <Bike className="w-12 h-12 text-slate-500 opacity-50" />
                </div>
                <p className="text-slate-400 text-sm font-medium">
                  אין רכיבות להצגה
                </p>
              </div>
            )}

            {/* ride cards */}
            {visibleRides.map((ride) => (
              <button
                key={ride.id}
                type="button"
                onClick={() => openRide(ride)}
                className="w-full text-right"
              >
                <div className="flex items-center gap-3.5 rounded-2xl border border-white/5 bg-white/5 p-3 hover:border-white/10 hover:bg-white/10 backdrop-blur-sm transition-all shadow-sm">
                  {/* thumbnail */}
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-slate-700 to-emerald-900/40 ring-1 ring-white/10">
                    {ride.imageUrl ? (
                      <img
                        src={imgSrc(ride.imageUrl)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-600 text-xs">
                        מפה
                      </div>
                    )}
                  </div>
                  {/* info */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="truncate font-semibold text-slate-100 text-sm">
                      {ride.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{ride.date}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium text-emerald-300">
                      <span className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        <Timer className="w-3.5 h-3.5 text-emerald-400" />{" "}
                        {ride.duration}
                      </span>
                      <span className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />{" "}
                        {ride.distance}
                      </span>
                    </div>
                  </div>
                  <span className="text-slate-500 ml-1">›</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Routes list ── */}
        {activeTab === "routes" && (
          <div className="px-4 mt-6 space-y-3">
            {/* search bar */}
            <div className="relative mb-4">
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                🔎
              </span>
              <input
                type="search"
                value={routesSearchQuery}
                onChange={(e) => setRoutesSearchQuery(e.target.value)}
                placeholder="חפש מסלול שמור..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pe-3 ps-10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 backdrop-blur-md transition"
              />
            </div>

            {isRoutesLoading && (
              <p className="text-center text-xs text-slate-400 py-6">
                טוען מסלולים...
              </p>
            )}
            {routesLoadError && !isRoutesLoading && (
              <p className="text-center text-xs text-rose-300 py-6">
                {routesLoadError}
              </p>
            )}

            {/* empty state */}
            {!isRoutesLoading && visibleRoutes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center opacity-80">
                <div className="mb-4 flex justify-center">
                  <MapIcon className="w-12 h-12 text-slate-500 opacity-50" />
                </div>
                <p className="text-slate-400 text-sm font-medium">
                  אין מסלולים שמורים
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddRoute(true)}
                  className="flex items-center gap-2 mt-5 rounded-full border border-emerald-400/50 px-5 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10 transition"
                >
                  <Plus className="w-4 h-4" /> הוסף מסלול ראשון
                </button>
              </div>
            )}

            {/* route cards */}
            {visibleRoutes.map((route) => (
              <button
                key={route._id}
                type="button"
                onClick={() => openRoute(route)}
                className="w-full text-right"
              >
                <div className="flex items-center gap-3.5 rounded-2xl border border-white/5 bg-white/5 p-3 hover:border-white/10 hover:bg-white/10 backdrop-blur-sm transition-all shadow-sm">
                  {/* thumbnail placeholder */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 text-xl">
                    <MapIcon className="w-7 h-7 text-emerald-400 opacity-60" />
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="truncate font-semibold text-slate-100 text-sm">
                      {route.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 truncate">
                      {route.originLabel?.split(",")[0] || "מוצא לא ידוע"} ➝{" "}
                      {route.destinationLabel?.split(",")[0] || "יעד לא ידוע"}
                    </p>
                  </div>
                  <span className="text-slate-500 ml-1">›</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}

      {modalRide && (
        <HistoryDetailModal
          ride={modalRide}
          onClose={() => setModalRide(null)}
          apiClient={apiClient}
          fetchHistoryFromServer={fetchHistoryFromServer}
          fetchRoutesFromServer={fetchRoutesFromServer}
          isMapLoaded={isMapLoaded}
          mapLoadError={mapLoadError}
          mapApiKey={mapApiKey}
        />
      )}

      {modalRoute && (
        <RouteDetailModal
          route={modalRoute}
          onClose={() => {
            setModalRoute(null);
            setSelectedRoute(null);
            setModalSource("activity");
          }}
          onStartRide={() => {
            setModalRoute(null);
          }}
          isMapLoaded={isMapLoaded}
          mapLoadError={mapLoadError}
          mapApiKey={mapApiKey}
          isValidMapPoint={isValidMapPoint}
          getSafePolylinePath={getSafePolylinePath}
          getRoutePolylinePath={getRoutePolylinePath}
          setIsRideActive={setIsRideActive}
          setIsRidePaused={setIsRidePaused}
          setIsRideMinimized={setIsRideMinimized}
          onNavigate={onNavigate}
          apiClient={apiClient}
          authToken={authToken}
          fetchRoutesFromServer={fetchRoutesFromServer}
          source={modalSource}
          currentUserId={currentUserId}
          onNavigateToCommunity={onNavigateToCommunity}
        />
      )}

      {showAddRoute && (
        <AddRouteModal
          onClose={() => setShowAddRoute(false)}
          newRouteTitle={newRouteTitle}
          setNewRouteTitle={setNewRouteTitle}
          newOriginLabel={newOriginLabel}
          setNewOriginLabel={setNewOriginLabel}
          newOriginLatLng={newOriginLatLng}
          setNewOriginLatLng={setNewOriginLatLng}
          newDestinationLabel={newDestinationLabel}
          setNewDestinationLabel={setNewDestinationLabel}
          newDestinationLatLng={newDestinationLatLng}
          setNewDestinationLatLng={setNewDestinationLatLng}
          newRouteType={newRouteType}
          setNewRouteType={setNewRouteType}
          newRouteDifficulty={newRouteDifficulty}
          setNewRouteDifficulty={setNewRouteDifficulty}
          newRouteIsTwisty={newRouteIsTwisty}
          setNewRouteIsTwisty={setNewRouteIsTwisty}
          activeMapPickField={activeMapPickField}
          setActiveMapPickField={setActiveMapPickField}
          mapPickCenter={mapPickCenter}
          setMapPickCenter={setMapPickCenter}
          mapPickStatus={mapPickStatus}
          setMapPickStatus={setMapPickStatus}
          mapPickRequestIdRef={mapPickRequestIdRef}
          isMapLoaded={isMapLoaded}
          mapLoadError={mapLoadError}
          mapApiKey={mapApiKey}
          isValidMapPoint={isValidMapPoint}
          originSuggestions={originSuggestions}
          setOriginSuggestions={setOriginSuggestions}
          destinationSuggestions={destinationSuggestions}
          setDestinationSuggestions={setDestinationSuggestions}
          activeSuggestionField={activeSuggestionField}
          setActiveSuggestionField={setActiveSuggestionField}
          newRouteLocationError={newRouteLocationError}
          setNewRouteLocationError={setNewRouteLocationError}
          isPlacesSuggestionsReady={isPlacesSuggestionsReady}
          apiClient={apiClient}
          authToken={authToken}
          fetchRoutesFromServer={fetchRoutesFromServer}
          getAdjustedDifficultyForTwisty={getAdjustedDifficultyForTwisty}
          handleUnauthorized={handleUnauthorized}
        />
      )}
    </div>
  );
}
