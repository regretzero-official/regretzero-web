import { getSajuCharacter } from "@/features/saju-chat/characters";
import { getSajuProduct } from "./products";
import type {
  SajuBirthForm,
  SajuProductId,
  SajuReportPayload,
  SajuReportSection,
} from "./types";

function safe(value: string, fallback: string) {
  const t = value.trim();
  return t.length > 0 ? t : fallback;
}

function birthLabel(form: SajuBirthForm) {
  const y = safe(form.birthYear, "1995");
  const m = safe(form.birthMonth, "3");
  const d = safe(form.birthDay, "14");
  const time = safe(form.birthTime, "밤 10시");
  const place = safe(form.birthPlace, "서울");
  return `${y}년 ${m}월 ${d}일 ${time}생(${place})`;
}

function monthsLabel(form: SajuBirthForm) {
  const n = safe(form.monthsApart, "3");
  return `약 ${n}개월`;
}

function you(form: SajuBirthForm) {
  return safe(form.displayName, "너");
}

function partner(form: SajuBirthForm) {
  return safe(form.partnerName, "그 사람");
}

function concernLine(form: SajuBirthForm) {
  return safe(
    form.concern,
    "재회 가능 여부 / 지금 연락해도 되는지 / 내 자리가 남아있는지",
  );
}

function disclaimerBlock(characterName: string, productTitle: string) {
  return `본 문서는 **엔터테인먼트용 ${productTitle} 리포트**입니다.
실제 운명·재회·상대 심리에 대한 확정 예언이 아니며, 정확한 만세력 계산·전문 상담·의료·법률 조언을 대체하지 않습니다.
문서 중 원국·일간·월지·시주·십성·합충·용신·대운·세운·공망 등의 표현은 **예시용 해석 프레임**이며, 검증된 만세력 결과가 아닙니다.
의사결정의 책임은 독자 본인에게 있으며, 타인을 스토킹·괴롭히거나 원치 않는 연락을 반복하는 행위는 권장하지 않습니다.

— ${characterName} · ${productTitle}`;
}

function commonCover(
  form: SajuBirthForm,
  characterName: string,
  productTitle: string,
  oneLiner: string,
  bullets: string[],
): SajuReportSection {
  const p = partner(form);
  const y = you(form);
  return {
    id: "cover",
    title: "1. 표지 / 한 줄 결론",
    body: `${y}, 밤에 또 ${p} 생각했지.

${birthLabel(form)}, ${form.gender}. 그날의 기운은 ‘낮의 말’보다 ‘밤의 감정’이 더 깊게 남는 쪽에 가깝다. 헤어진 지 ${monthsLabel(form)}—짧지도 길지도 않은 그 구간에서, ${safe(form.breakupNote, "서로 지쳐 헤어진 느낌")}이 아직 몸 안쪽에 남아 있을 가능성이 커.

**흐름상 결론만 먼저 말해줄게.**

${oneLiner}

${bullets.map((b) => `- ${b}`).join("\n")}

단정 예언은 안 한다. 氣는 고정값이 아니라 움직이는 흐름이니까. 그래도 네 **원국(原局)**의 결 + 이별의 결 + ${monthsLabel(form)}의 침묵 패턴을 겹치면, 위 방향이 **가장 설득력 있는 시나리오**야.

※ 본 리포트는 **예시용 해석 프레임**입니다. 정확한 만세력·시주 확정이 아닌, 전통 사주 문체를 빌린 **엔터테인먼트 점사**임을 먼저 밝힌다.

— ${characterName} · ${productTitle}`,
  };
}

