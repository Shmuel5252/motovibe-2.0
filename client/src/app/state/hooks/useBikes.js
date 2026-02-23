/**
 * useBikes — Sub-Hook לניהול אופנועים ותמונותיהם.
 * אחראי על: bikes state, טעינה מהשרת, תצוגת תמונה.
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

  /*
   * תצוגה מקומית של תמונת האופנוע שנבחרה (ללא העלאה לשרת בשלב זה).
   */
  const [bikePhotoPreview, setBikePhotoPreview] = useState("");
  const bikePhotoInputRef = useRef(null);

  // טעינת רשימת אופנועים מהשרת
  const fetchBikesFromServer = async (tokenOverride) => {
    const effectiveToken = tokenOverride || authToken;
    if (!effectiveToken) {
      return;
    }

    setBikesLoading(true);
    setBikesError("");

    try {
      const response = await apiClient.get("/bikes", {
        headers: { Authorization: `Bearer ${effectiveToken}` },
      });

      const list = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setBikes(Array.isArray(list) ? list : []);
    } catch (error) {
      if (error?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      if (error?.response?.status === 404) {
        setBikesError("עדיין אין API לאופנועים בשרת");
        return;
      }

      setBikesError("טעינת אופנועים נכשלה");
    } finally {
      setBikesLoading(false);
    }
  };

  return {
    bikes,
    bikesLoading,
    bikesError,
    fetchBikesFromServer,
    bikePhotoPreview, setBikePhotoPreview,
    bikePhotoInputRef,
  };
}
