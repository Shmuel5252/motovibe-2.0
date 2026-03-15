/**
 * socket.js — Socket.io initialisation and per-user emit helper.
 *
 * Usage:
 *   const { initSocket, emitToUser } = require("./socket");
 *   initSocket(httpServer);          // called once at startup
 *   emitToUser(userId, "event", {}); // called from any controller
 */

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

/** userId (string) → Set<socketId> */
const userSockets = new Map();

/**
 * Initialise Socket.io on the given HTTP server.
 * Must be called before any emitToUser calls.
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  // JWT authentication middleware for every socket connection
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = String(decoded.userId);
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId } = socket;

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    socket.on("disconnect", () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(userId);
      }
    });
  });

  return io;
}

/**
 * Push a Socket.io event to every open socket belonging to a given user.
 * Safe to call even if the user has no active connections (no-op).
 */
function emitToUser(userId, event, data) {
  if (!io) return;
  const sockets = userSockets.get(String(userId));
  if (!sockets || sockets.size === 0) return;
  for (const socketId of sockets) {
    io.to(socketId).emit(event, data);
  }
}

/**
 * Broadcast a Socket.io event to ALL currently-connected sockets.
 */
function emitAll(event, data) {
  if (!io) {
    console.warn("[socket] emitAll called but io is not initialised yet");
    return;
  }
  const connectedCount = io.engine?.clientsCount ?? 0;
  console.log(
    `[socket] emitAll "${event}" → ${connectedCount} connected socket(s)`,
  );
  io.emit(event, data);
}

module.exports = { initSocket, emitToUser, emitAll };