function questionsSection(form: SajuBirthForm, characterName: string): SajuReportSection {
  const p = partner(form);
  return {
    id: "questions",
    title: "2. 이번 점사의 질문 정리",
    body: `네가 진짜로 묻고 싶은 건 겹겹이다.

1. **관계는 다시 열릴 수 있는가?** — “가능/불가능”이 아니라, *어떤 조건에서 가능성이 살아나는가.*
2. **지금 연락해도 되는가?** — “해도 된다/안 된다”가 아니라, *지금 연락이 흐름을 여는가, 닫는가.*
3. **${p} 마음에 내가 남아 있는가?** — 남아 있다면 *그리움인지, 죄책감인지, 습관인지* 구분.

네가 적어 준 고민:
> ${concernLine(form)}

${characterName}가 이 리포트에서 답하는 방식은 단순하다.
**표면 감정은 거짓말하기 쉽고, 기운의 방향은 비교적 정직하다.**
서로 지쳐 헤어진 이별은 “사랑이 없어서”가 아니라 “사랑의 속도가 서로 안 맞아서”인 경우가 많다. 그 차이를 못 보면, 다시 만나도 같은 벽에서 또 부딪힌다.

사주 언어로 바꾸면—이번 점사는 **관성(官星)·재성(財星)·인성(印星)**의 흐름이 ${p}와의 인연에서 어떻게 막히고, 어디서 다시 숨통이 트이는지를 보는 작업이다.`,
  };
}

function loveTraitSection(form: SajuBirthForm): SajuReportSection {
  const p = partner(form);
  return {
    id: "trait",
    title: "3. 내 사주의 연애 기질",
    body: `정확한 만세력 확정이 아닌 **예시용 프레임**으로 말한다.
${birthLabel(form)} ${form.gender}의 결을 전통 사주 언어로 옮기면 대략 이런 이미지다.

### 3-1. 원국(原局) — 타고난 기운의 바탕
**원국**이란, 생년월일시로 짜인 네 사주의 ‘기본 설계도’다. 대운·세운이 날씨와 계절이라면, 원국은 집의 구조다.
네 원국은 연애에서 **깊이·지속·감정 잔향**이 강한 쪽으로 읽힌다. 짧게 스치고 끝나는 인연보다, 한번 물리면 오래 가는 인연에 약하다.

### 3-2. 일간(日干) — ‘나’의 중심
**일간**은 사주에서 ‘나 자신’을 가리키는 핵심 글자다.
예시 프레임으로 보면, 네 일간의 결은 **부드럽지만 속이 단단한 나무(木) 기운**—겉은 다정한데, 한번 마음 주면 쉽게 안 빼는 타입.
木 기운의 연애는 “관심”보다 “뿌리”다. 상대가 멀어지면 가지를 흔들기보다 **뿌리가 흔들린 것처럼** 반응하기 쉽다. 그래서 이별 후에도 밤마다 ${p} 생각이 남는 거다.

### 3-3. 월지·시주 감각
태어난 달·시각의 결은 “시작은 따뜻한데, 유지 국면에서 조율이 필요”한 패턴을 만들기 쉽다. 밤 시간대에 가까운 출생이라면, 낮에는 괜찮은 척해도 밤에 감정이 커지기 쉽다.

### 3-4. 십성으로 본 연애 감각
너는 상대에게 **관심·챙김(재성·인성 쪽 사용)**을 많이 쓰는 편. 상대가 감정을 닫으면 “내가 부족한가”로 해석하기 쉽다. 이때 말이 날카로워지거나, 과도하게 이해하고 참는 패턴이 번갈아 나올 수 있다.

**연애 함정**: ‘끝까지 이해해주면 돌아올 것’이라는 믿음. ${p}처럼 지쳐 떠난 상대에게는 그 믿음이 **압박**으로 읽힐 수 있다.

한 줄 압축:
> **깊게 사랑하고, 오래 남기고, 먼저 무너지기 싫어 참다가, 한꺼번에 지친다.**`,
  };
}

