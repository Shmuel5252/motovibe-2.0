/**
 * useAppState — Facade Hook מרכזי של האפליקציה.
 *
 * אוסף את כל ה-Sub-Hooks ומחזיר אובייקט אחד עם אותם keys כמו מקודם,
 * כך שאף Page לא נשבר.
 *
 * תלויות:
 *   useGoogleMaps  ← apiKey בלבד
 *   useAuth        ← apiClient
 *   useRoutes      ← apiClient, authToken, mapsStatus, handleUnauthorized
 *   useBikes       ← apiClient, authToken, handleUnauthorized
 *   useHistory     ← ללא תלויות
 */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import useGoogleMaps, {
  ISRAEL_DEFAULT_CENTER,
  ISRAEL_DEFAULT_ZOOM,
} from "./hooks/useGoogleMaps";
import useAuth from "./hooks/useAuth";
import useRoutes from "./hooks/useRoutes";
import useBikes from "./hooks/useBikes";
import useHistory from "./hooks/useHistory";

export { ISRAEL_DEFAULT_CENTER, ISRAEL_DEFAULT_ZOOM };

/** תיקון 404: בסיס ה-API חייב להצביע לשרת backend ולא ל-origin של Vite. */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function useAppState() {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  /* יצירת apiClient פעם אחת בלבד לשימוש בכל הקריאות לשרת. */
  const apiClient = useMemo(() => axios.create({ baseURL: API_BASE_URL }), []);

  /* ─── Sub-Hooks ─── */

  const maps = useGoogleMaps(googleMapsApiKey);

  const auth = useAuth(apiClient);

  const routesHook = useRoutes({
    apiClient,
    authToken: auth.authToken,
    isGoogleMapsLoaded: maps.isGoogleMapsLoaded,
    googleMapsLoadError: maps.googleMapsLoadError,
    handleUnauthorized: auth.handleUnauthorized,
  });

  const bikes = useBikes({
    apiClient,
    authToken: auth.authToken,
    handleUnauthorized: auth.handleUnauthorized,
  });

  const history = useHistory({ apiClient, authToken: auth.authToken });

  /* ─── State: פילטרים גלובליים ─── */
  const [selectedChip, setSelectedChip] = useState("הכל");

  /*
   * כלל תצוגה: מסלול נבחר יוצג ב־Ride רק אם ההתחלה הייתה ממסך מסלולים.
   */
  const [didStartFromRoute, setDidStartFromRoute] = useState(false);

  /*
   * המסלול הנבחר לתצוגת פרטים בתוך מסך המסלולים.
   */
  const [selectedRoute, setSelectedRoute] = useState(null);

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

  /* ─── Wiring: submitAuthForm needs fetchRoutesFromServer ─── */
  const submitAuthForm = (opts) =>
    auth.submitAuthForm({
      ...opts,
      fetchRoutes: routesHook.fetchRoutesFromServer,
    });

  /* ─── Return: אותו אובייקט בדיוק כמו קודם ─── */
  return {
    /* Google Maps */
    googleMapsApiKey,
    isGoogleMapsLoaded: maps.isGoogleMapsLoaded,
    googleMapsLoadError: maps.googleMapsLoadError,
    isPlacesSuggestionsReady: maps.isPlacesSuggestionsReady,

    /* Auth */
    authToken: auth.authToken,
    isAuthenticated: auth.isAuthenticated,
    currentUser: auth.currentUser,
    showAuthScreen: auth.showAuthScreen,
    authMode: auth.authMode, setAuthMode: auth.setAuthMode,
    authName: auth.authName, setAuthName: auth.setAuthName,
    authEmail: auth.authEmail, setAuthEmail: auth.setAuthEmail,
    authPassword: auth.authPassword, setAuthPassword: auth.setAuthPassword,
    authError: auth.authError, setAuthError: auth.setAuthError,
    isAuthSubmitting: auth.isAuthSubmitting,
    handleLogout: auth.handleLogout,
    handleUnauthorized: auth.handleUnauthorized,
    submitAuthForm,

    /* Routes */
    routes: routesHook.routes, setRoutes: routesHook.setRoutes,
    selectedRoute, setSelectedRoute,
    routesView, setRoutesView,
    goToRoutesListView,
    isRoutesLoading: routesHook.isRoutesLoading,
    routesLoadError: routesHook.routesLoadError,
    routesSearchQuery: routesHook.routesSearchQuery, setRoutesSearchQuery: routesHook.setRoutesSearchQuery,
    selectedRoutesFilter: routesHook.selectedRoutesFilter, setSelectedRoutesFilter: routesHook.setSelectedRoutesFilter,
    isRoutesFilterMenuOpen: routesHook.isRoutesFilterMenuOpen, setIsRoutesFilterMenuOpen: routesHook.setIsRoutesFilterMenuOpen,
    fetchRoutesFromServer: routesHook.fetchRoutesFromServer,
    normalizeRouteFromServer: routesHook.normalizeRouteFromServer,
    routesFilterOptions: routesHook.routesFilterOptions,
    filterChips: routesHook.filterChips,
    recentRoutes: routesHook.recentRoutes,
    getRouteLengthCategory: routesHook.getRouteLengthCategory,
    getAdjustedDifficultyForTwisty: routesHook.getAdjustedDifficultyForTwisty,
    getRoutePolylinePath: maps.getRoutePolylinePath,
    isValidMapPoint: maps.isValidMapPoint,
    getSafePolylinePath: maps.getSafePolylinePath,

    /* New Route Form */
    newRouteTitle: routesHook.newRouteTitle, setNewRouteTitle: routesHook.setNewRouteTitle,
    newOriginLabel: routesHook.newOriginLabel, setNewOriginLabel: routesHook.setNewOriginLabel,
    newOriginLatLng: routesHook.newOriginLatLng, setNewOriginLatLng: routesHook.setNewOriginLatLng,
    newDestinationLabel: routesHook.newDestinationLabel, setNewDestinationLabel: routesHook.setNewDestinationLabel,
    newDestinationLatLng: routesHook.newDestinationLatLng, setNewDestinationLatLng: routesHook.setNewDestinationLatLng,
    newRouteType: routesHook.newRouteType, setNewRouteType: routesHook.setNewRouteType,
    newRouteDifficulty: routesHook.newRouteDifficulty, setNewRouteDifficulty: routesHook.setNewRouteDifficulty,
    newRouteIsTwisty: routesHook.newRouteIsTwisty, setNewRouteIsTwisty: routesHook.setNewRouteIsTwisty,
    isAddRouteExpanded: routesHook.isAddRouteExpanded, setIsAddRouteExpanded: routesHook.setIsAddRouteExpanded,
    activeMapPickField: routesHook.activeMapPickField, setActiveMapPickField: routesHook.setActiveMapPickField,
    mapPickCenter: routesHook.mapPickCenter, setMapPickCenter: routesHook.setMapPickCenter,
    mapPickStatus: routesHook.mapPickStatus, setMapPickStatus: routesHook.setMapPickStatus,
    mapPickRequestIdRef: routesHook.mapPickRequestIdRef,
    originSuggestions: routesHook.originSuggestions, setOriginSuggestions: routesHook.setOriginSuggestions,
    destinationSuggestions: routesHook.destinationSuggestions, setDestinationSuggestions: routesHook.setDestinationSuggestions,
    activeSuggestionField: routesHook.activeSuggestionField, setActiveSuggestionField: routesHook.setActiveSuggestionField,
    newRouteLocationError: routesHook.newRouteLocationError, setNewRouteLocationError: routesHook.setNewRouteLocationError,

    /* Bikes */
    bikes: bikes.bikes,
    bikesLoading: bikes.bikesLoading,
    bikesError: bikes.bikesError,
    fetchBikesFromServer: bikes.fetchBikesFromServer,
    bikePhotoPreview: bikes.bikePhotoPreview, setBikePhotoPreview: bikes.setBikePhotoPreview,
    bikePhotoInputRef: bikes.bikePhotoInputRef,

    /* History */
    historyRides: history.historyRides,
    historyLoading: history.historyLoading,
    historyError: history.historyError,
    fetchHistoryFromServer: history.fetchHistoryFromServer,
    historyFilters: history.historyFilters,
    selectedHistoryFilter: history.selectedHistoryFilter, setSelectedHistoryFilter: history.setSelectedHistoryFilter,
    isHistoryFilterMenuOpen: history.isHistoryFilterMenuOpen, setIsHistoryFilterMenuOpen: history.setIsHistoryFilterMenuOpen,
    selectedHistoryRide: history.selectedHistoryRide, setSelectedHistoryRide: history.setSelectedHistoryRide,
    historyRideNotes: history.historyRideNotes, setHistoryRideNotes: history.setHistoryRideNotes,
    searchQuery: history.searchQuery, setSearchQuery: history.setSearchQuery,

    /* Ride */
    didStartFromRoute, setDidStartFromRoute,

    /* Misc */
    selectedChip, setSelectedChip,
    apiClient,
  };
}
