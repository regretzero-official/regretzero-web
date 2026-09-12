import type { SajuChart } from "./manseryeok/types";
import { dayMasterLabel } from "./manseryeok/computeChart";
import type { SajuBirthForm } from "./types";


/** Korean topic/subject particles from hangul batchim. */
export function topicParticle(name: string): string {
  const last = name.trim().slice(-1);
  if (!last) return "는";
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return "는";
  return (code - 0xac00) % 28 === 0 ? "는" : "은";
}

export function subjectParticle(name: string): string {
  const last = name.trim().slice(-1);
  if (!last) return "가";
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return "가";
  return (code - 0xac00) % 28 === 0 ? "가" : "이";
}

export function safe(value: string, fallback: string) {
  const t = value.trim();
  return t.length > 0 ? t : fallback;
}

export function you(form: SajuBirthForm) {
  return safe(form.displayName, "너");
}

export function partner(form: SajuBirthForm) {
  return safe(form.partnerName, "그 사람");
}

export function monthsLabel(form: SajuBirthForm) {
  return `약 ${safe(form.monthsApart, "3")}개월`;
}

export function concernLine(form: SajuBirthForm) {
  return safe(form.concern, "그 사람, 아직 나를 생각할까?");
}

export function breakupLine(form: SajuBirthForm) {
  return safe(form.breakupNote, "서로 지쳐 헤어진 느낌");
}

export function birthLabel(form: SajuBirthForm) {
  return `${safe(form.birthYear, "1995")}년 ${safe(form.birthMonth, "3")}월 ${safe(form.birthDay, "14")}일 ${safe(form.birthTime, "시간 미상")}생(${safe(form.birthPlace, "서울")})`;
}

/** Plain everyday metaphor for day-master element (support line). */
export function dayMasterSense(chart: SajuChart): string {
  const dm = dayMasterLabel(chart.dayMaster, chart.dayMasterElement);
  const el = chart.dayMasterElement;
  if (el.includes("목") || el === "木") {
    return `네 일간은 ${dm}. 나무처럼 한번 뿌리 내리면 쉽게 안 빼는 결이라, 연애도 ‘깊게·오래’ 쪽으로 기운다.`;
  }
  if (el.includes("화") || el === "火") {
    return `네 일간은 ${dm}. 불처럼 먼저 따뜻해지고, 식는 데도 시간이 걸리는 결이라 잔향이 길다.`;
  }
  if (el.includes("토") || el === "土") {
    return `네 일간은 ${dm}. 흙처럼 받아 담고 버티는 결이라, 관계는 천천히 쌓이고 쉽게 안 비운다.`;
  }
  if (el.includes("금") || el === "金") {
    return `네 일간은 ${dm}. 쇠처럼 기준이 분명한 결이라, 한번 마음 열면 쉽게 흔들리지 않는다.`;
  }
  if (el.includes("수") || el === "水") {
    return `네 일간은 ${dm}. 물처럼 깊게 스며드는 결이라, 한번 마음에 들면 쉽게 안 뺀다.`;
  }
  return `네 일간은 ${dm}. 한번 마음 주면 쉽게 안 빼는 쪽에 가깝다.`;
}

export function voidSense(chart: SajuChart): string {
  const v = chart.voidBranches.join("·");
  if (!v) {
    return `공망 표시는 약하다. 그래도 ‘관심은 있는데 손이 안 가는’ 구간은 사람마다 온다.`;
  }
  return `네 공망은 ${v}. 쉽게 말하면 ‘관심은 있는데 손이 안 가는’ 구간에 가깝다.`;
}

export function yearSense(chart: SajuChart): string {
  return `올해 세운 연주는 ${chart.currentYearPillar.korean}. 움직임·기회가 커질 수 있는 해 결이다.`;
}

export function luckLine(chart: SajuChart): string {
  if (!chart.luckPillars) return "대운은 성별(남/여) 입력이 있을 때 함께 읽어요.";
  const sample = chart.luckPillars.pillars
    .slice(0, 3)
    .map((p) => `${p.age}세 ${p.korean}`)
    .join(" → ");
  return `대운 ${chart.luckPillars.forward ? "순행" : "역행"} · 시작 ${chart.luckPillars.startAge}세 · ${sample}`;
}

export function hourLine(chart: SajuChart): string {
  if (chart.hourUnknown || !chart.pillars.hour) {
    return "시주 미상 (출생 시각을 몰라 시주는 제외했어요)";
  }
  return `시주 ${chart.pillars.hour.korean}(${chart.pillars.hour.hanja})`;
}