function bondSection(form: SajuBirthForm): SajuReportSection {
  const p = partner(form);
  const py = safe(form.partnerBirthYear, "");
  const ageBit = py ? `${p}(${py}년생)와 ` : `${p}와 `;
  return {
    id: "bond",
    title: "4. 두 사람 사이 인연의 결",
    body: `${ageBit}너는 나이 차이보다 **호흡 차이**가 핵심이다.
전통 사주에서 글자끼리의 관계를 **합(合)·충(沖)·형(刑)·해(害)**로 본다.
쉽게 말하면—합은 붙음, 충은 부딪침, 형은 꼬임·상처, 해는 불편·배신감의 결이다.
**원진(怨嗔)**은 “정은 있는데 마음이 상하기 쉬운” 인연의 결—좋아하면서도 자주 서운해지는 느낌이다.

### 끌림의 합
너는 감정·‘우리’의 온도를 보고, ${p}는 현실·페이스·‘내가 괜찮은가’를 본다. 처음엔 **보완의 합**으로 작동한다.

### 충돌의 충
관계가 길어지면 너는 “왜 말이 없어?”, 상대는 “왜 계속 확인하려 해?”가 된다. **합이 과하면 충이 된다.**
${monthsLabel(form)} 전 이별이 “큰 사건”보다 “${safe(form.breakupNote, "서로 지쳐")}”였다면, 충의 누적에 가깝다.

### 원진 느낌
정은 남는데 마음이 상하기 쉬운 결—헤어진 뒤에도 “미운데 그리운” 상태.
이 인연은 강제 재회 타입이라기보다, **서로가 ‘다시 배울 준비’가 될 때 붙는 인연**에 가깝다.`,
  };
}

function breakupReasonSection(form: SajuBirthForm): SajuReportSection {
  const p = partner(form);
  return {
    id: "breakup-reason",
    title: "5. 헤어진 진짜 이유 — 표면 vs 속마음",
    body: `### 표면
- 대화가 줄고, 만나면 편하기보다 피곤했다.
- “잠깐 쉬자”, “이쯤에서 정리하자” 같은 말이 나왔을 가능성.
- 큰 배신보다 **소모**가 원인으로 포장됨.
- 네가 남긴 메모: ${safe(form.breakupNote, "서로 지쳐 헤어진 느낌")}

### 속마음 (흐름 해석)
- **네 쪽**: 놓치기 싫은데 매달리면 초라해질까 봐 — 자존심과 애착이 동시에 작동.
- **${p} 쪽**: “네가 싫어서”라기보다 “네 기대 속도를 못 따라가겠다”는 **자기보호**. 지친 이별의 핵심은 미움이 아니라 **역량 고갈**인 경우가 많다.
- **공통**: 둘 다 ‘사랑’이 아니라 ‘지침’을 말했다. 그래서 감정의 잔향이 남는다.

너희는 **끝이 아니라 과열 차단**을 한 것일 수 있다. 임시장치가 영구가 되려면 그 사이에 **새로운 태도(안정)**가 들어가야 한다.`,
  };
}

function remainingHeartSection(form: SajuBirthForm): SajuReportSection {
  const p = partner(form);
  return {
    id: "remaining",
    title: "6. 상대 속마음에 내가 남아있는지",
    body: `${p} 마음에 네가 **남아 있을 가능성**은 있다. 다만 “보고 싶다”와 “다시 만나자” 사이에 칸이 있다.

### 남아 있다는 쪽의 신호
- SNS·대화창을 가끔 열지만 먼저 쓰지는 못함.
- 공통 지인 앞에서 네 이름을 피하거나 너무 무덤덤하게 말함.
- 새 만남을 급하게 깊게 못 들어감.
- “그때 우리가…”를 떠올리다가 스스로 끊음.

### 거리감이 유지되는 이유
- 다시 연락하는 순간 **또 그 피로로 돌아갈까 봐** 무서움.
- 네가 장문으로 감정을 쏟을까 봐 문지방을 못 넘음.
- 관계의 틀을 다시 쓰기엔, 아직 기력이 안 찬 상태.

### 공망(空亡) 감각 (가볍게)
지금은 ${p} 쪽에서 너를 **삭제한 공망**이라기보다, **손대기 무서운 공망**에 가깝다.
비어 있던 자리가 다시 메워지려면, 세운·월운이 완화되고 네가 저자극으로 다가갈 때다.
(※ 공망 언급도 **예시적 비유 프레임**이다.)

정리: **남아 있다 ≠ 지금 받아줄 준비가 됐다.**
네 자리가 삭제됐다기보다 **보관함**에 들어가 있을 가능성이 크다.`,
  };
}

