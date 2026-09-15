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
  topicParticle,
  voidSense,
  yearSense,
  you,
} from "./novelHelpers";

/** 헤어진 진짜 이유 — Foxbunny식 긴 점사 상담 (서나리 기본, 이도령·차유리 가능) */
export function buildBreakupReasonNarrativeSections(
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
  const hooks =
    "표면 이유와 속 이유를 나누고, 제3자 가능성은 단정이 아니라 결로 읽어. 진실을 안 뒤에는 네 하루부터.";
  const L = (n: number, lead: string, mid = "") =>
    longSection(n, p, y, months, breakup, concern, dm, chartBits, vn, hooks, lead, mid);

  const cover: SajuReportSection = {
    id: "cover",
    title: "표지 / 한줄결론",
    body: `${y}. ${vn}${topicParticle(vn)} 바로 점사할게.

${voice.openerAside(p)}

${voice.coverBridge(y, birthLabel(form), form.gender, months, breakup)}

네가 적어 준 고민의 핵:
> ${concern}

「우리 사이에 다른 사람이 있었을까?」
「헤어진 진짜 이유는 뭐였을까?」
그 두 문장을 밤에만 백 번 굴리는 사람—${vn}${topicParticle(vn)} 그 시간을 무시하지 않아. 궁금함과 상처가 한몸에 있어. 둘을 뭉치면 판단이 흐려져. 그래서 오늘은 **한줄 결론부터** 짚고, 표면·속·제3자 가능성·피로·남은 마음·그다음에 할 일로 길게 풀어줄게. 체크리스트 강의가 아니라, **점쟁이가 사주를 보고 예언·풀이해주는 상담**으로.

**원국 요약:** ${chart.summaryLine} · 일간 **${dm}**

**결론만 먼저.**

${oneLiner}

${bullets.map((b) => `- ${b}`).join("\n")}

이 리포트는 짧게 끝내지 않을게. “그냥 지쳐서”, “다른 사람” — 말은 쉬운데 **풀어주는 말이 없으면** 밤에 더 무너져. 그래서 ${vn}${topicParticle(vn)} 점사처럼 길게 말해. ${p}가 말한 이유와 말하지 못한 이유, 제3자가 ‘있었던 것처럼’ 느껴지는 결, 진실을 안 뒤에 네가 고를 선택. 읽다가 “내 얘기다” 싶으면, 그게 맞는 호흡이야.

${voice.coverClose}

자, 네가 진짜로 묻고 싶은 질문부터 정리하자.

— ${vn} · ${productTitle}`,
  };

  const questions: SajuReportSection = {
    id: "questions",
    title: "1장 · 이번 점사의 질문",
    body: L(
      4,
      `${voice.questionsLead ?? "질문이 겹겹이지? 하나씩 풀자."}

1. **표면으로 말한 이유는?** — “쉬자”, “바빠”, “성격”… 그 말이 전부가 아닌 경우가 많아.
2. **속 이유는?** — 미움보다 *피로·페이스·자기보호* 쪽인지.
3. **다른 사람이 있었을까?** — 단정이 아니라 *결·타이밍·거리감*으로 읽어.
4. **진실을 안 뒤에 나는 뭘 하면 돼?** — 추궁이 아니라 *네 하루*로.

${voice.frameAside ?? ""}
${voice.questionsClose?.(p) ?? ""}`,
      `고민: ${concern} · 이별: ${breakup} · ${months}`,
    ),
  };

  const trait: SajuReportSection = {
    id: "trait",
    title: "원국·일간 기질",
    body: L(
      4,
      `${voice.traitLead ?? "기질은 원국 기준으로 쉽게."}
${birthLabel(form)} ${form.gender} — 만세력 원국 **${chart.summaryLine}**.

### 일간 — ‘나’의 중심
일간 **${dm}** (${chart.dayMasterYinYang}${chart.dayMasterElement}).
오행 **${chart.dayMasterElement}** 기운의 연애는 “관심”보다 “뿌리”로 읽히기 쉽다. 상대가 멀어지면 가지를 흔들기보다 뿌리가 흔들린 것처럼 반응하기 쉽다. 그래서 ‘진짜 이유’를 끝까지 파고드는 밤이 길어져.

### 기둥을 시험 점수로 읽지 마
년 **${chart.pillars.year.korean}** · 월 **${chart.pillars.month.korean}** · 일 **${chart.pillars.day.korean}** · ${hourLine(chart)}
외우지 마. “깊게 남고, 참다가 지친다”만 기억해.

*(근거 한 줄)* ${dayMasterSense(chart)}
${voice.traitClose?.(p) ?? ""}`,
    ),
  };

  const pattern: SajuReportSection = {
    id: "pattern",
    title: "연애 패턴 · 잔향의 스크립트",
    body: L(
      4,
      `네 원국에서 보이는 연애 패턴을, ${p}와의 **스크립트**로 읽는다.

1. **진입** — 상대의 빈자리·무심함이 끌림
2. **몰입** — 네가 감정·배려·계획을 많이 씀
3. **감정이 커질 때** — 확인·장문↑, 상대는 숨
4. **차단** — “쉬자” / 이별 · 메모: **${breakup}**
5. **잔향** — 지금 ${months}은 “왜?”를 밤에만 키우는 단계

진짜 이유를 알고 싶다면 4단계의 **표면 말**과 **속 피로**를 나눠야 해. 같은 확인 스크립트로 들어가면 또 지친다.

${voice.patternClose?.(p) ?? ""}
${voice.strategyNudge}`,
    ),
  };

  const bond: SajuReportSection = {
    id: "bond",
    title: "두 사람 사이 인연의 결",
    body: L(
      4,
      `${p}와 너는 나이 차이보다 **호흡 차이**가 핵심이다.
쉽게 말하면—붙음은 온기, 부딪침은 숨 막힘, 꼬임은 상처, 불편은 서운함의 결이야.
“정은 있는데 마음이 상하기 쉬운” 인연—좋아하면서도 자주 서운해지는 느낌, 그거.

### 끌림의 온기
너는 감정·‘우리’의 온도를 보고, ${p}는 현실·페이스·‘내가 괜찮은가’를 본다. 처음엔 보완으로 작동한다.

### 숨 막힘
관계가 길어지면 너는 “왜 말이 없어?”, 상대는 “왜 계속 확인하려 해?”가 된다. **온기가 과하면 숨이 막힌다.**
${months} 전 이별이 “${breakup}”였다면, 누적 피로에 가깝다.

${voice.bondAside?.(p) ?? ""}`,
    ),
  };

  const surface: SajuReportSection = {
    id: "surface-reason",
    title: "표면으로 말한 이유",
    body: L(
      4,
      `### 표면 — 입으로 나온 말
대화↓, 만나면 피곤, “잠깐 쉬자”, “바빠”, “성격이 안 맞아”류.
네가 남긴 메모: **${breakup}** · 헤어진 지 ${months}.

표면 말은 **틀렸다기보다 불완전**해. 상대가 거짓말을 했다기보다, **말할 수 있는 수준까지만** 말한 경우가 많아. 지친 사람은 ‘진짜 문장’을 고를 힘이 없다. 그래서 짧은 말로 문을 닫아.

### 표면만 믿으면 생기는 일
- “바빴다” → 네가 더 잘해주려다 소모↑
- “성격” → 네가 나를 고치려다 자존↓
- “쉬자” → 기한 없는 기다림에 네가 갇힘

${vn}${topicParticle(vn)} 분명히 말해. 표면은 **입구**야. 출구가 아니야. 다음 장에서 속을 열어볼게.

*(근거 한 줄)* ${voidSense(chart)}`,
    ),
  };

  const realCause: SajuReportSection = {
    id: "real-cause",
    title: "헤어진 진짜 이유 — 표면 vs 속",
    body: L(
      5,
      `### 표면
대화↓, 만나면 피곤, “잠깐 쉬자”류. 메모: **${breakup}**.

### 속
- **네 쪽**: 놓치기 싫은데 매달리면 초라해질까 봐 / 이유를 알면 고칠 수 있을 것 같아서
- **${p} 쪽**: 미움보다 “기대 속도를 못 따라가겠다”는 자기보호 / 설명이 길어질수록 더 부담
- **공통**: 둘 다 ‘사랑 없음’이 아니라 ‘지침·페이스 어긋남’을 말했다. 그래서 잔향이 남는다.

${voice.breakupAside?.(p) ?? ""}

고민(${concern})에 대한 첫 답: “배신했나/아닌가”보다 **어떤 피로가 문을 닫았는가**.
사랑이 없어서 헤어진 게 아니야. 서로 페이스가 안 맞아서 지쳐서 끝난 결이 더 흔해. **이게 맞아.**

*(근거 한 줄)* ${dayMasterSense(chart)} · ${luckLine(chart)}`,
    ),
  };

  const thirdParty: SajuReportSection = {
    id: "third-party",
    title: "다른 사람이 있었을까",
    body: L(
      5,
      `질문이 아프다. 그래도 ${vn}${topicParticle(vn)} 피하지 않고 점사할게.

### 단정부터 하지 마
원국만으로 “있었다/없었다”를 100%로 찍는 건 사기다. 대신 **결**을 읽어.
- **피로·자기보호형 이별**이면: 제3자가 ‘원인’이라기보다, 이미 지친 뒤에 생긴 *빈자리*일 수 있어.
- **갑작스러운 온도 급락·설명 회피**면: ‘다른 관심’ 가능성을 **열어두고** 보되, 지금 추궁하면 진실이 아니라 방어만 나와.
- **잔향이 길고 손이 안 가는 공망 결**이면: 새 인연을 급하게 깊게 못 들어가는 쪽도 있어. “다른 사람”처럼 보여도, 실제론 **회피·회복**일 때가 많아.

### 지금 ${months} 기준으로
${p} 쪽에 ‘누군가’가 있더라도, 그게 네 가치를 증명하는 시험지가 아니야. **네가 확인할 수 있는 건 상대의 행동이 아니라 네 상태**야.
확인하고 싶을 때가 제일 보내면 안 되는 때야—느낌 왔지?

*(근거 한 줄)* ${voidSense(chart)} · 공망 **${chart.voidBranches.join("·") || "없음"}**
${voice.remainingAside?.(p) ?? ""}`,
    ),
  };

  const fatigue: SajuReportSection = {
    id: "fatigue-pace",
    title: "피로·페이스 어긋남",
    body: L(
      4,
      `진짜 이유의 척추는 여기서 자주 잡힌다.

### 페이스
너는 ‘우리’의 밀도를 올리고, ${p}는 ‘나’의 여유를 지키려 해. 초반엔 보완, 후반엔 충돌.
감정이 커질수록 너는 확인을, 상대는 침묵을 고른다. 침묵을 무정으로 읽으면 장문이 나오고, 장문이 나오면 상대는 더 숨는다.

### 피로
“${breakup}” — 큰 배신 문장이 아니어도 **누적 소모**면 문은 닫힌다.
미움으로 끝났으면 마음이 더 빨리 식었을 거야. 식지 않고 아픈 건, **정이 남았는데 힘이 바닥난** 결이야.

### 점사 결론
페이스를 맞추지 못한 채 ‘더 잘해주기’만 키우면, 같은 이별이 복제된다.
**지금은 다가가지 마.** 네 생활 리듬이 먼저야. ${voice.timelineAside ?? ""}

*(근거 한 줄)* ${yearSense(chart)}`,
    ),
  };

  const remaining: SajuReportSection = {
    id: "remaining",
    title: "2장 · 남은 마음과 미련의 결",
    body: L(
      5,
      `**지운 건 아냐. 근데 지금 당장 다시 만나자 할 마음은 아니야.**
${p} 마음엔 남아 있는데, 손대긴 무서운 상태야. 있다고 해서 지금 이유를 캐도 된다는 뜻은 아냐. 지금은 여기까지야.

### 남아 있다는 쪽의 신호
- SNS·대화창을 가끔 열지만 먼저 못 씀
- 공통 지인 앞에서 네 이름을 피하거나 너무 무덤덤
- 새 만남을 급하게 깊게 못 들어감

### 미련이 너를 잡는 방식
- “진짜 이유만 알면 고칠 수 있어” → 끝없는 기다림에 갇힘
- “다른 사람이면 나는?” → 자존이 시험지가 됨

「그럼… 이유를 물어보면 열려?」
추궁으로는 안 열려. **네가 안전해 보이는 시간**이 쌓일 때, 말의 문이 느슨해진다. 그래도 안 열리면—그건 네 실패가 아니라 **상대의 선택**이야.

*(근거 한 줄)* ${voidSense(chart)}`,
    ),
  };

  const afterTruth: SajuReportSection = {
    id: "after-truth",
    title: "진실을 안 뒤에 할 일",
    body: L(
      4,
      `${voice.heartTempLead?.(p) ?? `${p}에게 지금 필요한 건 설득이 아니라 안전감.`}

진실을 알아도 **전송으로 증명할 필요는 없어.** 아는 것과 보내는 것은 다른 층이야.

### 해도 되는 것
- 메모장에만 “내가 이해한 진짜 이유” 3줄 적기
- 몸 움직이기, 수면, 사람 만나기
- 가벼운 안부(타이밍·상태 될 때만) — 추궁 금지
- 자존 문장: “나는 이유를 몰라도 내 하루를 산다.”

### 하지 말 것
- “다른 사람 있었지?” / “솔직히 말해” 자정 장문
- 공통 지인 탐문
- 이유를 알면 고쳐줄 테니 만나자는 설득

${voice.keepLeaveClose ?? "결정은 감정 점수가 아니라, 네가 먼저 괜찮은 상태인지로."}
${voice.strategyNudge}

*(근거 한 줄)* ${dayMasterSense(chart)}`,
    ),
  };

  const pitfalls: SajuReportSection = {
    id: "pitfalls",
    title: "주의할 함정",
    body: L(
      3,
      `${voice.pitfallsLead ?? "함정만 짧게."}
확인하고 싶을 때가 제일 보내면 안 되는 때야.

- SNS 잠복 / 읽은 시간 확인
- “다른 사람” 탐문·스토킹성 추적
- “이번이 마지막” 협박 톤으로 이유 캐기
- 답장에 자존 걸기
- 고민(${concern})을 ${p}에게 그대로 던지기

함정에 빠진 밤의 복구: 폰 두기 → 몸 움직이기 → 친구 한 통 → “나는 내 하루로 돌아간다.”`,
    ),
  };

  const closing: SajuReportSection = {
    id: "closing",
    title: "캐릭터 마지막 한마디",
    body: L(
      4,
      `${voice.closingHook(p, months)}

${voice.closingBody}

네가 가져갈 세 문장:
1. 표면 이유와 속 이유를 나눠. 사랑이 없어서가 아니라 지쳐서인 결이 많아.
2. 제3자는 단정하지 마. 결로 읽고, 추궁은 내일로.
3. 진실을 안 뒤에는 전송보다 네 하루. 답장 속도보다, 네가 무너지지 않는 하루.

*(근거 한 줄)* 원국 ${chart.summaryLine} · 일간 ${dm} · ${yearSense(chart)} — 참고용이에요. 절대 결과가 아니에요.

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
    bond,
    surface,
    realCause,
    thirdParty,
    fatigue,
    remaining,
    afterTruth,
    pitfalls,
    closing,
    notice,
  ];

  const pads: Record<string, { beat: string; scene: string }> = {
    questions: {
      beat: "질문 정리",
      scene: `질문의 핵만 남긴다. 표면, 속, 제3자 결, 그다음에 할 일. 여기서 멈춰.`,
    },
    trait: {
      beat: "일간 기질",
      scene: "원국을 보면—시험 점수가 아니라, 깊게 남는 결을 읽는 점사다.",
    },
    pattern: {
      beat: "잔향 스크립트",
      scene: "같은 스크립트의 4단계(차단) 앞에서, 표면 말과 속 피로를 나누는 상담이 시작된다.",
    },
    bond: {
      beat: "인연의 결",
      scene: "온기와 숨 막힘 사이. 정은 있는데 마음이 상하기 쉬운 그 결.",
    },
    "surface-reason": {
      beat: "표면 이유",
      scene: "‘잠깐 쉬자’는 입구다. 전부가 아니야. 여기서 멈춰.",
    },
    "real-cause": {
      beat: "진짜 이유",
      scene: "미움보다 속도·피로로 읽어. 사랑이 없어서가 아니야. 이게 맞아.",
    },
    "third-party": {
      beat: "제3자 결",
      scene: "단정하지 마. 결로 읽고, 추궁은 내일로. 상담 결론이다.",
    },
    "fatigue-pace": {
      beat: "피로·페이스",
      scene: "페이스 어긋남이 문을 닫는다. 더 잘해주기만으로는 안 열려.",
    },
    remaining: {
      beat: "남은 마음",
      scene: "지운 건 아냐. 아직은 거리 두는 중이야. 그래도 마음엔 남아 있다. 이게 맞아.",
    },
    "after-truth": {
      beat: "진실 이후",
      scene: "아는 것과 보내는 것은 다르다. 네 하루가 먼저야.",
    },
    pitfalls: {
      beat: "함정",
      scene: "확인하고 싶을 때가 제일 보내면 안 되는 때다.",
    },
    closing: {
      beat: "마지막 말",
      scene: "진짜 이유는 지도로, 하루는 네가 산다. 그게 점사의 본편이야.",
    },
  };

  return applyPads(sections, pads, form, p, chart, vn, "reason");
}
