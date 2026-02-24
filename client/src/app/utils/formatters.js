export const formatRideDuration = (totalSeconds) => {
    if (!totalSeconds || isNaN(totalSeconds)) return "00:00 דק'";

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');

    if (hours > 0) {
        return `${hours}:${formattedMinutes}:${formattedSeconds} שעות`;
    }

    return `${formattedMinutes}:${formattedSeconds} דק'`;
};