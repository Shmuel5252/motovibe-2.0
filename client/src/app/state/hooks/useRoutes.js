/**
 * useRoutes — Sub-Hook לניהול מסלולים.
 * אחראי על: רשימת מסלולים, טעינה מהשרת, פילטרים,
 *           טופס יצירת מסלול חדש (כולל Autocomplete Places).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { ISRAEL_DEFAULT_CENTER } from "./useGoogleMaps";

/**
 * @param {{
 *   apiClient: import("axios").AxiosInstance,
 *   authToken: string,
 *   isGoogleMapsLoaded: boolean,
 *   googleMapsLoadError: Error | undefined,
 *   handleUnauthorized: Function,
 * }} params
 */
export default function useRoutes({
  apiClient,
  authToken,
  isGoogleMapsLoaded,
  googleMapsLoadError,
  handleUnauthorized,
}) {
  /* מסלולים נטענים מהשרת בלבד — אין נתוני demo מוקדם בקוד */
  const [routes, setRoutes] = useState([]);

  /* ─── State: Routes loading ─── */
  const [isRoutesLoading, setIsRoutesLoading] = useState(false);
  const [routesLoadError, setRoutesLoadError] = useState("");

  /*
   * מצבי UI מקומיים למסך מסלולים (חיפוש + פילטר טווח).
   */
  const [routesSearchQuery, setRoutesSearchQuery] = useState("");
  const [selectedRoutesFilter, setSelectedRoutesFilter] = useState("הכל");
  const [isRoutesFilterMenuOpen, setIsRoutesFilterMenuOpen] = useState(false);

  /* טופס יצירה מקומי למסלול חדש במסך Routes. */
  const [newRouteTitle, setNewRouteTitle] = useState("");
  const [newOriginLabel, setNewOriginLabel] = useState("");
  const [newOriginLatLng, setNewOriginLatLng] = useState(null);
  const [newDestinationLabel, setNewDestinationLabel] = useState("");
  const [newDestinationLatLng, setNewDestinationLatLng] = useState(null);
  const [newRouteType, setNewRouteType] = useState("עירוני");
  const [newRouteDifficulty, setNewRouteDifficulty] = useState("בינוני");
  const [newRouteIsTwisty, setNewRouteIsTwisty] = useState(false);
  const [isAddRouteExpanded, setIsAddRouteExpanded] = useState(false);
  /* מצב בחירה מהמפה בתוך הטופס עבור מוצא/יעד. */
  const [activeMapPickField, setActiveMapPickField] = useState(null);
  /* מרכז דינמי לפיקר: נקודה קיימת/גיאוקוד/ברירת מחדל. */
  const [mapPickCenter, setMapPickCenter] = useState(ISRAEL_DEFAULT_CENTER);
  /* סטטוס חיפוש מיקום לפתיחת פיקר ליד טקסט שהוקלד. */
  const [mapPickStatus, setMapPickStatus] = useState("");
  const mapPickRequestIdRef = useRef(0);

  /* שירות הצעות למוצא/יעד (AutocompleteService). */
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [activeSuggestionField, setActiveSuggestionField] = useState(null);
  const [newRouteLocationError, setNewRouteLocationError] = useState("");

  const isPlacesSuggestionsReady =
    isGoogleMapsLoaded &&
    !googleMapsLoadError &&
    typeof window !== "undefined" &&
    Boolean(window.google?.maps?.places);

  /* ─── Routes Logic ─── */

  const toLatLngPoint = (point) => {
    const lat = Number(point?.lat);
    const lng = Number(point?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { lat, lng };
  };

  const normalizeRouteFromServer = (route, index) => {
    const originPoint = toLatLngPoint(route?.start);
    const destinationPoint = toLatLngPoint(route?.end);

    return {
      ...route,
      id: route?._id || route?.id || `route-${Date.now()}-${index}`,
      from: route?.start?.label || route?.from || "מוצא",
      to: route?.end?.label || route?.to || "יעד",
      etaMin: route?.etaMin ?? route?.etaMinutes ?? 0,
      ...(originPoint ? { fromLatLng: originPoint, origin: originPoint } : {}),
      ...(destinationPoint
        ? { toLatLng: destinationPoint, destination: destinationPoint }
        : {}),
    };
  };

  /* טעינת מסלולים מהשרת לפי משתמש מחובר ושמירה ב-state של המסך. */
  const fetchRoutesFromServer = async (tokenOverride) => {
    const effectiveToken = tokenOverride || authToken;
    if (!effectiveToken) {
      return;
    }

    setIsRoutesLoading(true);
    setRoutesLoadError("");

    try {
      const response = await apiClient.get("/routes", {
        headers: { Authorization: `Bearer ${effectiveToken}` },
      });

      const serverRoutes = Array.isArray(response.data?.routes)
        ? response.data.routes
        : [];
      setRoutes(serverRoutes.map(normalizeRouteFromServer));
    } catch (error) {
      if (error?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      console.error("Failed to load routes", error);
      setRoutesLoadError("טעינת מסלולים נכשלה");
    } finally {
      setIsRoutesLoading(false);
    }
  };

  /* קטגוריות ופילטרים קבועים */
  const filterChips = ["הכל", "קצר", "בינוני", "ארוך", "שטח"];
  const routesFilterOptions = ["הכל", "קצר", "בינוני", "ארוך"];

  /* 3 המסלולים האחרונים לתצוגת דף הבית. */
  const recentRoutes = useMemo(() => {
    if (!Array.isArray(routes) || routes.length === 0) {
      return [];
    }

    const hasCreatedAt = routes.some((route) => Boolean(route?.createdAt));
    const sourceRoutes = [...routes];

    if (hasCreatedAt) {
      sourceRoutes.sort((a, b) => {
        const aTimestamp = Date.parse(a?.createdAt || "");
        const bTimestamp = Date.parse(b?.createdAt || "");

        if (Number.isNaN(aTimestamp) && Number.isNaN(bTimestamp)) {
          return 0;
        }

        if (Number.isNaN(aTimestamp)) {
          return 1;
        }

        if (Number.isNaN(bTimestamp)) {
          return -1;
        }

        return bTimestamp - aTimestamp;
      });
    }

    return sourceRoutes.slice(0, 3);
  }, [routes]);

  /**
   * מחזיר קטגוריית אורך למסלול לפי מרחק ק"מ.
   */
  const getRouteLengthCategory = (distanceKm) => {
    if (distanceKm <= 40) {
      return "קצר";
    }

    if (distanceKm <= 80) {
      return "בינוני";
    }

    return "ארוך";
  };

  /**
   * מחזיר קושי מעודכן כאשר מסלול מוגדר כמפותל.
   */
  const getAdjustedDifficultyForTwisty = (difficulty) => {
    if (difficulty === "קל") {
      return "בינוני";
    }

    return difficulty;
  };

  /* ניקוי הצעות כאשר שירות המקומות לא זמין. */
  useEffect(() => {
    if (isPlacesSuggestionsReady) {
      return;
    }

    setOriginSuggestions([]);
    setDestinationSuggestions([]);
  }, [isPlacesSuggestionsReady]);

  /* הצעות למוצא: קריאה מדובנסת ל-AutocompleteService. */
  useEffect(() => {
    if (!isPlacesSuggestionsReady) {
      setOriginSuggestions([]);
      return;
    }

    const input = newOriginLabel.trim();
    if (!input) {
      setOriginSuggestions([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      /* הגנת שירות: מריצים Autocomplete רק כאשר Places זמין בפועל. */
      if (!window.google?.maps?.places) {
        setOriginSuggestions([]);
        return;
      }

      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: "il" },
        },
        (predictions, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
            setOriginSuggestions([]);
            return;
          }

          setOriginSuggestions(predictions || []);
        },
      );
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [newOriginLabel, isPlacesSuggestionsReady]);

  /* הצעות ליעד: קריאה מדובנסת ל-AutocompleteService. */
  useEffect(() => {
    if (!isPlacesSuggestionsReady) {
      setDestinationSuggestions([]);
      return;
    }

    const input = newDestinationLabel.trim();
    if (!input) {
      setDestinationSuggestions([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      /* הגנת שירות: מריצים Autocomplete רק כאשר Places זמין בפועל. */
      if (!window.google?.maps?.places) {
        setDestinationSuggestions([]);
        return;
      }

      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: "il" },
        },
        (predictions, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
            setDestinationSuggestions([]);
            return;
          }

          setDestinationSuggestions(predictions || []);
        },
      );
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [newDestinationLabel, isPlacesSuggestionsReady]);

  return {
    /* Routes state */
    routes, setRoutes,
    isRoutesLoading,
    routesLoadError,
    routesSearchQuery, setRoutesSearchQuery,
    selectedRoutesFilter, setSelectedRoutesFilter,
    isRoutesFilterMenuOpen, setIsRoutesFilterMenuOpen,

    /* Routes logic */
    fetchRoutesFromServer,
    normalizeRouteFromServer,
    filterChips,
    routesFilterOptions,
    recentRoutes,
    getRouteLengthCategory,
    getAdjustedDifficultyForTwisty,

    /* New Route Form */
    newRouteTitle, setNewRouteTitle,
    newOriginLabel, setNewOriginLabel,
    newOriginLatLng, setNewOriginLatLng,
    newDestinationLabel, setNewDestinationLabel,
    newDestinationLatLng, setNewDestinationLatLng,
    newRouteType, setNewRouteType,
    newRouteDifficulty, setNewRouteDifficulty,
    newRouteIsTwisty, setNewRouteIsTwisty,
    isAddRouteExpanded, setIsAddRouteExpanded,
    activeMapPickField, setActiveMapPickField,
    mapPickCenter, setMapPickCenter,
    mapPickStatus, setMapPickStatus,
    mapPickRequestIdRef,
    originSuggestions, setOriginSuggestions,
    destinationSuggestions, setDestinationSuggestions,
    activeSuggestionField, setActiveSuggestionField,
    newRouteLocationError, setNewRouteLocationError,
  };
}
