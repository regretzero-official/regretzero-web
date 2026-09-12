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

/** 이별 결정 — Foxbunny식 긴 점사 상담 (차유리 기본, voicePack으로 강세온 가능) */
export function buildBreakupDecisionNarrativeSections(
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
  const chartBits = `원국 ${chart.summaryLine} · 일간 **${dm}** · ${hourLine(chart)}`;
  const vn = voice.name;
  const hooks = "결정은 사랑 점수가 아니라 자존 구조로. 퍼주지 마. 아껴도 돼.";
  const L = (n: number, lead: string, mid = "") =>
    longSection(n, p, y, months, breakup, concern, dm, chartBits, vn, hooks, lead, mid);

  const cover: SajuReportSection = {
    id: "cover",
    title: "표지 / 한줄결론",
    body: `${y}. ${vn}${topicParticle(vn)} 결정 점사 들어갈게.

마음이 반반일 때일수록, 눈물 상담 말고 **자존 상담**으로 가자.

${voice.openerAside(p)}

${voice.coverBridge(y, birthLabel(form), form.gender, months, breakup)}

고민의 핵:
> ${concern}

「붙여야 할까… 끝내야 할까.」
그 문장을 백 번 굴리지 마. 오늘은 **구조로** 읽어. 감정 점수로 판결하지 않아.

**원국 요약:** ${chart.summaryLine} · 일간 **${dm}**

**결론만 먼저.**

${oneLiner}

${bullets.map((b) => `- ${b}`).join("\n")}

이 리포트는 짧게 끝내지 않을게. “그냥 잊어”는 말이 되고, **풀어주는 말이 없으면** 밤에 또 ${p}를 열어. 그래서 점사처럼 길게 말해. 남겨둘 조건, 놓을 조건, 자존이 버티는 루틴. 팩트로.

${voice.coverClose}

— ${vn} · ${productTitle}`,
  };

  const questions: SajuReportSection = {
    id: "questions",
    title: "1장 · 이번 점사의 질문",
    body: L(
      5,
      `${voice.questionsLead ?? "질문부터 팩트로."}

1. **남겨둘 이유**는 사랑인가, 익숙함인가, 두려움인가?
2. **놓을 이유**는 소모인가, 성장인가, 자존 보호인가?
3. **지금 결정**해도 되는 상태인가? — 감정 최고점이면 내일로.

${voice.frameAside ?? ""}
${voice.questionsClose?.(p) ?? ""}
이별 메모: ${breakup} · ${months}.`,
    ),
  };

  const trait: SajuReportSection = {
    id: "trait",
    title: "원국·일간 기질",
    body: L(
      4,
      `${voice.traitLead ?? "기질은 원국 숫자로 짧게."}
${birthLabel(form)} — **${chart.summaryLine}**. 일간 **${dm}**.

깊게 사랑하고, 참다가, 한꺼번에 지치는 결. ${p} 이별도 그 패턴이다. 인정해야 다음이 있어.

년 ${chart.pillars.year.korean} · 월 ${chart.pillars.month.korean} · 일 ${chart.pillars.day.korean} · ${hourLine(chart)}

*(근거 한 줄)* ${dayMasterSense(chart)}
${voice.traitClose?.(p) ?? ""}`,
    ),
  };

  const pattern: SajuReportSection = {
    id: "pattern",
    title: "연애 패턴 · 잔향의 스크립트",
    body: L(
      4,
      `스크립트: 진입→몰입→과열→차단→잔향. 지금 ${months}은 잔향 구간.
같은 과열로 ${p}에게 가면 또 지친다. 재시도의 핵심은 더 잘해주기가 아니라 **덜 매달리는 안정**.

${voice.patternClose?.(p) ?? ""}
${voice.strategyNudge}`,
    ),
  };

  const breakupReason: SajuReportSection = {
    id: "breakup-reason",
    title: "헤어진 진짜 이유 — 표면 vs 속마음",
    body: L(
      5,
      `표면: 소모, “${breakup}”, 대화↓.
속: ${p} 쪽 자기보호 · 네 쪽 애착+자존 동시 작동.
팩트: 사랑이 0이 아니다. **속도·피로**로 문 닫힌 결이다. 선 그어.

${voice.breakupAside?.(p) ?? ""}
자책 문장 교정: “내가 과해서 끝났다” → “속도가 어긋났고, 나는 조절할 수 있다.”`,
    ),
  };

  const keepLeave: SajuReportSection = {
    id: "keep-leave",
    title: "2장 · 남겨둘 이유 / 놓을 이유",
    body: L(
      6,
      `${voice.keepLeaveClose ?? "결정은 사랑 점수가 아니라 자존 구조로."}

### 남겨둘 이유가 설득력 있으려면
- 서로의 페이스를 재계약할 의사가 보임
- 네가 추궁·장문 없이 버틸 루틴이 있음
- ${p}와의 관계가 너를 **키우는지** (작아지게 하는지)

### 놓을 이유가 설득력 있으려면
- 소모가 사랑보다 오래감
- 자존이 답장·침묵에 거래됨
- “잠깐 쉬자”가 영구가 됐는데 새 호흡이 안 들어옴

### 결정 문장 워크숍
남겨둔다면: “나는 ○○가 보일 때만 남긴다.”
놓는다면: “나는 ○○를 위해 놓는다.” (상대 탓이 아니라 네 자존 문장)

고민(${concern})을 한 줄로 줄여. 줄이지 못하면 지금은 결정 타이밍이 아니다—**루틴 타이밍**이다.`,
    ),
  };

  const routine: SajuReportSection = {
    id: "self-routine",
    title: "자존 회복 루틴",
    body: L(
      5,
      `${voice.selfRoutineClose ?? "흔들림을 줄이면 침묵의 의미가 달라진다."}

### 매일
- 수면 고정
- 몸 30분
- ${p} 검색 창 닫기
- 감정 일지 10분 (보내지 않음)

### 주간
- 사람 있는 약속 1~2
- “오늘 내가 참은 추궁” 기록
- 자존을 답장에 걸었던 순간 체크

*(근거 한 줄)* ${voidSense(chart)} · ${yearSense(chart)}
퍼주지 마. 너는 더 아껴도 돼.`,
    ),
  };

  const pitfalls: SajuReportSection = {
    id: "pitfalls",
    title: "주의할 함정",
    body: L(
      4,
      `${voice.pitfallsLead ?? "함정—확인해."}
- 감정 최고점에서 “끝이야/다시 하자” 선언
- 놓기로 하고 자정 장문
- 남겨두기로 하고 매일 시험
- 지인 재판정
- 자존 거래형 연락

${voice.strategyNudge}`,
    ),
  };

  const closing: SajuReportSection = {
    id: "closing",
    title: "캐릭터 마지막 한마디",
    body: L(
      5,
      `${voice.closingHook(p, months)}

${voice.closingBody}

세 문장:
1. 무조건 붙여/버려가 아니다. 구조다.
2. 남겨도/놓아도 네가 작아지면 잘못된 결정이다.
3. 팩트—너는 더 아껴도 돼.

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
    breakupReason,
    keepLeave,
    routine,
    pitfalls,
    closing,
    notice,
  ];

  const pads: Record<string, { beat: string; scene: string }> = {
    questions: { beat: "질문", scene: "붙여야 할까 끝내야 할까—판결 대신 구조로." },
    trait: { beat: "기질", scene: "깊게 사랑하고 참다가 지치는 결. 인정해야 다음이 있다." },
    pattern: { beat: "패턴", scene: "같은 과열 스크립트를 반복하지 않기." },
    "breakup-reason": { beat: "이별 원인", scene: "미움보다 속도·피로. 자책 문장을 교정한다." },
    "keep-leave": { beat: "남겨둘/놓을", scene: "사랑 점수가 아니라 자존 구조로 결정 문장을 쓴다." },
    "self-routine": { beat: "자존 루틴", scene: "퍼주지 마. 루틴이 매력이다." },
    pitfalls: { beat: "함정", scene: "감정 최고점 선언·자정 장문은 독." },
    closing: { beat: "마지막 말", scene: "남겨도 놓아도, 네가 작아지면 잘못된 결정이다." },
  };
  return applyPads(sections, pads, form, p, chart, vn, "breakup");
}
