import type { DemoReview } from "./types";

/** Clearly fictional demo reviews — UI must label as 예시 후기(데모). */
export const SAJU_DEMO_REVIEWS: DemoReview[] = [
  {
    id: "r1",
    maskedName: "김**",
    stars: 5,
    tags: ["재회운", "한시우"],
    body: "장문이 아니라 ‘왜 지금이면 안 되는지’가 먼저 정리돼서 숨이 좀 트였어요. (예시)",
  },
  {
    id: "r2",
    maskedName: "이**",
    stars: 5,
    tags: ["속마음", "이도령"],
    body: "남아 있다/없다를 단정하지 않고, 거리감의 결을 나눠줘서 덜 흔들렸어요. (예시)",
  },
  {
    id: "r3",
    maskedName: "박**",
    stars: 4,
    tags: ["이별 결정", "강세온"],
    body: "붙잡을지 말지 체크리스트가 현실적이라, 감정만으로 결정하지 않게 됐어요. (예시)",
  },
  {
    id: "r4",
    maskedName: "최**",
    stars: 5,
    tags: ["행동 전략", "한시우"],
    body: "금지 문구랑 1·3·6개월 창이 구체적이라 밤에 휴대폰만 만지작거리던 습관이 줄었어요. (예시)",
  },
];
