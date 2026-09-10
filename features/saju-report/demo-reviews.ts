import type { DemoReview } from "./types";

/** Clearly fictional demo reviews — UI must label as 예시 후기(데모). */
export const SAJU_DEMO_REVIEWS: DemoReview[] = [
  {
    id: "r1",
    maskedName: "j***e",
    stars: 5,
    tags: ["재회운", "백련"],
    elementChips: ["木", "보관함", "3개월 창"],
    dateLabel: "2026.08.14",
    body: "삼 년 전 헤어진 사람인데, 백련 언니가 기운으로 짚어준 ‘보관함’ 구간이 너무 겹쳐서… 속마음 파트에서 흔적이 남아 있다는 문장 보고 울었어요. 그 주부터 자정 장문을 끊었더니 마음이 조금 덜 흔들려요. (예시)",
  },
  {
    id: "r2",
    maskedName: "s***n",
    stars: 5,
    tags: ["속마음", "서나리"],
    elementChips: ["일간", "거리감", "저자극"],
    dateLabel: "2026.07.29",
    body: "서나리 느낌 말이 진짜 카톡 언니 같았어요. 연락 타이밍이 반신이었는데, ‘확인하고 싶을 때가 보내면 안 되는 때’ 문장 보고 참았더니 그 주에 톡이 와서 다시 읽었어요. (예시)",
  },
  {
    id: "r3",
    maskedName: "h***i",
    stars: 5,
    tags: ["이별 결정", "차유리"],
    elementChips: ["자존", "체크리스트", "기신"],
    dateLabel: "2026.08.02",
    body: "차유리 팩트 폭격… 아프긴 한데 자존감이 올라왔어요. 남겨둘 이유/놓을 이유 체크리스트 보고 ‘내가 버티는 구조’가 뭔지 처음으로 문장으로 적었어요. (예시)",
  },
  {
    id: "r4",
    maskedName: "m***a",
    stars: 5,
    tags: ["행동 전략", "한보라"],
    elementChips: ["식신", "금지 멘트", "1단계"],
    dateLabel: "2026.09.01",
    body: "한보라가 말린 금지 멘트가 딱 내가 쓰려던 말이라… 참았어요. 대신 한 줄 안부만 보냈는데 답장이 와서, 그거만으로도 값어치 있었어요. (예시)",
  },
  {
    id: "r5",
    maskedName: "y***o",
    stars: 5,
    tags: ["재회운", "백련"],
    elementChips: ["대운", "세운", "정돈"],
    dateLabel: "2026.06.18",
    body: "타임라인에서 1개월은 관망·3개월 접촉 창이라고 해서 조급함이 줄었어요. ‘완전히 끝’이 아니라 ‘방식만 바꾸라’는 말에 숨이 트인 느낌. (예시)",
  },
  {
    id: "r6",
    maskedName: "k***u",
    stars: 4,
    tags: ["속마음", "서나리"],
    elementChips: ["공망", "인성", "안전감"],
    dateLabel: "2026.08.21",
    body: "상대가 삭제했다기보다 손대기 무서운 공망이라는 비유가… 이상하게 위로됐어요. 다가갈 온도를 2~3도로 낮추니까 내가 덜 무너졌어요. (예시)",
  },
];
