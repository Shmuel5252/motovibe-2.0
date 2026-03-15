# MotoVibe 2.0 — Full Technical Documentation

> **Project:** MotoVibe 2.0  
> **Type:** Full-Stack Web Application  
> **Stack:** React 19 · Node.js/Express · MongoDB · Socket.io · Google Maps API  
> **Date:** March 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [User Flows](#2-user-flows)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Design](#5-database-design)
6. [External Integrations](#6-external-integrations)
7. [Security](#7-security)
8. [Special Features](#8-special-features)
9. [Development Process](#9-development-process)

---

## 1. System Overview

MotoVibe is a motorcycle riding companion platform. It is designed for motorcycle enthusiasts who want to plan routes, track their rides with live GPS, manage their motorcycle's maintenance history, and connect with other riders through a community hub.

### What the system does — from the user's perspective

A user opens MotoVibe in any modern browser. After creating an account (or signing in with Google), the application presents a dashboard-style interface with a bottom navigation bar on mobile and a sidebar drawer for expanded navigation.

The user can:

- **Plan a route** by entering a starting point and destination, selecting a route type (urban, intercity, off-road, scenic), a difficulty level, and other characteristics. The system automatically calculates the distance and estimated travel time using Google Maps.
- **Start a ride** on a selected route or a "free ride" (no predefined route). During the ride, a full-screen cockpit shows a live speedometer (SVG arc gauge), distance traveled, elapsed time, GPS accuracy, and current weather. The user can pause and resume the ride, minimize it to a floating widget, or finish it.
- **Save ride history.** When the ride ends, the GPS track is stored, the duration and distance are recorded, and the motorcycle's odometer is automatically updated. Past rides are browsable in a history page with a map overlay of the GPS track.
- **Manage their motorcycle.** The user can add their bike details (make, model, year, odometer, engine size, MOT/test validity), upload a photo, and log every maintenance event (oil change, chain service, brakes, etc.) with date, odometer reading, and cost. The system alerts the user when service intervals are approaching.
- **Discover public routes.** The community hub shows routes shared publicly by other riders, filterable by type, difficulty, and twisty-roads preference.
- **Join or organize group rides.** Users can create a group ride event with a date, description, participant limit, and optional route. Other users can join or leave. The organizer can edit or cancel the event.
- **Receive real-time notifications.** A bell icon in the top bar shows unread alerts: maintenance due reminders, MOT expiry warnings, mileage-triggered service alerts, new public routes, and new group ride events posted by the community.

---

## 2. User Flows

### 2.1 Registration and Login

```
User visits the app
       │
       ▼
  Not authenticated?
       │
       ▼
 AuthScreen appears
  ┌─────────────────────────────┐
  │  Tab: Login | Register      │
  └─────────────────────────────┘
       │
  ┌────▼───────────────────────────────────────────────┐
  │  REGISTER                                          │
  │  1. Enter name, email, password, confirm password  │
  │  2. Live password strength checklist validates:    │
  │     - Min 8 characters                             │
  │     - Uppercase letter                             │
  │     - Lowercase letter                             │
  │     - Special character                            │
  │  3. Submit → POST /api/auth/register               │
  │  4. Server hashes password (bcrypt) → creates User │
  │  5. Server returns { token, user }                 │
  │  6. Token saved in sessionStorage                  │
  │  7. App loads routes + bikes → shows main UI       │
  └────────────────────────────────────────────────────┘
       │
  ┌────▼────────────────────────────────────────────────┐
  │  LOGIN                                              │
  │  1. Enter email + password                          │
  │  2. Submit → POST /api/auth/login                   │
  │  3. Server verifies bcrypt hash                     │
  │  4. Returns { token, user }                         │
  │  5. Token saved → main UI                           │
  └─────────────────────────────────────────────────────┘
       │
  ┌────▼────────────────────────────────────────────────┐
  │  GOOGLE OAUTH                                       │
  │  1. Click "Continue with Google" button             │
  │  2. Browser redirects to GET /api/auth/google       │
  │  3. Server redirects to Google sign-in page         │
  │  4. Google redirects back to /api/auth/google/      │
  │     callback with auth code                         │
  │  5. Server verifies, finds or creates User record   │
  │  6. Server redirects to frontend /?token=<jwt>      │
  │  7. Client reads token from URL, calls /auth/me     │
  │  8. URL cleaned, main UI shown                      │
  └─────────────────────────────────────────────────────┘
```

---

### 2.2 Creating a Route

```
User navigates to "Routes" tab
       │
       ▼
Click "Add Route" (expands inline form)
       │
       ▼
Fill in:
  - Route title
  - Origin (text search with Google Places autocomplete
           OR tap a point on the embedded map)
  - Destination (same)
  - Route type: Urban / Intercity / Off-road / Scenic
  - Difficulty: Easy / Medium / Hard
  - Twisty roads toggle (yes/no)
  - Visibility: Private / Shared / Friends / Public
       │
       ▼
Submit → POST /api/directions/compute (server-side)
  → Google Maps Directions API called from server
  → Returns: distanceKm, etaMinutes, encoded polyline
       │
       ▼
POST /api/routes with all fields + directions result
       │
       ▼
Route saved in database
  ├─ If visibility = "public":
  │    Global notification created: "New public route"
  │    Real-time push emitted to all connected users
  └─ Route appears in user's route list immediately
```

---

### 2.3 Starting a Ride

```
User navigates to "Ride" tab
       │
       ▼
RideControlCenter screen appears:
  - GPS status checked (navigator.geolocation)
  - Current weather fetched (OpenWeatherMap API)
  - Map shows current location or selected route
       │
  ┌────▼─────────────────────────────────────────┐
  │  Choose mode:                                │
  │  A) Free Ride (no route)                     │
  │  B) Route Ride (select from saved routes)    │
  └────────────────────────────────────────────  ┘
       │
       ▼
Click "Start Ride"
  → POST /api/rides/start (with optional routeId)
  → Server checks: no active ride already exists
  → Server creates Ride document:
      { startedAt: now, endedAt: null, routeSnapshot: {...} }
       │
       ▼
RideActiveCockpit appears (fullscreen):
  ┌──────────────────────────────────────────────┐
  │  • SVG Speedometer arc gauge (0–200 km/h)    │
  │  • Live GPS speed via watchPosition          │
  │  • Live distance accumulation (Haversine)    │
  │  • Elapsed time counter (HH:MM:SS)           │
  │  • Max speed recorded                        │
  │  • Remaining distance / ETA from snapshot    │
  │  • Weather tile (temp + icon)                │
  │  • GPS accuracy indicator                    │
  │  • Navigation buttons (Waze / Google Maps)   │
  │  • Pause / Finish buttons                    │
  └──────────────────────────────────────────────┘
       │
       ├─ Pause → timer stops, GPS still watches
       ├─ Minimize → floating pill widget on any tab
       └─ Finish → see 2.4
```

---

### 2.4 Saving Ride History

```
User clicks "Finish" on cockpit
       │
       ▼
POST /api/rides/stop
  Server performs:
  ├─ Computes durationSeconds (endedAt - startedAt)
  ├─ Saves GPS path array (max 2,000 points, validated)
  ├─ Updates user's first bike's currentOdometerKm
  │    (adds ride distance to current odometer)
  ├─ Checks mileageAlerts on the bike:
  │    If odometer >= any alert's targetKm:
  │      → Sends personal notification to user
  │      → Auto-increments targetKm by +10,000 km
  └─ Returns the completed Ride document
       │
       ▼
Client navigates away from cockpit
       │
       ▼
User opens "History" (or "Activity") tab
       │
       ▼
GET /api/rides/history → last 50 completed rides
       │
       ▼
History list shows:
  - Ride title (user-set name, or route name, or default)
  - Date (DD.MM.YY)
  - Duration (formatted)
  - Distance (from routeSnapshot or Haversine calculation)
  - Optional photo
       │
       ▼
Click any ride → Detail modal with:
  - GPS track on Google Map (emerald polyline)
  - Start (A) and End (B) markers
  - Stats: distance, duration, date
  - Name editing field
  - "Convert to Route" button
       │
       ▼
"Convert to Route":
  Uses routeSnapshot data → creates a new Route document
  User can now reuse this ride as a named, saved route
```

---

### 2.5 Public Routes

```
User navigates to "Community Hub" tab
       │
       ▼
"Community Routes" tab selected
       │
       ▼
GET /api/routes/public
  (No authentication required)
  Optional query filters:
    ?routeType=scenic
    ?difficulty=easy
    ?isTwisty=true
       │
       ▼
User sees list of public routes with:
  - Title
  - Distance and ETA
  - Route type and difficulty badge
  - Twisty roads flag
       │
       ▼
"View Route" → detail modal (textual, start/end labels)
       │
       ▼
Filtering chips available:
  - Type: Urban / Intercity / Off-road / Scenic
  - Difficulty: Easy / Medium / Hard

         ┌──────────────────────────────────────────┐
         │  When any user publishes a route:        │
         │  Server creates a global Notification    │
         │  → emitted via Socket.io to ALL users    │
         │  → Bell icon badge increments instantly  │
         └──────────────────────────────────────────┘
```

---

### 2.6 Group Ride Feature

```
  ┌─────────────────────────────────────────────────────────┐
  │  CREATING A GROUP RIDE                                  │
  │  User navigates to Community Hub → "Group Rides" tab    │
  │  Click "Create Event"                                   │
  │  Fill in:                                               │
  │    - Title                                              │
  │    - Date and time                                      │
  │    - Description                                        │
  │    - Max participants (blank = unlimited)               │
  │    - Optional: link to one of the user's saved routes   │
  │  Submit → POST /api/events                              │
  │  Server: organizer auto-joined, global notification     │
  │  sent to all users via Socket.io                        │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │  JOINING A GROUP RIDE                                   │
  │  User sees event card:                                  │
  │    - Title, organizer name, date/time                   │
  │    - Participant count + available slots                │
  │      (green: plenty of space, amber: almost full,       │
  │       red: 1 slot left)                                 │
  │  Click "Join" → POST /api/events/:id/join               │
  │  Server validates:                                      │
  │    ✓ Event is "open"                                    │
  │    ✓ Event has not passed                               │
  │    ✓ User not already joined                            │
  │    ✓ Not at max capacity                                │
  │  Success: user added to participants array              │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │  ORGANIZER CONTROLS                                     │
  │  Edit event (title, date, description, max participants)│
  │  Cancel event (sets status: "cancelled")               │
  │  Delete event (hard delete)                             │
  │  Note: organizer cannot leave their own event           │
  └─────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Architecture

### 3.1 Folder Structure

```
client/src/
├── main.jsx              Entry point — mounts <App /> into #root
├── App.jsx               Root component — auth guard + tab switcher
├── App.css               Global component styles
│
├── app/
│   ├── layouts/
│   │   └── AppShell.jsx  Navigation shell (top bar, bottom nav,
│   │                     side drawer, ride timer, notification slot)
│   │
│   ├── state/
│   │   ├── useAppState.js    Facade hook — composes all sub-hooks
│   │   └── hooks/
│   │       ├── useAuth.js        Login, register, Google OAuth, JWT
│   │       ├── useBikes.js       Bike CRUD + maintenance logs
│   │       ├── useGoogleMaps.js  Maps SDK loader + helpers
│   │       ├── useHistory.js     Ride history fetch + filtering
│   │       ├── useNotifications.js Socket.io + notification CRUD
│   │       └── useRoutes.js      Route CRUD + form + autocomplete
│   │
│   ├── ui/
│   │   ├── NotificationCenter.jsx  Bell button + notification panel
│   │   ├── components/
│   │   │   ├── Button.jsx      Reusable button (primary/ghost)
│   │   │   ├── GlassCard.jsx   Glassmorphic card container
│   │   │   └── MapPreview.jsx  Map preview placeholder
│   │   └── nav/
│   │       ├── BottomNav.jsx   Mobile 5-item tab bar
│   │       ├── SideDrawer.jsx  RTL slide-in full-height drawer
│   │       └── TopNav.jsx      Sticky header with logo + controls
│   │
│   └── utils/
│       └── formatters.js       formatRideDuration() helper
│
└── pages/
    ├── SettingsPage.jsx       → exports AuthScreen (login/register UI)
    ├── AppSettingsPage.jsx    → In-app preferences page
    ├── HomePage.jsx           → Dashboard: recent routes, bike card
    ├── RidePage.jsx           → Ride orchestrator (pre/active ride)
    ├── RideControlCenter.jsx  → Pre-ride launcher screen
    ├── RideActiveCockpit.jsx  → Live ride HUD (speedometer, GPS, stats)
    ├── RoutesPage.jsx         → Route list + add route form
    ├── HistoryPage.jsx        → Ride history list + ride detail modal
    ├── ActivityPage.jsx       → Combined stats + rides + routes tabs
    ├── CommunityHubPage.jsx   → Public routes + group rides
    ├── MyBikePage.jsx         → Bike management + maintenance logs
    └── ProfilePage.jsx        → User profile + stats + avatar edit
```

### 3.2 Main Components

| Component                | What it does                                                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `App.jsx`                | Root. Handles initial hydration, auth guard, tab-based page switching. Renders `<AuthScreen>` or `<AppShell>`.                                                  |
| `AppShell.jsx`           | Navigation container. Manages `activeTab`, ride timer (`setInterval`), ride minimization, drawer open/close. Uses render-prop pattern to pass state to pages.   |
| `RideActiveCockpit.jsx`  | Full-screen live ride HUD. SVG speedometer with neon glow, real-time speed/distance/time, weather chip, navigation launcher, pause/finish controls.             |
| `RideControlCenter.jsx`  | Pre-ride screen. Shows GPS status, weather, map preview, ride mode selector. Triggers ride start.                                                               |
| `CommunityHubPage.jsx`   | Self-contained community section. Manages its own local state (not in global store). Renders public routes and group ride events with full CRUD for organizers. |
| `NotificationCenter.jsx` | Bell button with badge count. Drop-down panel listing recent notifications with read/delete actions and deep-link navigation.                                   |
| `RoutesPage.jsx`         | Route list with Filters, search, details map, and a powerful add-route form with Places Autocomplete and map picker.                                            |

### 3.3 State Management

MotoVibe uses a **custom hook composition pattern** — no Redux or Zustand. All state lives in React hooks.

```
useAppState.js  (facade)
   ├── useAuth.js          → authToken, currentUser, login/logout logic
   ├── useGoogleMaps.js    → isGoogleMapsLoaded, map helpers, default center
   ├── useRoutes.js        → routes[], form state, fetchRoutesFromServer()
   ├── useBikes.js         → bikes[], maintenance data, bike CRUD
   ├── useHistory.js       → historyRides[], filters, mapRideToUIShape()
   └── useNotifications.js → notifications[], unreadCount, Socket.io
```

`useAppState.js` creates a single **axios instance** (`apiClient`) and distributes it to all sub-hooks. It applies a global 401 response interceptor that clears session storage and reloads the page when the token is rejected by the server.

> The composed state object is passed as a single large props bundle to `App.jsx`, which distributes relevant slices further down to each page component.

**No URL-based routing is used.** Navigation is entirely driven by `activeTab` (a string like `"home"`, `"ride"`, `"routes"`, etc.) stored in `AppShell`. Pages receive an `onNavigate(tabKey)` callback to switch tabs.

### 3.4 Routing (Navigation)

Although `react-router` is listed as a dependency, it is **not used at runtime**. Instead, the app uses a custom tab-based navigation:

1. `AppShell` owns the `activeTab` state.
2. `App.jsx` renders the correct page component based on `activeTab` using a switch-like structure.
3. Every component that needs to navigate receives an `onNavigate(tabKey)` function as a prop.
4. The `BottomNav`, `SideDrawer`, and `TopNav` all call `onNavigate` when the user taps a link.
5. Deep linking from notifications works because `NotificationCenter` also receives `onNavigate` and calls it with the `link` field from the notification object.

**Ride fullscreen mode** overrides navigation: when `isRideActive && !isRideMinimized`, all navigation elements are hidden and the cockpit occupies the entire screen.

---

## 4. Backend Architecture

### 4.1 Server Structure

```
server/src/
├── index.js              Entry point: Express app setup + startServer()
│
├── config/
│   ├── db.js             Mongoose connection to MongoDB
│   ├── passport.js       Google OAuth 2.0 strategy configuration
│   └── socket.js         Socket.io server: auth middleware, user→socket map
│
├── app/
│   ├── controllers/      Business logic (one file per domain)
│   ├── middlewares/
│   │   └── auth.middleware.js    JWT verification → req.user
│   ├── models/           Mongoose schemas (one file per collection)
│   ├── routes/           Express routers (one file per domain)
│   └── services/
│       └── directions.service.js   Google Directions API wrapper
│
└── jobs/
    └── maintenance.cron.js   Daily scheduled reminders (node-cron)
```

**Bootstrap sequence (`startServer`):**

1. Connect to MongoDB (`connectDB`)
2. Initialize Socket.io (`initSocket`)
3. Start daily cron job (`startMaintenanceCron`)
4. Begin listening on `PORT` (default 5000)

### 4.2 Controllers, Routes, Services

The server follows a clean three-layer pattern:

```
HTTP Request
     │
     ▼
Router (routes/*.routes.js)
  - Applies auth middleware if required
  - Applies express-validator rules
  - Calls the appropriate controller function
     │
     ▼
Controller (controllers/*.controller.js)
  - Reads req.user, req.params, req.body
  - Queries/mutates MongoDB via Mongoose
  - Calls service functions for external APIs
  - Sends JSON response or error
     │
     ▼
Service (services/*.service.js)
  - Encapsulates third-party API calls (Google Maps)
  - Throws typed errors for the controller to translate
  - Has no knowledge of HTTP (req/res)
```

**Route modules and their purposes:**

| Route file                | Prefix               | Purpose                                             |
| ------------------------- | -------------------- | --------------------------------------------------- |
| `health.routes.js`        | `/api/health`        | Liveness check — returns service name and timestamp |
| `auth.routes.js`          | `/api/auth`          | Register, login, profile, Google OAuth              |
| `bikes.routes.js`         | `/api/bikes`         | Bike CRUD + maintenance logs and plans              |
| `rides.routes.js`         | `/api/rides`         | Start, stop, active ride, history                   |
| `routes.routes.js`        | `/api/routes`        | Route CRUD + public listing                         |
| `directions.routes.js`    | `/api/directions`    | Google Directions proxy                             |
| `events.routes.js`        | `/api/events`        | Group ride event CRUD + join/leave                  |
| `maintenance.routes.js`   | `/api/maintenance`   | Maintenance alerts across all bikes                 |
| `notifications.routes.js` | `/api/notifications` | Read, mark, delete notifications                    |
| `upload.routes.js`        | `/api/upload`        | Image upload (multer)                               |

### 4.3 Authentication Flow

```
  ┌──────────────────────────────────────────────────────┐
  │  EMAIL / PASSWORD FLOW                               │
  │                                                      │
  │  POST /api/auth/register                             │
  │    body: { name, email, password }                   │
  │    1. express-validator checks input format          │
  │    2. Check no existing user with same email → 409   │
  │    3. bcrypt.hash(password, 10)                      │
  │    4. new User({ name, email, passwordHash })        │
  │    5. signToken(user._id) → JWT (7-day expiry)       │
  │    6. Response: { token, user: { id, name, email }}  │
  │                                                      │
  │  POST /api/auth/login                                │
  │    1. Find user by email                             │
  │    2. bcrypt.compare(password, user.passwordHash)    │
  │    3. If mismatch → 401 "Invalid credentials"        │
  │    4. signToken → response { token, user }           │
  └──────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────┐
  │  GOOGLE OAUTH FLOW                                   │
  │                                                      │
  │  GET /api/auth/google                                │
  │    Passport redirects to Google consent screen       │
  │                                                      │
  │  GET /api/auth/google/callback                       │
  │    Passport strategy runs:                           │
  │      1. Look up User by googleId                     │
  │      2. If not found: look up by email               │
  │         (links Google to existing email account)     │
  │      3. If still not found: create new User          │
  │    signToken(user._id)                               │
  │    Redirect to FRONTEND_URL/?token=<jwt>             │
  └──────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────┐
  │  PROTECTED REQUEST FLOW                              │
  │                                                      │
  │  Any request to a protected route:                   │
  │    1. auth.middleware reads Authorization header     │
  │       "Bearer <token>"                               │
  │    2. jwt.verify(token, JWT_SECRET)                  │
  │    3. Decoded { userId } attached to req.user        │
  │    4. Controller uses req.user.userId for all queries│
  │                                                      │
  │  If token missing or invalid → 401 JSON response     │
  └──────────────────────────────────────────────────────┘
```

---

## 5. Database Design

All collections are stored in MongoDB. The ORM layer is Mongoose.

### 5.1 Collections Overview

```
MongoDB Database
├── users
├── bikes
├── rides
├── routes
├── rideevents
├── maintenancelogs
├── maintenanceplans
└── notifications
```

### 5.2 Collection Schemas

#### `users`

| Field          | Type        | Constraints / Notes                          |
| -------------- | ----------- | -------------------------------------------- |
| `_id`          | ObjectId    | Auto-generated primary key                   |
| `name`         | String      | Required, 2–50 characters                    |
| `email`        | String      | Required, unique, lowercased, indexed        |
| `passwordHash` | String      | Null for Google-only accounts                |
| `googleId`     | String      | Sparse index (unique, allows multiple nulls) |
| `role`         | String enum | `"user"` or `"admin"`, default `"user"`      |
| `avatarUrl`    | String      | URL to uploaded avatar image, optional       |
| `createdAt`    | Date        | Auto-managed by Mongoose timestamps          |
| `updatedAt`    | Date        | Auto-managed by Mongoose timestamps          |

---

#### `bikes`

| Field               | Type             | Constraints / Notes                  |
| ------------------- | ---------------- | ------------------------------------ |
| `_id`               | ObjectId         | Primary key                          |
| `owner`             | ObjectId → users | Required, indexed                    |
| `name`              | String           | Required, max 60 characters          |
| `make`              | String           | Optional (e.g. "Honda")              |
| `model`             | String           | Optional (e.g. "CB500F")             |
| `year`              | Number           | Optional, 1900–2100                  |
| `currentOdometerKm` | Number           | Default 0, updated on ride stop      |
| `engineCc`          | Number           | Optional engine displacement         |
| `imageUrl`          | String           | URL to uploaded bike photo, optional |
| `testValidity`      | Date             | MOT / vehicle inspection expiry date |
| `mileageAlerts`     | Array            | Embedded sub-documents (see below)   |

**`mileageAlerts` sub-document:**

| Field      | Type   | Notes                                    |
| ---------- | ------ | ---------------------------------------- |
| `type`     | String | Service type (oil, chain, brakes, etc.)  |
| `targetKm` | Number | Odometer reading that triggers the alert |
| `note`     | String | Optional user note                       |

---

#### `rides`

| Field             | Type              | Constraints / Notes                                                                           |
| ----------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `_id`             | ObjectId          | Primary key                                                                                   |
| `owner`           | ObjectId → users  | Required, indexed                                                                             |
| `route`           | ObjectId → routes | Optional, reference to originating route                                                      |
| `name`            | String            | Optional user-assigned ride name                                                              |
| `imageUrl`        | String            | Optional ride photo                                                                           |
| `routeSnapshot`   | Object            | Frozen copy of route at start time: `{ title, start, end, distanceKm, etaMinutes, polyline }` |
| `startedAt`       | Date              | Required, set on ride start                                                                   |
| `endedAt`         | Date              | Null while ride is active; set on stop                                                        |
| `durationSeconds` | Number            | Computed on stop                                                                              |
| `path`            | Array             | GPS track: `[{ lat, lng, t }]`, max 2,000 points                                              |

> **Compound index:** `owner + endedAt + startedAt` for efficient history queries.

**Why `routeSnapshot`?** Routes can be edited or deleted after a ride. The snapshot preserves the exact route data as it was at the moment the ride started, ensuring history is always accurate.

---

#### `routes`

| Field        | Type             | Constraints / Notes                                 |
| ------------ | ---------------- | --------------------------------------------------- |
| `_id`        | ObjectId         | Primary key                                         |
| `owner`      | ObjectId → users | Required, indexed                                   |
| `title`      | String           | Required, 2–80 characters                           |
| `imageUrl`   | String           | Optional photo                                      |
| `routeType`  | String enum      | `"עירוני"` / `"בין-עירוני"` / `"שטח"` / `"נוף"`     |
| `difficulty` | String enum      | `"קל"` / `"בינוני"` / `"קשה"`                       |
| `isTwisty`   | Boolean          | Twisty/winding roads flag                           |
| `start`      | Object           | `{ lat, lng, label }` — required start point        |
| `end`        | Object           | `{ lat, lng, label }` — required end point          |
| `distanceKm` | Number           | Computed by Google Directions, stored once          |
| `etaMinutes` | Number           | Computed by Google Directions, stored once          |
| `polyline`   | String           | Encoded Google polyline, used to render the route   |
| `visibility` | String enum      | `"private"` / `"shared"` / `"friends"` / `"public"` |
| `createdAt`  | Date             | Auto-managed                                        |

---

#### `rideevents` (Group Rides)

| Field             | Type              | Constraints / Notes                        |
| ----------------- | ----------------- | ------------------------------------------ |
| `_id`             | ObjectId          | Primary key                                |
| `organizer`       | ObjectId → users  | Required, indexed                          |
| `route`           | ObjectId → routes | Optional linked route                      |
| `title`           | String            | Required, 2–100 characters                 |
| `description`     | String            | Optional, max 1,000 characters             |
| `scheduledAt`     | Date              | Required — when the group ride will happen |
| `maxParticipants` | Number            | Null = unlimited, minimum 2 if set         |
| `status`          | String enum       | `"open"` / `"cancelled"` / `"completed"`   |
| `participants`    | Array of ObjectId | All joined users (organizer auto-included) |

> **Compound index:** `scheduledAt + status` for efficient listing of upcoming open events.

---

#### `maintenancelogs`

| Field               | Type             | Constraints / Notes                       |
| ------------------- | ---------------- | ----------------------------------------- |
| `_id`               | ObjectId         | Primary key                               |
| `owner`             | ObjectId → users | Indexed                                   |
| `bikeId`            | ObjectId → bikes | Indexed                                   |
| `type`              | String           | Service type (max 40 chars)               |
| `date`              | Date             | Required — date the service was performed |
| `odometerKm`        | Number           | Required — odometer at time of service    |
| `notes`             | String           | Optional notes, max 400 characters        |
| `cost`              | Number           | Optional cost in local currency           |
| `customServiceType` | String           | Optional freeform type (max 60 chars)     |
| `receiptUrl`        | String           | Optional URL to receipt image             |

---

#### `maintenanceplans`

| Field                   | Type             | Constraints / Notes                          |
| ----------------------- | ---------------- | -------------------------------------------- |
| `_id`                   | ObjectId         | Primary key                                  |
| `owner`                 | ObjectId → users | Indexed                                      |
| `bikeId`                | ObjectId → bikes | Indexed                                      |
| `type`                  | String           | Service type, max 40 characters              |
| `intervalKm`            | Number           | How often service is needed (km), optional   |
| `intervalDays`          | Number           | How often service is needed (days), optional |
| `lastServiceOdometerKm` | Number           | Odometer at last service, optional           |
| `lastServiceDate`       | Date             | Date of last service, optional               |

> A plan is upserted (created or updated) using the composite key `{ owner, bikeId, type }`.

---

#### `notifications`

| Field       | Type              | Constraints / Notes                                                                              |
| ----------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| `_id`       | ObjectId          | Primary key                                                                                      |
| `recipient` | ObjectId → users  | Null for global notifications                                                                    |
| `isGlobal`  | Boolean           | True = sent to all users                                                                         |
| `readBy`    | Array of ObjectId | For global: tracks who has read it                                                               |
| `type`      | String            | `"route_new"` / `"event_new"` / `"maintenance_reminder"` / `"test_reminder"` / `"mileage_alert"` |
| `title`     | String            | Short notification heading                                                                       |
| `body`      | String            | Full notification text                                                                           |
| `link`      | String            | Tab key for in-app navigation (e.g. `"bike"`, `"community"`)                                     |
| `read`      | Boolean           | For personal notifications: whether read                                                         |
| `ref`       | String            | External reference ID — used to deduplicate repeat reminders                                     |
| `sender`    | ObjectId → users  | Optional — who triggered this notification                                                       |
| `createdAt` | Date              | Auto-managed                                                                                     |

> **Dual indexing:** `recipient + createdAt` for personal; `isGlobal + createdAt` for global broadcasts.

---

### 5.3 Relationships Diagram

```
users ──────┬──── owns ──────► bikes
            │                     │
            │                     ├── has many ──► maintenancelogs
            │                     └── has many ──► maintenanceplans
            │
            ├──── owns ──────► routes
            │                     │
            │                     └── referenced by ──► rideevents
            │                                           (optional)
            │
            ├──── owns ──────► rides
            │                     │
            │                     └── references (optional) ──► routes
            │                          (also stores routeSnapshot
            │                           as embedded copy)
            │
            ├──── organizes ─► rideevents
            │                     │
            │                     └── participants[] ──► users (many-to-many)
            │
            └──── receives ──► notifications
                                 (personal: recipient = user)
                                 (global: isGlobal = true, readBy = [users])
```

---

## 6. External Integrations

### 6.1 GPS (Browser Geolocation API)

GPS tracking is handled entirely client-side using the browser's native `navigator.geolocation` API.

**During a ride:**

```
navigator.geolocation.watchPosition(
  callback,
  errorHandler,
  { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
)
```

- `watchPosition` fires repeatedly as the device moves.
- Each position update provides `latitude`, `longitude`, `speed` (m/s, converted to km/h), and `accuracy` (meters).
- The React component accumulates a `path` array: `[{ lat, lng, t: timestamp }]`.
- **Speed** is read directly from the browser position object, not calculated.
- **Distance** is calculated client-side using the Haversine formula (great-circle distance between consecutive GPS points).
- At ride end, the full `path` array is sent to the server in `POST /api/rides/stop`.
- The server validates each point (finite numbers only) and caps the array at 2,000 points.
- GPS watch ID is stored in a React ref and cancelled on component unmount to prevent memory leaks.

**GPS accuracy indicator** in the cockpit converts `accuracy` (meters) to a percentage: 100% = 5m or less, 0% = 50m or more.

---

### 6.2 Google Maps API

The system uses Google Maps in two different ways: a **server-side directions proxy** and **client-side map rendering**.

#### Server-Side: Directions Proxy

When a user creates or edits a route, the client does **not** call Google Maps directly. Instead:

```
Client → POST /api/directions/compute
           { start: { lat, lng }, end: { lat, lng } }
              │
              ▼
         directions.service.js
              │
              ▼
         Google Maps Directions API
         (server uses GOOGLE_MAPS_API_KEY from environment)
         mode=driving, alternatives=false, timeout=8s
              │
              ▼
         Returns:
           distanceKm   (rounded to 1 decimal)
           etaMinutes   (minimum 1 minute)
           polyline     (encoded overview polyline string)
              │
              ▼
         Stored in the Route document
```

**Why proxy through the server?** The Google Maps API key is kept confidential on the server, never exposed to the browser. The client never knows the key.

#### Client-Side: Map Rendering

The Google Maps JavaScript SDK is loaded once in the client via `useJsApiLoader` with:

- Libraries: `places` (for autocomplete), `geometry` (for polyline decoding)
- Language: Hebrew (`"he"`)
- Region: Israel (`"IL"`)
- Key: `VITE_GOOGLE_MAPS_API_KEY` (client-side, read-only display key)

**Maps used throughout the app:**

| Location                       | What it shows                                  |
| ------------------------------ | ---------------------------------------------- |
| `RideControlCenter`            | Current location or selected route preview     |
| `RidePage (RideActiveMap)`     | Live GPS position (marker) + route polyline    |
| `RoutesPage (RouteDetailsMap)` | Full route with DirectionsRenderer             |
| `HistoryPage / ActivityPage`   | Past GPS track (emerald polyline, A/B markers) |

**Polyline rendering:** Stored polylines (encoded strings from Google) are decoded using `@react-google-maps/api`'s geometry library into `[{ lat, lng }]` arrays for `PolylineF`.

**Places Autocomplete:** In the route creation form, as the user types a location, the app queries the Google Places API client-side and displays suggestions in a dropdown.

**Map Picker:** The user can tap directly on the map to set a route waypoint. The clicked `LatLng` is captured from the `GoogleMap` `onClick` handler.

---

### 6.3 OpenWeatherMap API

The ride control center fetches current weather on launch:

```
navigator.geolocation.getCurrentPosition(pos => {
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=...&lon=...
     &appid=VITE_WEATHER_API_KEY&units=metric&lang=he`
  )
  → temperature (°C) + weather condition (Clear, Clouds, Rain, etc.)
})
```

Weather is displayed as a chip: temperature + icon (Sun, Cloud, Rain, etc.). If the API key is missing or the request fails, the component silently falls back to showing 24°C / Clear.

---

### 6.4 Socket.io (Real-Time Notifications)

```
Server side (socket.js):
  ┌──────────────────────────────────────────────────┐
  │  Socket.io Server attached to HTTP server        │
  │  ├── Auth middleware: verifies JWT from           │
  │  │   socket.handshake.auth.token on every connect│
  │  ├── userSockets: Map<userId → Set<socketId>>    │
  │  │   (supports multiple devices per user)        │
  │  └── Cleans up on disconnect                     │
  │                                                  │
  │  emitToUser(userId, "notification", data)        │
  │    → sends only to that user's sockets           │
  │                                                  │
  │  emitAll("notification", data)                   │
  │    → broadcasts to ALL connected sockets         │
  └──────────────────────────────────────────────────┘

Client side (useNotifications.js):
  ┌──────────────────────────────────────────────────┐
  │  io(VITE_SOCKET_URL, { auth: { token } })        │
  │  Listens for "notification" events               │
  │  ├── Deduplicates by _id                         │
  │  ├── Prepends to notifications[] state           │
  │  └── Increments unreadCount                      │
  │  Disconnects on logout or token change           │
  └──────────────────────────────────────────────────┘
```

**Events that trigger Socket.io pushes:**

| Trigger                               | Type                   | Recipients            |
| ------------------------------------- | ---------------------- | --------------------- |
| New public route created              | `route_new`            | All users (global)    |
| New group ride event created          | `event_new`            | All users (global)    |
| Mileage alert threshold reached       | `mileage_alert`        | Ride owner (personal) |
| Daily: MOT expiry within 7 days       | `test_reminder`        | Bike owner (personal) |
| Daily: service interval within 7 days | `maintenance_reminder` | Bike owner (personal) |

---

## 7. Security

### 7.1 JSON Web Tokens (JWT)

Every authenticated session in MotoVibe is managed via a JWT (JSON Web Token).

**Token structure:**

```
Header:  { alg: "HS256", typ: "JWT" }
Payload: { userId: "<MongoDB ObjectId>", iat: <issued at>, exp: <7 days from iat> }
Signed with: JWT_SECRET (environment variable, never exposed)
```

**Lifecycle:**

1. Server signs a new token on successful login or register.
2. Token sent to client in the response body.
3. Client stores it in `sessionStorage` (not `localStorage` — cleared when the browser tab is closed).
4. Client attaches it to every API request: `Authorization: Bearer <token>`.
5. Server verifies it on every protected request in the auth middleware.
6. Token expires after 7 days; the client detects 401 responses and logs the user out.

**Socket.io authentication:** The Socket.io connection also sends the JWT as `socket.handshake.auth.token`. The server verifies it before allowing the socket to connect, so real-time notifications are also protected.

---

### 7.2 Protected Routes

**Server protection:**

```
All routes under /api/* (except listed below) require:
  Authorization: Bearer <valid JWT>

Public endpoints (no auth required):
  GET  /api/health
  POST /api/auth/register
  POST /api/auth/login
  GET  /api/auth/google
  GET  /api/auth/google/callback
  GET  /api/routes/public
  GET  /api/events
  GET  /api/events/:id
```

The `auth.middleware.js` is applied at the router level for every protected route group. If the token is missing or invalid, the middleware responds with `401 Unauthorized` before the controller function runs.

**Ownership enforcement:** Every controller validates that the requesting user owns the resource before serving or mutating data. For example:

- `GET /api/bikes/:id` → verifies `bike.owner.toString() === req.user.userId`
- `DELETE /api/rides/:id` → verifies `ride.owner.toString() === req.user.userId`

This prevents any user from reading or modifying another user's data even if they have a valid token.

**Password security:** Passwords are hashed with `bcrypt` at cost factor 10 before storage. The plaintext password is never stored or logged. Comparison is done with `bcrypt.compare()`, which is timing-safe.

**API key protection:** The Google Maps Directions API key is stored only as a server environment variable (`GOOGLE_MAPS_API_KEY`). The client-facing key (`VITE_GOOGLE_MAPS_API_KEY`) is a separate, restricted key used only for map rendering.

**File upload safety:** Multer is configured with a 5 MB file size limit. Files are stored on disk in the server's `public/uploads/` directory under timestamped random filenames, preventing path traversal or filename collision attacks.

---

## 8. Special Features

### 8.1 Public Routes Logic

Routes can have one of four visibility levels: **private**, **shared**, **friends**, or **public**.

The `GET /api/routes/public` endpoint is the only unauthenticated data endpoint (besides auth and events). It returns all routes where `visibility === "public"`, and supports three optional query parameters:

- `routeType` — filter by terrain type
- `difficulty` — filter by difficulty level
- `isTwisty` — filter for twisty/winding roads only

**This endpoint omits the `polyline` field** from the list response to reduce payload size. The polyline is only returned when a user opens a specific route detail.

**Community notification trigger:** When a route is published (either created as public, or updated from private to public), the server calls `createGlobalAndEmit()`. This:

1. Creates a `Notification` document with `isGlobal: true`.
2. Calls `emitAll("notification", data)` via Socket.io.
3. Every connected user's bell badge increments in real time.

**Deduplication:** The route update path specifically checks whether the route's visibility is _changing_ from non-public to public (`wasPublic = oldRoute.visibility === "public"`) and only fires the notification on that transition — not on every save.

---

### 8.2 Group Ride Logic

Group rides (stored as `rideevents`) are the community coordination feature.

**Creating:**

- Any authenticated user can create an event.
- The organizer is automatically added to the `participants` array.
- A global `event_new` notification is broadcast to all users.

**Joining:**
The `joinEvent` controller enforces four guards before adding a user:

1. Event `status` must be `"open"` (not cancelled or completed).
2. `scheduledAt` must be in the future (prevents joining past events).
3. User must not already be in `participants` (no double-joining).
4. If `maxParticipants` is set, `participants.length` must be less than it.

If any guard fails, the server returns a specific error code (`EVENT_FULL`, `EVENT_PAST`, `ALREADY_JOINED`, `EVENT_NOT_OPEN`) so the client can display a meaningful message.

**Capacity display:** The client calculates available slots from `maxParticipants - participants.length` and color-codes the display:

- Green: plenty of space
- Amber: 2–3 slots left
- Red: 1 slot left
- Grey/disabled: full

**Leaving:** Any participant except the organizer can leave. The organizer cannot leave their own event; they must cancel it instead.

**Organizer powers:**

- Edit: title, description, date/time, max participants (PATCH `/api/events/:id`)
- Cancel: sets `status: "cancelled"` — event remains visible but no one can join
- Delete: hard delete from database

---

## 9. Development Process

MotoVibe was built in a layered, bottom-up approach — the data model came first, then the server, then the client.

### Phase 1: Project Foundation

The project structure was established with two separate npm packages: `server/` and `client/`. A Vite-based React project handles the frontend; a Node.js Express application handles the backend. Environment variables were configured for MongoDB, JWT, Google APIs, and client URLs.

The MongoDB connection module and Express application skeleton were created first, establishing the startup sequence and middleware chain.

### Phase 2: Authentication System

User registration and login were built: the `User` model, password hashing with bcrypt, JWT signing, and the `auth.middleware.js` that protects all subsequent routes. Google OAuth was added using Passport.js with account linking logic (merging Google sign-in to existing email accounts).

On the client, `useAuth.js` was built to manage token lifecycle in sessionStorage, apply the Authorization header to axios, and handle the Google OAuth redirect callback.

### Phase 3: Core Data Models

Database schemas were designed for all core entities: `Bike`, `Route`, `Ride`, `RideEvent`, `MaintenanceLog`, `MaintenancePlan`, and `Notification`. Indexes were added for the most common query patterns (owner filters, date ranges, compound queries).

### Phase 4: REST API Layer

Controllers and route files were built domain by domain:

- **Bikes:** Full CRUD with owner scoping.
- **Routes:** CRUD + the Google Directions proxy service to compute and store distance/polyline.
- **Rides:** Start/stop logic with GPS path storage, odometer sync, and mileage alert triggering.
- **Maintenance:** Log CRUD, plan upserts, and the alert calculation endpoint.
- **Events:** Group ride CRUD with join/leave guards.
- **Notifications:** Read/delete with global vs. personal handling.
- **Upload:** Multer file upload with static serving.

### Phase 5: Real-Time Layer

Socket.io was integrated into the server's HTTP server. The `userSockets` map was implemented for multi-device support. JWT authentication middleware was applied to the socket connection. `emitToUser` and `emitAll` were wired into the notification creation functions.

The client's `useNotifications.js` hook was built to connect, listen, deduplicate, and update the bell badge in real time.

### Phase 6: Frontend Pages

Pages were built in order of utility:

1. **AuthScreen** — Login/register with password strength validation and Google OAuth.
2. **AppShell** — Navigation shell with tab switching, ride timer, minimized ride widget.
3. **HomePage** — Dashboard with recent routes and bike summary.
4. **RoutesPage** — Route list with Google Maps integration, Places Autocomplete, and map picker.
5. **RideControlCenter** — Pre-ride launcher with GPS check and weather.
6. **RideActiveCockpit** — Live ride HUD with SVG speedometer, GPS tracking, metrics grid, and navigation panel.
7. **HistoryPage** — Ride history with GPS track map and "Convert to Route" feature.
8. **MyBikePage** — Bike management, photo upload, maintenance logs, mileage alerts.
9. **ProfilePage** — User stats, avatar management, profile editing.
10. **CommunityHubPage** — Public routes browser and group rides, with self-contained local state.
11. **ActivityPage** — Combined statistics + ride and route management tab.
12. **AppSettingsPage** — Settings toggles (UI placeholder).

### Phase 7: Background Jobs

The `node-cron` daily job was implemented to scan for:

- Bikes with MOT (test validity) expiring within 7 days
- Maintenance plans with service intervals due within 7 days

Each check deduplicates against existing notifications (using the `ref` field) to avoid sending the same reminder multiple times on the same day.

### Phase 8: Polish and Integration

- RTL (right-to-left) layout for Hebrew text throughout the UI.
- Dark glassmorphic design system (Tailwind CSS with `bg-white/5`, `backdrop-blur-xl`, `border-white/10`).
- Responsive navigation (bottom tab bar on mobile, sidebar drawer on desktop).
- `formatters.js` utility for consistent time display across pages.
- Image URL resolution for server-hosted uploads.
- Ride fullscreen mode that hides all navigation elements.
- `routeSnapshot` embedded copy pattern to protect historical ride data.

---

_End of MotoVibe 2.0 Technical Documentation_
