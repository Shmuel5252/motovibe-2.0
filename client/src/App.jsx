import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  DirectionsRenderer,
  GoogleMap,
  MarkerF,
  PolylineF,
  useJsApiLoader,
} from "@react-google-maps/api";
import Button from "./app/ui/components/Button";
import GlassCard from "./app/ui/components/GlassCard";
import AppShell from "./app/layouts/AppShell";

const ISRAEL_DEFAULT_CENTER = { lat: 32.0853, lng: 34.7818 };
const ISRAEL_DEFAULT_ZOOM = 11;
const MAP_LOADER_ID = "motovibe-maps";
/* ספריות טעינת מפה יציבות (כולל Places להצעות אוטומטיות). */
const MAP_LIBRARIES = ["maps", "places"];
/* תיקון 404: בסיס ה-API חייב להצביע לשרת backend ולא ל-origin של Vite. */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const AUTH_TOKEN_KEY = "mv_token";

/**
 * שכבת מפה לרכיבה פעילה כאשר קיים מפתח Google Maps.
 * @param {Object} props - מאפייני המפה.
 * @param {{lat: number, lng: number}} props.center - מרכז המפה הנוכחי.
 * @param {{lat: number, lng: number} | null} props.myLocation - מיקום המשתמש למרקר.
 * @param {string} props.apiKey - מפתח Google Maps מהסביבה.
 * @returns {JSX.Element} מפת Google עם מרקר אופציונלי.
 */
function RideActiveMap({
  center,
  myLocation,
  apiKey,
  isMapLoaded,
  mapLoadError,
}) {
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

  return (
    <GoogleMap
      center={center}
      zoom={ISRAEL_DEFAULT_ZOOM}
      mapContainerClassName="h-full w-full"
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        gestureHandling: "greedy",
      }}
    >
      {/* מרקר "המיקום שלי" מוצג רק לאחר הצלחת GPS. */}
      {myLocation && <MarkerF position={myLocation} title="המיקום שלי" />}
    </GoogleMap>
  );
}

/**
 * מסך האפליקציה הראשי.
 * רינדור המסך מתבצע לפי activeTab שמנוהל ב־AppShell (ללא Router בשלב זה).
 * @returns {JSX.Element} מעטפת ניווט עם תוכן דינמי לפי לשונית פעילה.
 */
