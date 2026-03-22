/**
 * RideActiveCockpit — ה-HUD הפעיל במהלך רכיבה.
 *
 * Automotive premium dark-mode dashboard.
 * Strictly NO emojis. All icons from lucide-react.
 *
 * Props (same contract as the old RideActiveHud):
 *  - rideElapsedSeconds  {number}
 *  - isRidePaused        {boolean}
 *  - setIsRidePaused     {Function}
 *  - selectedRoute       {Object|null}
 *  - onMinimize          {Function}
 *  - onFinish            {Function}
 *  - isMapLoaded         {boolean}
 *  - mapLoadError        {Error|null}
 *  - stopError           {string}
 *  - onCapturePhoto      {Function}
 *  - totalDistanceKm     {number}
 *  - currentSpeedKmh     {number}
 *  - maxSpeedKmh         {number}
 *  - gpsAccuracyPct      {number|null}
 */

import { useState, useEffect, useMemo } from "react";
import { GoogleMap, MarkerF, PolylineF } from "@react-google-maps/api";
import {
  Navigation,
  Pause,
  Play,
  Flag,
  Map,
  Maximize2,
  Route,
  Gauge,
  Timer,
  TrendingUp,
  ExternalLink,
  ChevronDown,
  Plus,
  Minus,
  Compass,
  Maximize,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudSun,
  Loader2,
} from "lucide-react";
import {
  ISRAEL_DEFAULT_CENTER,
  ISRAEL_DEFAULT_ZOOM,
} from "../app/state/useAppState";

/* ─── Design tokens ─── */
const NEON = "#00FFA3";
const NEON_DIM = "rgba(0,255,163,0.15)";

/* ══════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════ */

function padTwo(n) {
  return String(n).padStart(2, "0");
}

