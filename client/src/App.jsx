/**
 * App.jsx — נקודת הכניסה הראשית לאפליקציה.
 *
 * קובץ זה מתפקד כשכבת תיאום בלבד:
 * - useAppState: כל ה-State, Logic ו-Side Effects
 * - AppShell: ניווט (TopBar, BottomNav, SideDrawer)
 * - Pages: מסכים נפרדים ב-src/pages/
 *
 * ללא React Router — הניווט מבוסס activeTab שמנוהל ב-AppShell.
 */

import { useEffect, useRef } from "react";
import useAppState from "./app/state/useAppState";
import AppShell from "./app/layouts/AppShell";
import HomePage from "./pages/HomePage";
import RoutesPage from "./pages/RoutesPage";
import ActivityPage from "./pages/ActivityPage";
import RidePage from "./pages/RidePage";
import MyBikePage from "./pages/MyBikePage";
import CommunityHubPage from "./pages/CommunityHubPage";
import { AuthScreen } from "./pages/SettingsPage";

/* ─── LoadingSplash ─── */

/** מסך טעינה ראשוני — מוצג עד לסיום הידרציית משתמש */
function LoadingSplash() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-[#020617]">
      {/* ספינר אמרלד */}
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-emerald-500/30 border-t-emerald-400" />
      {/* שם מותג */}
      <p className="text-lg font-bold tracking-widest text-emerald-300">
        MotoVibe
      </p>
    </div>
  );
}

/* ─── BikeTabLoader ─── */

/**
 * רכיב עזר שטוען נתוני אופנועים רק פעם אחת בכניסה לטאב bike.
 * מוצב מחוץ לכל מסך כדי לא לגרום ל-rerender בכל מסך.
 */
function BikeTabLoader({ activeTab, isAuthenticated, onLoad }) {
  const wasBikeTabRef = useRef(false);

  useEffect(() => {
    const isBikeTab = activeTab === "bike";

    if (isAuthenticated && isBikeTab && !wasBikeTabRef.current) {
      onLoad();
    }

    wasBikeTabRef.current = isBikeTab;
  }, [activeTab, isAuthenticated, onLoad]);

  return null;
}

/* ─── App ─── */

/**
 * מסך האפליקציה הראשי.
 * רינדור המסך מתבצע לפי activeTab שמנוהל ב־AppShell (ללא Router בשלב זה).
 */
