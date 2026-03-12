/**
 * CommunityHubPage — מרכז פעילות הקהילה של MotoVibe.
 *
 * שני טאבים:
 *   1. מסלולי הקהילה  — GET /api/routes/public  (סינון לפי type/difficulty/isTwisty)
 *   2. רכיבות קבוצתיות — GET /api/events         (הצטרפות עם POST /api/events/:id/join)
 *
 * ניהול state מקומי בלבד — לא מזהם את useAppState הגלובלי.
 */

import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Users,
  Calendar,
  Navigation,
  Zap,
  RefreshCw,
} from "lucide-react";
import Button from "../app/ui/components/Button";
import GlassCard from "../app/ui/components/GlassCard";

/* ─── קבועים ─── */

const ROUTE_TYPES = ["הכל", "עירוני", "בין־עירוני", "שטח", "נוף"];
const DIFFICULTIES = ["הכל", "קל", "בינוני", "קשה"];

const DIFFICULTY_STYLE = {
  קל: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  בינוני: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  קשה: "text-red-400 bg-red-400/10 border-red-400/30",
};

/* ─── רכיבי עזר ─── */

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1 text-xs font-medium transition",
        active
          ? "bg-teal-500/20 border-teal-400/60 text-teal-300"
          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 rounded-lg py-2 text-sm font-semibold transition",
        active
          ? "bg-linear-to-r from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20"
          : "text-slate-400 hover:text-slate-200",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-400" />
    </div>
  );
}

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <p className="text-sm text-red-400">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="md" onClick={onRetry}>
          <RefreshCw size={14} className="ml-1.5" />
          נסה שוב
        </Button>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center text-slate-500">
      <span className="text-4xl">🏍️</span>
      <p className="text-sm">{message}</p>
    </div>
  );
}

/* ─── כרטיסיית מסלול ─── */

