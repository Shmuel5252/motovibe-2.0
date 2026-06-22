/**
 * padTwo — מוסיף 0 מוביל למספר חד-ספרתי (לדוגמה: 5 → "05").
 * @param {number} n
 * @returns {string}
 */
export function padTwo(n) {
    return String(n).padStart(2, "0");
}

/**
 * formatRideDuration — ממיר שניות למחרוזת זמן קריאה בעברית
 * (לדוגמה: "15 דקות", "1 שעות ו-15 דקות")
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatRideDuration(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds || 0));

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const formattedM = padTwo(m);
    const formattedS = padTwo(s);

    if (h > 0) {
        return `${h}:${formattedM}:${formattedS} שעות`;
    }

    return `${formattedM}:${formattedS} דק'`;
}