function App() {
  /* כל ה-state וה-handlers של האפליקציה מגיעים מ-useAppState. */
  const state = useAppState();

  /* הידרציה בעת הטעינה: Promise.all לטעינה מקבילה ו-isInitializing=false בסיום */
  useEffect(() => {
    if (!state.authToken) {
      /* אין טוקן — אין מה לטעון, ישר למסך אימות */
      state.setIsInitializing(false);
      return;
    }

    (async () => {
      try {
        await Promise.all([
          state.fetchRoutesFromServer(state.authToken),
          state.fetchBikesFromServer(state.authToken),
        ]);
      } finally {
        /* מסיים טעינה בין אם הצליח בין אם נכשל (401 יטופל ע"י האינטרספטור) */
        state.setIsInitializing(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ספלש טעינה ראשוני */
  if (state.isInitializing) return <LoadingSplash />;

  /* מצב אורח: מסך אימות ללא מעטפת ניווט (TopNav / BottomNav) */
  if (state.showAuthScreen || !state.isAuthenticated) {
    return (
      <AuthScreen
        authMode={state.authMode}
        setAuthMode={state.setAuthMode}
        authName={state.authName}
        setAuthName={state.setAuthName}
        authEmail={state.authEmail}
        setAuthEmail={state.setAuthEmail}
        authPassword={state.authPassword}
        setAuthPassword={state.setAuthPassword}
        authError={state.authError}
        setAuthError={state.setAuthError}
        isAuthSubmitting={state.isAuthSubmitting}
        submitAuthForm={state.submitAuthForm}
      />
    );
  }

  return (
    <AppShell
      onLogout={state.handleLogout}
      isAuthenticated={state.isAuthenticated}
    >
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
        /* טוען אופנועים פעם אחת בכניסה לטאב bike. */
        const bikeTabLoader = (
          <BikeTabLoader
            activeTab={activeTab}
            isAuthenticated={state.isAuthenticated}
            onLoad={() => state.fetchBikesFromServer()}
          />
        );

        /*
         * navigateTo — מעטפת ניווט עם לוגיקה של מסלול/מקור.
         * מסלול מוצג רק אם התחלנו רכיבה מתוך מסלולים;
         * מעבר רגיל ל-Ride מנקה מסלול.
         */
        const navigateTo = (tabKey, options = { source: "other" }) => {
          const source = options?.source ?? "other";

          if (tabKey === "ride" && source !== "routeStart") {
            state.setSelectedRoute(null);
            state.setDidStartFromRoute(false);
          }

          if (tabKey === "ride" && source === "routeStart") {
            state.setDidStartFromRoute(true);
          }

          onNavigate(tabKey);
        };

        /* מיפוי תצוגה לפי הטאב הפעיל (ללא Router בשלב זה). */

        if (activeTab === "home") {
          return (
            <>
              {bikeTabLoader}
              <HomePage
                currentUser={state.currentUser}
                historyRides={state.historyRides}
                recentRoutes={state.recentRoutes}
                isRideActive={isRideActive}
                isRideMinimized={isRideMinimized}
                setIsRideActive={setIsRideActive}
                setIsRidePaused={setIsRidePaused}
                setIsRideMinimized={setIsRideMinimized}
                setSelectedRoute={state.setSelectedRoute}
                setDidStartFromRoute={state.setDidStartFromRoute}
                onNavigate={navigateTo}
                bikes={state.bikes}
                fetchBikesFromServer={state.fetchBikesFromServer}
              />
            </>
          );
        }

        if (activeTab === "routes") {
          /* Route detail view: keep full-screen RoutesPage detail */
          if (state.routesView === "routeDetails" && state.selectedRoute) {
            return (
              <>
                {bikeTabLoader}
                <RoutesPage
                  /* ride state */
                  isRideActive={isRideActive}
                  isRideMinimized={isRideMinimized}
                  setIsRideActive={setIsRideActive}
                  setIsRidePaused={setIsRidePaused}
                  setIsRideMinimized={setIsRideMinimized}
                  setDidStartFromRoute={state.setDidStartFromRoute}
                  onNavigate={navigateTo}
                  /* map props */
                  mapApiKey={state.googleMapsApiKey}
                  isMapLoaded={state.isGoogleMapsLoaded}
                  mapLoadError={state.googleMapsLoadError}
                  /* routes state */
                  routes={state.routes}
                  selectedRoute={state.selectedRoute}
                  setSelectedRoute={state.setSelectedRoute}
                  routesView={state.routesView}
                  setRoutesView={state.setRoutesView}
                  goToRoutesListView={state.goToRoutesListView}
                  isRoutesLoading={state.isRoutesLoading}
                  routesLoadError={state.routesLoadError}
                  routesSearchQuery={state.routesSearchQuery}
                  setRoutesSearchQuery={state.setRoutesSearchQuery}
                  selectedRoutesFilter={state.selectedRoutesFilter}
                  setSelectedRoutesFilter={state.setSelectedRoutesFilter}
                  isRoutesFilterMenuOpen={state.isRoutesFilterMenuOpen}
                  setIsRoutesFilterMenuOpen={state.setIsRoutesFilterMenuOpen}
                  routesFilterOptions={state.routesFilterOptions}
                  getRouteLengthCategory={state.getRouteLengthCategory}
                  getAdjustedDifficultyForTwisty={
                    state.getAdjustedDifficultyForTwisty
                  }
                  getRoutePolylinePath={state.getRoutePolylinePath}
                  isValidMapPoint={state.isValidMapPoint}
                  getSafePolylinePath={state.getSafePolylinePath}
                  fetchRoutesFromServer={state.fetchRoutesFromServer}
                  authToken={state.authToken}
                  apiClient={state.apiClient}
                  /* new route form */
                  newRouteTitle={state.newRouteTitle}
                  setNewRouteTitle={state.setNewRouteTitle}
                  newOriginLabel={state.newOriginLabel}
                  setNewOriginLabel={state.setNewOriginLabel}
                  newOriginLatLng={state.newOriginLatLng}
                  setNewOriginLatLng={state.setNewOriginLatLng}
                  newDestinationLabel={state.newDestinationLabel}
                  setNewDestinationLabel={state.setNewDestinationLabel}
                  newDestinationLatLng={state.newDestinationLatLng}
                  setNewDestinationLatLng={state.setNewDestinationLatLng}
                  newRouteType={state.newRouteType}
                  setNewRouteType={state.setNewRouteType}
                  newRouteDifficulty={state.newRouteDifficulty}
                  setNewRouteDifficulty={state.setNewRouteDifficulty}
                  newRouteIsTwisty={state.newRouteIsTwisty}
                  setNewRouteIsTwisty={state.setNewRouteIsTwisty}
                  isAddRouteExpanded={state.isAddRouteExpanded}
                  setIsAddRouteExpanded={state.setIsAddRouteExpanded}
                  activeMapPickField={state.activeMapPickField}
                  setActiveMapPickField={state.setActiveMapPickField}
                  mapPickCenter={state.mapPickCenter}
                  setMapPickCenter={state.setMapPickCenter}
                  mapPickStatus={state.mapPickStatus}
                  setMapPickStatus={state.setMapPickStatus}
                  mapPickRequestIdRef={state.mapPickRequestIdRef}
                  originSuggestions={state.originSuggestions}
                  setOriginSuggestions={state.setOriginSuggestions}
                  destinationSuggestions={state.destinationSuggestions}
                  setDestinationSuggestions={state.setDestinationSuggestions}
                  activeSuggestionField={state.activeSuggestionField}
                  setActiveSuggestionField={state.setActiveSuggestionField}
                  newRouteLocationError={state.newRouteLocationError}
                  setNewRouteLocationError={state.setNewRouteLocationError}
                  isPlacesSuggestionsReady={state.isPlacesSuggestionsReady}
                  handleUnauthorized={state.handleUnauthorized}
                />
              </>
            );
          }

          /* Default: unified Activity dashboard */
          return (
            <>
              {bikeTabLoader}
              <ActivityPage
                /* ride state */
                isRideActive={isRideActive}
                isRideMinimized={isRideMinimized}
                setIsRideActive={setIsRideActive}
                setIsRidePaused={setIsRidePaused}
                setIsRideMinimized={setIsRideMinimized}
                setDidStartFromRoute={state.setDidStartFromRoute}
                onNavigate={navigateTo}
                /* map props */
                mapApiKey={state.googleMapsApiKey}
                isMapLoaded={state.isGoogleMapsLoaded}
                mapLoadError={state.googleMapsLoadError}
                /* routes props */
                routes={state.routes}
                selectedRoute={state.selectedRoute}
                setSelectedRoute={state.setSelectedRoute}
                isRoutesLoading={state.isRoutesLoading}
                routesLoadError={state.routesLoadError}
                routesSearchQuery={state.routesSearchQuery}
                setRoutesSearchQuery={state.setRoutesSearchQuery}
                selectedRoutesFilter={state.selectedRoutesFilter}
                setSelectedRoutesFilter={state.setSelectedRoutesFilter}
                isRoutesFilterMenuOpen={state.isRoutesFilterMenuOpen}
                setIsRoutesFilterMenuOpen={state.setIsRoutesFilterMenuOpen}
                routesFilterOptions={state.routesFilterOptions}
                getRouteLengthCategory={state.getRouteLengthCategory}
                getAdjustedDifficultyForTwisty={
                  state.getAdjustedDifficultyForTwisty
                }
                getRoutePolylinePath={state.getRoutePolylinePath}
                isValidMapPoint={state.isValidMapPoint}
                getSafePolylinePath={state.getSafePolylinePath}
                fetchRoutesFromServer={state.fetchRoutesFromServer}
                authToken={state.authToken}
                apiClient={state.apiClient}
                /* new route form */
                newRouteTitle={state.newRouteTitle}
                setNewRouteTitle={state.setNewRouteTitle}
                newOriginLabel={state.newOriginLabel}
                setNewOriginLabel={state.setNewOriginLabel}
                newOriginLatLng={state.newOriginLatLng}
                setNewOriginLatLng={state.setNewOriginLatLng}
                newDestinationLabel={state.newDestinationLabel}
                setNewDestinationLabel={state.setNewDestinationLabel}
                newDestinationLatLng={state.newDestinationLatLng}
                setNewDestinationLatLng={state.setNewDestinationLatLng}
                newRouteType={state.newRouteType}
                setNewRouteType={state.setNewRouteType}
                newRouteDifficulty={state.newRouteDifficulty}
                setNewRouteDifficulty={state.setNewRouteDifficulty}
                newRouteIsTwisty={state.newRouteIsTwisty}
                setNewRouteIsTwisty={state.setNewRouteIsTwisty}
                isAddRouteExpanded={state.isAddRouteExpanded}
                setIsAddRouteExpanded={state.setIsAddRouteExpanded}
                activeMapPickField={state.activeMapPickField}
                setActiveMapPickField={state.setActiveMapPickField}
                mapPickCenter={state.mapPickCenter}
                setMapPickCenter={state.setMapPickCenter}
                mapPickStatus={state.mapPickStatus}
                setMapPickStatus={state.setMapPickStatus}
                mapPickRequestIdRef={state.mapPickRequestIdRef}
                originSuggestions={state.originSuggestions}
                setOriginSuggestions={state.setOriginSuggestions}
                destinationSuggestions={state.destinationSuggestions}
                setDestinationSuggestions={state.setDestinationSuggestions}
                activeSuggestionField={state.activeSuggestionField}
                setActiveSuggestionField={state.setActiveSuggestionField}
                newRouteLocationError={state.newRouteLocationError}
                setNewRouteLocationError={state.setNewRouteLocationError}
                isPlacesSuggestionsReady={state.isPlacesSuggestionsReady}
                handleUnauthorized={state.handleUnauthorized}
                /* history props */
                historyRides={state.historyRides}
                historyFilters={state.historyFilters}
                selectedHistoryFilter={state.selectedHistoryFilter}
                setSelectedHistoryFilter={state.setSelectedHistoryFilter}
                isHistoryFilterMenuOpen={state.isHistoryFilterMenuOpen}
                setIsHistoryFilterMenuOpen={state.setIsHistoryFilterMenuOpen}
                selectedHistoryRide={state.selectedHistoryRide}
                setSelectedHistoryRide={state.setSelectedHistoryRide}
                historyRideNotes={state.historyRideNotes}
                setHistoryRideNotes={state.setHistoryRideNotes}
                searchQuery={state.searchQuery}
                setSearchQuery={state.setSearchQuery}
                fetchHistoryFromServer={state.fetchHistoryFromServer}
              />
            </>
          );
        }

        if (activeTab === "community") {
          return (
            <CommunityHubPage
              apiClient={state.apiClient}
              authToken={state.authToken}
              onViewRoute={(route) => {
                state.setSelectedRoute(route);
                state.setRoutesView("routeDetails");
                onNavigate("routes");
              }}
            />
          );
        }

        if (activeTab === "ride") {
          return (
            <>
              {bikeTabLoader}
              <RidePage
                isRideActive={isRideActive}
                isRidePaused={isRidePaused}
                isRideMinimized={isRideMinimized}
                rideElapsedSeconds={rideElapsedSeconds}
                setIsRideActive={setIsRideActive}
                setIsRidePaused={setIsRidePaused}
                setIsRideMinimized={setIsRideMinimized}
                selectedRoute={state.selectedRoute}
                didStartFromRoute={state.didStartFromRoute}
                setDidStartFromRoute={state.setDidStartFromRoute}
                onNavigate={navigateTo}
                mapApiKey={state.googleMapsApiKey}
                isMapLoaded={state.isGoogleMapsLoaded}
                mapLoadError={state.googleMapsLoadError}
                apiClient={state.apiClient}
                fetchHistoryFromServer={state.fetchHistoryFromServer}
                fetchBikesFromServer={state.fetchBikesFromServer}
              />
            </>
          );
        }

        /* ברירת מחדל — טאב bike */
        return (
          <>
            {bikeTabLoader}
            <MyBikePage
              isRideActive={isRideActive}
              isRideMinimized={isRideMinimized}
              onNavigate={navigateTo}
              /* bike data */
              bikes={state.bikes}
              bikesLoading={state.bikesLoading}
              bikesError={state.bikesError}
              createBike={state.createBike}
              updateBike={state.updateBike}
              deleteBike={state.deleteBike}
              /* maintenance data */
              maintenanceLogs={state.maintenanceLogs}
              maintenanceLoading={state.maintenanceLoading}
              fetchMaintenance={state.fetchMaintenance}
              addMaintenanceLog={state.addMaintenanceLog}
              deleteMaintenanceLog={state.deleteMaintenanceLog}
              /* photo */
              bikePhotoPreview={state.bikePhotoPreview}
              setBikePhotoPreview={state.setBikePhotoPreview}
              bikePhotoInputRef={state.bikePhotoInputRef}
              apiClient={state.apiClient}
              fetchBikesFromServer={state.fetchBikesFromServer}
            />
          </>
        );
      }}
    </AppShell>
  );
}

export default App;
