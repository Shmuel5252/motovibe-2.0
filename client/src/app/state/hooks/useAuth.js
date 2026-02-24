/**
 * useAuth — Sub-Hook לניהול אימות משתמשים.
 * אחראי על: טוקן, משתמש, Login/Logout, הידרציה מ-localStorage.
 */

import { useEffect, useState } from "react";
import axios from "axios";

const AUTH_TOKEN_KEY = "mv_token";

/**
 * @param {import("axios").AxiosInstance} apiClient - מופע axios לשרת.
 */
export default function useAuth(apiClient) {
  /* ─── State: Auth ─── */
  const [authToken, setAuthToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  /* מציג מסך אימות מיד אם אין טוקן שמור — ללא רציפת flash */
  const [showAuthScreen, setShowAuthScreen] = useState(
    () => typeof window !== "undefined" && !window.localStorage.getItem(AUTH_TOKEN_KEY)
  );
  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  /* ─── Auth Handlers ─── */

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
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * שליחת התחברות/הרשמה לשרת ועדכון מצב מאומת באפליקציה.
   * @param {{ onNavigate: Function, fetchRoutes: Function }} opts
   */
  const submitAuthForm = async ({ onNavigate, fetchRoutes }) => {
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
      await fetchRoutes(token);
      /* onNavigate עשוי להיות undefined כשה-AuthScreen מרונדר מחוץ ל-AppShell */
      if (typeof onNavigate === "function") onNavigate("home");
    } catch (error) {
      console.error("Auth failed", error);
      setAuthError("התחברות נכשלה. בדוק פרטים ונסה שוב");
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  return {
    authToken,
    isAuthenticated,
    currentUser,
    showAuthScreen,
    authMode, setAuthMode,
    authName, setAuthName,
    authEmail, setAuthEmail,
    authPassword, setAuthPassword,
    authError, setAuthError,
    isAuthSubmitting,
    handleLogout,
    handleUnauthorized,
    applyAuthSuccess,
    submitAuthForm,
  };
}