function RouteCard({ route, onViewRoute }) {
  const diffStyle =
    DIFFICULTY_STYLE[route.difficulty] ??
    "text-slate-400 bg-white/5 border-white/10";

  return (
    <GlassCard className="flex flex-col gap-3">
      {/* כותרת + תג קושי */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug text-slate-100">
          {route.title}
        </h3>
        {route.difficulty && (
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${diffStyle}`}
          >
            {route.difficulty}
          </span>
        )}
      </div>

      {/* מטא-דאטה */}
      <div className="flex flex-wrap gap-2 text-xs text-slate-400">
        {route.distanceKm != null && (
          <span className="flex items-center gap-1">
            <Navigation size={12} />
            {route.distanceKm.toFixed(1)} ק&quot;מ
          </span>
        )}
        {route.etaMinutes != null && (
          <span className="flex items-center gap-1">
            <span>⏱</span>~{route.etaMinutes} דק'
          </span>
        )}
        {route.routeType && (
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
            {route.routeType}
          </span>
        )}
        {route.isTwisty && (
          <span className="flex items-center gap-1 text-teal-300">
            <Zap size={12} />
            מפותל
          </span>
        )}
      </div>

      <Button
        variant="ghost"
        size="md"
        className="mt-auto w-full"
        onClick={() => onViewRoute(route)}
      >
        צפייה במסלול
      </Button>
    </GlassCard>
  );
}

/* ─── כרטיסיית אירוע רכיבה ─── */

function EventCard({ event, authToken, apiClient, onJoined }) {
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [participantCount, setParticipantCount] = useState(
    event.participants?.length ?? 0,
  );

  const isFull =
    event.maxParticipants !== null &&
    event.maxParticipants !== undefined &&
    participantCount >= event.maxParticipants;
  const isOpen = event.status === "open";

  const scheduledDate = new Date(event.scheduledAt);
  const dateStr = scheduledDate.toLocaleDateString("he-IL", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
  const timeStr = scheduledDate.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusLabel =
    event.status === "open"
      ? "פתוח"
      : event.status === "cancelled"
        ? "בוטל"
        : "הסתיים";
  const statusStyle =
    event.status === "open"
      ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
      : "text-slate-400 bg-white/5 border-white/10";

  const handleJoin = async () => {
    if (!authToken) {
      setJoinError("עליך להתחבר כדי להצטרף לרכיבה");
      return;
    }
    setIsJoining(true);
    setJoinError(null);
    try {
      const { data } = await apiClient.post(
        `/events/${event._id}/join`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      setParticipantCount(data.participantCount);
      onJoined?.();
    } catch (err) {
      const code = err?.response?.data?.error?.code;
      if (code === "ALREADY_JOINED") setJoinError("כבר הצטרפת לרכיבה זו");
      else if (code === "EVENT_FULL") setJoinError("האירוע מלא");
      else if (code === "EVENT_NOT_OPEN")
        setJoinError("האירוע לא פתוח להצטרפות");
      else if (code === "EVENT_PAST") setJoinError("האירוע כבר עבר");
      else setJoinError("שגיאה בהצטרפות, נסה שוב");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <GlassCard className="flex flex-col gap-3">
      {/* כותרת + סטטוס */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug text-slate-100">
          {event.title}
        </h3>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyle}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* פרטי אירוע */}
      <div className="flex flex-col gap-1.5 text-sm text-slate-400">
        <span className="flex items-center gap-2">
          <Calendar size={14} className="shrink-0" />
          {dateStr} · {timeStr}
        </span>
        <span className="flex items-center gap-2">
          <Users size={14} className="shrink-0" />
          {participantCount} משתתפים
          {event.maxParticipants ? ` / ${event.maxParticipants} מקסימום` : ""}
        </span>
        {event.organizer?.name && (
          <span className="text-xs text-slate-500">
            מארגן: {event.organizer.name}
          </span>
        )}
        {event.route?.title && (
          <span className="flex items-center gap-2 text-xs">
            <MapPin size={12} className="shrink-0 text-teal-400" />
            מסלול: {event.route.title}
            {event.route.distanceKm != null && (
              <span className="text-slate-500">
                ({event.route.distanceKm.toFixed(1)} ק&quot;מ)
              </span>
            )}
          </span>
        )}
      </div>

      {event.description && (
        <p className="text-xs leading-relaxed text-slate-500">
          {event.description}
        </p>
      )}

      {joinError && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400">
          {joinError}
        </p>
      )}

      <Button
        variant={!isOpen || isFull ? "ghost" : "primary"}
        size="md"
        className="mt-auto w-full"
        disabled={isJoining || isFull || !isOpen}
        onClick={handleJoin}
      >
        {isJoining
          ? "מצטרף..."
          : isFull
            ? "האירוע מלא"
            : !isOpen
              ? "סגור להצטרפות"
              : "הצטרף לרכיבה"}
      </Button>
    </GlassCard>
  );
}

/* ─── CommunityHubPage ─── */

export default function CommunityHubPage({
  apiClient,
  authToken,
  onViewRoute,
}) {
  const [activeTab, setActiveTab] = useState("routes");

  /* ── Routes state ── */
  const [routes, setRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState(null);

  /* ── פילטרים למסלולים ── */
  const [filterType, setFilterType] = useState("הכל");
  const [filterDifficulty, setFilterDifficulty] = useState("הכל");
  const [filterTwisty, setFilterTwisty] = useState(false);

  /* ── Events state ── */
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);

  /* ── fetch מסלולים ציבוריים ── */
  const fetchRoutes = useCallback(async () => {
    setRoutesLoading(true);
    setRoutesError(null);
    try {
      const params = {};
      if (filterType !== "הכל") params.routeType = filterType;
      if (filterDifficulty !== "הכל") params.difficulty = filterDifficulty;
      if (filterTwisty) params.isTwisty = "true";

      const { data } = await apiClient.get("/routes/public", { params });
      setRoutes(data.routes ?? []);
    } catch {
      setRoutesError("שגיאה בטעינת המסלולים");
    } finally {
      setRoutesLoading(false);
    }
  }, [apiClient, filterType, filterDifficulty, filterTwisty]);

  /* ── fetch אירועים ── */
  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const { data } = await apiClient.get("/events");
      setEvents(data.events ?? []);
    } catch {
      setEventsError("שגיאה בטעינת האירועים");
    } finally {
      setEventsLoading(false);
    }
  }, [apiClient]);

  /* טעינה בעת כניסה לטאב */
  useEffect(() => {
    if (activeTab === "routes") fetchRoutes();
  }, [activeTab, fetchRoutes]);

  useEffect(() => {
    if (activeTab === "events") fetchEvents();
  }, [activeTab, fetchEvents]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6" dir="rtl">
      {/* כותרת */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
          קהילת MotoVibe
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          מסלולים ורכיבות קבוצתיות משותפות
        </p>
      </header>

      {/* מתג טאבים */}
      <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        <TabButton
          active={activeTab === "routes"}
          onClick={() => setActiveTab("routes")}
        >
          🗺 מסלולי הקהילה
        </TabButton>
        <TabButton
          active={activeTab === "events"}
          onClick={() => setActiveTab("events")}
        >
          🏍️ רכיבות קבוצתיות
        </TabButton>
      </div>

      {/* ─── טאב מסלולים ─── */}
      {activeTab === "routes" && (
        <>
          {/* שורת סינון */}
          <section className="mb-5 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">סוג:</span>
              {ROUTE_TYPES.map((t) => (
                <FilterChip
                  key={t}
                  label={t}
                  active={filterType === t}
                  onClick={() => setFilterType(t)}
                />
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">קושי:</span>
              {DIFFICULTIES.map((d) => (
                <FilterChip
                  key={d}
                  label={d}
                  active={filterDifficulty === d}
                  onClick={() => setFilterDifficulty(d)}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">כביש מפותל:</span>
              <FilterChip
                label={filterTwisty ? "⚡ כן" : "⚡ הכל"}
                active={filterTwisty}
                onClick={() => setFilterTwisty((v) => !v)}
              />
            </div>
          </section>

          {/* תוצאות */}
          {routesLoading && <LoadingSpinner />}
          {routesError && (
            <ErrorMessage message={routesError} onRetry={fetchRoutes} />
          )}
          {!routesLoading && !routesError && routes.length === 0 && (
            <EmptyState message="לא נמצאו מסלולים ציבוריים עם הסינון הזה" />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {routes.map((route) => (
              <RouteCard
                key={route._id}
                route={route}
                onViewRoute={onViewRoute}
              />
            ))}
          </div>
        </>
      )}

      {/* ─── טאב רכיבות קבוצתיות ─── */}
      {activeTab === "events" && (
        <>
          {eventsLoading && <LoadingSpinner />}
          {eventsError && (
            <ErrorMessage message={eventsError} onRetry={fetchEvents} />
          )}
          {!eventsLoading && !eventsError && events.length === 0 && (
            <EmptyState message="אין רכיבות קבוצתיות מתוכננות כרגע" />
          )}
          <div className="flex flex-col gap-4">
            {events.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                authToken={authToken}
                apiClient={apiClient}
                onJoined={fetchEvents}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
