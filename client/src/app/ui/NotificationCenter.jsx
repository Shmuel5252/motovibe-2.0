import { Bell, Check, Trash2, X } from "lucide-react";
import { useEffect, useRef } from "react";

/**
 * NotificationCenter — לוח התראות עם פעמון ולוח נגרר.
 *
 * @param {object}   props
 * @param {Array}    props.notifications      - רשימת אובייקטי התראות
 * @param {number}   props.unreadCount        - מספר התראות שלא נקראו
 * @param {boolean}  props.isOpen             - האם הלוח פתוח
 * @param {Function} props.onToggle           - פתיחה/סגירה
 * @param {Function} props.onClose            - סגירה בלבד
 * @param {Function} props.onMarkRead         - (id) => void
 * @param {Function} props.onMarkAllRead      - () => void
 * @param {Function} props.onDelete           - (id) => void
 */
export default function NotificationCenter({
  notifications = [],
  unreadCount = 0,
  isOpen,
  onToggle,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onNavigate,
}) {
  const bellRef = useRef(null);
  const panelRef = useRef(null);

  /* סגירה בלחיצה מחוץ ללוח ולפעמון */
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        bellRef.current &&
        !bellRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  /* סגירה על Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const formattedTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "עכשיו";
    if (diffMins < 60) return `לפני ${diffMins} דק'`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `לפני ${diffHours} שע'`;
    const diffDays = Math.floor(diffHours / 24);
    return `לפני ${diffDays} ימים`;
  };

  return (
    <>
      {/* כפתור פעמון */}
      <button
        ref={bellRef}
        type="button"
        onClick={onToggle}
        aria-label="התראות"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition hover:text-white mv-card"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* לוח ההתראות — מוצג רק כשפתוח */}
      {isOpen && (
        <div
          ref={panelRef}
          dir="rtl"
          className="fixed top-16 left-4 z-999 w-80 rounded-2xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {/* כותרת */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-emerald-400" />
              <span className="text-sm font-semibold text-white">התראות</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                  {unreadCount} חדשות
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-slate-400 transition hover:text-emerald-300"
                  title="סמן הכל כנקרא"
                >
                  <Check size={12} />
                  <span>סמן הכל</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-slate-500 transition hover:text-white"
                aria-label="סגור"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* רשימת התראות */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell size={32} className="mb-3 text-slate-600" />
                <p className="text-sm text-slate-500">אין התראות עדיין</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <NotificationItem
                  key={notif._id}
                  notif={notif}
                  formattedTime={formattedTime}
                  onMarkRead={onMarkRead}
                  onDelete={onDelete}
                  onNavigate={onNavigate}
                />
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}

function NotificationItem({
  notif,
  formattedTime,
  onMarkRead,
  onDelete,
  onNavigate,
}) {
  const handleClick = () => {
    if (!notif.read) onMarkRead(notif._id);
    if (notif.link && onNavigate) onNavigate(notif.link);
  };

  return (
    <div
      className={[
        "group flex gap-3 px-4 py-3 border-b border-white/5 transition hover:bg-white/5",
        notif.read ? "opacity-60" : "",
      ].join(" ")}
    >
      {/* אינדיקטור קריאה */}
      <div className="mt-1.5 shrink-0">
        {!notif.read ? (
          <span className="block h-2 w-2 rounded-full bg-emerald-400" />
        ) : (
          <span className="block h-2 w-2 rounded-full bg-transparent" />
        )}
      </div>

      {/* תוכן — לחיץ לניווט */}
      <div
        className={["min-w-0 flex-1", notif.link ? "cursor-pointer" : ""].join(
          " ",
        )}
        onClick={notif.link ? handleClick : undefined}
        role={notif.link ? "button" : undefined}
        tabIndex={notif.link ? 0 : undefined}
        onKeyDown={
          notif.link ? (e) => e.key === "Enter" && handleClick() : undefined
        }
      >
        <p className="text-sm font-medium text-slate-100 leading-snug">
          {notif.title}
        </p>
        {notif.body && (
          <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">
            {notif.body}
          </p>
        )}
        <p className="mt-1 text-[11px] text-slate-600">
          {formattedTime(notif.createdAt)}
        </p>
      </div>

      {/* פעולות */}
      <div className="flex shrink-0 flex-col gap-1 opacity-0 transition group-hover:opacity-100">
        {!notif.read && (
          <button
            type="button"
            onClick={() => onMarkRead(notif._id)}
            className="rounded p-1 text-slate-500 transition hover:text-emerald-400"
            title="סמן כנקרא"
          >
            <Check size={13} />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(notif._id)}
          className="rounded p-1 text-slate-500 transition hover:text-red-400"
          title="מחק"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
