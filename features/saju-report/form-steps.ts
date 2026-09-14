export const FORM_STEPS = [
  { id: "gender", label: "성별" },
  { id: "basic", label: "기본정보" },
  { id: "partner", label: "상대" },
  { id: "situation", label: "상황" },
  { id: "confirm", label: "확인" },
] as const;

export type FormStepId = (typeof FORM_STEPS)[number]["id"];
