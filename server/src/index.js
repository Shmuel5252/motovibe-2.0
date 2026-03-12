const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const connectDB = require("./config/db");

const healthRoutes = require("./app/routes/health.routes");

const authRoutes = require("./app/routes/auth.routes");

const routesRoutes = require("./app/routes/routes.routes");

const ridesRoutes = require("./app/routes/rides.routes");

const directionsRoutes = require("./app/routes/directions.routes");

const bikesRoutes = require("./app/routes/bikes.routes");

const maintenanceRoutes = require("./app/routes/maintenance.routes");

const uploadRoutes = require("./app/routes/upload.routes");
const eventsRoutes = require("./app/routes/events.routes");
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

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

// 404 handler (minimal)
app.use((req, res) => {
  return res.status(404).json({
    error: { code: "NOT_FOUND", message: "Not found" },
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
