/**
 * RideControlCenter — "Ride Launcher" screen.
 * Premium dark industrial aesthetic. BMW Motorrad / Ducati inspired.
 * Focused entirely on starting a ride. No map. No clutter.
 *
 * Props:
 *  - onStartRide          {Function}
 *  - onSelectRoute        {Function}
 *  - selectedRoute        {Object|null}
 *  - didStartFromRoute    {boolean}
 *  - setDidStartFromRoute {Function}
 *  - startError           {string}
 */

import { useState, useEffect, useCallback } from "react";
import {
    CloudSun,
    CloudRain,
    Sun,
    Map,
    Navigation,
    AlertTriangle,
    MapPin,
    Crosshair,
    Target,
    Loader2,
    Cloud,
    CloudLightning,
    CloudSnow
} from "lucide-react";
import { MapPreview } from "./RideActiveCockpit";

/* ─── Design tokens ─── */
const NEON = "#00FFA3";

/* ══════════════════════════════════════════════
   1.  COCKPIT HEADER
   ══════════════════════════════════════════════ */

const getWeatherIcon = (condition) => {
    switch (condition?.toLowerCase()) {
        case 'clear': return Sun;
        case 'clouds': return Cloud;
        case 'rain':
        case 'drizzle': return CloudRain;
        case 'thunderstorm': return CloudLightning;
        case 'snow': return CloudSnow;
        default: return CloudSun;
    }
};

function CockpitHeader({ gpsState }) {
    const isReady = gpsState === "ready";
    const [weather, setWeather] = useState({ temp: null, condition: null, isLoading: true, error: false });

    // Live weather integration via OpenWeatherMap API
    useEffect(() => {
        if (!navigator.geolocation) {
            setWeather(prev => ({ ...prev, isLoading: false, error: true }));
            return;
        }

        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
                if (!apiKey) {
                    console.warn("VITE_WEATHER_API_KEY missing in .env.");
                    // Graceful fallback if no API key is set
                    setWeather({ temp: 24, condition: "clear", isLoading: false, error: false });
                    return;
                }
                const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&units=metric&appid=${apiKey}`);
                if (!res.ok) throw new Error("Weather fetch failed");
                const data = await res.json();

                const temp = Math.round(data.main.temp);
                const condition = data.weather[0].main; // e.g. 'Clear', 'Clouds'

                setWeather({ temp, condition, isLoading: false, error: false });
            } catch (err) {
                console.error("Weather error:", err);
                setWeather({ temp: null, condition: null, isLoading: false, error: true });
            }
        }, () => {
            // Geolocation permission denied or failed
            setWeather({ temp: null, condition: null, isLoading: false, error: true });
        });
    }, []);

    const WeatherIcon = getWeatherIcon(weather.condition);
    const iconColor = weather.condition?.toLowerCase() === 'clear' ? 'text-amber-400'
        : weather.condition?.toLowerCase() === 'rain' ? 'text-blue-400'
            : 'text-slate-400';

    return (
        <header className="flex w-full items-center justify-between px-6 pb-2 pt-4 mt-0 shrink-0">
            {/* Left — title + minimal GPS status */}
            <div className="flex flex-col items-start gap-0">
                <h1 className="text-[22px] font-black tracking-tight text-white mb-0.5">
                    מוכן לרכיבה
                </h1>

                {/* Refined GPS indicator */}
                <div className="flex items-center gap-2">
                    {/* live dot */}
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${isReady ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-slate-500"}`}
                    />
                    <span
                        className="text-[11px] font-medium tracking-wide text-white/50"
                        dir="rtl"
                    >
                        {isReady ? "GPS פעיל" : gpsState === "checking" ? "GPS מחפש" : "GPS מושבת"}
                    </span>
                </div>
            </div>

            {/* Right — live weather chip */}
            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md shadow-sm transition-all duration-200 hover:bg-white/10">
                {weather.isLoading && !weather.error ? (
                    <Loader2 size={16} className="text-slate-400 animate-spin" strokeWidth={1.5} />
                ) : (
                    <WeatherIcon size={16} className={weather.error ? "text-slate-500" : iconColor} strokeWidth={1.5} />
                )}
                <span className="text-[13px] font-semibold text-white/90" dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {weather.isLoading || weather.error || weather.temp === null ? "--°C" : `${weather.temp}°C`}
                </span>
            </div>
        </header>
    );
}

/* ══════════════════════════════════════════════
   2.  UNIFIED SYSTEM PANEL (STATUS + MODE)
   ══════════════════════════════════════════════ */

