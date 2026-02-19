/* מפה של וריאנטים ויזואליים לפי שם. */
const variantClasses = {
  primary:
    "mv-btn-primary focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
  ghost: "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
};

/* מפה של גדלי כפתור לפי שם. */
const sizeClasses = {
  md: "rounded-xl px-4 py-2 text-sm font-medium",
  lg: "rounded-xl px-5 py-3 text-base font-semibold",
};

/**
 * קומפוננטת כפתור כללית של מערכת העיצוב.
 * @param {Object} props - מאפייני הקומפוננטה.
 * @param {"primary"|"ghost"} [props.variant="primary"] - וריאנט עיצוב.
 * @param {"md"|"lg"} [props.size="md"] - גודל הכפתור.
 * @param {string} [props.className] - קלאסים נוספים.
 * @param {"button"|"submit"|"reset"} [props.type="button"] - סוג כפתור HTML.
 * @param {React.ReactNode} props.children - תוכן פנימי של הכפתור.
 * @returns {JSX.Element} אלמנט button עם קלאסים מחושבים.
 */
function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...props
}) {
  /* בניית מחרוזת קלאסים סופית מתוך בסיס + וריאנט + גודל + הרחבות חיצוניות. */
  const classes = [
    "inline-flex items-center justify-center transition focus:outline-none",
    variantClasses[variant] ?? variantClasses.primary,
    sizeClasses[size] ?? sizeClasses.md,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}

export default Button;
