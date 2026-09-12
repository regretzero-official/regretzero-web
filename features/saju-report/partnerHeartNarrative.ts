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

/** 상대 속마음 — Foxbunny식 긴 점사 상담 (서나리 기본, voicePack으로 이도령/강세온 가능) */
export function buildPartnerHeartNarrativeSections(
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
  const hooks = "속마음은 저열로 읽고, 온기는 2~3도만. 보관함을 억지로 열지 마.";
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

「지금 그 사람 마음은… 뭐지.」
그 문장을 백 번 굴리는 밤—${vn}${topicParticle(vn)} 그 시간을 무시하지 않아. 진심과 불안이 한몸에 있어. 둘을 뭉치면 판단이 흐려져. 그래서 오늘은 **한줄 결론부터** 짚고, 그다음 원국·심리·행동으로 길게 풀어줄게. 체크리스트 강의가 아니라, **점쟁이가 사주를 보고 예언·풀이해주는 상담**으로.

**원국 요약:** ${chart.summaryLine} · 일간 **${dm}**

**결론만 먼저.**

${oneLiner}

${bullets.map((b) => `- ${b}`).join("\n")}

이 리포트는 짧게 끝내지 않을게. “기다려”, “연락하지 마” — 말은 맞는데 **풀어주는 말이 없으면** 밤에 무너져. 그래서 ${vn}${topicParticle(vn)} 점사처럼 길게 말해. ${p}가 너를 보관함에 둘 때의 심리, 네가 자정에 장문을 쓰고 싶을 때의 감정, 다가갈 온도·타이밍. 읽다가 “내 얘기다” 싶으면, 그게 맞는 호흡이야.

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

1. **${p} 마음에 내가 남아 있는가?** — 남아 있다면 *그리움인지, 죄책감인지, 습관인지* 구분.
2. **거리감의 핵은 뭔가?** — 미움이 아니라 *피로·자기보호* 쪽인지.
3. **다가갈 온도는?** — *지금*이 아니라 *어떤 상태의 너*일 때인지.

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
오행 **${chart.dayMasterElement}** 기운의 연애는 “관심”보다 “뿌리”로 읽히기 쉽다. 상대가 멀어지면 가지를 흔들기보다 뿌리가 흔들린 것처럼 반응하기 쉽다.

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
3. **과열** — 확인·장문↑, 상대는 숨
4. **차단** — “쉬자” / 이별
5. **잔향** — 지금 ${months}은 4→5단계 경계

재회·속마음을 원한다면 3단계를 **다른 호흡**으로 다시 써야 해. 같은 방식으로 들어가면 또 지친다.

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

  const breakupReason: SajuReportSection = {
    id: "breakup-reason",
    title: "헤어진 진짜 이유 — 표면 vs 속마음",
    body: L(
      4,
      `### 표면
대화↓, 만나면 피곤, “잠깐 쉬자”류. 네가 남긴 메모: **${breakup}** · ${months}.

### 속마음
- **네 쪽**: 놓치기 싫은데 매달리면 초라해질까 봐
- **${p} 쪽**: 미움보다 “기대 속도를 못 따라가겠다”는 자기보호
- **공통**: 둘 다 ‘사랑’이 아니라 ‘지침’을 말했다. 그래서 잔향이 남는다.

${voice.breakupAside?.(p) ?? ""}
고민(${concern})에 대한 첫 답: “가능/불가능”보다 **어떤 호흡으로 다시 쓸 수 있는가**.`,
    ),
  };

  const remaining: SajuReportSection = {
    id: "remaining",
    title: "2장 · 상대 속마음에 내가 남아있는지",
    body: L(
      5,
      `${voice.remainingAside?.(p) ?? ""}
**상대는 보관함이다. ${p} 마음은 삭제가 아니다.**
남아 있음 ≠ 지금 열어줄 준비. 지금은 그 선이다.

### 남아 있다는 쪽의 신호
- SNS·대화창을 가끔 열지만 먼저 못 씀
- 공통 지인 앞에서 네 이름을 피하거나 너무 무덤덤
- 새 만남을 급하게 깊게 못 들어감

### 거리감이 유지되는 이유
- 또 그 피로로 돌아갈까 봐
- 네가 장문으로 감정을 쏟을까 봐

*(근거 한 줄)* ${voidSense(chart)}
네 공망: **${chart.voidBranches.join("·") || "없음"}**.

「그럼… 기다리면 열려?」
기다림만으로는 안 열려. **네가 안전해 보이는 시간**이 쌓일 때 잠금이 느슨해진다.`,
    ),
  };

  const temp: SajuReportSection = {
    id: "heart-temp",
    title: "상대에게 다가갈 온도",
    body: L(
      4,
      `${voice.heartTempLead?.(p) ?? `${p}에게 지금 필요한 건 설득이 아니라 안전감.`}

**흘려보낼 온기는 2~3도면 충분해.** 길게 설명할수록 청구서가 돼.
“문득 생각나서. 잘 지내?” — 이게 상한선에 가까운 온도야.

### 온도 실수
- 자정 장문 = 고열 폭탄
- “나 아직 너만” = 책임 청구서
- 연속 톡 = 문 닫는 초인종

### 온도 연습
떠오름 → 메모장 → 닫기 → 물 한 잔 → 내일의 너에게. 이 30초가 속마음 운을 지켜.

*(근거 한 줄)* ${dayMasterSense(chart)}`,
    ),
  };

  const contact: SajuReportSection = {
    id: "contact",
    title: "연락 멘트 / 금지 문구",
    body: L(
      4,
      `**지금 당장(이 주~이번 달)의 장문·감정 폭발형 연락은 비추천.**
확인용이면 보내지 마. 흘려보내려는 연락만.

### 해도 되는 말
- “문득 생각나서. 잘 지내?”
- “답장 없어도 괜찮아. 그냥 안부.”
- “요즘 바쁠 것 같아서, 괜히 안부인사.”

### 금지 문구
- “그때 너 때문에…”, “다른 사람 생겼어?”, “내가 아직도 마음에 있어?”
- 자정 장문, 읽씹 추궁, 연속 메시지

${voice.contactAside?.(p) ?? ""}
${voice.strategyNudge}`,
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
- 공통 지인 탐문
- “이번이 마지막” 협박 톤
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
1. 자리는 남아 있다. 문은 아직이다. 지금은 그 선이다.
2. 속마음은 저열로 읽고, 온기는 얇게.
3. 답장 속도보다, 네가 무너지지 않는 하루.

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
    breakupReason,
    remaining,
    temp,
    contact,
    pitfalls,
    closing,
    notice,
  ];

  const pads: Record<string, { beat: string; scene: string }> = {
    questions: { beat: "질문 정리", scene: `질문의 핵만 남긴다. ${p} 속마음, 거리감, 온도. 선 그어.` },
    trait: { beat: "일간 기질", scene: "원국을 보면—시험 점수가 아니라, 깊게 남는 결을 읽는 점사다." },
    pattern: { beat: "잔향 스크립트", scene: "같은 스크립트의 3단계(과열) 앞에서, 다른 숨을 쉬는 상담이 시작된다." },
    bond: { beat: "인연의 결", scene: "온기와 숨 막힘 사이. 정은 있는데 마음이 상하기 쉬운 그 결." },
    "breakup-reason": { beat: "이별 원인", scene: "‘잠깐 쉬자’가 남긴 잔향. 미움보다 속도·피로로 읽어." },
    remaining: { beat: "남은 속마음", scene: "상대는 보관함이다. 열려 있진 않다. 그래도 비어 있진 않다. 단정해." },
    "heart-temp": { beat: "다가갈 온도", scene: "온기는 2~3도. 고열은 일기장에만. 상담 결론이다." },
    contact: { beat: "연락 가이드", scene: "멘트보다 네 상태. 전송 전 30초만 물어." },
    pitfalls: { beat: "함정", scene: "확인하고 싶을 때가 제일 보내면 안 되는 때다." },
    closing: { beat: "마지막 말", scene: "속마음은 지도로, 하루는 네가 산다. 그게 점사의 본편이야." },
  };

  return applyPads(sections, pads, form, p, chart, vn, "heart");
}
