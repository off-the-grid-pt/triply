import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "@/features/auth/options";
import { parseMoneyToMinorUnits } from "@/features/trips/money";
import type { CurrencyCode } from "@/features/trips/types";

export const uuid=z.string().uuid("Identificador inválido.");
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/,"Introduza uma data válida.");
const optional=z.string().trim().max(2000,"Máximo de 2000 caracteres.").transform(v=>v||null);
const money=z.object({amount:z.string().trim(),currency:z.enum(SUPPORTED_CURRENCIES),baseAmount:z.string().trim()});
export function moneyValues(input:z.infer<typeof money>,baseCurrency:CurrencyCode,required:boolean){
  if(!required&&input.amount==="")return null;
  const original=parseMoneyToMinorUnits(input.amount,input.currency),base=parseMoneyToMinorUnits(input.currency===baseCurrency?input.amount:input.baseAmount,baseCurrency);
  if(original===null||base===null||original===0n&&base!==0n)return null;
  return{original,currency:input.currency,base,baseCurrency};
}
export const scopeSchema=z.object({scopeType:z.enum(["trip","stop","travel_leg"]),scopeId:z.string()}).superRefine((v,c)=>{if(v.scopeType!=="trip"&&!uuid.safeParse(v.scopeId).success)c.addIssue({code:"custom",path:["scopeId"],message:"Selecione uma associação válida."});});
export const costSchema=z.object({title:z.string().trim().min(1,"Introduza um título.").max(120),categoryId:uuid,scopeType:z.enum(["trip","stop","travel_leg"]),scopeId:z.string(),estimatedAmount:z.string().trim(),estimatedCurrency:z.enum(SUPPORTED_CURRENCIES),estimatedBaseAmount:z.string().trim(),committedAmount:z.string().trim(),committedCurrency:z.enum(SUPPORTED_CURRENCIES),committedBaseAmount:z.string().trim(),notes:optional,requestId:uuid}).and(scopeSchema);
export const transactionSchema=z.object({costItemId:z.string(),categoryId:z.string(),title:z.string().trim().max(120),scopeType:z.enum(["trip","stop","travel_leg"]),scopeId:z.string(),amount:z.string().trim().min(1,"Introduza um valor."),currency:z.enum(SUPPORTED_CURRENCIES),baseAmount:z.string().trim(),date,notes:optional,requestId:uuid});
export const adjustmentSchema=z.object({paymentId:z.string(),actualExpenseId:z.string(),amount:z.string().trim().min(1,"Introduza o reembolso."),baseAmount:z.string().trim(),date,notes:z.string().trim().min(1,"Indique o motivo.").max(2000),requestId:uuid});
export const categorySchema=z.object({name:z.string().trim().min(1,"Introduza um nome.").max(60)});
