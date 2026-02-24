/**
 * useBikes — Sub-Hook לניהול אופנוע יחיד ורשומות תחזוקה.
 * אחראי על: bike CRUD, maintenance logs CRUD, תצוגת תמונה.
 */

import { useRef, useState } from "react";

/**
 * @param {{ apiClient: import("axios").AxiosInstance, authToken: string, handleUnauthorized: Function }} params
 */
export default function useBikes({ apiClient, authToken, handleUnauthorized }) {
  /* ─── State: Bikes ─── */
  const [bikes, setBikes] = useState([]);
  const [bikesLoading, setBikesLoading] = useState(false);
  const [bikesError, setBikesError] = useState("");

  /* ─── State: Maintenance ─── */
  /* maintenanceLogs: { [bikeId]: Log[] } */
  const [maintenanceLogs, setMaintenanceLogs] = useState({});
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  /* תצוגה מקומית של תמונת האופנוע (ללא העלאה לשרת בשלב זה) */
  const [bikePhotoPreview, setBikePhotoPreview] = useState("");
  const bikePhotoInputRef = useRef(null);

  /* ─── Helpers ─── */

  /* שולף את הרשימה ממקום שהשרת יכול להחזיר אותה */
  function extractBikeList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.bikes)) return data.bikes;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }

  /* טיפול שגיאה מרכזי — 401 → logout, אחרת מחזיר הודעה */
  function handleApiError(error, fallbackMsg) {
    if (error?.response?.status === 401) {
      handleUnauthorized();
    }
    return error?.response?.data?.error?.message || fallbackMsg;
  }

  /* ─── Bike CRUD ─── */

  /* טעינת כל האופנועים של המשתמש */
  const fetchBikesFromServer = async (tokenOverride) => {
    const effectiveToken = tokenOverride || authToken;
    if (!effectiveToken) return;

    setBikesLoading(true);
    setBikesError("");
    try {
      const { data } = await apiClient.get("/bikes");
      setBikes(extractBikeList(data));
    } catch (error) {
      setBikesError(handleApiError(error, "טעינת אופנועים נכשלה"));
    } finally {
      setBikesLoading(false);
    }
  };

  /* יצירת אופנוע חדש */
  const createBike = async (payload) => {
    const { data } = await apiClient.post("/bikes", payload);
    const bike = data?.bike || data;
    setBikes((prev) => [bike, ...prev]);
    return bike;
  };

  /* עדכון נתוני אופנוע קיים */
  const updateBike = async (bikeId, payload) => {
    const { data } = await apiClient.patch(`/bikes/${bikeId}`, payload);
    const updated = data?.bike || data;
    setBikes((prev) => prev.map((b) => (b._id === bikeId ? updated : b)));
    return updated;
  };

  /* מחיקת אופנוע */
  const deleteBike = async (bikeId) => {
    await apiClient.delete(`/bikes/${bikeId}`);
    setBikes((prev) => prev.filter((b) => b._id !== bikeId));
    setMaintenanceLogs((prev) => {
      const next = { ...prev };
      delete next[bikeId];
      return next;
    });
  };

  /* ─── Maintenance Logs CRUD ─── */

  /* טעינת רשומות תחזוקה לאופנוע נתון */
  const fetchMaintenance = async (bikeId) => {
    setMaintenanceLoading(true);
    try {
      const { data } = await apiClient.get(`/bikes/${bikeId}/maintenance`);
      const logs = Array.isArray(data?.logs) ? data.logs : [];
      setMaintenanceLogs((prev) => ({ ...prev, [bikeId]: logs }));
    } catch (error) {
      if (error?.response?.status === 401) handleUnauthorized();
    } finally {
      setMaintenanceLoading(false);
    }
  };

  /* הוספת רשומת תחזוקה */
  const addMaintenanceLog = async (bikeId, payload) => {
    const { data } = await apiClient.post(`/bikes/${bikeId}/maintenance/logs`, payload);
    const log = data?.log || data;
    setMaintenanceLogs((prev) => ({
      ...prev,
      [bikeId]: [log, ...(prev[bikeId] || [])],
    }));
    /* עדכון odometer באופנוע אם הוא גדול יותר */
    if (payload.odometerKm) {
      setBikes((prev) =>
        prev.map((b) =>
          b._id === bikeId && payload.odometerKm > (b.currentOdometerKm ?? 0)
            ? { ...b, currentOdometerKm: payload.odometerKm }
            : b
        )
      );
    }
    return log;
  };

  /* מחיקת רשומת תחזוקה */
  const deleteMaintenanceLog = async (bikeId, logId) => {
    await apiClient.delete(`/bikes/${bikeId}/maintenance/logs/${logId}`);
    setMaintenanceLogs((prev) => ({
      ...prev,
      [bikeId]: (prev[bikeId] || []).filter((l) => l._id !== logId),
    }));
  };

  return {
    /* bike */
    bikes,
    bikesLoading,
    bikesError,
    fetchBikesFromServer,
    createBike,
    updateBike,
    deleteBike,
    /* maintenance */
    maintenanceLogs,
    maintenanceLoading,
    fetchMaintenance,
    addMaintenanceLog,
    deleteMaintenanceLog,
    /* photo */
    bikePhotoPreview,
    setBikePhotoPreview,
    bikePhotoInputRef,
  };
}
