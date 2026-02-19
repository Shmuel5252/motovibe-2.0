/**
 * מציג כרטיס זכוכית אחיד עם אזור כותרת אופציונלי.
 * @param {Object} props - מאפייני הקומפוננטה.
 * @param {React.ReactNode} [props.title] - כותרת צד ימין/ראש הכרטיס.
 * @param {React.ReactNode} [props.right] - תוכן משלים לכותרת (כפתור/סטטוס).
 * @param {string} [props.className] - קלאסים נוספים להרחבת סגנון.
 * @param {React.ReactNode} props.children - תוכן פנימי של הכרטיס.
 * @returns {JSX.Element} בלוק section בסגנון glass.
 */
function GlassCard({ title, right, className = "", children }) {
  return (
    <section className={`mv-card p-5 ${className}`.trim()}>
      {/* כותרת אופציונלית: מוצגת רק אם יש title או right */}
      {(title || right) && (
        <header className="mb-4 flex items-center justify-between">
          {title ? (
            <h2 className="text-base font-semibold">{title}</h2>
          ) : (
            <span />
          )}
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export default GlassCard;
