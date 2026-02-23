/**
 * useHistory — Sub-Hook לניהול נתוני היסטוריית רכיבות.
 * אחראי על: טעינה מהשרת, פילטרים, חיפוש ומצבי UI של מסך ההיסטוריה.
 */

import { useEffect, useState } from "react";

/**
 * עיצוב שניות לפורמט H:MM כמו במוק (0:05, 1:45).
 * @param {number} seconds
 * @returns {string}
 */
function formatDuration(seconds) {
  const totalSeconds = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

/**
 * עיצוב תאריך כ-DD.MM.YY כמו במוק.
 * @param {string|Date|null} dateInput
 * @returns {string}
 */
function formatDate(dateInput) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

/**
 * ממיר מסמך Ride מהשרת לצורה שה-UI מצפה לה.
 * @param {Object} ride
 * @returns {{ id: string, title: string, date: string, duration: string, distance: string }}
 */
function mapRideToUIShape(ride) {
  /* כותרת: שם מפורש > snapshot > ברירת מחדל */
  const title =
    ride.name ||
    ride.title ||
    ride.routeSnapshot?.title ||
    "רכיבה";

  /* תאריך: endedAt > createdAt > startedAt */
  const date = formatDate(ride.endedAt || ride.createdAt || ride.startedAt);

  /* משך: durationSeconds בפורמט H:MM */
  const duration = formatDuration(ride.durationSeconds);

  /* מרחק: ride.distanceKm > snapshot, עיגון לספרה אחת */
  const rawKm =
    ride.distanceKm ?? ride.routeSnapshot?.distanceKm ?? 0;
  const km = Math.round(rawKm * 10) / 10;
  const distance = `${km} ק״מ`;

  return {
    id: ride._id || ride.id,
    title,
    date,
    duration,
    distance,
  };
}

/**
 * @param {{ apiClient: import("axios").AxiosInstance, authToken: string }} params
 */
export default function useHistory({ apiClient, authToken }) {
  /* ─── State: נתוני היסטוריה ─── */
  const [historyRides, setHistoryRides] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  /* ─── State: UI פילטרים + חיפוש ─── */
  const [selectedHistoryFilter, setSelectedHistoryFilter] = useState("הכל");
  const [isHistoryFilterMenuOpen, setIsHistoryFilterMenuOpen] = useState(false);
  const [selectedHistoryRide, setSelectedHistoryRide] = useState(null);
  const [historyRideNotes, setHistoryRideNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  /* קטגוריות פילטר */
  const historyFilters = ["הכל", "שבוע", "חודש", "שנה"];

  /* ─── Fetch: טעינת היסטוריה מהשרת ─── */
  const fetchHistoryFromServer = async () => {
    if (!authToken) return;

    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await apiClient.get("/rides/history", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const serverRides = Array.isArray(response.data?.rides)
        ? response.data.rides
        : [];

      /* מיפוי לצורת ה-UI */
      setHistoryRides(serverRides.map(mapRideToUIShape));
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.error?.message || error.message;
      console.error(`fetchHistoryFromServer failed [${status}]: ${message}`);
      setHistoryError("טעינת היסטוריה נכשלה");
    } finally {
      setHistoryLoading(false);
    }
  };

  /* ─── אפקט: טעינה אוטומטית כשיש טוקן ─── */
  useEffect(() => {
    if (!authToken) return;
    fetchHistoryFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  return {
    historyRides,
    historyLoading,
    historyError,
    fetchHistoryFromServer,
    historyFilters,
    selectedHistoryFilter, setSelectedHistoryFilter,
    isHistoryFilterMenuOpen, setIsHistoryFilterMenuOpen,
    selectedHistoryRide, setSelectedHistoryRide,
    historyRideNotes, setHistoryRideNotes,
    searchQuery, setSearchQuery,
  };
}
