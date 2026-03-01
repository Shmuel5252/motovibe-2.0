/**
 * RoutesPage — מסך המסלולים.
 * מכיל את RouteDetailsMap כרכיב עזר פנימי.
 * רכיב Stateless: מקבל את כל הנתונים וה-Handlers כ-Props מ-App.jsx.
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
import { ISRAEL_DEFAULT_CENTER, ISRAEL_DEFAULT_ZOOM } from "../app/state/useAppState";

/* ─── ActiveRideBanner ─── */

function ActiveRideBanner({ isRideActive, isRideMinimized, onNavigate }) {
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
}

/* ─── RouteDetailsMap ─── */

/**
 * מפה למסך פרטי מסלול עם קו מסלול (Polyline) ו-Directions API.
 */
function RouteDetailsMap({
  apiKey,
  path,
  onBack,
  isMapLoaded,
  mapLoadError,
  preferredOrigin,
  preferredDestination,
  isValidMapPoint,
  getSafePolylinePath,
}) {
  const [mapInstance, setMapInstance] = useState(null);
  const [directionsResult, setDirectionsResult] = useState(null);
  const [directionsStatus, setDirectionsStatus] = useState("ממתין...");
  const [directionsErrorMessage, setDirectionsErrorMessage] = useState("");

  const normalizedApiKey = apiKey?.trim() ?? "";

  /* בטיחות Polyline: אם הנתיב לא תקין, לא מציירים קו. */
  const safePath = getSafePolylinePath(path);
  const selectedOrigin = isValidMapPoint(preferredOrigin) ? preferredOrigin : null;
  const selectedDestination = isValidMapPoint(preferredDestination) ? preferredDestination : null;

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
    console.log("Directions request", { origin, destination, travelMode: "DRIVING" });

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
          result?.error_message || result?.status_message || "לא התקבלה תגובה תקינה",
        );
      });
    } catch {
      setDirectionsResult(null);
      setDirectionsStatus("EXCEPTION");
      setDirectionsErrorMessage("שגיאה פנימית בהפעלת Directions");
    }
  }, [normalizedApiKey, isMapLoaded, mapInstance, selectedOrigin, selectedDestination]);

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

/* ─── RoutesPage ─── */

/**
 * @param {Object} props - כל ה-Props עוברים מ-App.jsx דרך useAppState.
 */
export default function RoutesPage({
  /* ride state */
  isRideActive,
  isRideMinimized,
  setIsRideActive,
  setIsRidePaused,
  setIsRideMinimized,
  setDidStartFromRoute,
  onNavigate,
  /* map props */
  mapApiKey,
  isMapLoaded,
  mapLoadError,
  /* routes state */
  routes,
  selectedRoute,
  setSelectedRoute,
  routesView,
  setRoutesView,
  goToRoutesListView,
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
  /* new route form */
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
  isPlacesSuggestionsReady,
  handleUnauthorized,
}) {
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
    const matchesSearch = route.title.toLowerCase().includes(normalizedSearch);
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

  /* ─── תצוגת פרטי מסלול ─── */
  const [routeDeleteError, setRouteDeleteError] = useState("");

  if (routesView === "routeDetails" && selectedRoute) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
        <main className="mt-6 flex-1">
          <ActiveRideBanner
            isRideActive={isRideActive}
            isRideMinimized={isRideMinimized}
            onNavigate={onNavigate}
          />

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

          {/* הצגת תמונת המסלול אם צורפה */}
          {selectedRoute?.imageUrl && (
            <section className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <img
                src={selectedRoute.imageUrl}
                alt="תמונת מסלול"
                className="h-56 w-full object-cover sm:h-72"
              />
            </section>
          )}

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
                  selectedRoute?.destination || selectedRoute?.toLatLng || null
                }
                isValidMapPoint={isValidMapPoint}
                getSafePolylinePath={getSafePolylinePath}
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

          {/* פעולות: התחלת רכיבה, מחיקה, חזרה */}
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

              {/* מחיקת מסלול */}
              <Button
                variant="ghost"
                size="md"
                className="border-rose-300/30 text-rose-300 hover:text-rose-200"
                onClick={async () => {
                  if (!window.confirm("האם אתה בטוח שברצונך למחוק מסלול זה?")) return;
                  setRouteDeleteError("");
                  const routeId = selectedRoute._id || selectedRoute.id;
                  try {
                    await apiClient.delete(`/routes/${routeId}`);
                    await fetchRoutesFromServer(authToken);
                    goToRoutesListView();
                  } catch (err) {
                    console.error("DELETE route error:", err?.response?.status, err?.message);
                    setRouteDeleteError("שגיאה במחיקת מסלול");
                  }
                }}
              >
                מחק מסלול
              </Button>

              <Button variant="ghost" size="md" onClick={goToRoutesListView}>
                חזרה למסלולים
              </Button>
            </div>
            {/* שגיאת מחיקה inline */}
            {routeDeleteError && (
              <p className="mt-2 text-xs text-rose-300">{routeDeleteError}</p>
            )}
          </section>
        </main>
      </div>
    );
  }

  /* ─── תצוגת רשימת מסלולים ─── */
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
      <main className="mt-6 flex-1">
        <ActiveRideBanner
          isRideActive={isRideActive}
          isRideMinimized={isRideMinimized}
          onNavigate={onNavigate}
        />

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
                      {isPlacesDebugReady ? "Places: פעיל" : "Places: לא נטען"}
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
                      onChange={(event) => setNewRouteType(event.target.value)}
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
                              ? getAdjustedDifficultyForTwisty(newRouteDifficulty)
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
                          mapContainerStyle={{ width: "100%", height: "100%" }}
                          onLoad={() => { }}
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
                          className={`mv-pill px-2.5 py-1 text-xs ${mapPickStatus === "מחפש מיקום..."
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
}
