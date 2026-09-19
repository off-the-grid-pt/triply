export function formatTripDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function formatTripDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) return formatTripDate(startDate);
  return `${formatTripDate(startDate)} — ${formatTripDate(endDate)}`;
}
