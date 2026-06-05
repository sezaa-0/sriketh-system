/** Sinhala month names for live clock display */
const SINHALA_MONTHS = [
  "ජනවාරි",
  "පෙබරවාරි",
  "මාර්තු",
  "අප්‍රේල්",
  "මැයි",
  "ජූනි",
  "ජූලි",
  "අගෝස්තු",
  "සැප්තැම්බර්",
  "ඔක්තෝබර්",
  "නොවැම්බර්",
  "දෙසැම්බර්",
];

/**
 * @param {Date} date
 * @returns {string}
 * @example "2026 මැයි 21 | Thursday, 03:08:15 AM"
 */
export function formatLiveDateTime(date) {
  const year = date.getFullYear();
  const month = SINHALA_MONTHS[date.getMonth()];
  const day = date.getDate();
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return `${year} ${month} ${day} | ${dayName}, ${time}`;
}