function UnifiedSystemPanel({ gpsState, rideSelectedRoute, onFreeride, onSelectRoute }) {
    const isReady = gpsState === "ready";
    const freerideActive = !rideSelectedRoute;
    const routeActive = !!rideSelectedRoute;

    return (
        <div className="relative w-full shrink-0 mt-2 mb-2">
            {/* Background Depth / Suble Glow behind cockpit card */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 blur-3xl rounded-full translate-y-2 scale-105 pointer-events-none" />

            <div className="w-full bg-white/[0.04] border border-white/10 backdrop-blur-xl rounded-[1.25rem] p-4 flex flex-col gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all duration-200" dir="rtl">

                {/* Subtle inner emerald reflection */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-50" />

                {/* Minimal Status Row - Telemetry feeling */}
                <div className="flex w-full items-center justify-between px-2 relative z-10 border-b border-white/[0.04] pb-3">
                    <div className="flex flex-col items-center gap-1 transition-all duration-200">
                        <Crosshair size={18} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" strokeWidth={1.5} />
                        <span className="text-[9px] font-bold text-white/40 tracking-widest uppercase">GPS</span>
                        <div className="flex items-center gap-1.5">
                            {isReady && <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_4px_rgba(52,211,153,0.8)]" />}
                            <span className="text-[11px] font-medium text-white/90">{isReady ? "פעיל" : "מחפש"}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 transition-all duration-200">
                        <Target size={18} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" strokeWidth={1.5} />
                        <span className="text-[9px] font-bold text-white/40 tracking-widest uppercase">TRACKING</span>
                        <span className="text-[11px] font-medium text-white/90">מוכן</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 transition-all duration-200">
                        {rideSelectedRoute ? (
                            <Map size={18} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" strokeWidth={1.5} />
                        ) : (
                            <Navigation size={18} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" strokeWidth={1.5} />
                        )}
                        <span className="text-[9px] font-bold text-white/40 tracking-widest uppercase">MODE</span>
                        <span className="text-[11px] font-medium text-white/90 truncate max-w-[80px]">
                            {rideSelectedRoute ? "מסלול" : "חופשית"}
                        </span>
                    </div>
                </div>

                {/* Segmented Mode Selector */}
                <div className="flex w-full p-1 bg-black/30 rounded-xl border border-white/[0.05] shadow-inner relative z-10">
                    <button
                        type="button"
                        onClick={onFreeride}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 transition-all duration-200 ease-out active:scale-95 ${freerideActive
                            ? "bg-white/10 text-white font-medium shadow-sm border border-white/5"
                            : "bg-transparent text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
                            }`}
                    >
                        <Navigation size={15} strokeWidth={freerideActive ? 2 : 1.5} />
                        <span className="text-[13px] leading-tight">רכיבה חופשית</span>
                    </button>
                    <button
                        type="button"
                        onClick={onSelectRoute}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 transition-all duration-200 ease-out active:scale-95 ${routeActive
                            ? "bg-white/10 text-white font-medium shadow-sm border border-white/5"
                            : "bg-transparent text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
                            }`}
                    >
                        <Map size={15} strokeWidth={routeActive ? 2 : 1.5} />
                        <span className="text-[13px] leading-tight">בחר מסלול</span>
                    </button>
                </div>

                {/* Selected Route Info (if any) */}
                {rideSelectedRoute && (
                    <div className="flex w-full items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 shadow-inner relative z-10 transition-all duration-300">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)] shrink-0">
                            <Map size={14} className="text-emerald-400" />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0 pb-0.5">
                            <p className="truncate text-xs font-medium text-white/90">{rideSelectedRoute.title}</p>
                            {(rideSelectedRoute.from || rideSelectedRoute.to) && (
                                <p className="truncate text-[10px] text-white/50 tracking-wide mt-0.5">
                                    {rideSelectedRoute.from} &rarr; {rideSelectedRoute.to}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════
   3.  START RIDE BUTTON
   ══════════════════════════════════════════════ */

function StartRideButton({ onClick, error }) {
    return (
        <div className="w-full shrink-0 relative z-10">
            {error && (
                <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-400" dir="rtl">
                    <AlertTriangle size={14} />
                    {error}
                </p>
            )}
            <button
                type="button"
                onClick={onClick}
                className="group relative w-full overflow-hidden rounded-[1.25rem] py-4 transition-all duration-200 ease-out hover:scale-105 active:scale-95 bg-gradient-to-r from-emerald-600 to-emerald-400 shrink-0"
                style={{
                    boxShadow: `0 0 20px rgba(16,185,129,0.2), inset 0 1px 0 rgba(255,255,255,0.2)`,
                }}
            >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
                <div className="flex flex-col items-center justify-center relative z-10">
                    <span className="text-[17px] font-bold tracking-[0.1em] text-[#001a0e] group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-200">
                        התחל רכיבה
                    </span>
                </div>
            </button>
        </div>
    );
}

/* ══════════════════════════════════════════════
   4. EXTERNAL NAVIGATION
   ══════════════════════════════════════════════ */

function ExternalNavigation() {
    return (
        <div className="w-full grid grid-cols-2 gap-3 shrink-0 relative z-10" dir="rtl">
            {/* Waze */}
            <button
                onClick={() => window.open("waze://?ll=31.0461,34.8516&navigate=yes", "_blank")}
                className="flex justify-center items-center gap-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 py-3.5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:border-white/20 active:translate-y-0 active:scale-95 group"
            >
                <Navigation size={15} strokeWidth={1.5} className="text-emerald-400 group-hover:drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-200" />
                <span className="text-[13px] text-white/80 font-medium tracking-wide group-hover:text-white transition-colors duration-200">Waze</span>
            </button>

            {/* Google Maps */}
            <button
                onClick={() => window.open("https://maps.google.com/?q=", "_blank")}
                className="flex justify-center items-center gap-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 py-3.5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:border-white/20 active:translate-y-0 active:scale-95 group"
            >
                <MapPin size={15} strokeWidth={1.5} className="text-emerald-400 group-hover:drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-200" />
                <span className="text-[13px] text-white/80 font-medium tracking-wide group-hover:text-white transition-colors duration-200">Google Maps</span>
            </button>
        </div>
    );
}

/* ══════════════════════════════════════════════
   ROOT COMPONENT
   ══════════════════════════════════════════════ */

export default function RideControlCenter({
    onStartRide,
    onSelectRoute,
    selectedRoute,
    didStartFromRoute,
    setDidStartFromRoute,
    startError,
    isMapLoaded,
    mapLoadError
}) {
    const rideSelectedRoute = didStartFromRoute && selectedRoute ? selectedRoute : null;
    const [gpsState, setGpsState] = useState("checking");

    /* Live GPS watch for header status */
    useEffect(() => {
        if (!navigator.geolocation) {
            setGpsState("unavailable");
            return;
        }
        const id = navigator.geolocation.watchPosition(
            () => setGpsState("ready"),
            () => setGpsState("unavailable"),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
        return () => navigator.geolocation.clearWatch(id);
    }, []);

    const handleFreeride = useCallback(() => {
        setDidStartFromRoute(false);
    }, [setDidStartFromRoute]);

    return (
        <div className="flex h-[100dvh] w-full flex-col overflow-hidden relative bg-transparent">
            {/* Base ambient gradient background */}
            <div
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                    background:
                        "radial-gradient(circle at 50% 30%, rgba(16,185,129,0.05) 0%, transparent 60%)",
                }}
            />

            {/* ─── 1. TOP SECTION (Map + Header) ─── */}
            <div className="flex-none relative w-full h-[280px] p-5 pb-0">
                <MapPreview
                    isMapLoaded={isMapLoaded}
                    mapLoadError={mapLoadError}
                    selectedRoute={rideSelectedRoute}
                    customContainerClass="relative w-full h-full"
                    customContainerStyle={{}}
                    innerClassName="rounded-[2rem] overflow-hidden border border-white/10 shadow-lg relative w-full h-full"
                >
                </MapPreview>

                {/* ─── Header overlaid on map ─── */}
                <div className="absolute top-4 inset-x-5 z-20 pointer-events-none">
                    <div className="pointer-events-auto">
                        <CockpitHeader gpsState={gpsState} />
                    </div>
                </div>
            </div>

            {/* ─── FOCUSED RIDE LAUNCHER CONTENT ─── */}
            <div className="relative z-10 flex flex-1 flex-col justify-start pt-6 px-6 max-w-sm mx-auto w-full gap-5 pb-6 mt-1 transition-all duration-300">

                {/* ─── 2. UNIFIED SYSTEM PANEL ─── */}
                <UnifiedSystemPanel
                    gpsState={gpsState}
                    rideSelectedRoute={rideSelectedRoute}
                    onFreeride={handleFreeride}
                    onSelectRoute={onSelectRoute}
                />

                {/* ─── 3. CTA ─── */}
                <StartRideButton onClick={onStartRide} error={startError} />

                {/* ─── 4. EXTERNAL NAV ─── */}
                <ExternalNavigation />

            </div>
        </div>
    );
}
