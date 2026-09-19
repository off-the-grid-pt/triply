export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "confirmPassword" | "displayName" | "currency" | "locale", string>>;
};

export const initialAuthActionState: AuthActionState = { status: "idle" };
