import type { SajuChart } from "./manseryeok/types";
import { dayMasterLabel } from "./manseryeok/computeChart";
import type { SajuBirthForm, SajuReportSection } from "./types";

function safe(value: string, fallback: string) {
  const t = value.trim();
  return t.length > 0 ? t : fallback;
}

function you(form: SajuBirthForm) {
  return safe(form.displayName, "너");
}

function partner(form: SajuBirthForm) {
  return safe(form.partnerName, "그 사람");
}

function monthsLabel(form: SajuBirthForm) {
  return `약 ${safe(form.monthsApart, "3")}개월`;
}

function concernLine(form: SajuBirthForm) {
  return safe(form.concern, "그 사람, 아직 나를 생각할까?");
}

function breakupLine(form: SajuBirthForm) {
  return safe(form.breakupNote, "서로 지쳐 헤어진 느낌");
}

function depthPad(form: SajuBirthForm, p: string, chart: SajuChart, beat: string): string {
  const dm = dayMasterLabel(chart.dayMaster, chart.dayMasterElement);
  return `
### 더 깊이 — ${beat}
일간 **${dm}** · 원국 ${chart.summaryLine}을 축으로 보면, ${p}와의 이별(${breakupLine(form)}, ${monthsLabel(form)})은 단발 사건이 아니라 **호흡 누적**에 가깝다.
- 네가 감정을 깊게 쓸수록, 상대는 페이스 조절을 필요로 했을 수 있다.
- 공망(${chart.voidBranches.join("·") || "약함"}) 구간에서는 ‘관심은 있는데 손이 안 가는’ 상태가 길어질 수 있다.
- 세운 ${chart.currentYearPillar.korean} 해의 창은 있으나, 기신(추궁·장문·술김)을 쓰면 창이 일찍 닫힌다.
고민(${concernLine(form)})을 매일 검색으로 풀려 하지 말고, **지도로만** 보라. 발은 네 것이다.
${beat}에서 기억할 한 줄: 설득보다 안정, 확인보다 흘림, 답장 속도보다 네 하루.`;
}


export type ReunionVoice = {
  name: string;
  openerAside: (p: string) => string;
  coverBridge: (y: string, birth: string, gender: string, months: string, breakup: string) => string;
  coverClose: string;
  closingHook: (p: string, months: string) => string;
  closingBody: string;
  signOff: string;
  strategyNudge: string;
};

function birthLabel(form: SajuBirthForm) {
  return `${safe(form.birthYear, "1995")}년 ${safe(form.birthMonth, "3")}월 ${safe(form.birthDay, "14")}일 ${safe(form.birthTime, "시간 미상")}생(${safe(form.birthPlace, "서울")})`;
}

function hourLine(chart: SajuChart): string {
  if (chart.hourUnknown || !chart.pillars.hour) {
    return "시주 미상 (출생 시각을 몰라 시주는 제외했어요)";
  }
  return `시주 ${chart.pillars.hour.korean}(${chart.pillars.hour.hanja})`;
}

function luckLine(chart: SajuChart): string {
  if (!chart.luckPillars) return "대운은 성별(남/여) 입력이 있을 때 함께 읽어요.";
  const sample = chart.luckPillars.pillars
    .slice(0, 3)
    .map((p) => `${p.age}세 ${p.korean}`)
    .join(" → ");
  return `대운 ${chart.luckPillars.forward ? "순행" : "역행"} · 시작 ${chart.luckPillars.startAge}세 · ${sample}`;
}

