import type { DemoReview } from "./types";

/** Clearly fictional demo reviews — UI must label as 예시 후기(데모). */
export const SAJU_DEMO_REVIEWS: DemoReview[] = [
  {
    id: "r1",
    maskedName: "j***",
    stars: 5,
    tags: ["재회운", "백련"],
    body: "삼 년 전 헤어진 사람인데, 백련 언니가 기운으로 짚어준 구간이 너무 겹쳐서… 속마음 파트에서 ‘흔적이 남아 있다’는 문장 보고 울었어요. (예시)",
  },
  {
    id: "r2",
    maskedName: "s***",
    stars: 5,
    tags: ["속마음", "서나리"],
    body: "서나리 느낌 말이 진짜 카톡 언니 같았어요. 연락 타이밍이 반신이었는데, 그 주에 톡이 와서 다시 읽었어요. (예시)",
  },
  {
    id: "r3",
    maskedName: "h***",
    stars: 5,
    tags: ["이별 결정", "차유리"],
    body: "차유리 팩트 폭격… 아프긴 한데 자존감이 올라왔어요. 체크리스트 보고 마음이 조금 정해졌어요. (예시)",
  },
  {
    id: "r4",
    maskedName: "m***",
    stars: 5,
    tags: ["행동 전략", "한보라"],
    body: "한보라가 말린 문장이 딱 내가 쓰려던 말이라… 참았어요. 그거만으로도 값어치 있었어요. (예시)",
  },
];