function timelineSection(form: SajuBirthForm): SajuReportSection {
  const p = partner(form);
  return {
    id: "timeline",
    title: "7. 재회운 타임라인 · 1 · 3 · 6개월",
    body: `먼저 용어만 짚는다.
- **대운(大運)**: 약 10년 단위의 큰 흐름.
- **세운(歲運)**: 그해의 흐름.
- **월운(月運)**: 달 단위의 세부 날씨.

※ 아래 타임라인은 확정 예언이 아니라, 네 이별 패턴·원국 결·일반적 세운/월운 리듬을 겹친 **가능성의 지도**다.

### ◇ 1개월 (관망·정돈)
- 흐름상 **적극 재접근 비추천**.
- 지금 연락하면 “또 감정 청구서”로 읽힐 위험.
- 할 일: 생활 리듬·컨디션 정돈, ${p} 없는 하루를 일부러 설계.
- 키워드: *식히되, 끊지 마라.*

### ◇ 3개월 전후 (접촉 창)
- 날카로움이 무뎌지고 **추억의 온도**만 남는 구간.
- 가벼운 안부인사형 접촉이 붙을 가능성↑.
- 조건: 네가 **매달림 없는 상태**로 보여야 함.
- 키워드: *문을 두드리되, 밀고 들어가지 마라.*

### ◇ 6개월 (갈림길)
- 재개 vs 정리 인연이 갈림.
- 핵심은 로맨스 연출이 아니라 **대화 방식 업그레이드**.
- 예전의 “왜 답장이 늦어”가 나오면 흐름은 빨리 식는다.
- 키워드: *같은 사람, 다른 호흡.*

※ 네 선택이 지도를 바꾼다. 氣는 조급할수록 충으로, 정돈될수록 합으로 기운다.`,
  };
}

function contactGuideSection(form: SajuBirthForm): SajuReportSection {
  const p = partner(form);
  return {
    id: "contact",
    title: "8. 지금 연락해도 되는지",
    body: `**지금 당장(이 주~이번 달)의 장문·감정 폭발형 연락은 비추천.**
꼭 보내야 한다면, “확인받으려는 연락”인지 “흘려보내려는 연락”인지 구분해. 확인용이면 보내지 마.

### 해도 되는 말 (타이밍은 1개월 이후가 더 안전)
- “문득 생각나서. 잘 지내?”
- “갑자기 그날 노래 나와서. 별일은 아니고.”
- “답장 없어도 괜찮아. 그냥 안부.”

짧고, 압박 없고, 숙제 안 주기.

### 금지 문구
- “그때 너 때문에 내가…”, “다른 사람 생겼어?”, “내가 아직도 마음에 있어?”
- “다시 시작해줘”, 강요형 “한 번만 만나자”
- 자정 넘은 술김·장문, 읽씹 추궁, 연속 메시지, 통화 폭탄

${p}처럼 지쳐 끝난 상대에게 **추궁은 재이별의 지름길**이다.`,
  };
}