function App() {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const apiClient = useMemo(() => axios.create({ baseURL: API_BASE_URL }), []);

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

  const [selectedChip, setSelectedChip] = useState("הכל");

  /*
   * המסלול הנבחר לתצוגת פרטים בתוך מסך המסלולים.
   * כאשר null מוצגת רשימת המסלולים, וכאשר יש ערך מוצג Route Details.
   */
  const [selectedRoute, setSelectedRoute] = useState(null);

  /*
   * כלל תצוגה: מסלול נבחר יוצג ב־Ride רק אם ההתחלה הייתה ממסך מסלולים.
   */
  const [didStartFromRoute, setDidStartFromRoute] = useState(false);

  /*
   * פילטר מקומי למסך היסטוריה (UI בלבד ללא סינון נתונים אמיתי בשלב זה).
   */
  const [selectedHistoryFilter, setSelectedHistoryFilter] = useState("הכל");
  const [isHistoryFilterMenuOpen, setIsHistoryFilterMenuOpen] = useState(false);

  /* רכיבה נבחרת לתצוגת פרטי היסטוריה במודל מקומי. */
  const [selectedHistoryRide, setSelectedHistoryRide] = useState(null);

  /* הערות מקומיות למסך פרטי רכיבה (ללא שמירה לשרת). */
  const [historyRideNotes, setHistoryRideNotes] = useState("");

  /*
   * טקסט חיפוש מקומי למסך היסטוריה (ללא API).
   */
  const [searchQuery, setSearchQuery] = useState("");

  /*
   * מצבי UI מקומיים למסך מסלולים (חיפוש + פילטר טווח).
   */
  const [routesSearchQuery, setRoutesSearchQuery] = useState("");
  const [selectedRoutesFilter, setSelectedRoutesFilter] = useState("הכל");
  const [isRoutesFilterMenuOpen, setIsRoutesFilterMenuOpen] = useState(false);

  /* תצוגה פנימית למסך Routes: רשימה או פרטי מסלול. */
  const [routesView, setRoutesView] = useState("routes");

  const goToRoutesListView = () => setRoutesView("routes");

  useEffect(() => {
    if (routesView !== "routeDetails") {
      return undefined;
    }

    /* תיקון ניווט: לחיצה על "מסלולים" בניווט מחזירה תמיד לרשימת המסלולים. */
    const handleRoutesNavClick = (event) => {
      const targetElement = event.target;
      if (!(targetElement instanceof Element)) {
        return;
      }

      const clickedButton = targetElement.closest("button");
      if (!clickedButton) {
        return;
      }

      if (clickedButton.textContent?.includes("מסלולים")) {
        goToRoutesListView();
      }
    };

    document.addEventListener("click", handleRoutesNavClick, true);

    return () => {
      document.removeEventListener("click", handleRoutesNavClick, true);
    };
  }, [routesView]);

  /*
   * תצוגה מקומית של תמונת האופנוע שנבחרה (ללא העלאה לשרת בשלב זה).
   */
  const [bikePhotoPreview, setBikePhotoPreview] = useState("");
  const bikePhotoInputRef = useRef(null);

  /*
   * נתוני מסלולים מקומיים כולל metadata בסיסי לתצוגת פרטים.
   */
  const [routes, setRoutes] = useState([
    {
      id: "route-1",
      title: "רמת השרון → תל אביב",
      from: "רמת השרון",
      to: "תל אביב",
      distanceKm: 42,
      etaMin: 45,
      routeType: "עירוני",
      difficulty: "בינוני",
      isTwisty: false,
      tags: ["כביש", "לילה", "מהיר"],
    },
    {
      id: "route-2",
      title: "כביש החוף → חיפה",
      from: "כביש החוף",
      to: "חיפה",
      distanceKm: 96,
      etaMin: 70,
      routeType: "בין־עירוני",
      difficulty: "בינוני",
      isTwisty: false,
      tags: ["כביש", "לילה", "מהיר"],
    },
    {
      id: "route-3",
      title: "הרי ירושלים → בית שמש",
      from: "הרי ירושלים",
      to: "בית שמש",
      distanceKm: 38,
      etaMin: 52,
      routeType: "נוף",
      difficulty: "קשה",
      isTwisty: true,
      tags: ["כביש", "לילה", "מהיר"],
    },
  ]);
  const [authToken, setAuthToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isRoutesLoading, setIsRoutesLoading] = useState(false);
  const [routesLoadError, setRoutesLoadError] = useState("");

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

  /* טיפול מרכזי ב-401: ניקוי טוקן, מעבר למצב אורח ותצוגת מסך אימות. */
  const handleUnauthorized = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }

    delete apiClient.defaults.headers.common.Authorization;
    setAuthToken("");
    setIsAuthenticated(false);
    setShowAuthScreen(true);
  };

  // התנתקות: ניקוי טוקן ואיפוס מצב התחברות
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_TOKEN_KEY || "mv_token");
      // בהתנתקות מנקים גם את פרטי המשתמש
      window.localStorage.removeItem("mv_user");
    }

    delete apiClient.defaults.headers.common.Authorization;
    setAuthToken("");
    setCurrentUser(null);
    setIsAuthenticated(false);
    setShowAuthScreen(true);
  };

  /* הצלחת אימות: שמירה ב-localStorage, חיבור Bearer ועדכון סטייט התחברות. */
  const applyAuthSuccess = (token, user = null) => {
    if (!token) {
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      // שמירת המשתמש כדי להציג שם אמיתי גם אחרי רענון
      if (user && typeof user === "object") {
        window.localStorage.setItem("mv_user", JSON.stringify(user));
      }
    }

    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    setAuthToken(token);
    if (user && typeof user === "object") {
      setCurrentUser(user);
    }
    setIsAuthenticated(true);
    setShowAuthScreen(false);
  };

  /* חילוץ טוקן מתשובת Auth (תומך גם ב-response עם user+token). */
  const extractTokenFromAuthResponse = (data) =>
    data?.token || data?.data?.token || "";

  const extractUserFromAuthResponse = (data) =>
    data?.user || data?.data?.user || null;

  /* שליחת התחברות/הרשמה לשרת ועדכון מצב מאומת באפליקציה. */
  const submitAuthForm = async ({ onNavigate }) => {
    const email = authEmail.trim();
    const password = authPassword.trim();
    const name = authName.trim();

    if (!email || !password || (authMode === "register" && !name)) {
      setAuthError("נא למלא את כל השדות הנדרשים");
      return;
    }

    setIsAuthSubmitting(true);
    setAuthError("");

    try {
      /* הנתיב יחסי ל-baseURL שכבר כולל /api, לכן נשאר /auth/... */
      const endpoint =
        authMode === "register" ? "/auth/register" : "/auth/login";
      const payload =
        authMode === "register"
          ? { name, email, password }
          : { email, password };

      const response = await apiClient.post(endpoint, payload);
      const token = extractTokenFromAuthResponse(response.data);
      const user = extractUserFromAuthResponse(response.data);
      if (!token) {
        setAuthError("לא התקבל טוקן מהשרת");
        return;
      }

      applyAuthSuccess(token, user);
      await fetchRoutesFromServer(token);
      onNavigate("home");
    } catch (error) {
      console.error("Auth failed", error);
      setAuthError("התחברות נכשלה. בדוק פרטים ונסה שוב");
    } finally {
      setIsAuthSubmitting(false);
    }
  };

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

  /* הידרציה בטעינה: הגדרת Authorization לפני fetchRoutes ואז טעינת מסלולים. */
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedToken = window.localStorage.getItem(AUTH_TOKEN_KEY) || "";
    if (!storedToken) {
      setIsAuthenticated(false);
      setShowAuthScreen(true);
      return;
    }

    // אתחול משתמש מה-localStorage כדי שהשם יוצג גם אחרי רענון
    const rawStoredUser = window.localStorage.getItem("mv_user");
    if (rawStoredUser) {
      try {
        const parsedUser = JSON.parse(rawStoredUser);
        if (parsedUser && typeof parsedUser === "object") {
          setCurrentUser(parsedUser);
        }
      } catch {
        window.localStorage.removeItem("mv_user");
      }
    }

    applyAuthSuccess(storedToken);
    fetchRoutesFromServer(storedToken);
  }, []);

  const filterChips = ["הכל", "קצר", "בינוני", "ארוך", "שטח"];

  const routesFilterOptions = ["הכל", "קצר", "בינוני", "ארוך"];

  const historyFilters = ["הכל", "שבוע", "חודש", "שנה"];

  /*
   * נתוני דמו למסך היסטוריית רכיבות.
   * בהמשך יוחלפו בנתונים אמיתיים מהשרת.
   */
  const historyRides = [
    {
      id: "ride-1",
      title: "טיול רכיבה ביום שבת",
      date: "03.12.25",
      duration: "1:45",
      distance: "72 ק״מ",
    },
    {
      id: "ride-2",
      title: "נסיעה לעבודה",
      date: "28.11.25",
      duration: "0:55",
      distance: "21 ק״מ",
    },
    {
      id: "ride-3",
      title: "טיול לילה בהרים",
      date: "21.11.25",
      duration: "2:10",
      distance: "94 ק״מ",
    },
    {
      id: "ride-4",
      title: "סיבוב חוף ערב",
      date: "18.11.25",
      duration: "1:20",
      distance: "48 ק״מ",
    },
  ];

  /**
   * מחזיר קטגוריית אורך למסלול לפי מרחק ק"מ.
   * @param {number} distanceKm - מרחק המסלול בקילומטרים.
   * @returns {"קצר"|"בינוני"|"ארוך"} קטגוריית טווח למסך המסלולים.
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
   * @param {"קל"|"בינוני"|"קשה"} difficulty - רמת קושי נוכחית.
   * @returns {"קל"|"בינוני"|"קשה"} רמת קושי לאחר כלל מפותל.
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

  /**
   * מחזיר נתיב למסלול עבור Polyline במפת פרטי מסלול.
   * אם אין נקודות במסלול, מוחזר נתיב דמו קצר באזור תל אביב.
   * @param {{points?: Array<{lat: number, lng: number}>} | null} route - אובייקט מסלול נבחר.
   * @returns {Array<{lat: number, lng: number}>} מערך נקודות חוקי ל-Polyline.
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
   * בודק שנקודת מפה תקינה לציור על מפה.
   * @param {unknown} point - אובייקט נקודה לבדיקה.
   * @returns {point is {lat: number, lng: number}} האם הנקודה חוקית.
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
   * @param {unknown} path - נתיב נכנס ממקור נתונים.
   * @returns {Array<{lat: number, lng: number}>} נתיב בטוח להצגה.
   */
  const getSafePolylinePath = (path) => {
    if (!Array.isArray(path)) {
      return [];
    }

    return path.filter(isValidMapPoint);
  };

  /**
   * מפה למסך פרטי מסלול עם קו מסלול (Polyline).
   * @param {Object} props - מאפייני המפה.
   * @param {string} props.apiKey - מפתח Google Maps מהסביבה.
   * @param {Array<{lat: number, lng: number}>} props.path - נקודות הקו להצגה.
   * @param {() => void} props.onBack - חזרה למסך המסלולים במקרה fallback.
   * @returns {JSX.Element} תכולת מפה עם קו מסלול.
   */
  function RouteDetailsMap({
    apiKey,
    path,
    onBack,
    isMapLoaded,
    mapLoadError,
    preferredOrigin,
    preferredDestination,
  }) {
    const [mapInstance, setMapInstance] = useState(null);
    const [directionsResult, setDirectionsResult] = useState(null);
    const [directionsStatus, setDirectionsStatus] = useState("ממתין...");
    const [directionsErrorMessage, setDirectionsErrorMessage] = useState("");

    const normalizedApiKey = apiKey?.trim() ?? "";

    /* בטיחות Polyline: אם הנתיב לא תקין, לא מציירים קו. */
    const safePath = getSafePolylinePath(path);
    const startPoint = safePath[0] ?? null;
    const endPoint = safePath.length > 1 ? safePath[safePath.length - 1] : null;
    const selectedOrigin = isValidMapPoint(preferredOrigin)
      ? preferredOrigin
      : null;
    const selectedDestination = isValidMapPoint(preferredDestination)
      ? preferredDestination
      : null;

    /* דיבוג Directions: בקשת מסלול אמיתי בין נקודות התחלה/סיום. */
    useEffect(() => {
      if (!normalizedApiKey || !isMapLoaded || !window.google || !mapInstance) {
        return;
      }

      if (!selectedOrigin || !selectedDestination) {
        setDirectionsResult(null);
        setDirectionsStatus("אין נתונים");
        setDirectionsErrorMessage("אין נתוני מסלול להצגה");
        return;
      }

      const origin = {
        lat: Number(selectedOrigin.lat),
        lng: Number(selectedOrigin.lng),
      };
      const destination = {
        lat: Number(selectedDestination.lat),
        lng: Number(selectedDestination.lng),
      };
      const travelMode = window.google.maps.TravelMode.DRIVING;

      const request = { origin, destination, travelMode };
      console.log("Directions request", {
        origin,
        destination,
        travelMode: "DRIVING",
      });

      try {
        const service = new window.google.maps.DirectionsService();
        service.route(request, (result, status) => {
          console.log("Directions callback", { status, result });

          if (status === "OK" && result) {
            setDirectionsResult(result);
            setDirectionsStatus("OK");
            setDirectionsErrorMessage("");
            return;
          }

          setDirectionsResult(null);
          setDirectionsStatus(String(status ?? "UNKNOWN_ERROR"));
          setDirectionsErrorMessage(
            result?.error_message ||
              result?.status_message ||
              "לא התקבלה תגובה תקינה",
          );
        });
      } catch {
        setDirectionsResult(null);
        setDirectionsStatus("EXCEPTION");
        setDirectionsErrorMessage("שגיאה פנימית בהפעלת Directions");
      }
    }, [
      normalizedApiKey,
      isMapLoaded,
      mapInstance,
      selectedOrigin,
      selectedDestination,
    ]);

    /* התאמת viewport לנקודות ידועות באופן בטוח בלבד. */
    useEffect(() => {
      if (
        !normalizedApiKey ||
        !isMapLoaded ||
        !window.google ||
        !mapInstance ||
        safePath.length < 2
      ) {
        return;
      }

      try {
        const bounds = new window.google.maps.LatLngBounds();
        safePath.forEach((point) => bounds.extend(point));
        mapInstance.fitBounds(bounds);
      } catch {
        /* no-op: לא מפילים UI במקרה ש-fitBounds נכשל. */
      }
    }, [normalizedApiKey, isMapLoaded, mapInstance, safePath]);

    /* fallback למפתח חסר: משאירים UI שמיש וחזרה מהירה לרשימה. */
    if (!normalizedApiKey) {
      return (
        <GlassCard className="h-full" title="מפת מסלול">
          <p className="text-sm text-slate-200">חסר מפתח Google Maps</p>
          <div className="mt-4">
            <Button variant="ghost" size="md" onClick={onBack}>
              חזרה למסלולים
            </Button>
          </div>
        </GlassCard>
      );
    }

    /* fallback לשגיאת טעינת סקריפט מפה. */
    if (mapLoadError) {
      return (
        <GlassCard className="h-full" title="מפת מסלול">
          <p className="text-sm text-slate-200">שגיאה בטעינת המפה</p>
          <div className="mt-4">
            <Button variant="ghost" size="md" onClick={onBack}>
              חזרה למסלולים
            </Button>
          </div>
        </GlassCard>
      );
    }

    /* מצב טעינה מקומי במקום מסך שחור/ריק. */
    if (!isMapLoaded) {
      return (
        <div className="flex h-full items-center justify-center bg-slate-900/60 text-sm text-slate-200">
          טוען מפה...
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="relative h-70 w-full md:h-90">
          <GoogleMap
            center={ISRAEL_DEFAULT_CENTER}
            zoom={ISRAEL_DEFAULT_ZOOM}
            onLoad={(map) => setMapInstance(map)}
            mapContainerClassName="h-full w-full"
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              streetViewControl: false,
              fullscreenControl: false,
              mapTypeControl: false,
              gestureHandling: "greedy",
            }}
          >
            {/* ציור מסלול: קודם Directions (אם הצליח), אחרת Polyline מקומי. */}
            {directionsResult ? (
              <DirectionsRenderer
                directions={directionsResult}
                options={{
                  suppressMarkers: false,
                  polylineOptions: {
                    strokeColor: "#14b8a6",
                    strokeOpacity: 0.95,
                    strokeWeight: 5,
                  },
                }}
              />
            ) : (
              safePath.length >= 2 && (
                <PolylineF
                  path={safePath}
                  options={{
                    strokeColor: "#14b8a6",
                    strokeOpacity: 0.95,
                    strokeWeight: 5,
                  }}
                />
              )
            )}

            {/* תמיד ניתן להציג נקודת התחלה/סיום גם ללא קו מלא. */}
            {selectedOrigin && (
              <MarkerF position={selectedOrigin} title="התחלה" />
            )}
            {selectedDestination && (
              <MarkerF position={selectedDestination} title="סיום" />
            )}

            {/* מצב ללא נקודות: ממשיכים UI ללא Directions */}
            {!selectedOrigin && !selectedDestination && (
              <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-xs text-slate-200">
                אין נקודות למפה
              </div>
            )}
          </GoogleMap>

          {/* מצב מידע כשאין נתוני מסלול תקינים להצגת קו. */}
          {safePath.length < 2 && (
            <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-xs text-slate-200">
              אין נתוני מסלול להצגה
            </div>
          )}
        </div>

        {/* סטטוס דיבוג Directions: תוצאה ופרטי שגיאה לשקיפות מלאה. */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mv-pill px-3 py-1 text-xs text-slate-200">
            Directions: {directionsStatus}
          </span>
          {directionsStatus !== "OK" && directionsErrorMessage && (
            <span className="mv-pill px-3 py-1 text-xs text-amber-200">
              שגיאה: {directionsErrorMessage}
            </span>
          )}
        </div>
      </div>
    );
  }

  /**
   * באנר רכיבה פעילה לטאבים שאינם רכיבה.
   * @param {Object} params - מאפייני הבאנר.
   * @param {boolean} params.isRideActive - האם רכיבה פעילה כרגע.
   * @param {boolean} params.isRideMinimized - האם הרכיבה כרגע במצב מזעור.
   * @param {(tabKey: "home" | "routes" | "ride" | "history" | "bike") => void} params.onNavigate - ניווט בין טאבים.
   * @returns {JSX.Element | null} באנר חזרה לרכיבה או null.
   */
  const renderActiveRideBanner = ({
    isRideActive,
    isRideMinimized,
    onNavigate,
  }) => {
    if (!isRideActive || isRideMinimized) {
      return null;
    }

    return (
      <section className="mv-card mb-5 flex items-center justify-between gap-3 px-4 py-2.5">
        <span className="text-sm text-emerald-200">יש רכיבה פעילה</span>
        <Button variant="ghost" size="md" onClick={() => onNavigate("ride")}>
          חזור לרכיבה
        </Button>
      </section>
    );
  };

  /**
   * שכבת HUD לרכיבה פעילה במסך מלא.
   * כוללת טיימר גלובלי, נתוני סטטוס ופעולות שליטה תחתונות.
   * @param {Object} props - מאפייני הקומפוננטה.
   * @param {number} props.rideElapsedSeconds - זמן רכיבה מצטבר בשניות.
   * @param {boolean} props.isRidePaused - האם הרכיבה במצב השהיה.
   * @param {(value: boolean) => void} props.setIsRidePaused - עדכון מצב השהיה.
   * @param {{title: string, from: string, to: string} | null} props.selectedRoute - מסלול שנבחר מראש למסך רכיבה.
   * @param {() => void} props.onMinimize - מזעור HUD וחזרה למעטפת רגילה.
   * @param {() => void} props.onFinish - סיום רכיבה פעילה וחזרה למצב רגיל.
   * @returns {JSX.Element} מסך רכיבה פעילה Fullscreen.
   */
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
  }) {
    /* אתחול מפה: מרכז ברירת מחדל בישראל וזום ראשוני. */
    const [mapCenter, setMapCenter] = useState(ISRAEL_DEFAULT_CENTER);

    /* מרקר מיקום משתמש יוצג רק אם GPS חזר בהצלחה. */
    const [myLocation, setMyLocation] = useState(null);

    /* סטטוס GPS במקרה של דחייה/חוסר תמיכה. */
    const [isGpsUnavailable, setIsGpsUnavailable] = useState(false);

    /* אם אין מפתח — לא טוענים Google Maps ומציגים הודעת fallback בעברית. */
    const hasGoogleMapsApiKey = Boolean(mapApiKey);

    /* GPS חד־פעמי: ניסיון יחיד לקבלת מיקום נוכחי בזמן mount. */
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

    const hours = String(Math.floor(rideElapsedSeconds / 3600)).padStart(
      2,
      "0",
    );
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
                    apiKey={mapApiKey}
                    isMapLoaded={isMapLoaded}
                    mapLoadError={mapLoadError}
                  />
                )}
              </div>
            </div>
          </div>

          {/* KPI צף בסגנון נקי: 3 עמודות עם אייקון, ערך גדול ותווית קטנה */}
          <div className="mx-auto mt-8 w-full max-w-3xl border-y border-white/10 py-5">
            {/* סדר עמודות לוגי: דיוק → מהירות → מרחק */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="flex flex-col items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm">
                  🧭
                </span>
                <span className="text-2xl font-semibold leading-none text-white">
                  82%
                </span>
                <span className="text-xs text-slate-400">דיוק</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm">
                  ⏱️
                </span>
                <span className="text-2xl font-semibold leading-none text-white">
                  84
                </span>
                <span className="text-xs text-slate-400">מהירות (קמ״ש)</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm">
                  📍
                </span>
                <span className="text-2xl font-semibold leading-none text-white">
                  12.4
                </span>
                <span className="text-xs text-slate-400">מרחק (ק״מ)</span>
              </div>
            </div>
          </div>

          {/* סרגל פעולות תחתון */}
          <div className="mv-card mt-8 flex items-center justify-between gap-2 rounded-2xl px-3 py-3">
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

  /**
   * מסך Home/Dashboard זמני.
   * @returns {JSX.Element} בלוק בית עם hero, כרטיסים וסטטיסטיקות.
   */
  const renderHomeScreen = ({
    isRideActive,
    isRideMinimized,
    setIsRideActive,
    setIsRidePaused,
    setIsRideMinimized,
    setSelectedRoute,
    setDidStartFromRoute,
    onNavigate,
  }) => (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
      <main className="mt-6 flex-1">
        {renderActiveRideBanner({ isRideActive, isRideMinimized, onNavigate })}

        {/* Hero ראשי למסך הבית */}
        <section className="grid grid-cols-1 items-center gap-5 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              {currentUser?.name ? `שלום ${currentUser.name}` : "שלום רוכב"}
            </h1>
            <p className="mt-2 text-lg text-slate-300">מוכן לרכיבה</p>
            <Button
              variant="primary"
              size="lg"
              className="mt-6"
              onClick={() => {
                /* זרימת התחלה ישירה מהבית: הפעלה, איפוס מצבי ביניים ומעבר ללשונית רכיבה. */
                /* התחלה מהבית תמיד ללא מסלול מוקדם וללא שיוך למסלול. */
                setSelectedRoute(null);
                setIsRideActive(true);
                setIsRidePaused(false);
                setIsRideMinimized(false);
                onNavigate("ride", { source: "homeStart" });
              }}
            >
              התחל רכיבה
            </Button>
          </div>

          <div className="mv-card relative min-h-44 overflow-hidden rounded-2xl md:min-h-56">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(20,184,166,0.28),rgba(15,23,42,0.18)_40%,rgba(2,6,23,0.1)_75%)]" />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 to-transparent" />
            <div className="relative flex h-full items-end p-4">
              <span className="mv-pill px-3 py-1 text-xs text-slate-200">
                אזור תמונת אופנוע
              </span>
            </div>
          </div>
        </section>

        {/* כרטיסי מידע מרכזיים */}
        <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <GlassCard
            title="מסלולים אחרונים"
            right={
              <button
                type="button"
                className="text-xs text-emerald-300 hover:text-emerald-200"
              >
                ראה הכל
              </button>
            }
          >
            <div className="space-y-3">
              <div className="h-28 rounded-xl bg-slate-900/80 ring-1 ring-white/10" />
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  רמת השרון למסילת איילון
                </h3>
                <p className="mt-1 text-xs text-slate-400">42 ק״מ • 45 דק׳</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard
            title="האופנוע שלי"
            right={
              <span className="mv-pill px-2.5 py-1 text-xs font-medium text-emerald-200">
                תקין
              </span>
            }
          >
            <div className="space-y-3">
              <div className="h-28 rounded-xl bg-linear-to-br from-slate-900/90 via-slate-800/60 to-emerald-900/30 ring-1 ring-white/10" />
              <p className="text-sm text-slate-300">טיפול הבא: 800 ק״מ</p>
            </div>
          </GlassCard>
        </section>
      </main>

      {/* פס סטטיסטיקות תחתון */}
      <section className="mv-pill mt-6 px-4 py-3">
        <div className="flex items-center justify-between gap-2 text-sm text-slate-200">
          <span>4 רכיבות</span>
          <span className="text-white/30">|</span>
          <span>3:15 שעות</span>
          <span className="text-white/30">|</span>
          <span>215 ק״מ</span>
        </div>
      </section>
    </div>
  );

  /**
   * מסך Routes בסגנון MotoVibe עם חיפוש, פילטר ותצוגת כרטיסים.
   * @returns {JSX.Element} מסך מסלולים מחובר לזרימת התחלת רכיבה.
   */
  const renderRoutesScreen = ({
    isRideActive,
    isRideMinimized,
    setIsRideActive,
    setIsRidePaused,
    setIsRideMinimized,
    setDidStartFromRoute,
    onNavigate,
    mapApiKey,
    isMapLoaded,
    mapLoadError,
  }) => {
    /* אינדיקציית דיבוג מינימלית: האם ספריית Places נטענה בדפדפן. */
    const isPlacesDebugReady =
      typeof window !== "undefined" && Boolean(window.google?.maps?.places);

    const isPlacesApiReady =
      isMapLoaded &&
      !mapLoadError &&
      typeof window !== "undefined" &&
      Boolean(window.google?.maps?.places);

    /* סינון מקומי בסיסי למסלולים לפי חיפוש וכרטיסיית טווח. */
    const normalizedSearch = routesSearchQuery.trim().toLowerCase();
    const visibleRoutes = routes.filter((route) => {
      const matchesSearch = route.title
        .toLowerCase()
        .includes(normalizedSearch);
      const matchesFilter =
        selectedRoutesFilter === "הכל" ||
        getRouteLengthCategory(route.distanceKm) === selectedRoutesFilter;

      return matchesSearch && matchesFilter;
    });

    const closeRoutesDropdown = () => setIsRoutesFilterMenuOpen(false);

    /* פענוח הצעת Places לנקודה: קודם getDetails, ואז fallback ל-Geocoder לפי placeId. */
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

        const onGeocodeFallback = () => {
          if (!window.google?.maps?.Geocoder) {
            resolve(null);
            return;
          }

          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ placeId }, (results, status) => {
            if (status === "OK" && results?.[0]?.geometry?.location) {
              const location = results[0].geometry.location;
              resolve({
                point: { lat: location.lat(), lng: location.lng() },
                label: fallbackLabel,
              });
              return;
            }

            resolve(null);
          });
        };

        try {
          const placesService = new window.google.maps.places.PlacesService(
            document.createElement("div"),
          );
          placesService.getDetails(
            {
              placeId,
              fields: ["geometry", "name", "formatted_address"],
            },
            (place, status) => {
              if (
                status === window.google.maps.places.PlacesServiceStatus.OK &&
                place?.geometry?.location
              ) {
                const location = place.geometry.location;
                resolve({
                  point: { lat: location.lat(), lng: location.lng() },
                  label: place.formatted_address || place.name || fallbackLabel,
                });
                return;
              }

              onGeocodeFallback();
            },
          );
        } catch {
          onGeocodeFallback();
        }
      });

    /* החלת בחירת הצעה על שדה פעיל: טקסט + LatLng, ואז סגירת הרשימה. */
    const applySuggestionSelection = async (target, suggestion) => {
      const chosenLabel = suggestion?.description || "";

      if (target === "from") {
        setNewOriginLabel(chosenLabel);
        setOriginSuggestions([]);
      } else {
        setNewDestinationLabel(chosenLabel);
        setDestinationSuggestions([]);
      }

      setActiveSuggestionField(null);

      const resolved = await resolveSuggestionToPoint(suggestion);
      if (!resolved?.point) {
        return;
      }

      if (target === "from") {
        setNewOriginLatLng(resolved.point);
        setNewOriginLabel(chosenLabel || resolved.label);
      } else {
        setNewDestinationLatLng(resolved.point);
        setNewDestinationLabel(chosenLabel || resolved.label);
      }

      setNewRouteLocationError("");
    };

    /* פתיחת פיקר מפה ליד נקודה קיימת/גיאוקוד טקסט/ברירת מחדל. */
    const openInlineMapPicker = (target) => {
      setActiveMapPickField(target);

      const existingPoint =
        target === "from" ? newOriginLatLng : newDestinationLatLng;
      const labelText =
        target === "from" ? newOriginLabel.trim() : newDestinationLabel.trim();

      const nextRequestId = mapPickRequestIdRef.current + 1;
      mapPickRequestIdRef.current = nextRequestId;

      if (isValidMapPoint(existingPoint)) {
        setMapPickCenter(existingPoint);
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
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: labelText }, (results, status) => {
        if (mapPickRequestIdRef.current !== nextRequestId) {
          return;
        }

        if (status === "OK" && results?.[0]?.geometry?.location) {
          const location = results[0].geometry.location;
          setMapPickCenter({ lat: location.lat(), lng: location.lng() });
          setMapPickStatus("");
          return;
        }

        setMapPickCenter(ISRAEL_DEFAULT_CENTER);
        setMapPickStatus("לא נמצא מיקום — בחר ידנית");
      });
    };

    const closeInlineMapPicker = () => {
      mapPickRequestIdRef.current += 1;
      setMapPickStatus("");
      setActiveMapPickField(null);
    };

    /* נתיב קו להצגה במסך פרטי מסלול. */
    const routePath = getRoutePolylinePath(selectedRoute);

    /* פרטי תצוגה למסלול עם fallback מקומי ללא שינוי מודל נתונים. */
    const routeStyle =
      selectedRoute?.routeType ||
      selectedRoute?.style ||
      selectedRoute?.routeStyle ||
      "עירוני";
    const routeDifficulty = selectedRoute?.difficulty || "בינוני";
    const routeNote = selectedRoute?.note || "מסלול זורם ומתאים לרכיבה יומית.";

    if (routesView === "routeDetails" && selectedRoute) {
      return (
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
          <main className="mt-6 flex-1">
            {renderActiveRideBanner({
              isRideActive,
              isRideMinimized,
              onNavigate,
            })}

            {/* כותרת: פרטי מסלול עם מקור/יעד */}
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                  פרטי מסלול
                </h1>
              </div>
              <p className="mt-2 text-base font-semibold text-slate-200 sm:text-lg">
                {selectedRoute.title}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {selectedRoute.from} → {selectedRoute.to}
              </p>
            </section>

            {/* בלוק מפה: תצוגת מסלול קומפקטית ורספונסיבית */}
            <section className="mt-6">
              <div className="mv-card overflow-hidden rounded-2xl border border-white/10">
                <RouteDetailsMap
                  apiKey={mapApiKey}
                  path={routePath}
                  onBack={goToRoutesListView}
                  isMapLoaded={isMapLoaded}
                  mapLoadError={mapLoadError}
                  preferredOrigin={
                    selectedRoute?.origin || selectedRoute?.fromLatLng || null
                  }
                  preferredDestination={
                    selectedRoute?.destination ||
                    selectedRoute?.toLatLng ||
                    null
                  }
                />
              </div>
            </section>

            {/* סטטיסטיקות: שלושה אריחים מרכזיים בסגנון מקצועי */}
            <section className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              <div className="mv-card rounded-xl px-3 py-3 text-center">
                <p className="text-xl font-semibold leading-none text-white sm:text-2xl">
                  {selectedRoute.distanceKm} ק״מ
                </p>
                <p className="mt-1 text-xs text-slate-400">מרחק</p>
              </div>
              <div className="mv-card rounded-xl px-3 py-3 text-center">
                <p className="text-xl font-semibold leading-none text-white sm:text-2xl">
                  {selectedRoute.etaMin} דק׳
                </p>
                <p className="mt-1 text-xs text-slate-400">זמן משוער</p>
              </div>
              <div className="mv-card rounded-xl px-3 py-3 text-center">
                <p className="text-xl font-semibold leading-none text-white sm:text-2xl">
                  {routeStyle}
                </p>
                <p className="mt-1 text-xs text-slate-400">סוג</p>
              </div>
            </section>

            {/* תגיות metadata: קושי + מפותל מתחת לגריד הסטטיסטיקות */}
            <section className="mt-4 flex flex-wrap items-center gap-2">
              <span className="mv-pill px-3 py-1 text-xs text-emerald-200">
                קושי: {routeDifficulty}
              </span>
              {selectedRoute?.isTwisty && (
                <span className="mv-pill px-3 py-1 text-xs text-amber-200">
                  מפותל
                </span>
              )}
            </section>

            {/* הערות: כרטיס ייעודי עם טקסט מסלול */}
            <section className="mt-6">
              <GlassCard title="הערות">
                <p className="text-sm text-slate-300">{routeNote}</p>
              </GlassCard>
            </section>

            {/* פעולות: התחלת רכיבה או חזרה לרשימת המסלולים */}
            <section className="mt-6">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setIsRidePaused(false);
                    setIsRideMinimized(false);
                    setIsRideActive(true);
                    onNavigate("ride", { source: "routeStart" });
                  }}
                >
                  התחל
                </Button>
                <Button variant="ghost" size="md" onClick={goToRoutesListView}>
                  חזרה למסלולים
                </Button>
              </div>
            </section>
          </main>
        </div>
      );
    }

    return (
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
        <main className="mt-6 flex-1">
          {renderActiveRideBanner({
            isRideActive,
            isRideMinimized,
            onNavigate,
          })}

          {/* כותרת מסך מסלולים */}
          <section>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              מסלולים
            </h1>
            <p className="mt-2 text-base text-slate-300 sm:text-lg">
              בחר מסלול וצא לרכיבה
            </p>

            {(isRoutesLoading || routesLoadError) && (
              <p className="mt-2 text-xs text-slate-300">
                {isRoutesLoading ? "טוען מסלולים מהשרת..." : routesLoadError}
              </p>
            )}

            {/* אקורדיון הוספת מסלול: ברירת מחדל סגור */}
            <div className="mv-card mt-4 rounded-2xl p-3">
              <button
                type="button"
                onClick={() => setIsAddRouteExpanded((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-xl px-1 py-1 text-right"
                aria-expanded={isAddRouteExpanded}
              >
                <span className="text-base font-semibold text-slate-100">
                  הוסף מסלול
                </span>
                <span className="text-sm text-slate-300">
                  {isAddRouteExpanded ? "⌃" : "⌄"}
                </span>
              </button>

              {/* שורת סיכום במצב סגור */}
              {!isAddRouteExpanded && (
                <p className="mt-2 text-sm text-slate-300">
                  {newOriginLabel && newDestinationLabel
                    ? `מוצא: ${newOriginLabel} | יעד: ${newDestinationLabel}`
                    : "בחר מוצא ויעד כדי ליצור מסלול"}
                </p>
              )}

              {isAddRouteExpanded && (
                <>
                  {/* שורת שדות ראשית: שם מסלול + מוצא/יעד נקיים יותר */}
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <input
                      type="text"
                      value={newRouteTitle}
                      onChange={(event) => setNewRouteTitle(event.target.value)}
                      placeholder="שם מסלול"
                      className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                    />

                    {/* דיבוג זמני: סטטוס טעינת Places ליד שדות מוצא/יעד. */}
                    <div className="flex justify-start">
                      <span className="mv-pill px-2.5 py-1 text-xs text-slate-200">
                        {isPlacesDebugReady
                          ? "Places: פעיל"
                          : "Places: לא נטען"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {/* מוצא: קלט עם הצעות מהירות + מעבר לבחירה מהמפה */}
                      <div className="space-y-1">
                        <label className="text-xs text-slate-300">מוצא</label>
                        <div className="flex items-center gap-2">
                          <div className="relative w-full">
                            <input
                              type="text"
                              value={newOriginLabel}
                              onFocus={() => setActiveSuggestionField("from")}
                              onChange={(event) => {
                                setNewOriginLabel(event.target.value);
                                setActiveSuggestionField("from");
                              }}
                              placeholder="חפש מוצא..."
                              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                            />

                            {/* רשימת הצעות למוצא (RTL, שכבה עליונה). */}
                            {isPlacesApiReady &&
                              activeSuggestionField === "from" &&
                              originSuggestions.length > 0 && (
                                <div className="absolute right-0 top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 shadow-lg backdrop-blur">
                                  {originSuggestions
                                    .slice(0, 6)
                                    .map((suggestion) => (
                                      <button
                                        key={suggestion.place_id}
                                        type="button"
                                        onMouseDown={(event) =>
                                          event.preventDefault()
                                        }
                                        onClick={() =>
                                          applySuggestionSelection(
                                            "from",
                                            suggestion,
                                          )
                                        }
                                        className="block w-full border-b border-white/5 px-3 py-2 text-right text-sm text-slate-100 transition hover:bg-white/10 last:border-b-0"
                                      >
                                        {suggestion.description}
                                      </button>
                                    ))}
                                </div>
                              )}
                          </div>
                          <Button
                            variant="ghost"
                            size="md"
                            className="whitespace-nowrap"
                            onClick={() => openInlineMapPicker("from")}
                          >
                            דייק מוצא במפה
                          </Button>
                        </div>
                      </div>

                      {/* יעד: קלט עם הצעות מהירות + מעבר לבחירה מהמפה */}
                      <div className="space-y-1">
                        <label className="text-xs text-slate-300">יעד</label>
                        <div className="flex items-center gap-2">
                          <div className="relative w-full">
                            <input
                              type="text"
                              value={newDestinationLabel}
                              onFocus={() => setActiveSuggestionField("to")}
                              onChange={(event) => {
                                setNewDestinationLabel(event.target.value);
                                setActiveSuggestionField("to");
                              }}
                              placeholder="חפש יעד..."
                              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                            />

                            {/* רשימת הצעות ליעד (RTL, שכבה עליונה). */}
                            {isPlacesApiReady &&
                              activeSuggestionField === "to" &&
                              destinationSuggestions.length > 0 && (
                                <div className="absolute right-0 top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 shadow-lg backdrop-blur">
                                  {destinationSuggestions
                                    .slice(0, 6)
                                    .map((suggestion) => (
                                      <button
                                        key={suggestion.place_id}
                                        type="button"
                                        onMouseDown={(event) =>
                                          event.preventDefault()
                                        }
                                        onClick={() =>
                                          applySuggestionSelection(
                                            "to",
                                            suggestion,
                                          )
                                        }
                                        className="block w-full border-b border-white/5 px-3 py-2 text-right text-sm text-slate-100 transition hover:bg-white/10 last:border-b-0"
                                      >
                                        {suggestion.description}
                                      </button>
                                    ))}
                                </div>
                              )}
                          </div>
                          <Button
                            variant="ghost"
                            size="md"
                            className="whitespace-nowrap"
                            onClick={() => openInlineMapPicker("to")}
                          >
                            דייק יעד במפה
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {/* בחירת סוג מסלול */}
                    <label className="flex flex-col gap-1 text-xs text-slate-300">
                      <span>סוג מסלול</span>
                      <select
                        value={newRouteType}
                        onChange={(event) =>
                          setNewRouteType(event.target.value)
                        }
                        className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                      >
                        <option value="עירוני">עירוני</option>
                        <option value="בין־עירוני">בין־עירוני</option>
                        <option value="שטח">שטח</option>
                        <option value="נוף">נוף</option>
                      </select>
                    </label>

                    {/* בחירת רמת קושי */}
                    <label className="flex flex-col gap-1 text-xs text-slate-300">
                      <span>רמת קושי</span>
                      <select
                        value={newRouteDifficulty}
                        onChange={(event) =>
                          setNewRouteDifficulty(event.target.value)
                        }
                        className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                      >
                        <option value="קל">קל</option>
                        <option value="בינוני">בינוני</option>
                        <option value="קשה">קשה</option>
                      </select>
                    </label>

                    {/* בחירת כביש מפותל עם התאמת קושי ל"קל" בלבד */}
                    <label className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={newRouteIsTwisty}
                        onChange={(event) => {
                          const isChecked = event.target.checked;
                          setNewRouteIsTwisty(isChecked);
                          if (isChecked) {
                            setNewRouteDifficulty((prev) =>
                              getAdjustedDifficultyForTwisty(prev),
                            );
                          }
                        }}
                        className="h-4 w-4 rounded border-white/20 bg-slate-900/60 text-emerald-400 focus:ring-emerald-300"
                      />
                      כביש מפותל
                    </label>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={async () => {
                        const title = newRouteTitle.trim();
                        const from = newOriginLabel.trim();
                        const to = newDestinationLabel.trim();

                        if (!title || !from || !to) {
                          return;
                        }

                        if (!authToken) {
                          setNewRouteLocationError(
                            "נדרש אימות משתמש לשמירה בשרת",
                          );
                          return;
                        }

                        if (!newOriginLatLng || !newDestinationLatLng) {
                          setNewRouteLocationError(
                            "לשמירה בשרת יש לבחור מוצא ויעד במפה",
                          );
                          return;
                        }

                        setNewRouteLocationError("");

                        /* יצירת מסלול בשרת עם נקודות והמטא-דאטה של הטופס. */
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
                                ? getAdjustedDifficultyForTwisty(
                                    newRouteDifficulty,
                                  )
                                : newRouteDifficulty,
                              isTwisty: newRouteIsTwisty,
                            },
                            {
                              headers: { Authorization: `Bearer ${authToken}` },
                            },
                          );

                          /* רענון רשימת מסלולים מהשרת אחרי יצירה מוצלחת. */
                          await fetchRoutesFromServer(authToken);
                        } catch (error) {
                          if (error?.response?.status === 401) {
                            handleUnauthorized();
                            return;
                          }

                          console.error("Failed to create route", error);
                          setNewRouteLocationError("שמירת מסלול נכשלה");
                          return;
                        }

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
                        closeInlineMapPicker();
                      }}
                    >
                      הוסף מסלול
                    </Button>
                  </div>

                  {/* הערת עזר: דיוק במפה אופציונלי ולא חובה לשמירה */}
                  <p className="mt-2 text-xs text-slate-400">
                    אפשר לשמור עם טקסט בלבד. לדיוק — לחץ "דייק במפה".
                  </p>

                  {!!newRouteLocationError && (
                    <p className="mt-2 text-xs text-rose-300">
                      {newRouteLocationError}
                    </p>
                  )}

                  {/* בחירה פשוטה מהמפה: לחיצה בודדת לשמירת מוצא/יעד */}
                  {activeMapPickField && (
                    <GlassCard
                      className="mt-3"
                      title="בחר נקודה על המפה"
                      right={
                        <Button
                          variant="ghost"
                          size="md"
                          onClick={closeInlineMapPicker}
                        >
                          סגור מפה
                        </Button>
                      }
                    >
                      {!mapApiKey?.trim() ? (
                        <p className="text-sm text-slate-200">
                          חסר מפתח Google Maps
                        </p>
                      ) : mapLoadError ? (
                        <div className="space-y-1 text-sm text-slate-200">
                          <p>שגיאת טעינת מפה</p>
                          <p className="text-xs text-slate-400">
                            {mapLoadError.message || "אירעה שגיאה לא ידועה"}
                          </p>
                        </div>
                      ) : !isMapLoaded ? (
                        <p className="text-sm text-slate-200">טוען מפה...</p>
                      ) : (
                        <div className="h-80 w-full overflow-hidden rounded-xl border border-white/10">
                          <GoogleMap
                            center={mapPickCenter}
                            zoom={11}
                            mapContainerStyle={{
                              width: "100%",
                              height: "100%",
                            }}
                            onLoad={() => {}}
                            onClick={(event) => {
                              const lat = event.latLng?.lat();
                              const lng = event.latLng?.lng();
                              if (
                                typeof lat !== "number" ||
                                typeof lng !== "number"
                              ) {
                                return;
                              }

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
                              disableDefaultUI: true,
                              zoomControl: true,
                              gestureHandling: "greedy",
                            }}
                          >
                            {newOriginLatLng && (
                              <MarkerF
                                position={newOriginLatLng}
                                title="מוצא"
                              />
                            )}
                            {newDestinationLatLng && (
                              <MarkerF
                                position={newDestinationLatLng}
                                title="יעד"
                              />
                            )}
                          </GoogleMap>
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="mv-pill px-2.5 py-1 text-xs text-slate-200">
                          Maps loaded: {isMapLoaded ? "כן" : "לא"}
                        </span>
                        {mapLoadError?.message && (
                          <span className="mv-pill px-2.5 py-1 text-xs text-rose-200">
                            {mapLoadError.message}
                          </span>
                        )}
                        {!!mapPickStatus && (
                          <span
                            className={`mv-pill px-2.5 py-1 text-xs ${
                              mapPickStatus === "מחפש מיקום..."
                                ? "text-emerald-200"
                                : "text-amber-200"
                            }`}
                          >
                            {mapPickStatus}
                          </span>
                        )}
                      </div>
                    </GlassCard>
                  )}
                </>
              )}
            </div>

            {/* שורת חיפוש + סינון בסגנון History */}
            <div className="mt-4 flex items-center gap-2">
              <div className="mv-card relative flex-1 p-2">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  🔎
                </span>
                <input
                  type="search"
                  value={routesSearchQuery}
                  onChange={(event) => setRoutesSearchQuery(event.target.value)}
                  placeholder="חפש מסלול..."
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2 pe-3 ps-9 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                />
              </div>

              {/* דרופדאון אבסולוטי כדי לא לדחוף את ה-layout */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRoutesFilterMenuOpen((prev) => !prev)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  aria-label="סינון"
                  aria-expanded={isRoutesFilterMenuOpen}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 6h16l-6.5 7.2v4.8l-3 1.8v-6.6L4 6Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {isRoutesFilterMenuOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-40"
                      onClick={closeRoutesDropdown}
                      aria-label="סגור סינון"
                    />

                    {/* עוגנים לשמאל כדי למנוע חיתוך בחלון צר */}
                    <div className="absolute z-50 top-full mt-2 left-0 right-auto w-44 max-w-[calc(100vw-24px)] rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg p-2">
                      {routesFilterOptions.map((filter) => {
                        const isSelected = selectedRoutesFilter === filter;
                        return (
                          <button
                            key={`routes-filter-${filter}`}
                            type="button"
                            onClick={() => {
                              setSelectedRoutesFilter(filter);
                              closeRoutesDropdown();
                            }}
                            className={[
                              "mb-1 inline-flex w-full items-center justify-center rounded-xl border px-3 py-1.5 text-sm transition last:mb-0",
                              isSelected
                                ? "border-emerald-300/40 text-emerald-200"
                                : "border-transparent text-slate-200 hover:border-white/10 hover:text-white",
                            ].join(" ")}
                          >
                            {filter}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* רשימת מסלולים בכרטיסי זכוכית */}
          <section className="mt-6 space-y-4">
            {visibleRoutes.map((route) => (
              <GlassCard key={route.id}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[130px_1fr] md:items-center">
                  {/* תצוגת מפה מינימלית בצד ימין (RTL) */}
                  <div className="relative h-24 overflow-hidden rounded-xl bg-linear-to-br from-slate-900/90 via-slate-800/65 to-emerald-900/30 ring-1 ring-white/10">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-size-[22px_22px]" />
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-slate-100">
                      {route.title}
                    </h3>
                    {/* תגיות metadata בכרטיס מסלול: סוג/קושי/מפותל */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="mv-pill px-2.5 py-1 text-[11px] text-slate-200">
                        {route.routeType || "עירוני"}
                      </span>
                      <span className="mv-pill px-2.5 py-1 text-[11px] text-emerald-200">
                        {route.difficulty || "בינוני"}
                      </span>
                      {route.isTwisty && (
                        <span className="mv-pill px-2.5 py-1 text-[11px] text-amber-200">
                          מפותל
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {route.from} → {route.to}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      {route.distanceKm} ק״מ • {route.etaMin} דק׳
                    </p>

                    {/* פעולות מסלול: תצוגה או התחלה ישירה למסך רכיבה */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => {
                          /* מעבר פנימי לפרטי מסלול מתוך רשימת המסלולים. */
                          setSelectedRoute(route);
                          setRoutesView("routeDetails");
                        }}
                      >
                        צפה
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => {
                          /* 1) שמירת מסלול נבחר מתוך הכרטיס */
                          setSelectedRoute(route);
                          /* 2) הפעלת מצב רכיבה פעילה */
                          setIsRidePaused(false);
                          setIsRideMinimized(false);
                          setIsRideActive(true);
                          /* 3) מעבר למסך רכיבה ממקור מסלול */
                          onNavigate("ride", { source: "routeStart" });
                        }}
                      >
                        התחל
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </section>
        </main>
      </div>
    );
  };

  /**
   * מסך רכיבה בלשונית ride: מצב מוכן או HUD פעיל במסך מלא.
   * @param {Object} params - מאפייני תצוגה.
   * @param {boolean} params.isRideActive - האם רכיבה פעילה כרגע.
   * @param {boolean} params.isRidePaused - האם רכיבה בהשהיה.
   * @param {boolean} params.isRideMinimized - האם הרכיבה במצב מזעור.
   * @param {number} params.rideElapsedSeconds - זמן רכיבה מצטבר בשניות.
   * @param {(value: boolean) => void} params.setIsRideActive - עדכון מצב רכיבה פעילה.
   * @param {(value: boolean) => void} params.setIsRidePaused - עדכון מצב השהיה.
   * @param {(value: boolean) => void} params.setIsRideMinimized - עדכון מצב מזעור HUD.
   * @param {{title: string, from: string, to: string} | null} params.selectedRoute - מסלול שנבחר ממסך Routes.
   * @param {boolean} params.didStartFromRoute - האם ההתחלה למסך Ride הגיעה ממסך מסלולים.
   * @param {(value: boolean) => void} params.setDidStartFromRoute - עדכון כלל תצוגת מסלול ב־Ride.
   * @param {(tabKey: "home" | "routes" | "ride" | "history" | "bike") => void} params.onNavigate - ניווט בין טאבים.
   * @returns {JSX.Element} מסך ride בהתאם למצב הפעילות.
   */
  const renderRideScreen = ({
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
  }) => {
    /* מציגים מסלול רק אם המשתמש התחיל רכיבה מתוך מסך Routes. */
    const rideSelectedRoute =
      didStartFromRoute && selectedRoute ? selectedRoute : null;

    if (isRideActive && !isRideMinimized) {
      return (
        <RideActiveHud
          rideElapsedSeconds={rideElapsedSeconds}
          isRidePaused={isRidePaused}
          setIsRidePaused={setIsRidePaused}
          selectedRoute={rideSelectedRoute}
          mapApiKey={mapApiKey}
          isMapLoaded={isMapLoaded}
          mapLoadError={mapLoadError}
          onMinimize={() => {
            setIsRideMinimized(true);
            onNavigate("home");
          }}
          onFinish={() => {
            /* בסיום רכיבה חוזרים לבית ומאפסים שיוך מסלול/מצב התחלה */
            setIsRideActive(false);
            setIsRidePaused(false);
            setSelectedRoute(null);
            setDidStartFromRoute(false);
            setIsRideMinimized(false);
            onNavigate("home");
          }}
        />
      );
    }

    return (
      <>
        {/* נדרש Fragment כדי שהערה ו־div יהיו תחת הורה JSX יחיד */}
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

              {/* בחירת מסלול אופציונלית: שני קונטרולים מאותה משפחת עיצוב (pill/glass) */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm">
                <span className="text-slate-300">מסלול</span>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {/* ניקוי מסלול באופן מפורש מהמשתמש ושיקוף מצב נבחר ויזואלי */}
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      /* בחירה מפורשת ב"ללא מסלול" מאפסת גם את כלל "התחיל ממסלולים". */
                      setSelectedRoute(null);
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

                  {/* מעבר יזום למסך מסלולים לבחירה, ללא בחירה אוטומטית */}
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

              <Button
                variant="primary"
                size="lg"
                className="mt-6 w-full"
                onClick={() => {
                  /* כניסה לרכיבה פעילה תמיד מתחילה במצב לא מושהה. */
                  setIsRidePaused(false);
                  setIsRideMinimized(false);
                  setIsRideActive(true);
                }}
              >
                התחל רכיבה
              </Button>
            </GlassCard>
          </main>
        </div>
      </>
    );
  };

  /**
   * מסך History עם פילטרים, סטטיסטיקות ורשימת רכיבות אחרונות.
   * @param {Object} params - מאפייני תצוגה למסך.
   * @param {boolean} params.isRideActive - האם רכיבה פעילה כרגע.
   * @param {boolean} params.isRideMinimized - האם רכיבה במצב מזעור.
   * @param {(tabKey: "home" | "routes" | "ride" | "history" | "bike") => void} params.onNavigate - מעבר בין טאבים.
   * @returns {JSX.Element} מסך היסטוריית רכיבות בתצוגת MotoVibe.
   */
  const renderHistoryScreen = ({
    isRideActive,
    isRideMinimized,
    onNavigate,
  }) => {
    /* סינון מקומי פשוט לפי שם רכיבה (case-insensitive). */
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const visibleHistoryRides = historyRides.filter((ride) =>
      ride.title.toLowerCase().includes(normalizedSearch),
    );
    const closeDropdown = () => setIsHistoryFilterMenuOpen(false);

    return (
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
        <main className="mt-6 flex-1">
          {renderActiveRideBanner({
            isRideActive,
            isRideMinimized,
            onNavigate,
          })}

          {/* כותרת מסך + כלי חיפוש/סינון מקומיים */}
          <section>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              היסטוריית רכיבות
            </h1>
            <p className="mt-2 text-base text-slate-300 sm:text-lg">
              כל הרכיבות האחרונות שלך במקום אחד
            </p>

            {/* שורת חיפוש + כפתור סינון קומפקטי */}
            <div className="mt-4 flex items-center gap-2">
              <div className="mv-card relative flex-1 p-2">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  🔎
                </span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="חפש רכיבה..."
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2 pe-3 ps-9 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                />
              </div>

              {/* הדרופדאון אבסולוטי כדי לא לדחוף את ה-layout */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsHistoryFilterMenuOpen((prev) => !prev)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  aria-label="סינון"
                  aria-expanded={isHistoryFilterMenuOpen}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 6h16l-6.5 7.2v4.8l-3 1.8v-6.6L4 6Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {isHistoryFilterMenuOpen && (
                  <>
                    {/* שכבת סגירה קבועה מאחורי התפריט, לא תופסת מקום בזרימה */}
                    <button
                      type="button"
                      className="fixed inset-0 z-40"
                      onClick={closeDropdown}
                      aria-label="סגור סינון"
                    />

                    {/* עיגון חכם: ימין בדסקטופ רחב, ושמאל ברוחב צפוף כדי למנוע חיתוך/חריגה מהמסך */}
                    <div className="absolute z-50 top-full mt-2 left-0 lg:left-auto lg:right-0 w-44 max-w-[min(320px,calc(100vw-24px))] rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg p-2">
                      {historyFilters.map((filter) => {
                        const isSelected = selectedHistoryFilter === filter;
                        return (
                          <button
                            key={`menu-${filter}`}
                            type="button"
                            onClick={() => {
                              setSelectedHistoryFilter(filter);
                              closeDropdown();
                            }}
                            className={[
                              "mb-1 inline-flex w-full items-center justify-center rounded-xl border px-3 py-1.5 text-sm transition last:mb-0",
                              isSelected
                                ? "border-emerald-300/40 text-emerald-200"
                                : "border-transparent text-slate-200 hover:border-white/10 hover:text-white",
                            ].join(" ")}
                          >
                            {filter}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* סיכום מסנן נבחר (ללא שורת צ'יפים כפולה) */}
            <div className="mt-3">
              <span className="mv-pill px-3 py-1 text-xs text-slate-200">
                טווח: {selectedHistoryFilter}
              </span>
            </div>
          </section>

          {/* פס סטטיסטיקות חדש: מספרים גדולים ומחיצות אנכיות עדינות */}
          <section className="mv-card mt-6 px-4 py-3">
            <div className="grid grid-cols-3 gap-0 text-center">
              <div className="border-e border-white/10 px-2">
                <p className="text-2xl font-semibold leading-none text-white">
                  12
                </p>
                <p className="mt-1 text-xs text-slate-400">רכיבות</p>
              </div>
              <div className="border-e border-white/10 px-2">
                <p className="text-2xl font-semibold leading-none text-white">
                  14:30
                </p>
                <p className="mt-1 text-xs text-slate-400">שעות</p>
              </div>
              <div className="px-2">
                <p className="text-2xl font-semibold leading-none text-white">
                  615
                </p>
                <p className="mt-1 text-xs text-slate-400">ק״מ</p>
              </div>
            </div>
          </section>

          {/* רשימת רכיבות אחרונות */}
          <section className="mt-6 space-y-4">
            {visibleHistoryRides.map((ride) => (
              <GlassCard
                key={ride.id}
                right={
                  <Button
                    variant="ghost"
                    size="md"
                    className="h-8 w-8 rounded-full p-0 text-base"
                    onClick={() => setSelectedHistoryRide(ride)}
                  >
                    &gt;
                  </Button>
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_130px] md:items-center">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">
                      {ride.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">{ride.date}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                      <span>⏱️ {ride.duration}</span>
                      <span>📍 {ride.distance}</span>
                    </div>
                  </div>

                  <div className="h-24 overflow-hidden rounded-xl bg-linear-to-br from-slate-900/90 via-slate-800/65 to-emerald-900/30 ring-1 ring-white/10" />
                </div>
              </GlassCard>
            ))}

            {/*
              מצב ריק עתידי:
              כאשר historyRides יהיה מערך ריק, ניתן לרנדר כאן GlassCard עם הודעה
              כמו "אין רכיבות להצגה" וכפתור CTA להתחלת רכיבה חדשה.
            */}
          </section>

          {/* מודל פרטי רכיבה: שכבה קבועה עם סגירה בלחיצה על הרקע */}
          {selectedHistoryRide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <button
                type="button"
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                onClick={() => setSelectedHistoryRide(null)}
                aria-label="סגור פרטי רכיבה"
              />

              {/* תוכן המודל: פרטים בסיסיים ופעולות */}
              <div className="relative z-10 w-full max-w-md">
                <GlassCard title="פרטי רכיבה">
                  {/* כותרת קומפקטית: שם רכיבה + תאריך */}
                  <div className="mb-4 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-100">
                      {selectedHistoryRide.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {selectedHistoryRide.date}
                    </p>
                  </div>

                  {/* גריד סטטיסטיקות מקצועי לשלושת המדדים המרכזיים */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="mv-card rounded-xl px-2 py-2 text-center">
                      <p className="text-[11px] text-slate-400">משך</p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">
                        {selectedHistoryRide.duration}
                      </p>
                    </div>
                    <div className="mv-card rounded-xl px-2 py-2 text-center">
                      <p className="text-[11px] text-slate-400">מרחק</p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">
                        {selectedHistoryRide.distance}
                      </p>
                    </div>
                    <div className="mv-card rounded-xl px-2 py-2 text-center">
                      <p className="text-[11px] text-slate-400">תאריך</p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">
                        {selectedHistoryRide.date}
                      </p>
                    </div>
                  </div>

                  {/* סיכום רכיבה: שדות placeholder עד חיבור לנתונים אמיתיים */}
                  <div className="mv-card mt-4 rounded-xl px-3 py-3">
                    <p className="text-sm font-semibold text-slate-100">
                      סיכום רכיבה
                    </p>
                    <div className="mt-2 space-y-1.5 text-sm text-slate-300">
                      <p>מהירות ממוצעת: —</p>
                      <p>דופק ממוצע: —</p>
                      <p>מזג אוויר: —</p>
                    </div>
                  </div>

                  {/* הערות מקומיות: טקסט חופשי ללא שמירה בשרת */}
                  <div className="mv-card mt-4 rounded-xl px-3 py-3">
                    <p className="text-sm font-semibold text-slate-100">
                      הערות
                    </p>
                    <textarea
                      value={historyRideNotes}
                      onChange={(event) =>
                        setHistoryRideNotes(event.target.value)
                      }
                      placeholder="הוסף הערה קצרה על הרכיבה..."
                      className="mt-2 h-24 w-full resize-none rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                    />
                  </div>

                  {/* שורת פעולות תחתונה: placeholder לשמירה וחזרה להיסטוריה */}
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Button variant="primary" size="md" onClick={() => {}}>
                      שמור כמסלול
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => setSelectedHistoryRide(null)}
                    >
                      חזרה להיסטוריה
                    </Button>
                  </div>
                </GlassCard>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  };

  /**
   * מסך "האופנוע שלי" עם Hero, סטטיסטיקות ותחזוקה.
   * @param {Object} params - מאפייני תצוגה למסך.
   * @param {boolean} params.isRideActive - האם רכיבה פעילה כרגע.
   * @param {boolean} params.isRideMinimized - האם רכיבה פעילה במצב מזעור.
   * @param {(tabKey: "home" | "routes" | "ride" | "history" | "bike") => void} params.onNavigate - ניווט בין טאבים.
   * @returns {JSX.Element} מסך ניהול האופנוע בתצוגת MotoVibe.
   */
  const renderBikeScreen = ({ isRideActive, isRideMinimized, onNavigate }) => (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
      <main className="mt-6 flex-1">
        {renderActiveRideBanner({ isRideActive, isRideMinimized, onNavigate })}

        {/* כותרת ראשית למסך האופנוע */}
        <section>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            האופנוע שלי
          </h1>
          <p className="mt-2 text-base text-slate-300 sm:text-lg">
            ניהול פרטי האופנוע ותחזוקה
          </p>
        </section>

        {/* Hero ראשי עם תחושת תמונה + פעולות מהירות */}
        <section className="mt-6">
          <GlassCard
            title="Yamaha MT-07"
            right={
              <div className="flex items-center gap-2">
                <span className="mv-pill px-2.5 py-1 text-xs font-medium text-emerald-200">
                  תקין
                </span>
                <Button variant="ghost" size="md" className="text-xs">
                  ערוך
                </Button>
              </div>
            }
          >
            <p className="text-sm text-slate-300">2023 • Matte Black</p>

            <div className="relative mt-4 h-44 overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-slate-900/90 via-slate-800/60 to-emerald-900/25">
              {/* רקע דמוי תמונה עם שכבת גריד עדינה + זוהר ירקרק */}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[24px_24px]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(20,184,166,0.18),transparent_55%)]" />

              {bikePhotoPreview ? (
                <img
                  src={bikePhotoPreview}
                  alt="תצוגת אופנוע"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-end p-3">
                  <span className="mv-pill px-2.5 py-1 text-xs text-slate-200">
                    תצוגת תמונת אופנוע
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 flex justify-start">
              <Button
                variant="ghost"
                size="md"
                onClick={() => bikePhotoInputRef.current?.click()}
              >
                העלה תמונה
              </Button>
            </div>

            <input
              ref={bikePhotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }

                if (bikePhotoPreview.startsWith("blob:")) {
                  URL.revokeObjectURL(bikePhotoPreview);
                }

                const localPreviewUrl = URL.createObjectURL(file);
                setBikePhotoPreview(localPreviewUrl);

                /*
                 * בשלב עתידי נחבר כאן העלאה אמיתית לשרת ונשמור URL קבוע.
                 * כרגע זו תצוגה מקומית בלבד לצורך UX.
                 */
              }}
            />
          </GlassCard>
        </section>

        {/* שורת סטטוסים קצרה במראה פרימיום */}
        <section className="mt-4 flex flex-wrap gap-2">
          <span className="mv-pill px-3 py-1 text-xs text-slate-200">
            ק״מ: 12,450
          </span>
          <span className="mv-pill px-3 py-1 text-xs text-slate-200">
            טיפול הבא: 800 ק״מ
          </span>
          <span className="mv-pill px-3 py-1 text-xs text-slate-200">
            צמיגים: 32 PSI
          </span>
        </section>

        {/* בלוק תחזוקה והתראות */}
        <section className="mt-6">
          <h2 className="text-xl font-semibold text-slate-100">
            התראות ותחזוקה
          </h2>

          <div className="mt-4 space-y-3">
            <GlassCard
              title="לחץ אוויר תקין"
              right={
                <span className="mv-pill px-2.5 py-1 text-xs text-emerald-200">
                  תקין
                </span>
              }
            >
              <p className="text-sm text-slate-300">
                הלחץ בגלגלים מאוזן ומתאים לרכיבה יומית.
              </p>
              <div className="mt-3">
                <Button variant="ghost" size="md">
                  בדיקה
                </Button>
              </div>
            </GlassCard>

            <GlassCard
              title="שימון שרשרת"
              right={
                <span className="mv-pill px-2.5 py-1 text-xs text-amber-200">
                  בקרוב
                </span>
              }
            >
              <p className="text-sm text-slate-300">
                מומלץ לבצע שימון ב־150 הק״מ הקרובים.
              </p>
              <div className="mt-3">
                <Button variant="ghost" size="md">
                  סמן כבוצע
                </Button>
              </div>
            </GlassCard>

            <GlassCard
              title="בלמים"
              right={
                <span className="mv-pill px-2.5 py-1 text-xs text-rose-200">
                  דורש תשומת לב
                </span>
              }
            >
              <p className="text-sm text-slate-300">
                נמצאה שחיקה ברפידות, מומלץ לבצע בדיקה בהקדם.
              </p>
              <div className="mt-3">
                <Button variant="ghost" size="md">
                  בדיקה
                </Button>
              </div>
            </GlassCard>
          </div>
        </section>
      </main>
    </div>
  );

  /**
   * Placeholder למסכים שטרם מומשו.
   * @param {string} title - כותרת המסך.
   * @param {string} subtitle - תיאור קצר למסך.
   * @returns {JSX.Element} מסך זכוכית בסיסי עם תוכן זמני.
   */
  const renderPlaceholderScreen = (
    title,
    subtitle,
    { isRideActive, isRideMinimized, onNavigate },
  ) => (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
      <main className="mt-6 flex-1">
        {renderActiveRideBanner({ isRideActive, isRideMinimized, onNavigate })}

        <section>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-base text-slate-300 sm:text-lg">{subtitle}</p>
        </section>

        <section className="mt-6">
          <GlassCard
            title="בקרוב"
            right={<span className="mv-pill px-2.5 py-1 text-xs">Preview</span>}
          >
            <p className="text-sm text-slate-300">
              המסך בתהליך חיבור נתונים ולוגיקה. בינתיים זהו Placeholder ויזואלי
              בלבד.
            </p>
          </GlassCard>
        </section>
      </main>
    </div>
  );

  /* מסך אימות מינימלי: התחברות/הרשמה ושמירת טוקן לזרימת האפליקציה. */
  const renderAuthScreen = ({ isRideActive, isRideMinimized, onNavigate }) => (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
      <main className="mt-6 flex-1">
        {renderActiveRideBanner({ isRideActive, isRideMinimized, onNavigate })}

        <section>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            אימות משתמש
          </h1>
          <p className="mt-2 text-base text-slate-300 sm:text-lg">
            התחבר או הירשם כדי לעבוד עם מסלולים שמורים
          </p>
        </section>

        <section className="mt-6">
          <GlassCard
            title="כניסה"
            right={
              <div className="flex items-center gap-2">
                <Button
                  variant={authMode === "login" ? "primary" : "ghost"}
                  size="md"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError("");
                  }}
                >
                  התחברות
                </Button>
                <Button
                  variant={authMode === "register" ? "primary" : "ghost"}
                  size="md"
                  onClick={() => {
                    setAuthMode("register");
                    setAuthError("");
                  }}
                >
                  הרשמה
                </Button>
              </div>
            }
          >
            <div className="space-y-3">
              {authMode === "register" && (
                <input
                  type="text"
                  value={authName}
                  onChange={(event) => setAuthName(event.target.value)}
                  placeholder="שם מלא"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                />
              )}

              <input
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="אימייל"
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              />

              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="סיסמה"
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              />

              {!!authError && (
                <p className="text-xs text-rose-300">{authError}</p>
              )}

              {/* פעולת שליחה למסלול auth המתאים לפי מצב הטופס. */}
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => submitAuthForm({ onNavigate })}
                >
                  {isAuthSubmitting
                    ? "שולח..."
                    : authMode === "register"
                      ? "צור חשבון"
                      : "התחבר"}
                </Button>
              </div>
            </div>
          </GlassCard>
        </section>
      </main>
    </div>
  );

  return (
    <AppShell onLogout={handleLogout} isAuthenticated={isAuthenticated}>
      {({
        activeTab,
        isRideActive,
        setIsRideActive,
        isRidePaused,
        setIsRidePaused,
        isRideMinimized,
        setIsRideMinimized,
        rideElapsedSeconds,
        onNavigate,
      }) => {
        /* מצב אורח: מציגים מסך אימות מינימלי עד קבלת טוקן. */
        if (showAuthScreen || !isAuthenticated) {
          return renderAuthScreen({
            isRideActive,
            isRideMinimized,
            onNavigate,
          });
        }

        /* מסלול מוצג רק אם התחלנו רכיבה מתוך מסלולים; מעבר רגיל ל-Ride מנקה מסלול. */
        const navigateTo = (tabKey, options = { source: "other" }) => {
          const source = options?.source ?? "other";

          if (tabKey === "ride" && source !== "routeStart") {
            setSelectedRoute(null);
            setDidStartFromRoute(false);
          }

          if (tabKey === "ride" && source === "routeStart") {
            setDidStartFromRoute(true);
          }

          onNavigate(tabKey);
        };

        /* מיפוי תצוגה לפי הטאב הפעיל (ללא Router בשלב זה). */
        if (activeTab === "home") {
          return renderHomeScreen({
            isRideActive,
            isRideMinimized,
            setIsRideActive,
            setIsRidePaused,
            setIsRideMinimized,
            setSelectedRoute,
            setDidStartFromRoute,
            onNavigate: navigateTo,
          });
        }

        if (activeTab === "routes") {
          return renderRoutesScreen({
            isRideActive,
            isRideMinimized,
            setIsRideActive,
            setIsRidePaused,
            setIsRideMinimized,
            setDidStartFromRoute,
            onNavigate: navigateTo,
            mapApiKey: googleMapsApiKey,
            isMapLoaded: isGoogleMapsLoaded,
            mapLoadError: googleMapsLoadError,
          });
        }

        if (activeTab === "ride") {
          return renderRideScreen({
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
            onNavigate: navigateTo,
            mapApiKey: googleMapsApiKey,
            isMapLoaded: isGoogleMapsLoaded,
            mapLoadError: googleMapsLoadError,
          });
        }

        if (activeTab === "history") {
          return renderHistoryScreen({
            isRideActive,
            isRideMinimized,
            onNavigate: navigateTo,
          });
        }

        return renderBikeScreen({
          isRideActive,
          isRideMinimized,
          onNavigate: navigateTo,
        });
      }}
    </AppShell>
  );
}

export default App;
