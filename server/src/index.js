const http = require("http");
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const connectDB = require("./config/db");
const passport = require("./config/passport");
const { initSocket } = require("./config/socket");

const healthRoutes = require("./app/routes/health.routes");

const authRoutes = require("./app/routes/auth.routes");

const routesRoutes = require("./app/routes/routes.routes");

const ridesRoutes = require("./app/routes/rides.routes");

const directionsRoutes = require("./app/routes/directions.routes");

const bikesRoutes = require("./app/routes/bikes.routes");

const maintenanceRoutes = require("./app/routes/maintenance.routes");

const uploadRoutes = require("./app/routes/upload.routes");
const eventsRoutes = require("./app/routes/events.routes");
const notificationsRoutes = require("./app/routes/notifications.routes");
const { startMaintenanceCron } = require("./jobs/maintenance.cron");
const app = express();
const httpServer = http.createServer(app);

// Allowed origins: comma-separated list in CORS_ORIGIN env var (production)
// Falls back to localhost for local development
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no origin) and listed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(passport.initialize());

// Serve static files from the public directory (for uploads)
app.use(express.static(path.join(__dirname, "../public")));

// Routes
app.use("/api/health", healthRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/routes", routesRoutes);

app.use("/api/bikes", bikesRoutes);

app.use("/api/rides", ridesRoutes);

app.use("/api/directions", directionsRoutes);

app.use("/api/maintenance", maintenanceRoutes);

app.use("/api/upload", uploadRoutes);

app.use("/api/events", eventsRoutes);
app.use("/api/notifications", notificationsRoutes);

// 404 handler
app.use((req, res) => {
  return res.status(404).json({
    error: { code: "NOT_FOUND", message: "Not found" },
  });
});

// Global error handler — must have 4 params so Express recognises it as an error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[unhandled]", err);
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: err.message || "Unexpected server error",
    },
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    initSocket(httpServer);
    startMaintenanceCron();

    httpServer.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