function strategySection(form: SajuBirthForm): SajuReportSection {
  const p = partner(form);
  return {
    id: "strategy",
    title: "9. 재접근 전략 3단계",
    body: `### 1단계 — 네 기운부터 회수 (지금~1개월)
${p}를 설득하지 마. 일상에서 그를 ‘필수 변수’에서 빼.
운동·일·외모·친구 약속으로 “나 없이도 굴러간다”는 신호를 네 몸부터 만들어.
→ **인성을 나에게, 추궁을 차단.**

### 2단계 — 저자극 접촉 (대략 3개월 창)
한 줄 안부 → 반응 보면 멈춤.
답이 따뜻하면 2~3일 간격 가벼운 대화. 건조하거나 없으면 **최소 2주 침묵**.
목표: “이 사람은 예전처럼 무겁지 않다”는 **체감**.

### 3단계 — 만남이 열리면 과거 재판 금지 (3~6개월)
첫 1~2회는 추억 재판 금지. “왜 헤어졌을까”는 관계가 다시 따뜻해진 **이후**의 대화다.
재회의 본질은 로맨스 복원이 아니라 **호흡 재계약**.`,
  };
}

function pitfallsSection(form: SajuBirthForm): SajuReportSection {
  const p = partner(form);
  return {
    id: "pitfalls",
    title: "10. 주의할 함정",
    body: `1. **해석 중독**: ${p}의 모든 행동을 “좋아한다/아니다”로만 읽기.
2. **자존감 거래**: 외모 관리는 OK, 복수심은 NO.
3. **공동 지인 스파이**: 소문은 왜곡되고 너는 더 흔들린다.
4. **술·새벽·장문**: 밤에 감정이 커지는 타입일수록 아침에 다시 읽어라.
5. **빠른 대체 연애로 자극**: 질투는 단기 반응만 주고 신뢰는 무너뜨린다.
6. **‘서로 지쳐 헤어진’ 사실 부정**: 안 아팠던 척하면 같은 패턴으로 돌아간다.
7. **용신 착각**: “더 잘해주면”이 아니다. 지금은 **덜 매달리는 안정**이 용신에 가깝다.

경고 한 줄—
**네가 ‘확인하고 싶을 때’가, 가장 보내면 안 되는 때다.**`,
  };
}

function closingSection(form: SajuBirthForm, characterName: string): SajuReportSection {
  const p = partner(form);
  return {
    id: "closing",
    title: `11. ${characterName}의 마지막 한마디`,
    body: `${monthsLabel(form)}이면, 사랑은 안 죽었을 수도 있어.
근데 **예전의 방식**까지 살아 있으면, 다시 만나도 또 지친다.

${p} 마음에 네가 남아 있는지 묻기 전에—
**남겨둘 만한 너로 먼저 서 있냐**를 물어.
그게 재회를 ‘구걸’이 아니라 ‘선택’으로 만드는 방법이야.

氣는 조급할수록 흐트러지고,
정돈된 사람 쪽으로 다시 모인다.

그때 문이 열린다면—들어가.
안 열려도—네가 무너지진 않게.

이상, ${characterName}.`,
  };
}

function noticeSection(characterName: string, productTitle: string): SajuReportSection {
  return {
    id: "notice",
    title: "12. 엔터테인먼트 고지",
    body: disclaimerBlock(characterName, productTitle),
  };
}

function partnerHeartExtra(form: SajuBirthForm): SajuReportSection[] {
  const p = partner(form);
  return [
    {
      id: "heart-temp",
      title: "상대에게 다가갈 온도",
      body: `${p}에게 지금 필요한 건 설득이 아니라 **안전감**이다.
온도를 숫자로 비유하면—예전의 7~8도를 다시 켜지 말고, **2~3도의 옅은 온기**만 흘려보내라.
답장이 없어도 네가 무너지지 않는 모습이, 아이러니하게 ${p}의 문을 덜 무섭게 만든다.

할 일:
- 하루 1번, ${p} 검색 대신 네 몸·일·친구에 10분 쓰기
- 연락은 ‘확인’이 아니라 ‘흘림’일 때만
- 공통 지인에게 캐묻기 금지`,
    },
  ];
}