/** Minimal voice surface shared by long narrative builders. */
export type NarrativeVoice = {
  name: string;
  openerAside: (p: string) => string;
  coverBridge: (y: string, birth: string, gender: string, months: string, breakup: string) => string;
  coverClose: string;
  frameAside?: string;
  questionsLead?: string;
  questionsClose?: (p: string) => string;
  traitLead?: string;
  traitClose?: (p: string) => string;
  patternClose?: (p: string) => string;
  bondAside?: (p: string) => string;
  breakupAside?: (p: string) => string;
  remainingAside?: (p: string) => string;
  timelineAside?: string;
  contactAside?: (p: string) => string;
  strategyClose?: string;
  pitfallsLead?: string;
  closingHook: (p: string, months: string) => string;
  closingBody: string;
  signOff: string;
  strategyNudge: string;
  heartTempLead?: (p: string) => string;
  keepLeaveClose?: string;
  selfRoutineClose?: string;
  dontNowLead?: string;
};

/**
 * 점사/상담형 장 확장 — 직접 호명 + 흐름·원국 근거 + 상담 결론 + “다음에 네가 할 선택”
 * 문학 장면·웹소설 cliffhanger 대신, 점쟁이가 풀어주는 호흡. narrator 보이스 유지.
 */
export function novelDepth(
  form: SajuBirthForm,
  p: string,
  chart: SajuChart,
  beat: string,
  sceneHook: string,
  narrator: string,
  flavor: "heart" | "breakup" | "strategy" = "heart",
): string {
  const dm = dayMasterLabel(chart.dayMaster, chart.dayMasterElement);
  const months = monthsLabel(form);
  const breakup = breakupLine(form);
  const concern = concernLine(form);
  const y = you(form);

  const flavorLead =
    flavor === "heart"
      ? `${p}의 속마음은 고열이 아니라 저열이야. 스치고, 멈추고, 닫아. 네가 그 저열을 ‘무정’으로 읽으면 장문이 나오고, 장문이 나오면 상대의 보관함은 더 깊어져. **지금은 온기보다 안전감이다.** 선 그어.`
      : flavor === "breakup"
        ? `남겨둘지 놓을지의 핵은 사랑 점수가 아니야. **네 자존이 버티는 구조**야. ${p}를 악역으로 두어도, 성인으로 두어도—결정은 네가 작아지지 않는 쪽으로. 원국을 봐도 ‘퍼주는 결’이 과하면 소모가 먼저 와.`
        : `전략의 지표는 답장 속도가 아니야. **네가 무너지지 않는 하루**야. ${p}에게 보내는 한 줄보다, 보내고 나서의 네 일정이 더 중요해. **설득보다 정돈이 먼저다.**`;

  const flavorChoice =
    flavor === "heart"
      ? `가벼운 온기(타이밍·상태 될 때) / 보관함을 두드리지 않기 / 네가 안전해 보이는 루틴`
      : flavor === "breakup"
        ? `남겨둘 조건·놓을 조건을 문장으로 적기 / 자존 루틴 지키기 / 감정 최고점에서 결정 미루기`
        : `생활 리듬 회복 / 메모장에만 초안 / 저자극 안부(정돈된 날만) / 거절·읽씹 후에도 하루 굴리기`;

  const flavorCounsel =
    flavor === "heart"
      ? `속마음 상담으로 한 스푼 더: ${p}가 너를 떠올리는 순간이 있어도, 그걸 ‘지금 열어달라는 신호’로 읽지 마. 저열의 그리움은 **조용히 보관**하는 쪽에 가깝고, 고열의 확인은 문을 닫게 해. ${beat}에서 네가 고를 표정은 ‘간절’이 아니라 **편함**이야.`
      : flavor === "breakup"
        ? `결정 상담으로 한 스푼 더: “정이 남았는데”와 “자존이 깎이는데”가 동시에 올 수 있어. 둘을 한 점수로 합산하지 마. 남겨둔다면 **재계약 가능한 조건**이 보여야 하고, 놓는다면 **너를 키우는 문장**으로 놓아야 해. ${beat}의 결론은 감정 최고점이 아니라 낮의 맑은 머리에서.`
        : `전략 상담으로 한 스푼 더: 연락 창이 보여도 ‘허가증’이 아니야. 시험 운전에 가까워. ${beat}에서 성공은 답장이 아니라, **보내고 나서도 네가 일정대로 사는가**야. 그게 안정으로 읽혀.`;

  return `
---

### ${beat} · 점사로 한 번 더

${sceneHook}

${y}. ${narrator}${topicParticle(narrator)} ${beat}를 다시 풀어줄게. 소설 장면이 아니라, **사주를 보고 예언·풀이해주는 상담**으로.

**한줄 단정.** ${beat}에서 네가 진짜로 흔들리는 지점은 정보 부족이 아니야. 폰을 여는 손, 대화창을 올렸다 내리는 버릇, 자정에 문장을 늘리는 습관—그 패턴을 먼저 읽어. 그다음 선택이다.

${p}와의 이별(${breakup}, ${months})을 떠올릴 때, 너는 두 갈래로 갈려. 한쪽은 “아직 가능할까”이고, 다른 쪽은 “내가 또 매달리는 건 아닐까”야. 둘 다 정상이야. ${narrator}${topicParticle(narrator)} 그 둘을 싸우게 두지 않아. **선 그어. 매달림은 차단이다.**

고민(${concern})이 가슴을 누르면, 질문은 하나로 줄여. “지금 내가 정돈된가?” YES면 다음 선택(짧은 안부·침묵·루틴)을 고르고, NO면 선택은 전부 내일로 미뤄. 이 한 질문이 ${beat} 전체의 척추야.

${flavorLead}

### 원국을 보면 — ${beat} 근거

*(근거 한 줄)* ${dayMasterSense(chart)}
*(근거 한 줄)* ${voidSense(chart)} · ${yearSense(chart)}

일간 **${dm}**을 축으로 보면, 너는 깊게 남는다. 깊게 남는 사람은 이별 후에도 해석이 선명해. 선명함을 ‘즉시 행동’으로 옮기지 마. 선명함은 일기에, 행동은 낮의 짧은 언어로. **지금은 그 분리다.**

### ${p} 심리 · 타이밍 · 감정 해석

${flavorCounsel}

지쳐 헤어진 사람은 그리움과 두려움이 한몸이야. 네가 안전해 보일수록 그리움이 말하고, 네가 추궁으로 보일수록 두려움이 말해. 헤어진 지 ${months}, “${breakup}” 결이면 ${p}는 **미움이 아니라 피로·자기보호**다. **단정해.**

타이밍도 달력보다 상태야. “오늘이 며칠이라서”가 아니라 “오늘 내가 정돈됐나”가 먼저야. 상태가 흐리면 좋은 창도 독이 되고, 상태가 맑으면 평범한 날도 시험 운전이 돼.

### 다음에 네가 할 선택 — ${beat}

하지 말 것 (손가락이 가려 해도):
- 감정 최고점에서 전송
- 과거 재판을 ‘친밀감’으로 위장하기
- 공통 지인에게 떠보기
- 답장 속도에 자존 걸기
- “이번이 마지막” 협박 톤
- 고민(${concern})을 ${p}에게 그대로 질문으로 던지기

해도 되는 것 (지금은 이렇게 해):
- 메모장에만 속마음 적기
- 몸 움직이기, 사람 만나기, 수면 지키기
- ${flavorChoice}

${narrator}${subjectParticle(narrator)} 단호히 말해. “지금은 이렇다—**네가 무너지지 않는 기술**이 먼저다. 인연의 다음 흐름은 그 기술 위에 올라온다. 기술이 먼저야.”

**흔들리지 마. 밤은 길어도, 네 선택은 짧고 단호하게.** 헤어진 지 ${months}. “${breakup}”. 그 숫자를 달력 저당으로 쓰지 마. **상태 우선.** 상태가 정돈된 날이, 선택해도 되는 날이야.`;
}

