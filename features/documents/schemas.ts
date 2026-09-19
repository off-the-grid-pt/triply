import { z } from "zod";

export const uuid = z.string().uuid();
const optionalText = (maximum: number) => z.string().trim().max(maximum).transform((value) => value || null);
const optionalDate = z.string().refine(
  (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)),
  "Data inválida.",
);

export const documentSchema = z.object({
  type: z.enum(["passport", "national_id", "visa", "travel_insurance", "health_document", "ticket_or_boarding_pass", "accommodation_voucher", "reservation_voucher", "driver_document", "rental_document", "other"]),
  title: z.string().trim().min(1, "Introduza um título.").max(160),
  holderLabel: optionalText(120), stopId: z.string(), reservationId: z.string(), travelLegId: z.string(),
  issueDate: optionalDate, expiryDate: optionalDate, notes: optionalText(4000), requestId: uuid,
}).superRefine((value, context) => {
  for (const key of ["stopId", "reservationId", "travelLegId"] as const) if (value[key] && !uuid.safeParse(value[key]).success) context.addIssue({ code: "custom", path: [key], message: "Associação inválida." });
  if (value.issueDate && value.expiryDate && value.expiryDate < value.issueDate) context.addIssue({ code: "custom", path: ["expiryDate"], message: "A validade não pode ser anterior à emissão." });
});

export const documentFormValues = (data: FormData) => Object.fromEntries(
  ["type", "title", "holderLabel", "stopId", "reservationId", "travelLegId", "issueDate", "expiryDate", "notes", "requestId"].map((key) => [key, String(data.get(key) ?? "")]),
);
