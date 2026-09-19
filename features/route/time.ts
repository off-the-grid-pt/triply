export function isIanaTimezone(value: string): boolean {
  try { new Intl.DateTimeFormat("en", { timeZone: value }).format(); return true; } catch { return false; }
}

function localParts(epoch: number, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(epoch));
  return Object.fromEntries(parts.map((part) => [part.type, Number(part.value)]));
}

export function zonedDateTimeToEpoch(date: string, time: string, timezone: string): number | null {
  if (!isIanaTimezone(timezone)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = desired;
  for (let pass = 0; pass < 2; pass += 1) {
    const parts = localParts(candidate, timezone);
    const observed = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    candidate -= observed - desired;
  }
  return candidate;
}
