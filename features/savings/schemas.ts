import { z } from "zod";import { parseMoneyToMinorUnits } from "@/features/trips/money";import type { CurrencyCode } from "@/features/trips/types";
export const savingsFormSchema=z.object({currentAvailable:z.string().trim(),currency:z.string().regex(/^[A-Z]{3}$/,"Moeda inválida."),requestId:z.string().uuid("Pedido inválido.")});
export function availableMinor(value:string,currency:CurrencyCode):bigint|null{if(value.startsWith("-"))return null;return parseMoneyToMinorUnits(value,currency);}