function breakupDecisionExtra(form: SajuBirthForm): SajuReportSection[] {
  const p = partner(form);
  return [
    {
      id: "keep-or-leave",
      title: "남겨둘 이유 / 놓을 이유",
      body: `### 남겨둘 이유가 되는 조건
- ${p}와의 관계가 **서로를 성장**시켰던 구간이 분명하다.
- 이별 원인이 사건·배신보다 **페이스 조율 실패**에 가깝다.
- 네가 “그 사람이 아니면 안 된다”가 아니라 “다시 배우면 다를 수 있다”고 말할 수 있다.

### 놓는 편이 나은 신호
- 함께 있을 때 자존이 반복적으로 깎인다.
- 연락·만남이 회복이 아니라 **확인 강요**로만 흐른다.
- 네가 이미 몸의 피로·수면·일까지 무너지고 있다.

### 결정 체크리스트 (예)
1. 다시 만나면 **예전과 다른 규칙**을 말할 수 있나?
2. 답이 없어도 2주는 버틸 수 있나?
3. ${p} 없는 한 달의 나를 상상할 수 있나?

차유리 식으로 말하면—결정은 “사랑 점수”가 아니라 **네 자존이 버티는 구조**로 내려라.`,
    },
    {
      id: "self-routine",
      title: "자존 회복 루틴",
      body: `이별 결정이든 재시도든, 먼저 필요한 건 **네 기력**이다.
- 수면·식사·가벼운 운동을 ‘미션’이 아니라 ‘최소 생존’으로
- SNS 야간 차단 1~2시간
- “내가 초라해 보일까” 문장을 아침마다 한 줄로 반박해 쓰기

네가 흔들릴수록 ${p}의 침묵은 더 크게 들린다.
흔들림을 줄이면, 침묵의 의미도 달라 보이기 시작한다.`,
    },
  ];
}

function strategyProductExtra(form: SajuBirthForm): SajuReportSection[] {
  const p = partner(form);
  return [
    {
      id: "dont-now",
      title: "지금 하면 안 되는 것",
      body: `지금~앞으로 2~4주는 **설득 시즌이 아니다.**
금지에 가까운 행동:
- 자정 장문 / 술김 통화
- “우리 다시” 직구
- 읽씹 추궁, 연속 카톡
- 지인 통한 압력
- 질투 유발용 급작 새 만남 전시

대신 해도 되는 것:
- 생활 리듬 회복
- 외모·공간 정돈 (복수심 없이)
- ${p}를 떠올릴 때 ‘보낼 문장’을 메모장에만 적고 닫기`,
    },
  ];
}

function oneLinerFor(productId: SajuProductId, form: SajuBirthForm): string {
  const p = partner(form);
  switch (productId) {
    case "reunion-luck":
      return `흐름상, **완전히 끝난 인연은 아니다.** 다만 **지금 당장 들이대면** 기운이 다시 엉키고, **1~3개월 사이 ‘거리 있는 재접근’**이 붙을 가능성이 더 크다.`;
    case "partner-heart":
      return `${p} 마음에서 네가 **삭제됐다기보다 보관함**에 있을 가능성이 크다. 다만 ‘남아 있음’과 ‘다시 열 준비’는 다른 층이다.`;
    case "breakup-decision":
      return `지금은 “무조건 붙여”도 “무조건 버려”도 아니다. **자존이 버티는 구조**를 먼저 세운 뒤, 남겨둘지 놓을지를 결정 편이 맞다.`;
    case "reunion-strategy":
      return `재회의 핵심은 고백이 아니라 **저자극·정돈·타이밍**이다. 설득보다 안정이 먼저다.`;
  }
}

