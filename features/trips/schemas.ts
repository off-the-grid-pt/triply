import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "@/features/auth/options";
import { parseMoneyToMinorUnits } from "./money";
import type { CurrencyCode, TripFormValues } from "./types";

const calendarDate = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}, "Introduza uma data válida.");

const optionalLabel = z
  .string()
  .trim()
  .max(120, "Este campo pode ter no máximo 120 caracteres.")
  .transform((value) => value === "" ? null : value);

export const tripFormSchema = z
  .object({
    name: z.string().trim().min(1, "Introduza o nome da viagem.").max(100, "O nome pode ter no máximo 100 caracteres."),
    startDate: calendarDate,
    endDate: calendarDate,
    originLabel: optionalLabel,
    returnLabel: optionalLabel,
    travelersCount: z.coerce.number().int("Introduza um número inteiro.").min(1, "A viagem deve ter pelo menos 1 viajante."),
    baseCurrency: z.enum(SUPPORTED_CURRENCIES, "Selecione uma moeda suportada."),
    targetBudget: z.string().trim(),
    createRequestId: z.string().uuid("Pedido de criação inválido."),
  })
  .superRefine((values, context) => {
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      context.addIssue({ code: "custom", path: ["endDate"], message: "A data de fim não pode ser anterior à data de início." });
    }
    if (values.targetBudget.startsWith("-")) {
      context.addIssue({ code: "custom", path: ["targetBudget"], message: "O orçamento não pode ser negativo." });
    } else if (values.targetBudget !== "" && parseMoneyToMinorUnits(values.targetBudget, values.baseCurrency) === null) {
      context.addIssue({ code: "custom", path: ["targetBudget"], message: "Introduza um valor monetário válido para esta moeda." });
    }
  });

export const tripIdSchema = z.string().uuid();

export const deleteTripConfirmationSchema = z.object({
  confirmation: z.string(),
  expectedName: z.string().min(1),
}).refine((value) => value.confirmation === value.expectedName, {
  path: ["confirmation"],
  message: "Escreva o nome exato da viagem para confirmar.",
});

export function tripValuesFromFormData(formData: FormData): TripFormValues {
  return {
    name: String(formData.get("name") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    originLabel: String(formData.get("originLabel") ?? ""),
    returnLabel: String(formData.get("returnLabel") ?? ""),
    travelersCount: String(formData.get("travelersCount") ?? ""),
    baseCurrency: String(formData.get("baseCurrency") ?? ""),
    targetBudget: String(formData.get("targetBudget") ?? ""),
    createRequestId: String(formData.get("createRequestId") ?? ""),
  };
}

export function targetBudgetMinor(value: string, currency: CurrencyCode): string | null {
  return parseMoneyToMinorUnits(value, currency)?.toString() ?? null;
}
