/** Mobile-first ~3 screens: 나 → 상대 → 상황(선택·제출) */
export const FORM_STEPS = [
  { id: "me", label: "나" },
  { id: "partner", label: "상대" },
  { id: "situation", label: "상황" },
] as const;

export type FormStepId = (typeof FORM_STEPS)[number]["id"];