function bulletsFor(productId: SajuProductId, form: SajuBirthForm): string[] {
  const p = partner(form);
  switch (productId) {
    case "reunion-luck":
      return [
        "재회 **절대 불가** 쪽은 아니다.",
        "다만 **지금 이 순간 고백·추궁·장문**은 독이 될 가능성이 높다.",
        `${p} 마음속에 네가 **완전히 지워진 상태**로 보이지는 않는다.`,
        "**앞으로 1개월**: 관망·정돈. **3개월 전후**: 접촉 창. **6개월**: 재개 vs 정리 갈림.",
      ];
    case "partner-heart":
      return [
        "남아 있을 가능성은 있으나, 지금 받아줄 준비와는 별개다.",
        "거리감의 핵심은 미움보다 **피로·자기보호**일 가능성이 크다.",
        "다가갈 온도는 낮게, 확인 욕구는 더 낮게.",
      ];
    case "breakup-decision":
      return [
        "소모가 사랑보다 커졌다면, 결정은 ‘감정’이 아니라 ‘구조’로.",
        "남겨둘 조건과 놓을 조건을 문장으로 적어라.",
        "자존 회복 없는 재시도는 같은 이별을 복제한다.",
      ];
    case "reunion-strategy":
      return [
        "1단계: 네 기운 회수. 2단계: 저자극 접촉. 3단계: 과거 재판 금지.",
        "해도 되는 말 / 금지 문구를 먼저 외워라.",
        "확인하고 싶을 때가 가장 보내면 안 되는 때다.",
      ];
  }
}

function sectionsForProduct(
  productId: SajuProductId,
  form: SajuBirthForm,
  characterName: string,
  productTitle: string,
): SajuReportSection[] {
  const base: SajuReportSection[] = [
    commonCover(form, characterName, productTitle, oneLinerFor(productId, form), bulletsFor(productId, form)),
    questionsSection(form, characterName),
    loveTraitSection(form),
  ];

  if (productId === "reunion-luck") {
    return [
      ...base,
      bondSection(form),
      breakupReasonSection(form),
      remainingHeartSection(form),
      timelineSection(form),
      contactGuideSection(form),
      strategySection(form),
      pitfallsSection(form),
      closingSection(form, characterName),
      noticeSection(characterName, productTitle),
    ];
  }

  if (productId === "partner-heart") {
    return [
      ...base,
      bondSection(form),
      breakupReasonSection(form),
      remainingHeartSection(form),
      ...partnerHeartExtra(form),
      contactGuideSection(form),
      closingSection(form, characterName),
      noticeSection(characterName, productTitle),
    ];
  }

  if (productId === "breakup-decision") {
    return [
      ...base,
      breakupReasonSection(form),
      ...breakupDecisionExtra(form),
      pitfallsSection(form),
      closingSection(form, characterName),
      noticeSection(characterName, productTitle),
    ];
  }

  // reunion-strategy
  return [
    ...base,
    ...strategyProductExtra(form),
    timelineSection(form),
    contactGuideSection(form),
    strategySection(form),
    pitfallsSection(form),
    closingSection(form, characterName),
    noticeSection(characterName, productTitle),
  ];
}

export function buildTemplateReport(
  productId: SajuProductId,
  form: SajuBirthForm,
): SajuReportPayload {
  const product = getSajuProduct(productId);
  if (!product) {
    throw new Error("Unknown product");
  }
  const character = getSajuCharacter(product.characterId);
  const characterName = character?.name ?? product.characterName;
  const sections = sectionsForProduct(productId, form, characterName, product.title);
  const previewSections = sections.slice(0, 2).map((s, i) => ({
    ...s,
    blurred: i === 1,
  }));

  return {
    productId,
    characterId: product.characterId,
    characterName,
    title: `${product.title} 리포트｜${characterName}`,
    oneLiner: oneLinerFor(productId, form),
    previewSections,
    sections,
    source: "template",
    generatedAt: new Date().toISOString(),
    form,
  };
}

export function emptyBirthForm(): SajuBirthForm {
  return {
    displayName: "",
    gender: "여성",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    birthTime: "",
    birthPlace: "",
    partnerName: "",
    partnerBirthYear: "",
    monthsApart: "3",
    breakupNote: "",
    concern: "",
  };
}
