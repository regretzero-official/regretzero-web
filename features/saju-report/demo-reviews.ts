import type { DemoReview } from "./types";

/** Clearly fictional demo reviews — UI must label as 예시 후기(데모). */
export const SAJU_DEMO_REVIEWS: DemoReview[] = [
  {
    id: "r1",
    maskedName: "j***",
    stars: 5,
    tags: ["재회운", "한시우"],
    body: "삼 년 전 헤어진 사람인데, 왜 끝났는지가 사주에  겹쳐서 해서 소름… 속마음 파트에서 ‘흔적이 남아 있다’는 문장 보고 울었어요. (예시)",
  },
  {
    id: "r2",
    maskedName: "s***",
    stars: 5,
    tags: ["속마음", "이도령"],
    body: "연락 타이밍이 반신이었는데, 그 주에 진짜 톡이 와서 다시 읽었어요. 만날 때 조심할 점도 구체적이라 좋았습니다. (예시)",
  },
  {
    id: "r3",
    maskedName: "h***",
    stars: 5,
    tags: ["이별 결정", "강세온"],
    body: "붙잡을지 말지 혼자 빙빙 돌았는데, 체크리스트 보고 마음이 조금 정해졌어요. 위로만 하는 글이 아니라서요. (예시)",
  },
  {
    id: "r4",
    maskedName: "m***",
    stars: 5,
    tags: ["행동 전략", "한시우"],
    body: "보내지 말라는 문장이 딱 내가 쓰려던 말이라… 참았어요. 그거만으로도 값어치 있었어요. (예시)",
  },
];
