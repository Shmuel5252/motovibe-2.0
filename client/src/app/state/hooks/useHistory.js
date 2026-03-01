/**
 * useHistory — Sub-Hook לניהול נתוני היסטוריית רכיבות.
 * אחראי על: טעינה מהשרת, פילטרים, חיפוש ומצבי UI של מסך ההיסטוריה.
 */

import { useEffect, useState } from "react";
import { formatRideDuration } from "../../utils/formatters";

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
 * חישוב מרחק בק"מ מנתיב GPS לפי נוסחת Haversine.
 * @param {Array<{lat: number, lng: number}>} path
 * @returns {number}
 */
function calculatePathDistance(path) {
  if (!Array.isArray(path) || path.length < 2) return 0;
  const R = 6371;
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const dLat = ((curr.lat - prev.lat) * Math.PI) / 180;
    const dLng = ((curr.lng - prev.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((prev.lat * Math.PI) / 180) *
      Math.cos((curr.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return total;
}

/**
 * ממיר מסמך Ride מהשרת לצורה שה-UI מצפה לה.
 * @param {Object} ride
 * @returns {{ id: string, title: string, date: string, duration: string, distance: string }}
 */
function mapRideToUIShape(ride) {
  /* כותרת: שם שנשמר > snapshot > ברירת מחדל */
  const title =
    ride.name ||
    ride.routeSnapshot?.title ||
    "רכיבה";

  /* תאריך: endedAt > createdAt > startedAt */
  const date = formatDate(ride.endedAt || ride.createdAt || ride.startedAt);

  /* משך: durationSeconds, או חישוב מ-endedAt/startedAt אם 0 */
  const rawSeconds =
    ride.durationSeconds ||
    (ride.endedAt && ride.startedAt
      ? Math.max(0, Math.floor(
        (new Date(ride.endedAt) - new Date(ride.startedAt)) / 1000
      ))
      : 0);
  const duration = formatRideDuration(rawSeconds);

  /* מרחק: snapshot > חישוב מנתיב GPS > 0 */
  const rawKm =
    ride.routeSnapshot?.distanceKm ??
    (ride.path?.length >= 2 ? calculatePathDistance(ride.path) : 0);
  const km = Math.round(rawKm * 10) / 10;
  const distance = `${km} ק״מ`;

  return {
    id: ride._id || ride.id,
    /* שם מקורי מהשרת — לשימוש edit/convert */
    name: ride.name || "",
    title,
    date,
    duration,
    distance,
    rawSeconds,
    rawKm,
    imageUrl: ride.imageUrl || null,
    /* snapshot מסלול — לשימוש המרה למסלול קבוע */
    routeSnapshot: ride.routeSnapshot || null,
    /* מסמך גולמי מהשרת — גישה ל-path ושדות נוספים */
    raw: ride,
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