/** Foxbunny-style ~15 beat reunion narrative with real 원국 */
export function buildReunionNarrativeSections(
  form: SajuBirthForm,
  voice: ReunionVoice,
  chart: SajuChart,
  productTitle: string,
  oneLiner: string,
  bullets: string[],
): SajuReportSection[] {
  const p = partner(form);
  const y = you(form);
  const dm = dayMasterLabel(chart.dayMaster, chart.dayMasterElement);
  const partnerDm = chart.partnerYearPillar
    ? `${chart.partnerYearPillar.stem}${chart.partnerYearPillar.stemElement}`
    : null;

  const cover: SajuReportSection = {
    id: "cover",
    title: "표지 / 한줄결론",
    body: `${voice.openerAside(p)}

${voice.coverBridge(y, birthLabel(form), form.gender, monthsLabel(form), breakupLine(form))}

네가 적어 준 고민의 핵:
> ${concernLine(form)}

**원국 요약:** ${chart.summaryLine} · 일간 **${dm}**
${partnerDm ? `상대 연주 감각: **${chart.partnerYearPillar!.korean}** (연간 ${partnerDm} 결)` : ""}

**흐름상 결론만 먼저.**

${oneLiner}

${bullets.map((b) => `- ${b}`).join("\n")}

${voice.coverClose}

— ${voice.name} · ${productTitle}`,
  };

  const attraction: SajuReportSection = {
    id: "attraction",
    title: "1장 · 끌린 이유",
    body: `### 왜 ${p}에게 끌렸을까

일간 **${dm}**의 너는 ${chart.dayMasterYinYang}${chart.dayMasterElement} 기운이 중심이다. 연애에서 깊이·잔향·‘한번 물리면 오래’ 쪽이 켜지기 쉽다.

월주 **${chart.pillars.month.korean}**은 바깥에서 보이는 너·성장 환경의 결. ${p}와의 초반이 설렜다면, 월지의 계절감이 ‘올라오는 끌림’으로 작동했을 가능성이 크다.

십성으로 보면:
- 년주 ${chart.tenGods.year.stem}/${chart.tenGods.year.branch}
- 월주 ${chart.tenGods.month.stem}/${chart.tenGods.month.branch}
- 일주 일간/${chart.tenGods.day.branch}
${chart.tenGods.hour ? `- 시주 ${chart.tenGods.hour.stem}/${chart.tenGods.hour.branch}` : "- 시주 (미상)"}

끌림의 핵은 대개 **재성·관성**이 상대에게서 ‘채워지는 느낌’으로 번역될 때다. ${p}는 네게 그 역할을 했을 가능성이 크다.

이별 메모(${breakupLine(form)}) 이전의 ‘예쁨’은 가짜가 아니다. 다만 같은 기운이 과열되면 합이 충이 된다.`,
  };

  const compare: SajuReportSection = {
    id: "origin-compare",
    title: "두 사람의 사주 원국 비교",
    body: `### 「두 사람의 사주 원국 비교」

**나(${y})**
- 연주 **${chart.pillars.year.korean}** · 월주 **${chart.pillars.month.korean}** · 일주 **${chart.pillars.day.korean}** · 일간 **${dm}**
- ${hourLine(chart)}

**${p}**
- ${chart.partnerYearPillar ? `연주 **${chart.partnerYearPillar.korean}** (연간 ${partnerDm} 결)` : "출생연도 미상 — 연주 비교 생략"}
- 일주 전체는 생월일시가 더 있으면 정확해져요.

양력 ${chart.solar.year}-${String(chart.solar.month).padStart(2, "0")}-${String(chart.solar.day).padStart(2, "0")} 기준 만세력(입춘·절기)으로 계산했어요.
${chart.hourUnknown ? "출생 시각이 없어 시주는 빼 두었습니다." : ""}

### 일간 페어 감각
- 너: **${dm}** (${chart.dayMasterYinYang}${chart.dayMasterElement})
${partnerDm ? `- ${p}: 연주 **${chart.partnerYearPillar!.korean}** 결 (${partnerDm})` : `- ${p}: 연도만으로는 일간 페어를 단정하지 않아요.`}

### 공망 · 세운
- 네 공망: **${chart.voidBranches.join("·") || "없음"}** — ‘관심은 있는데 손이 안 가는’ 구간의 비유
- 올해 세운 연주: **${chart.currentYearPillar.korean}**
- ${luckLine(chart)}

“갑목+정화”처럼 **일간 페어**로 두 사람의 중심 기운을 겹쳐 보는 창이다. 지금은 네 일간 **${dm}**을 축으로 ${p} 쪽 기운을 읽는다.`,
  };

  const breakupCause: SajuReportSection = {
    id: "breakup-cause",
    title: "이별 진짜 원인",
    body: `### 표면
- 대화↓, 만나면 편하기보다 피곤
- “잠깐 쉬자”류의 말 · 헤어진 지 ${monthsLabel(form)}
- 네가 남긴 메모: **${breakupLine(form)}**

### 속 — 원국으로 보면
일간 **${dm}**이 감정을 깊이 쓰면, 상대 페이스가 안 맞을 때 **확인·해석·장문**이 늘기 쉽다. 십성상 월주 ${chart.tenGods.month.stem} 결이 과하면 ‘틀·책임(관성)’ 압박으로 읽힐 수 있다.

${p} 쪽은 미움보다 **역량 고갈·자기보호**일 가능성이 크다. 지쳐 헤어진 이별의 핵은 사랑 점수가 아니라 속도다.

임시장치가 영구가 되지 않으려면, 그 사이에 **다른 호흡(용신 감각의 안정)**이 들어가야 한다.`,
  };

  const traces: SajuReportSection = {
    id: "traces",
    title: "지워지지 않는 흔적",
    body: `원국은 ‘집의 구조’다. 대운·세운이 날씨라면, **${chart.summaryLine}** 구조는 쉽게 안 바뀐다.

### 연애 스크립트 (흔적)
1. 진입 — 상대의 빈자리·무심함이 끌림
2. 몰입 — 네가 감정·배려를 많이 씀
3. 과열 — 확인·장문↑
4. 차단 — 상대는 숨, 너는 버림으로 읽음
5. 잔향 — 지금 ${monthsLabel(form)}은 4→5단계 경계

재회를 원하면 3단계를 **다른 호흡**으로 다시 써야 한다. 같은 방식으로 들어가면 합이 다시 충이 된다.

용신 감각: 안정(정관·정인 쪽 틀) · 희신: 식신의 부드러운 말 · 기신: 추궁·상관 과다.`,
  };

  const remaining: SajuReportSection = {
    id: "remaining",
    title: "2장 · 남은 마음",
    body: `${p} 마음에 네가 **삭제**됐다기보다 **보관함**에 있을 가능성이 크다. 남아 있음 ≠ 지금 열어줄 준비.

공망 **${chart.voidBranches.join("·") || "(해당 약함)"}** 감각으로 말하면—관심은 있는데 손이 안 가는 구간에 가깝다.

### 남아 있다는 쪽의 신호
- SNS·대화창을 가끔 열지만 먼저 못 씀
- 공통 지인 앞에서 네 이름을 피하거나 너무 무덤덤
- 새 만남을 급하게 깊게 못 들어감

### 거리감이 유지되는 이유
- 또 그 피로로 돌아갈까 봐
- 네가 장문으로 감정을 쏟을까 봐
- 관성 틀을 다시 쓰기엔 기력이 안 찬 상태

고민(${concernLine(form)})에 대한 중간 답: **자리는 남아 있을 수 있다. 문은 아직이다.**`,
  };

  const recall: SajuReportSection = {
    id: "recall",
    title: "떠올리는 순간 · 말 못 하는 감정",
    body: `${p}가 너를 떠올리는 순간은 대개 ‘성공 스토리’가 아니라 **생활의 빈칸**—익숙한 길, 노래, 공통 친구 이야기—이다.

말 못 하는 감정:
- 미안한데 다시 열기 무섭다
- 보고 싶은데 설득당할까 봐 피한다
- 정이 남았는데 자존심이 먼저 선다

네 일간 **${dm}**이 밤에 감정이 커지는 타입이면, 자정 장문은 ${p}의 ‘말 못 하는 감정’을 더 굳힌다. 흘려보낼 온기는 2~3도면 충분하다.`,
  };

  const contactOdds: SajuReportSection = {
    id: "contact-odds",
    title: "3장 · 연락 확률과 시기",
    body: `※ 확정 예언이 아니라, 원국·이별 패턴·세운을 겹친 **가능성의 지도**다.

- **세운(올해):** ${chart.currentYearPillar.korean}
- ${luckLine(chart)}
- 헤어진 지 ${monthsLabel(form)}

### ◇ 1개월 — 관망·정돈
적극 재접근 비추천. 인성을 **너에게** 쓰기.

### ◇ 3개월 전후 — 접촉 창
추억의 온도만 남는 구간. 식신·정재의 가벼운 안부↑. 조건: 매달림 없는 너.

### ◇ 6개월 — 갈림길
재개 vs 정리. 상관→식신으로 말투 업그레이드가 핵심.

키워드: *문을 두드리되, 밀고 들어가지 마라.*`,
  };

  const whoFirst: SajuReportSection = {
    id: "who-first",
    title: "누가 먼저 연락할까",
    body: `흐름상 **네가 먼저** 저자극으로 두드리는 쪽이 현실적이다. ${p}가 먼저 올 확률은 ‘보관함을 열 용기’가 생길 때인데, 지쳐 끝난 상대는 그 용기가 늦다.

누가 먼저든 성공 지표는 답장 속도가 아니라 **네가 무너지지 않는 하루**다.

${voice.strategyNudge}`,
  };

  const reunionMeet: SajuReportSection = {
    id: "meet-again",
    title: "다시 만났을 때",
    body: `첫 1~2회는 **과거 재판 금지**. “왜 헤어졌을까 / ${breakupLine(form)}” 재심문은 관계가 다시 따뜻해진 이후의 대화다.

재회의 본질은 로맨스 복원이 아니라 **호흡 재계약**.
- 정관의 ‘편한 틀’이 보이게
- 편관의 압박은 숨기기
- 일간 **${dm}**의 깊이는 무기가 아니라 안정으로 쓰기`,
  };

  const external: SajuReportSection = {
    id: "external",
    title: "외부 변수 · 새 인연 역전",
    body: `외부 변수: 직장·이사·가족·새 만남·지인 소개. 세운 **${chart.currentYearPillar.korean}** 해에는 ‘움직임’이 커질 수 있다.

### 새 인연 역전 구간
대운이 문을 열어도, 네가 흔들리면 문은 닫힌다. ${p}가 아닌 새 인연이 먼저 보일 수 있다—그게 ‘배신’이 아니라 **기력이 회복 중**이라는 신호일 때도 있다.

역전 조건: 네가 ${p} 검색 대신 네 일상에 뿌리를 둘 때. 목(木) 기운이 상대에게만 기대지 않을 때.`,
  };

  const change: SajuReportSection = {
    id: "must-change",
    title: "4장 · 달라져야 할 것",
    body: `같은 스크립트로 ${p}에게 가면 또 지친다.

달라져야 할 것:
1. 확인·추궁·장문 (기신) → 짧은 식신
2. “내가 더 이해하면 돼” 과잉 인성 → 인성을 **나에게**
3. 답장에 자존 걸기 → 생활 리듬이 자존
4. 공망을 끝으로 단정하기 → 지도로만 보기

용신 착각: “더 잘해주면 용신”이 아니다. 지금은 **덜 매달리는 안정**이 용신에 가깝다.`,
  };

  const actionPlan: SajuReportSection = {
    id: "action-plan",
    title: "행동 플랜 · 연락 가이드",
    body: `### 1단계 — 기운 회수 (지금~1개월)
${p}를 설득하지 마. 운동·일·친구로 “나 없이도 굴러간다”를 몸부터.

### 2단계 — 저자극 접촉 (대략 3개월 창)
한 줄 안부 → 반응 보면 멈춤. 없거나 건조하면 최소 2주 침묵.

### 3단계 — 만남이 열리면 과거 재판 금지

### 해도 되는 말
- “문득 생각나서. 잘 지내?”
- “답장 없어도 괜찮아. 그냥 안부.”

### 금지
- “그때 너 때문에…”, “다른 사람 생겼어?”, 자정 장문, 연속 톡

${voice.strategyNudge}`,
  };

  const lastChance: SajuReportSection = {
    id: "last-chance",
    title: "마지막 기회 · 선생님 마지막 말",
    body: `${voice.closingHook(p, monthsLabel(form))}

**마지막 기회**는 ‘이번 톡이 마지막’이 아니라, **네가 같은 충을 반복하지 않는 태도**를 만들 수 있는 창이다. 창은 세운·대운이 열어도, 기신(추궁)을 쓰면 일찍 닫힌다.

${voice.closingBody}

원국 ${chart.summaryLine} · 일간 ${dm}을 축으로 읽었다. 해석·조언은 오락·위로며, 확정 예언이 아니다.

${voice.signOff}`,
  };

  const notice: SajuReportSection = {
    id: "notice",
    title: "안내",
    body: `이 글은 재미·위로 목적의 엔터테인먼트 ${productTitle} 리포트예요.
**원국(네 기둥·일간·십성·공망·대운·세운)은 출생 기준 만세력으로 계산**했습니다(양력, 입춘·절기, KASI 기반 라이브러리).
다만 **해석·조언·재회 가능성 문구는 오락·상담 톤**이며 확정 예언·전문 상담·의료·법률을 대신하지 않아요.
의사결정의 책임은 본인에게 있고, 원치 않는 연락·스토킹은 권하지 않아요.

— ${voice.name} · ${productTitle}`,
  };

  const sections = [
    cover,
    attraction,
    compare,
    breakupCause,
    traces,
    remaining,
    recall,
    contactOdds,
    whoFirst,
    reunionMeet,
    external,
    change,
    actionPlan,
    lastChance,
    notice,
  ];

  // Ensure template depth (~6000+ chars) while keeping Foxbunny 15-beat shape
  const pads: Record<string, string> = {
    attraction: "끌린 이유",
    "origin-compare": "원국 비교",
    "breakup-cause": "이별 원인",
    traces: "지워지지 않는 흔적",
    remaining: "남은 마음",
    recall: "떠올리는 순간",
    "contact-odds": "연락 시기",
    "who-first": "누가 먼저",
    "meet-again": "다시 만났을 때",
    external: "외부 변수",
    "must-change": "달라져야 할 것",
    "action-plan": "행동 플랜",
  };

  return sections.map((s) => {
    const beat = pads[s.id];
    if (!beat) return s;
    return { ...s, body: `${s.body}
${depthPad(form, p, chart, beat)}` };
  });
}
