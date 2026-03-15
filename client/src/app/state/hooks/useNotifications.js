import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

/**
 * useNotifications — מנהל התראות בזמן אמת.
 *
 * - טוען את ה-50 התראות האחרונות מהשרת בעת Mount
 * - מתחבר ל-Socket.io ומאזין לאירועי "notification" בזמן אמת
 * - מספק פונקציות לסימון/מחיקת התראות
 *
 * @param {{ authToken: string|null, apiClient: AxiosInstance }} opts
 */
export default function useNotifications({ authToken, apiClient }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  /* ── טעינה ראשונית מהשרת ── */
  useEffect(() => {
    if (!authToken || !apiClient) return;

    apiClient
      .get("/notifications")
      .then(({ data }) => {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .catch(() => {
        /* התראות אינן קריטיות — כשלון שקט */
      });
  }, [authToken, apiClient]);

  /* ── חיבור Socket.io ── */
  useEffect(() => {
    if (!authToken) return;

    const socket = io(SOCKET_URL, {
      auth: { token: authToken },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[notifications] Socket connected, id:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("[notifications] Socket connection error:", err.message);
    });

    socket.on("notification", (notif) => {
      console.log(
        "[notifications] Received via socket:",
        notif.type,
        notif.title,
      );
      setNotifications((prev) => {
        // Dedup: skip if already in the list (e.g. arrived via HTTP fetch)
        if (prev.some((n) => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [authToken]);

  /* ── סימון התראה בודדת כנקראה ── */
  const markRead = useCallback(
    async (id) => {
      try {
        await apiClient.patch(`/notifications/${id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        /* שגיאה שקטה */
      }
    },
    [apiClient],
  );

  /* ── סימון כל ההתראות כנקראות ── */
  const markAllRead = useCallback(async () => {
    try {
      await apiClient.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      /* שגיאה שקטה */
    }
  }, [apiClient]);

  /* ── מחיקת התראה ── */
  const deleteNotification = useCallback(
    async (id) => {
      try {
        const notif = notifications.find((n) => n._id === id);
        await apiClient.delete(`/notifications/${id}`);
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        if (notif && !notif.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch {
        /* שגיאה שקטה */
      }
    },
    [apiClient, notifications],
  );

  return {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    deleteNotification,
  };
}
