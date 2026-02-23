/**
 * useHistory — Sub-Hook לניהול נתוני היסטוריית רכיבות.
 * אחראי על: נתוני דמו, פילטרים, חיפוש ומצבי UI של מסך ההיסטוריה.
 */

import { useState } from "react";

export default function useHistory() {
  /*
   * פילטר מקומי למסך היסטוריה (UI בלבד ללא סינון נתונים אמיתי בשלב זה).
   */
  const [selectedHistoryFilter, setSelectedHistoryFilter] = useState("הכל");
  const [isHistoryFilterMenuOpen, setIsHistoryFilterMenuOpen] = useState(false);

  /* רכיבה נבחרת לתצוגת פרטי היסטוריה במודל מקומי. */
  const [selectedHistoryRide, setSelectedHistoryRide] = useState(null);

  /* הערות מקומיות למסך פרטי רכיבה (ללא שמירה לשרת). */
  const [historyRideNotes, setHistoryRideNotes] = useState("");

  /*
   * טקסט חיפוש מקומי למסך היסטוריה (ללא API).
   */
  const [searchQuery, setSearchQuery] = useState("");

  /* קטגוריות פילטר */
  const historyFilters = ["הכל", "שבוע", "חודש", "שנה"];

  /*
   * נתוני דמו למסך היסטוריית רכיבות.
   * בהמשך יוחלפו בנתונים אמיתיים מהשרת.
   */
  const historyRides = [
    {
      id: "ride-1",
      title: "טיול רכיבה ביום שבת",
      date: "03.12.25",
      duration: "1:45",
      distance: "72 ק״מ",
    },
    {
      id: "ride-2",
      title: "נסיעה לעבודה",
      date: "28.11.25",
      duration: "0:55",
      distance: "21 ק״מ",
    },
    {
      id: "ride-3",
      title: "טיול לילה בהרים",
      date: "21.11.25",
      duration: "2:10",
      distance: "94 ק״מ",
    },
    {
      id: "ride-4",
      title: "סיבוב חוף ערב",
      date: "18.11.25",
      duration: "1:20",
      distance: "48 ק״מ",
    },
  ];

  return {
    historyRides,
    historyFilters,
    selectedHistoryFilter, setSelectedHistoryFilter,
    isHistoryFilterMenuOpen, setIsHistoryFilterMenuOpen,
    selectedHistoryRide, setSelectedHistoryRide,
    historyRideNotes, setHistoryRideNotes,
    searchQuery, setSearchQuery,
  };
}