function formatElapsed(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${padTwo(h)}:${padTwo(m)}:${padTwo(s)}`;
}

function formatMinutes(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return h > 0 ? `${padTwo(h)}:${padTwo(m)} h` : `${padTwo(m)} m`;
}

const getWeatherIcon = (condition) => {
  switch (condition?.toLowerCase()) {
    case "clear":
      return Sun;
    case "clouds":
      return Cloud;
    case "rain":
    case "drizzle":
      return CloudRain;
    case "thunderstorm":
      return CloudLightning;
    case "snow":
      return CloudSnow;
    default:
      return CloudSun;
  }
};

function LiveWeatherChip({ weather }) {
  const WeatherIcon = getWeatherIcon(weather?.condition);
  const iconColor =
    weather?.condition?.toLowerCase() === "clear"
      ? "text-amber-400"
      : weather?.condition?.toLowerCase() === "rain"
        ? "text-blue-400"
        : "text-slate-400";

  return (
    <div
      className="flex items-center gap-1.5 rounded-sm border border-white/10 px-2.5 py-1.5 backdrop-blur-md shadow-sm"
      style={{ background: "rgba(13, 17, 23, 0.7)" }}
    >
      {weather?.isLoading && !weather?.error ? (
        <Loader2
          size={13}
          className="text-slate-400 animate-spin"
          strokeWidth={1.5}
        />
      ) : (
        <WeatherIcon
          size={13}
          className={weather?.error ? "text-slate-500" : iconColor}
          strokeWidth={1.5}
        />
      )}
      <span
        className="text-[11px] font-bold tracking-widest text-white/90 uppercase"
        dir="ltr"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {weather?.isLoading || weather?.error || weather?.temp === null
          ? "--°C"
          : `${weather.temp}°C`}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════
   1. TOP STATUS BAR
   ══════════════════════════════════════════════ */

function StatusBar({
  rideElapsedSeconds,
  gpsAccuracyPct,
  onMinimize,
  weather,
}) {
  return (
    <div className="flex w-full items-start justify-between px-3 pt-2.5 pb-0 sm:px-6 sm:pt-4">
      {/* Right side in RTL (GPS + Weather) */}
      <div className="flex flex-col gap-2 items-end">
        <div
          className="flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5"
          style={{
            borderColor: "#1e293b",
            background: "rgba(13, 17, 23, 0.7)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Navigation
            size={12}
            strokeWidth={2}
            style={{ color: gpsAccuracyPct !== null ? NEON : "#475569" }}
          />
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: gpsAccuracyPct !== null ? NEON : "#475569" }}
          >
            {gpsAccuracyPct !== null ? `GPS ${gpsAccuracyPct}%` : "GPS --"}
          </span>
        </div>
        {weather && <LiveWeatherChip weather={weather} />}
      </div>

      {/* Status — center */}
      <div className="flex flex-col items-center justify-center pt-1.5">
        <div className="flex items-center gap-2">
          {/* Layered ping pulse — outer ring + solid dot */}
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{
                backgroundColor: NEON,
                animation: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: NEON, boxShadow: `0 0 10px ${NEON}` }}
            />
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: NEON }}
          >
            Ride Active
          </span>
        </div>
      </div>

      {/* Minimize — top right */}
      <button
        type="button"
        onClick={onMinimize}
        className="flex items-center justify-center p-2.5 rounded-xl border border-white/10 bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
        aria-label="מזער"
      >
        <ChevronDown className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   2. SPEEDOMETER RING (SVG arc gauge)
   ══════════════════════════════════════════════ */

const GAUGE_R = 88; // radius of the arc
const GAUGE_CX = 120; // SVG viewBox center-x
const GAUGE_CY = 110; // SVG viewBox center-y
const MAX_SPEED = 200; // max km/h on scale
const START_ANGLE = 210; // degrees (bottom-left)
const END_ANGLE = -30; // degrees (bottom-right) → 240° sweep

function polarToXY(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const s = polarToXY(cx, cy, r, startAngle);
  const e = polarToXY(cx, cy, r, endAngle);
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
}

function Speedometer({ speedKmh, maxSpeedKmh, rideElapsedSeconds }) {
  const SWEEP = 240;

  const fraction = Math.min(speedKmh / MAX_SPEED, 1);
  const speedAngle = START_ANGLE + fraction * SWEEP;

  const filledArc = describeArc(
    GAUGE_CX,
    GAUGE_CY,
    GAUGE_R,
    START_ANGLE,
    speedAngle,
  );
  const bgArc = describeArc(
    GAUGE_CX,
    GAUGE_CY,
    GAUGE_R,
    START_ANGLE,
    START_ANGLE + SWEEP,
  );

  const ticks = [0, 50, 100, 150, 200].map((v) => {
    const a = START_ANGLE + (v / MAX_SPEED) * SWEEP;
    const inner = polarToXY(GAUGE_CX, GAUGE_CY, GAUGE_R - 12, a);
    const outer = polarToXY(GAUGE_CX, GAUGE_CY, GAUGE_R + 2, a);
    const label = polarToXY(GAUGE_CX, GAUGE_CY, GAUGE_R - 24, a);
    return { inner, outer, label, v };
  });

  return (
    <div className="flex w-full flex-col items-center justify-center">
      {/* Integrated Hero Timer */}
      <div className="relative z-10 -mb-6 flex flex-col items-center">
        <span
          className="font-mono font-light tracking-[0.12em] text-white transition-all duration-300 ease-out"
          style={{
            fontVariantNumeric: "tabular-nums",
            textShadow: "0 0 24px rgba(255,255,255,0.25)",
            fontSize: "clamp(1.85rem, 8vw, 3.25rem)",
          }}
        >
          {formatElapsed(rideElapsedSeconds)}
        </span>
      </div>

      {/* Hero Speedometer SVG — responsive size via clamp */}
      <div
        className="relative aspect-240/190 transition-all duration-300 ease-out"
        style={{ width: "clamp(200px, 72vw, 320px)" }}
      >
        <svg
          viewBox="0 0 240 190"
          width="100%"
          height="100%"
          aria-label={`Speed: ${speedKmh} km/h`}
          className="overflow-visible"
        >
          <defs>
            {/* Emerald → teal brand gradient for the speed arc */}
            <linearGradient id="speedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>

            {/* Glow filter — blur + spread for neon halo */}
            <filter id="neonGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite
                in="blur"
                in2="SourceGraphic"
                operator="over"
                result="glow"
              />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Subtle inner premium glow */}
            <filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite
                in2="SourceAlpha"
                operator="arithmetic"
                k2="-1"
                k3="1"
                result="shadowDiff"
              />
              <feFlood floodColor="#ffffff" floodOpacity="0.5" />
              <feComposite in2="shadowDiff" operator="in" />
              <feComposite in2="SourceGraphic" operator="over" />
            </filter>

            {/* Softer ambient halo behind the arc */}
            <filter id="haloGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <path
            d={bgArc}
            fill="none"
            stroke="#131e2d"
            strokeWidth="11"
            strokeLinecap="round"
          />

          {/* Ambient halo layer (wide soft glow behind gradient arc) */}
          {speedKmh > 0 && (
            <path
              d={filledArc}
              fill="none"
              stroke="url(#speedGrad)"
              strokeWidth="15"
              strokeLinecap="round"
              filter="url(#haloGlow)"
              opacity="0.35"
              className="transition-all duration-300 ease-out"
            />
          )}

          {/* Main gradient speed arc */}
          {speedKmh > 0 && (
            <path
              d={filledArc}
              fill="none"
              stroke="url(#speedGrad)"
              strokeWidth="11"
              strokeLinecap="round"
              filter="url(#neonGlow) url(#innerGlow)"
              className="transition-all duration-300 ease-out"
            />
          )}

          {/* Tick marks */}
          {ticks.map(({ inner, outer, label, v }) => (
            <g key={v}>
              <line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="#334155"
                strokeWidth="2"
              />
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8"
                fill="#64748b"
                fontFamily="monospace"
                fontWeight="600"
              >
                {v}
              </text>
            </g>
          ))}

          {/* Center: current speed (tabular-nums) */}
          <text
            x={GAUGE_CX}
            y={GAUGE_CY - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="62"
            fontWeight="700"
            fill="white"
            fontFamily="ui-monospace, monospace"
            className="transition-all duration-300 ease-out"
            style={{
              fontVariantNumeric: "tabular-nums",
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            {speedKmh}
          </text>
          <text
            x={GAUGE_CX}
            y={GAUGE_CY + 36}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="600"
            fill="#64748b"
            fontFamily="ui-sans-serif, system-ui"
            letterSpacing="0.18em"
          >
            KM/H
          </text>

          {/* Max speed label */}
          <text
            x={GAUGE_CX}
            y={GAUGE_CY + 56}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fill="#334155"
            fontFamily="ui-monospace, monospace"
            fontWeight="600"
            className="transition-all duration-300 ease-out"
          >
            MAX {maxSpeedKmh}
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   3. TELEMETRY HUD — 3-column
   ══════════════════════════════════════════════ */

function TelemetryCell({ icon: Icon, value, unit, label }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 px-1.5 py-2.5 sm:gap-1.5 sm:px-2 sm:py-4">
      <Icon
        size={14}
        className="text-emerald-400 opacity-80"
        strokeWidth={1.5}
      />
      <div className="flex items-baseline gap-0.5 mt-1">
        <span
          className="font-mono text-[1.1rem] sm:text-[1.35rem] font-semibold leading-none tracking-tight text-white mb-0.5"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </span>
        {unit ? (
          <span className="text-[10px] font-medium tracking-wide text-slate-400">
            {unit}
          </span>
        ) : null}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </span>
    </div>
  );
}

function TelemetryHUD({
  totalDistanceKm,
  rideElapsedSeconds,
  currentSpeedKmh,
}) {
  const elapsedH = rideElapsedSeconds / 3600;
  const avgSpeed = elapsedH > 0 ? Math.round(totalDistanceKm / elapsedH) : 0;

  return (
    /* Fluid premium glass telemetry style without harsh borders */
    <div
      className="relative mx-3 flex items-stretch justify-between overflow-hidden rounded-[18px] sm:mx-6 sm:rounded-[22px]"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 20px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.2)",
      }}
    >
      <TelemetryCell
        icon={Route}
        value={totalDistanceKm.toFixed(1)}
        unit="km"
        label="מרחק"
      />

      {/* Elegant soft divider */}
      <div className="my-4 w-px self-stretch bg-linear-to-b from-transparent via-white/10 to-transparent" />

      <TelemetryCell
        icon={Timer}
        value={formatMinutes(rideElapsedSeconds)}
        unit=""
        label="זמן"
      />

      {/* Elegant soft divider */}
      <div className="my-4 w-px self-stretch bg-linear-to-b from-transparent via-white/10 to-transparent" />

      <TelemetryCell
        icon={TrendingUp}
        value={avgSpeed}
        unit="kmh"
        label="ממוצע"
      />
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAP CONTROLS — vertical column, right side
   ══════════════════════════════════════════════ */

/* Shared glass button style */
const GLASS_BTN = {
  background: "rgba(0,0,0,0.60)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(100,116,139,0.45)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.55)",
};

function MapCtrlBtn({ onClick, children, isActive, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 active:scale-90"
      style={{
        ...GLASS_BTN,
        borderColor: isActive ? NEON : "rgba(100,116,139,0.45)",
        boxShadow: isActive
          ? `0 0 14px rgba(0,255,163,0.35), 0 2px 8px rgba(0,0,0,0.55)`
          : GLASS_BTN.boxShadow,
      }}
    >
      {children}
    </button>
  );
}

function MapControls({ mapInstance, myLocation, containerClassName }) {
  const [locateActive, setLocateActive] = useState(false);
  const [northActive, setNorthActive] = useState(false);

  const iconColor = (active) => ({ color: active ? NEON : "#cbd5e1" });

  const handleLocate = () => {
    if (!mapInstance || !myLocation) return;
    mapInstance.panTo(myLocation);
    mapInstance.setZoom(16);
    setLocateActive(true);
    setTimeout(() => setLocateActive(false), 1500);
  };

  const handleZoom = (delta) => {
    if (!mapInstance) return;
    mapInstance.setZoom(mapInstance.getZoom() + delta);
  };

  const handleNorth = () => {
    if (!mapInstance) return;
    mapInstance.setHeading(0);
    setNorthActive(true);
    setTimeout(() => setNorthActive(false), 1500);
  };

  return (
    <div
      className={
        containerClassName ||
        "absolute right-3 bottom-4 z-10 flex flex-col items-center gap-1.5 pointer-events-auto"
      }
    >
      {/* 1 — Zoom pill (Plus + separator + Minus) */}
      <div
        className="flex flex-col items-center overflow-hidden rounded-full"
        style={GLASS_BTN}
      >
        <button
          type="button"
          aria-label="הגדל מפה"
          onClick={() => handleZoom(1)}
          className="flex h-9 w-9 items-center justify-center transition-colors active:scale-90 hover:bg-white/10"
        >
          <Plus size={14} strokeWidth={2} className="text-slate-200" />
        </button>
        <div
          className="h-px w-5"
          style={{ background: "rgba(100,116,139,0.45)" }}
        />
        <button
          type="button"
          aria-label="הקטן מפה"
          onClick={() => handleZoom(-1)}
          className="flex h-9 w-9 items-center justify-center transition-colors active:scale-90 hover:bg-white/10"
        >
          <Minus size={14} strokeWidth={2} className="text-slate-200" />
        </button>
      </div>

      {/* 3 — Compass / Reset north */}
      <MapCtrlBtn onClick={handleNorth} isActive={northActive} ariaLabel="צפון">
        <Compass size={13} strokeWidth={2} style={iconColor(northActive)} />
      </MapCtrlBtn>

      {/* 4 — Locate Me */}
      <MapCtrlBtn
        onClick={handleLocate}
        isActive={locateActive}
        ariaLabel="מיקום נוכחי"
      >
        <Navigation size={13} strokeWidth={2} style={iconColor(locateActive)} />
      </MapCtrlBtn>
    </div>
  );
}

/* ══════════════════════════════════════════════
   4. MAP PREVIEW
   ══════════════════════════════════════════════ */

const DARK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#0b1120" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#3a4a5e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1120" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#162133" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#1e3a5f" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#050d18" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

export function MapPreview({
  isMapLoaded,
  mapLoadError,
  selectedRoute,
  recordedPath,
  customContainerClass,
  customContainerStyle,
  innerClassName = "rounded-3xl overflow-hidden border border-white/10 shadow-lg relative w-full h-full",
  controlsContainerClassName,
  children,
}) {
  const [myLocation, setMyLocation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [routePath, setRoutePath] = useState(null);
  const [hasFitRoute, setHasFitRoute] = useState(false);
  const [center, setCenter] = useState(ISRAEL_DEFAULT_CENTER);
  const [zoom, setZoom] = useState(15);

  // Track GPS position
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) =>
        setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Set initial center if map hasn't loaded bounds yet
  useEffect(() => {
    if (myLocation && !mapInstance && !selectedRoute) {
      setCenter(myLocation);
    }
  }, [myLocation, mapInstance, selectedRoute]);

  // Fit route bounds ONCE when map and route load
  useEffect(() => {
    if (!mapInstance || !routePath || routePath.length === 0 || hasFitRoute)
      return;

    const bounds = new window.google.maps.LatLngBounds();
    routePath.forEach((p) => bounds.extend(p));
    if (myLocation) bounds.extend(myLocation);

    // Timeout ensures GoogleMap has finished rendering layout
    setTimeout(() => {
      mapInstance.fitBounds(bounds, {
        top: 40,
        right: 40,
        bottom: 40,
        left: 40,
      });
      setHasFitRoute(true);
    }, 150);
  }, [mapInstance, routePath, myLocation, hasFitRoute]);

  // Pan map to rider ONLY IF we don't have a route to show
  useEffect(() => {
    if (mapInstance && myLocation && (!selectedRoute || !routePath)) {
      mapInstance.panTo(myLocation);
    }
  }, [mapInstance, myLocation, selectedRoute, routePath]);

  // Reset fit bounds trigger if selected route changes
  useEffect(() => {
    setHasFitRoute(false);
  }, [selectedRoute]);

  // Fetch directions for selected route
  useEffect(() => {
    if (!selectedRoute || !isMapLoaded || !window.google) {
      setRoutePath(null);
      return;
    }

    // If the route already has pre-defined points, use them directly instead of calling Directions API.
    if (selectedRoute.points && selectedRoute.points.length > 0) {
      setRoutePath(
        selectedRoute.points.map((p) => ({
          lat: Number(p.lat),
          lng: Number(p.lng),
        })),
      );
      return;
    }

    // Use precise server-provided polyline if available
    if (selectedRoute.polyline && window.google?.maps?.geometry?.encoding) {
      try {
        const decodedPoints = window.google.maps.geometry.encoding.decodePath(
          selectedRoute.polyline,
        );
        setRoutePath(
          decodedPoints.map((p) => ({ lat: p.lat(), lng: p.lng() })),
        );
        return;
      } catch (err) {
        console.warn("Failed to decode route polyline:", err);
      }
    }

    const origin =
      selectedRoute?.origin ||
      selectedRoute?.fromLatLng ||
      selectedRoute?.start;
    const destination =
      selectedRoute?.destination ||
      selectedRoute?.toLatLng ||
      selectedRoute?.end;
    if (!origin?.lat || !destination?.lat) return;

    const svc = new window.google.maps.DirectionsService();
    svc.route(
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
          setRoutePath(
            result.routes[0].overview_path.map((p) => ({
              lat: p.lat(),
              lng: p.lng(),
            })),
          );
        } else {
          setRoutePath([
            { lat: Number(origin.lat), lng: Number(origin.lng) },
            { lat: Number(destination.lat), lng: Number(destination.lng) },
          ]);
        }
      },
    );
  }, [
    isMapLoaded,
    selectedRoute?._id || selectedRoute?.id || selectedRoute?.title,
  ]);

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      gestureHandling: "none",
      clickableIcons: false,
      styles: DARK_MAP_STYLES,
      zoomControl: false,
    }),
    [],
  );

  const polylineOptions = useMemo(
    () => ({
      strokeColor: NEON,
      strokeOpacity: 0.85,
      strokeWeight: 4,
    }),
    [],
  );

  const recordedPathOptions = useMemo(
    () => ({
      strokeColor: "#3b82f6", // Blue color for recorded progress
      strokeOpacity: 0.9,
      strokeWeight: 4,
    }),
    [],
  );

  // Strip extra properties like `t` just in case Google Maps API gets confused
  const safeRecordedPath = useMemo(() => {
    if (!recordedPath || !Array.isArray(recordedPath)) return [];
    return recordedPath.map((p) => ({
      lat: Number(p.lat),
      lng: Number(p.lng),
    }));
  }, [recordedPath]);

  return (
    /*
     * TWO-LAYER fix — outer div: relative, no overflow:hidden (holds MapControls safely)
     *                  inner div: absolute inset-0, overflow-hidden, rounded (clips map tiles)
     */
    <div
      className={customContainerClass || "relative mx-5 flex-1 sm:mx-6"}
      style={customContainerStyle || { minHeight: 130 }}
    >
      {/* ── Inner: map + gradients + badge, rounded & clipped ── */}
      <div
        className={innerClassName}
        style={{
          boxShadow:
            "inset 0 4px 30px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.4)",
          background: "rgba(10,15,30,0.5)",
        }}
      >
        {mapLoadError ? (
          <div className="flex h-full min-h-32.5 items-center justify-center bg-slate-900 text-xs text-slate-500">
            Map unavailable
          </div>
        ) : !isMapLoaded ? (
          <div className="flex h-full min-h-32.5 items-center justify-center bg-slate-900">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-transparent border-t-slate-600" />
          </div>
        ) : (
          <GoogleMap
            center={hasFitRoute ? undefined : center}
            zoom={hasFitRoute ? undefined : zoom}
            mapContainerClassName="h-full w-full"
            options={mapOptions}
            onLoad={setMapInstance}
          >
            {myLocation && (
              <MarkerF
                position={myLocation}
                icon={
                  window.google?.maps?.SymbolPath
                    ? {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 7,
                        fillColor: NEON,
                        fillOpacity: 1,
                        strokeColor: "#001a0e",
                        strokeWeight: 2,
                      }
                    : undefined
                }
              />
            )}
            {routePath && routePath.length > 0 && (
              <PolylineF path={routePath} options={polylineOptions} />
            )}
            {/* Always show recorded progress path if available */}
            {safeRecordedPath && safeRecordedPath.length >= 2 && (
              <PolylineF
                path={safeRecordedPath}
                options={recordedPathOptions}
              />
            )}
          </GoogleMap>
        )}

        {/* Seamless ambient gradient overlay — deepens Map edges to simulate inner glass rim */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "radial-gradient(circle at center, transparent 40%, rgba(5,10,18,0.6) 100%)",
          }}
        />

        {/* Map label badge — bottom left */}
        <div
          className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-sm border px-2 py-1"
          style={{ background: "rgba(7,10,20,0.85)", borderColor: "#1e293b" }}
        >
          <Map size={10} className="text-slate-500" strokeWidth={2} />
          <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            מסלול חי
          </span>
        </div>
      </div>

      {/* Children rendered BEFORE MapControls so MapControls stay on top of gradients */}
      {children}
      {/* ── MapControls: lives in outer wrapper — never clipped ── */}
      <MapControls
        mapInstance={mapInstance}
        myLocation={myLocation}
        containerClassName={controlsContainerClassName}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════
   5. NAVIGATE SHEET (mini popover)
   ══════════════════════════════════════════════ */

function NavigateSheet({ selectedRoute, onClose }) {
  // Navigate to Destination
  const wazeDestUrl = useMemo(() => {
    const dest =
      selectedRoute?.destination ||
      selectedRoute?.toLatLng ||
      selectedRoute?.end;
    return dest?.lat
      ? `https://waze.com/ul?ll=${dest.lat},${dest.lng}&navigate=yes`
      : "https://waze.com/ul";
  }, [selectedRoute]);

  const googleDestUrl = useMemo(() => {
    const dest =
      selectedRoute?.destination ||
      selectedRoute?.toLatLng ||
      selectedRoute?.end;
    return dest?.lat
      ? `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`
      : "https://maps.google.com/";
  }, [selectedRoute]);

  // Navigate to Origin (Start point)
  const wazeOriginUrl = useMemo(() => {
    const origin =
      selectedRoute?.origin ||
      selectedRoute?.fromLatLng ||
      selectedRoute?.start;
    return origin?.lat
      ? `https://waze.com/ul?ll=${origin.lat},${origin.lng}&navigate=yes`
      : "https://waze.com/ul";
  }, [selectedRoute]);

  const googleOriginUrl = useMemo(() => {
    const origin =
      selectedRoute?.origin ||
      selectedRoute?.fromLatLng ||
      selectedRoute?.start;
    return origin?.lat
      ? `https://www.google.com/maps/dir/?api=1&destination=${origin.lat},${origin.lng}`
      : "https://maps.google.com/";
  }, [selectedRoute]);

  // Open General App
  const openApp = (url) => {
    window.open(url, "_blank");
    onClose();
  };

  return (
    <div
      className="absolute inset-x-4 bottom-24 z-10 overflow-hidden rounded-xl border flex flex-col shadow-2xl backdrop-blur-3xl"
      style={{ background: "rgba(13,17,23,0.85)", borderColor: "#1e293b" }}
    >
      {selectedRoute ? (
        <>
          {/* -- Origin Navigation -- */}
          <div
            className="border-b px-4 py-2.5 bg-white/5"
            style={{ borderColor: "#1e293b" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#00FFA3]">
              נווט לנקודת ההתחלה
            </p>
          </div>
          <div
            className="flex divide-x divide-x-reverse"
            style={{ "--tw-divide-opacity": 0.1, borderColor: "#ffffff" }}
          >
            {[
              { label: "Waze", url: wazeOriginUrl },
              { label: "Google", url: googleOriginUrl },
            ].map(({ label, url }) => (
              <button
                key={`origin-${label}`}
                type="button"
                onClick={() => openApp(url)}
                className="flex flex-1 items-center justify-center gap-1.5 px-3 py-3 transition-colors hover:bg-white/5 active:bg-white/10"
              >
                <span className="text-xs font-semibold text-white">
                  {label}
                </span>
                <ExternalLink
                  size={11}
                  className="text-slate-500"
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>

          {/* -- Destination Navigation -- */}
          <div
            className="border-b border-t px-4 py-2.5 bg-white/5 mt-1"
            style={{ borderColor: "#1e293b" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              נווט לנקודת הסיום
            </p>
          </div>
          <div
            className="flex divide-x divide-x-reverse"
            style={{ "--tw-divide-opacity": 0.1, borderColor: "#ffffff" }}
          >
            {[
              { label: "Waze", url: wazeDestUrl },
              { label: "Google", url: googleDestUrl },
            ].map(({ label, url }) => (
              <button
                key={`dest-${label}`}
                type="button"
                onClick={() => openApp(url)}
                className="flex flex-1 items-center justify-center gap-1.5 px-3 py-3 transition-colors hover:bg-white/5 active:bg-white/10"
              >
                <span className="text-xs font-semibold text-slate-300">
                  {label}
                </span>
                <ExternalLink
                  size={11}
                  className="text-slate-500"
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* -- Free Ride Navigation -- */}
          <div
            className="border-b px-4 py-3"
            style={{ borderColor: "#1e293b" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#00FFA3]">
              פתח אפליקציית ניווט
            </p>
          </div>
          <div
            className="flex flex-col divide-y"
            style={{ "--tw-divide-opacity": 1, borderColor: "#1e293b" }}
          >
            {[
              { label: "Waze", url: "https://waze.com/ul" },
              { label: "Google Maps", url: "https://maps.google.com/" },
            ].map(({ label, url }) => (
              <button
                key={label}
                type="button"
                onClick={() => openApp(url)}
                className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-white/5 active:bg-white/10"
              >
                <span className="text-sm font-semibold text-white">
                  {label}
                </span>
                <ExternalLink
                  size={13}
                  className="text-slate-500"
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className="py-2.5 text-xs text-slate-500 font-medium hover:text-white hover:bg-white/5 transition border-t"
        style={{ borderColor: "#1e293b" }}
      >
        סגור
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   5. BOTTOM ACTION BAR
   ══════════════════════════════════════════════ */

function ActionBar({
  isRidePaused,
  setIsRidePaused,
  onFinish,
  stopError,
  selectedRoute,
}) {
  const [showNav, setShowNav] = useState(false);

  return (
    <>
      {/* Navigate sheet */}
      {showNav && (
        <NavigateSheet
          selectedRoute={selectedRoute}
          onClose={() => setShowNav(false)}
        />
      )}

      {stopError && (
        <p
          className="mb-2 px-5 text-center text-xs font-semibold text-rose-400"
          dir="rtl"
        >
          {stopError}
        </p>
      )}

      {/* Floating glass pill — Anti-Gravity premium dock */}
      <div
        className="mx-3 mb-3 flex items-center gap-2 rounded-full border border-white/10 px-2.5 py-2 sm:mx-6 sm:mb-6 sm:gap-2.5 sm:px-3.5 sm:py-3 transition-all duration-300"
        style={{
          background:
            "linear-gradient(180deg, rgba(11,19,43,0.7), rgba(11,19,43,0.9))",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          boxShadow:
            "0 10px 40px rgba(0,0,0,0.6), 0 -1px 0 rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Pause / Resume */}
        <button
          type="button"
          onClick={() => setIsRidePaused((p) => !p)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/5 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10 hover:text-white active:scale-95 sm:gap-2 sm:py-3.5 sm:text-sm"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          {isRidePaused ? (
            <>
              <Play size={15} strokeWidth={2} style={{ color: NEON }} />
              <span>המשך</span>
            </>
          ) : (
            <>
              <Pause size={15} strokeWidth={2} className="text-slate-400" />
              <span>השהה</span>
            </>
          )}
        </button>

        {/* Navigate */}
        <button
          type="button"
          onClick={() => setShowNav((v) => !v)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/5 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10 hover:text-white active:scale-95 sm:gap-2 sm:py-3.5 sm:text-sm"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <Navigation size={15} strokeWidth={2} className="text-slate-400" />
          <span>נווט</span>
        </button>

        {/* Finish Ride — highly dominant premium neon pill */}
        <button
          type="button"
          onClick={onFinish}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 bg-linear-to-r from-emerald-500 to-teal-400 sm:gap-2 sm:py-3.5 sm:text-sm"
          style={{
            color: "#020617",
            boxShadow: `0 0 15px rgba(16,185,129,0.4), inset 0 2px 4px rgba(255,255,255,0.4)`,
          }}
        >
          <Flag size={15} strokeWidth={2.5} />
          סיום
        </button>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════
   ROOT: RideActiveCockpit
   ══════════════════════════════════════════════ */

export default function RideActiveCockpit({
  rideElapsedSeconds,
  isRidePaused,
  setIsRidePaused,
  selectedRoute,
  onMinimize,
  onFinish,
  isMapLoaded,
  mapLoadError,
  stopError,
  onCapturePhoto,
  totalDistanceKm,
  currentSpeedKmh,
  maxSpeedKmh,
  gpsAccuracyPct,
  recordedPath,
}) {
  const [weather, setWeather] = useState({
    temp: null,
    condition: null,
    isLoading: true,
    error: false,
  });

  // Live weather integration via OpenWeatherMap API
  useEffect(() => {
    if (!navigator.geolocation) {
      setWeather((prev) => ({ ...prev, isLoading: false, error: true }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
          if (!apiKey) {
            setWeather({
              temp: 24,
              condition: "clear",
              isLoading: false,
              error: false,
            });
            return;
          }
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&units=metric&appid=${apiKey}`,
          );
          if (!res.ok) throw new Error("Weather fetch failed");
          const data = await res.json();
          const temp = Math.round(data.main.temp);
          const condition = data.weather[0].main;
          setWeather({ temp, condition, isLoading: false, error: false });
        } catch (err) {
          setWeather({
            temp: null,
            condition: null,
            isLoading: false,
            error: true,
          });
        }
      },
      () => {
        setWeather({
          temp: null,
          condition: null,
          isLoading: false,
          error: true,
        });
      },
    );
  }, []);

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-transparent">
      {/* ─── 1. TOP SECTION (StatusBar & Weather) ─── */}
      <div className="flex-none relative w-full z-20">
        <StatusBar
          rideElapsedSeconds={rideElapsedSeconds}
          gpsAccuracyPct={gpsAccuracyPct}
          onMinimize={onMinimize}
          weather={weather}
        />
      </div>

      {/* ─── 2. MAIN DATA HUB (Speedometer + Telemetry) — scrolls if needed ─── */}
      <div className="flex-1 flex flex-col justify-center relative z-10 w-full px-1 overflow-hidden">
        {/* Speedometer */}
        <div className="flex justify-center pt-1 pb-0.5 relative z-10 w-full">
          <Speedometer
            speedKmh={currentSpeedKmh}
            maxSpeedKmh={maxSpeedKmh}
            rideElapsedSeconds={rideElapsedSeconds}
          />
        </div>

        {/* Route chip (if active) */}
        {selectedRoute && (
          <div
            className="mx-3 mb-2 flex items-center gap-2 rounded-md border px-2.5 py-1.5 sm:mx-6 sm:mb-4 sm:gap-3 sm:px-3 sm:py-2"
            style={{ borderColor: "#1e293b", background: "#0d1117" }}
            dir="rtl"
          >
            <div
              className="h-3.5 w-0.5 shrink-0 rounded-full sm:h-4"
              style={{ background: NEON, opacity: 0.7 }}
            />
            <p className="truncate text-xs font-bold text-white">
              {selectedRoute.title}
            </p>
            {(selectedRoute.from || selectedRoute.to) && (
              <p className="truncate text-[10px] text-slate-500">
                {selectedRoute.from} &rarr; {selectedRoute.to}
              </p>
            )}
          </div>
        )}

        {/* Telemetry HUD */}
        <div className="flex-none pb-2 shrink-0 sm:pb-4">
          <TelemetryHUD
            totalDistanceKm={totalDistanceKm}
            rideElapsedSeconds={rideElapsedSeconds}
            currentSpeedKmh={currentSpeedKmh}
          />
        </div>
      </div>

      {/* ─── 3. MAP PREVIEW — fixed small height on mobile, larger on sm+ ─── */}
      <div className="flex-none relative w-full h-44 sm:h-52 px-3 pt-1 pb-0 sm:p-5 sm:pt-2">
        <MapPreview
          isMapLoaded={isMapLoaded}
          mapLoadError={mapLoadError}
          selectedRoute={selectedRoute}
          recordedPath={recordedPath}
          customContainerClass="relative w-full h-full"
          customContainerStyle={{}}
          innerClassName="rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-lg relative w-full h-full"
        />
      </div>

      {/* ─── 4. Bottom Action Bar — sticky bottom ─── */}
      <div className="flex-none sticky bottom-0 z-30">
        <ActionBar
          isRidePaused={isRidePaused}
          setIsRidePaused={setIsRidePaused}
          onFinish={onFinish}
          stopError={stopError}
          selectedRoute={selectedRoute}
        />
      </div>
    </div>
  );
}