export function noticeBody(narrator: string, productTitle: string): string {
  return `**원국(네 기둥·일간 등)은 출생 기준 만세력으로 계산**했어요(양력·입춘·절기).
해석·조언은 **참고용이에요. 절대 결과가 아니에요.** 원치 않는 연락은 권하지 않아요. 재미·위로·자기 성찰용으로만 읽어 주세요.

— ${narrator} · ${productTitle}`;
}

export function applyPads(
  sections: { id: string; title: string; body: string }[],
  pads: Record<string, { beat: string; scene: string }>,
  form: SajuBirthForm,
  p: string,
  chart: SajuChart,
  narrator: string,
  flavor: "heart" | "breakup" | "strategy",
) {
  return sections.map((s) => {
    const pad = pads[s.id];
    if (!pad) return s;
    return {
      ...s,
      body: `${s.body}
${novelDepth(form, p, chart, pad.beat, pad.scene, narrator, flavor)}`,
    };
  });
}

export function sceneBlocks(
  n: number,
  p: string,
  y: string,
  months: string,
  breakup: string,
  concern: string,
  dm: string,
  chartBits: string,
  voiceName: string,
  productHooks: string,
): string {
  const beats = ["보관함", "온도", "연락", "자존", "전략", "침묵", "잔향", "선택", "루틴", "문", "온기", "중심"];
  const parts: string[] = [
    `${y}. ${voiceName}${topicParticle(voiceName)} 바로 말해줄게. ${p} 생각이 밤에만 커지는 건 약함이 아니라, 깊게 남는 결이야. 다만 그 결을 전송으로 쓰면 독이 돼.`,
    `고민 「${concern}」—낮엔 괜찮은 척해도 자정이면 해석이 늘어. ${voiceName}${topicParticle(voiceName)} 그 해석을 싸움으로 두지 않아. **흐름·원국·행동**으로 붙잡아.`,
    `헤어진 지 ${months}. 이별 메모는 “${breakup}”. 큰 배신이 아니라 소모·속도 어긋남이다. 그래서 미련이 남는다. 미움으로 끝났으면 마음이 더 빨리 식었을 거다.`,
    `원국을 보면 네 일간은 **${dm}**. 깊게 남는 결이라 해석이 선명해. 선명함을 즉시 전송으로 옮기지 마. 선명함은 일기장에, 행동은 낮의 짧은 언어로.`,
    chartBits,
    `${p} 심리 한 스푼: 지쳐 헤어진 사람은 그리움과 두려움이 한몸이야. 네가 안전해 보일수록 그리움이 말하고, 추궁으로 보일수록 두려움이 말해.`,
    `성공 지표를 바꿔. 답장 속도가 아니라 **네가 무너지지 않는 하루**. 답장이 늦어도 일정이 굴러가면, 그게 이기는 판이야.`,
    `다음에 네가 할 선택: 감정 최고점 전송 금지 · 메모장에만 속마음 · 몸 움직이기 · 사람 만나기 · 수면 지키기. ${productHooks}`,
    `*(근거 한 줄)* 원국·이별·침묵의 결을 겹치면 흐름이 선명해. **지금은 이렇다—정돈 먼저, 들이대기 나중.**`,
    `${voiceName}${subjectParticle(voiceName)} 상담 결론으로 남겨. “흔들리지 마. 밤은 길어도, 네 선택은 짧고 단호하게.”`,
  ];
  for (let i = 0; i < n; i++) {
    const beat = beats[i % beats.length];
    parts.push(`### 점사 풀이 ${i + 1} — ${beat}
${y}, ${beat} 앞에서 흔들릴 때 ${voiceName}${topicParticle(voiceName)} 이렇게 풀어줄게. 자정 전후 ${p} 대화창을 올렸다 내리는 그 30초—올리고 싶은 마음은 사랑이고, 내리는 손은 자기보호야. 둘 다 인정한 다음에야 “지금 보낼 문장인가?”를 물을 수 있어.

보내지 않기로 한 밤이 쌓이면, 너는 작아지는 게 아니라 **중심이 서는** 쪽으로 간다. ${p}가 그걸 늦게 느껴도 흐름은 바뀌어. 먼저 변하는 쪽은 언제나 너야.

이별(${breakup}) 이후 ${months} 동안 반복된 검색·해석·장문 초안이 있다면, 그걸 죄책감으로만 두지 마. **습관의 이름**을 붙여. 습관은 대체 습관으로 갈아끼워. 장문 욕구 → 메모 3줄. 검색 욕구 → 산책 10분. 해석 욕구 → “모름”이라고 말하기.

원국으로 보면 ${beat}의 핵은 ‘더 잘해주기’가 아니라 **덜 매달리는 안정**이다. ${y}의 진지함은 이미 충분해. 결론—진지함을 무게가 아니라 안정으로 바꿔. ${productHooks}

${beat} 앞에서 네가 흔들릴 때마다, “지금 내가 정돈된가?”만 물어. YES면 짧은 선택, NO면 전부 내일. 이 질문이 ${beat} 점사의 척추야.

${p}에게 확인하고 싶은 밤일수록, 확인은 독이다. 확인 대신 루틴. 루틴이 쌓이면 문이 얇아진다. 문이 그대로여도—너는 작아지지 않아. 그게 이 긴 점사 상담의 본편이야.

감정 해석 한 줄 더: ${beat}에서 네가 느끼는 조급함은 ‘사랑 부족’ 신호가 아니라 **불확실성을 못 견디는 몸**의 신호다. 몸을 안정시키면 해석이 짧아지고, 해석이 짧아지면 선택이 맑아져.`);
  }
  return parts.join("\n\n");
}

export function longSection(
  extraCount: number,
  p: string,
  y: string,
  months: string,
  breakup: string,
  concern: string,
  dm: string,
  chartBits: string,
  voiceName: string,
  productHooks: string,
  lead: string,
  middleExtra = "",
): string {
  return `${lead}

**쉬운 결론부터.** 점사는 길게, 결정은 또렷하게.

${sceneBlocks(extraCount, p, y, months, breakup, concern, dm, chartBits, voiceName, productHooks)}

${middleExtra}

「…이거, 내 얘기인데.」—맞아요. 그게 이 긴 점사 상담의 호흡이야. 짧은 조언은 이미 충분했을 거야. **풀어주는 말**이 있어야 밤에 한 번 덜 무너져.`;
}
