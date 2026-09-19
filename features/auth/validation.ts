import { z } from "zod";
import { SUPPORTED_CURRENCIES, SUPPORTED_LOCALES } from "./options";

export const emailSchema = z.string().trim().email("Introduza um email válido.");

export const passwordSchema = z
  .string()
  .min(8, "A palavra-passe deve ter pelo menos 8 caracteres.");

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = signInSchema;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As palavras-passe não coincidem.",
    path: ["confirmPassword"],
  });

export const onboardingSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Introduza o seu nome.")
    .max(80, "O nome pode ter no máximo 80 caracteres."),
  currency: z.enum(SUPPORTED_CURRENCIES),
  locale: z.enum(SUPPORTED_LOCALES.map((locale) => locale.value) as ["pt-PT", "en-GB"]),
});
