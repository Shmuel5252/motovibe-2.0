/**
 * useGoogleMaps — Sub-Hook לניהול טעינת Google Maps וקבועי המפה.
 * אחראי על: useJsApiLoader, קבועים, ופונקציות עזר של המפה.
 */

import { useMemo } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

/* ─── קבועים ייצוא ─── */
export const ISRAEL_DEFAULT_CENTER = { lat: 32.0853, lng: 34.7818 };
export const ISRAEL_DEFAULT_ZOOM = 11;

const MAP_LOADER_ID = "motovibe-maps";
/** ספריות טעינת מפה יציבות (כולל Places להצעות אוטומטיות). */
const MAP_LIBRARIES = ["maps", "places"];

/**
 * @param {string} googleMapsApiKey - מפתח ה-API ל-Google Maps.
 */
export default function useGoogleMaps(googleMapsApiKey) {
  const LOADER_OPTIONS = useMemo(
    () => ({
      id: MAP_LOADER_ID,
      googleMapsApiKey,
      libraries: MAP_LIBRARIES,
      language: "he",
      region: "IL",
      authReferrerPolicy: "origin",
    }),
    [googleMapsApiKey],
  );

  /* טוענים את Google Maps פעם אחת בלבד כדי למנוע קונפליקט אופציות. */
  const { isLoaded: isGoogleMapsLoaded, loadError: googleMapsLoadError } =
    useJsApiLoader(LOADER_OPTIONS);

  const isPlacesSuggestionsReady =
    isGoogleMapsLoaded &&
    !googleMapsLoadError &&
    typeof window !== "undefined" &&
    Boolean(window.google?.maps?.places);

  /* ─── Map Utilities ─── */

  /**
   * מחזיר נתיב למסלול עבור Polyline במפת פרטי מסלול.
   */
  const getRoutePolylinePath = (route) => {
    if (route?.points?.length >= 2) {
      return route.points;
    }

    return [
      { lat: 32.0853, lng: 34.7818 },
      { lat: 32.0951, lng: 34.7894 },
      { lat: 32.1063, lng: 34.8012 },
      { lat: 32.1148, lng: 34.8155 },
      { lat: 32.1222, lng: 34.8291 },
    ];
  };

  /**
   * בודק שנקודת מפה תקינה.
   */
  const isValidMapPoint = (point) => {
    if (!point || typeof point !== "object") {
      return false;
    }

    const lat = Number(point.lat);
    const lng = Number(point.lng);
    return Number.isFinite(lat) && Number.isFinite(lng);
  };

  /**
   * מסנן נתיב למסלול לנקודות חוקיות בלבד עבור Polyline.
   */
  const getSafePolylinePath = (path) => {
    if (!Array.isArray(path)) {
      return [];
    }

    return path.filter(isValidMapPoint);
  };

  return {
    isGoogleMapsLoaded,
    googleMapsLoadError,
    isPlacesSuggestionsReady,
    getRoutePolylinePath,
    isValidMapPoint,
    getSafePolylinePath,
  };
}
