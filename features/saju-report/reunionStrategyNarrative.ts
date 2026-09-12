import type { SajuChart } from "./manseryeok/types";
import { dayMasterLabel } from "./manseryeok/computeChart";
import type { SajuBirthForm, SajuReportSection } from "./types";
import {
  applyPads,
  birthLabel,
  breakupLine,
  concernLine,
  dayMasterSense,
  hourLine,
  longSection,
  luckLine,
  monthsLabel,
  type NarrativeVoice,
  noticeBody,
  partner,
  subjectParticle,
  topicParticle,
  voidSense,
  yearSense,
  you,
} from "./novelHelpers";

/** 재회 행동 전략 — Foxbunny식 긴 점사 상담 (한보라 기본, voicePack으로 한시우 가능) */
export function buildReunionStrategyNarrativeSections(
  form: SajuBirthForm,
  voice: NarrativeVoice,
  chart: SajuChart,
  productTitle: string,
  oneLiner: string,
  bullets: string[],
): SajuReportSection[] {
  const p = partner(form);
  const y = you(form);
  const dm = dayMasterLabel(chart.dayMaster, chart.dayMasterElement);
  const months = monthsLabel(form);
  const breakup = breakupLine(form);
  const concern = concernLine(form);
  const chartBits = `원국 ${chart.summaryLine} · 일간 **${dm}** · 세운 ${chart.currentYearPillar.korean}`;
  const vn = voice.name;
  const hooks = "설득보다 안정. 첫 문장은 짧게. 답장 없어도 네가 괜찮아야 해.";
  const L = (n: number, lead: string, mid = "") =>
    longSection(n, p, y, months, breakup, concern, dm, chartBits, vn, hooks, lead, mid);

  const luck = chart.luckPillars
    ? `대운 ${chart.luckPillars.forward ? "순행" : "역행"} · 시작 ${chart.luckPillars.startAge}세 · ` +
      chart.luckPillars.pillars.slice(0, 3).map((x) => `${x.age}세 ${x.korean}`).join(" → ")
    : "대운(성별 남/여 입력 시 표시)";

  const cover: SajuReportSection = {
    id: "cover",
    title: "표지 / 한줄결론",
    body: `${y}. ${vn}${topicParticle(vn)} 전략 점사 시작할게.

응원도 필요하지만, 위험한 집착은 말릴게. ${vn}의 호흡으로 가자.

${voice.openerAside(p)}

${voice.coverBridge(y, birthLabel(form), form.gender, months, breakup)}

고민:
> ${concern}

「지금 연락해도 될까.」
답부터—**지금은 연락 타이밍이 아니다.** 달력보다 **상태에 물어.**

**원국 요약:** ${chart.summaryLine} · 일간 **${dm}**

**흐름상 결론만 먼저.**

${oneLiner}

${bullets.map((b) => `- ${b}`).join("\n")}

이 리포트는 실행 가이드를 점사 상담처럼 길게 풀어줄게. 금지 목록, 1·3·6개월 지도, 멘트, 3단계 전략. 같이 가자.

${voice.coverClose}

— ${vn} · ${productTitle}`,
  };

  const questions: SajuReportSection = {
    id: "questions",
    title: "1장 · 이번 점사의 질문",
    body: L(
      4,
      `${voice.questionsLead ?? "질문의 핵만."}
1. 지금 하면 안 되는 행동은?
2. 1·3·6개월 창에서 내 위치는?
3. 첫 문장은 뭘로? 금지 문구는?

${voice.frameAside ?? ""}
${voice.questionsClose?.(p) ?? ""}`,
    ),
  };

  const trait: SajuReportSection = {
    id: "trait",
    title: "원국·일간 기질",
    body: L(
      4,
      `${voice.traitLead ?? "기질은 쉽게."}
${birthLabel(form)} — **${chart.summaryLine}**. 일간 **${dm}**.
${hourLine(chart)}

*(근거 한 줄)* ${dayMasterSense(chart)}
${voice.traitClose?.(p) ?? ""}`,
    ),
  };

  const pattern: SajuReportSection = {
    id: "pattern",
    title: "연애 패턴 · 잔향의 스크립트",
    body: L(
      4,
      `진입→몰입→과열→차단→잔향. 전략의 적은 3단계(과열) 반복.
같은 방식으로 ${p}에게 가면 또 지친다. 재회는 설득보다 안정.

${voice.patternClose?.(p) ?? ""}
${voice.strategyNudge}`,
    ),
  };

  const dontNow: SajuReportSection = {
    id: "dont-now",
    title: "지금 하면 안 되는 것",
    body: L(
      5,
      `${voice.dontNowLead ?? "지금은 설득 시즌이 아니야."}
헤어진 지 ${months}, “${breakup}”라면 더더욱.

### 금지에 가까운 행동
- 자정 장문 / 술김 통화
- “우리 다시” 직구
- 읽씹 추궁, 연속 카톡
- 지인 통한 압력
- 고민(${concern})을 ${p}에게 그대로 던지기

### 대신 해도 되는 것
- 생활 리듬 회복
- 메모장에만 초안
- 친구에게 “오늘 내가 참은 추궁” 자랑

${voice.strategyNudge}`,
    ),
  };

  const timeline: SajuReportSection = {
    id: "timeline",
    title: "2장 · 대운·세운 타임라인 · 1 · 3 · 6개월",
    body: L(
      5,
      `- **세운(올해 연주):** ${chart.currentYearPillar.korean}
- **${luck}**
- 원국: ${chart.summaryLine}

※ 흐름상 결론—**지금은 들이댈 때가 아니다. 1~3개월이 창이다.** ${months} 기준.

### ◇ 1개월 — 관망·정돈
적극 재접근 금지에 가깝다. 에너지를 너에게.

### ◇ 3개월 전후 — 접촉 창
가벼운 안부. 조건: 매달림 없는 너. **이 구간이 창이다.**

### ◇ 6개월 — 갈림길
재개 vs 정리. 말투를 추궁에서 짧은 안부로.

*(근거 한 줄)* ${yearSense(chart)}
${voice.timelineAside ?? ""}
달력에 복종하지 마. **상태에 복종해.**`,
    ),
  };

  const contact: SajuReportSection = {
    id: "contact",
    title: "연락 멘트 / 금지 문구",
    body: L(
      4,
      `### 해도 되는 말
- “문득 생각나서. 잘 지내?”
- “답장 없어도 괜찮아. 그냥 안부.”

### 금지
- “그때 너 때문에…”, “다른 사람 생겼어?”
- 자정 장문, 연속 톡, 지인 떠보기

${voice.contactAside?.(p) ?? ""}
전송 전 30초: 숙제 있으면 삭제 · 답 없어도 OK? · 보내고 일정으로.`,
    ),
  };

  const strategySec: SajuReportSection = {
    id: "strategy",
    title: "재접근 전략 3단계",
    body: L(
      5,
      `### 1단계 — 기운 회수 (지금~1개월)
${p}를 설득하지 마. 운동·일·친구로 “나 없이도 굴러간다”.

### 2단계 — 저자극 접촉 (대략 3개월 창)
한 줄 안부 → 반응 보면 멈춤. 없거나 건조하면 최소 2주 침묵.

### 3단계 — 만남이 열리면 과거 재판 금지
짧은 자리, 오늘 이야기, 48시간 장문 후속 금지.

${voice.strategyClose ?? ""}
${voice.strategyNudge}`,
    ),
  };

  const pitfalls: SajuReportSection = {
    id: "pitfalls",
    title: "주의할 함정",
    body: L(
      4,
      `${voice.pitfallsLead ?? "함정."}
확인하고 싶을 때가 제일 보내면 안 되는 때.
한 줄 안부 후 감정 에세이 / 너무 빠른 만남 제안 / 읽씹에 재전송.

같이 가자. 위험한 집착은 응원이 아니야.`,
    ),
  };

  const closing: SajuReportSection = {
    id: "closing",
    title: "캐릭터 마지막 한마디",
    body: L(
      4,
      `${voice.closingHook(p, months)}

${voice.closingBody}

세 문장:
1. 재회는 고백이 아니라 저자극·정돈·타이밍.
2. 첫 문장은 짧게. 숙제 주지 마.
3. 답장 없어도 네가 괜찮아야 해.

*(근거 한 줄)* ${chart.summaryLine} · ${dm} · ${luckLine(chart)} — 참고용이에요.

${voice.signOff}`,
    ),
  };

  const notice: SajuReportSection = {
    id: "notice",
    title: "안내",
    body: noticeBody(vn, productTitle),
  };

  const sections = [
    cover,
    questions,
    trait,
    pattern,
    dontNow,
    timeline,
    contact,
    strategySec,
    pitfalls,
    closing,
    notice,
  ];

  const pads: Record<string, { beat: string; scene: string }> = {
    questions: { beat: "질문", scene: "지금 연락해도 될까—달력이 아니라 상태에 묻는다." },
    trait: { beat: "기질", scene: "깊게 남는 결. 전략은 그 결을 추궁으로 쓰지 않는 것." },
    pattern: { beat: "패턴", scene: "과열 스크립트를 다른 호흡으로." },
    "dont-now": { beat: "금지", scene: "빨간불. 자정 장문·직구·추궁은 넘기지 마." },
    timeline: { beat: "타임라인", scene: "1·3·6개월은 눈금. 상태는 네가 표시한다." },
    contact: { beat: "멘트", scene: "전송 버튼 앞. 멘트보다 네 상태." },
    strategy: { beat: "3단계", scene: "회수 → 저자극 → 재판 금지." },
    pitfalls: { beat: "함정", scene: "확인하고 싶을 때가 제일 보내면 안 되는 때." },
    closing: { beat: "마지막 말", scene: "응원하되, 위험한 집착은 말린다." },
  };
  return applyPads(sections, pads, form, p, chart, vn, "strategy");
}
