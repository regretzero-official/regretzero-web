import { getSajuCharacter } from "@/features/saju-chat/characters";
import type { SajuCharacterId } from "@/features/saju-chat/types";
import { getCanonicalSections } from "./canonical-sections";
import { computeChart } from "./manseryeok/computeChart";
import { dayMasterLabel } from "./manseryeok/computeChart";
import type { SajuChart } from "./manseryeok/types";
import { getSajuProduct } from "./products";
import { buildReunionNarrativeSections } from "./reunionNarrative";
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

function monthsShort(form: SajuBirthForm) {
  return safe(form.monthsApart, "3");
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

function breakupLine(form: SajuBirthForm) {
  return safe(form.breakupNote, "서로 지쳐 헤어진 느낌");
}

type VoicePack = {
  id: SajuCharacterId | string;
  name: string;
  openerAside: (p: string) => string;
  coverBridge: (y: string, birth: string, gender: string, months: string, breakup: string) => string;
  coverClose: string;
  frameAside: string;
  questionsLead: string;
  questionsClose: (p: string) => string;
  traitLead: string;
  traitClose: (p: string) => string;
  patternClose: (p: string) => string;
  bondAside: (p: string) => string;
  sipseongAside: (p: string) => string;
  breakupAside: (p: string) => string;
  remainingAside: (p: string) => string;
  timelineAside: string;
  contactAside: (p: string) => string;
  strategyClose: string;
  pitfallsLead: string;
  closingHook: (p: string, months: string) => string;
  closingBody: string;
  signOff: string;
  strategyNudge: string;
  heartTempLead: (p: string) => string;
  keepLeaveClose: string;
  selfRoutineClose: string;
  dontNowLead: string;
};

function voicePack(characterId: string, characterName: string): VoicePack {
  switch (characterId) {
    case "seo-nari":
      return {
        id: characterId,
        name: characterName,
        openerAside: (p) => `느낌이 왔어. 밤공기 속에 ${p} 이름만 스쳐도 가슴이 먼저 반응하지? 언니 말 들어봐—그 반응, 끝이 아니라 잔향이야.`,
        coverBridge: (y, birth, gender, months, breakup) => `${y}, ${birth}, ${gender}. 낮엔 괜찮은 척해도 밤에 감정이 더 깊게 남는 결이야. 헤어진 지 ${months}—“${breakup}”이 아직 몸 안쪽에 남아 있을 가능성이 커. 오늘 이야기는 카톡처럼, 근데 장면처럼 길게 읽어줄게.`,
        coverClose: `단정 예언은 안 해. 느낌이 흐름이지 고정값이 아니야. 그래도 네 원국·이별·침묵의 결을 겹치면 위 방향이 제일 설득력 있어.`,
        frameAside: "서나리 식으로—표면 감정은 거짓말하기 쉽고, 가슴의 온도·잔향이 더 정직해.",
        questionsLead: "네가 진짜로 묻고 싶은 건 한 겹이 아니야. 장면마다 하나씩, 언니랑 풀어보자.",
        questionsClose: (p) => `서로 지쳐 헤어진 이별은 사랑이 없어서보다 속도가 안 맞아서인 경우가 많아. 그 차이를 못 보면 ${p}랑 다시 만나도 같은 벽이야.`,
        traitLead: "네 원국을 만세력으로 먼저 짚을게. 해석은 언니 식으로 풀어줄게.",
        traitClose: (p) => `그래서 ${p} 생각도 싸움 한 방보다 누적 피로로 남는 거야. 깊게 사랑하고, 오래 남기고, 참다가 한꺼번에 지치는 타입.`,
        patternClose: (p) => `재회를 원하면 같은 스크립트를 다른 호흡으로 다시 써야 해. ${p}한테 예전의 확인·장문으로 들어가면 또 숨이 막혀.`,
        bondAside: (p) => `느낌이 왔어—초반 온기는 예뻤을 거야. 문제는 온기가 과해지며 ${p}가 숨을 쉬려 할 때, 네가 버림으로 읽은 구간이야.`,
        sipseongAside: (p) => `정리하면 ${p}랑은 붙고, 흔들리고, 버티다 지친 구조. 다음엔 너부터 회복하고, 말은 얇게. 느낌 왔지?`,
        breakupAside: (p) => `서나리 느낌—너희는 끝이 아니라 과열 차단을 한 걸 수도 있어. ${p} 쪽에 미움보다 역량 고갈이 더 가까워.`,
        remainingAside: (p) => `${p} 마음에 네가 남아 있을 가능성은 있어. 다만 보고 싶다랑 다시 만나자는 칸이 달라. 삭제가 아니라 손대기 무서운 보관함에 가까워.`,
        timelineAside: "타임라인도 확정이 아니라 가능성의 지도야. 조급하면 엉키고, 정돈하면 창이 열려.",
        contactAside: (p) => `${p}처럼 지쳐 끝난 상대에게 추궁은 재이별의 지름길이야. 확인하고 싶을 때가 제일 보내면 안 되는 때—느낌 왔지?`,
        strategyClose: "성공 지표는 답장 속도가 아니라, 네가 무너지지 않는 하루야.",
        pitfallsLead: "함정만 짧게 짚을게. 검색으로 매일 확인하려 하지 마—불안만 커져.",
        closingHook: (p, months) => `${months}이면 사랑은 안 죽었을 수도 있어. 근데 ${p} 마음에 네가 남아 있는지 묻기 전에, 남겨둘 만한 너로 먼저 서 있냐를 물어.`,
        closingBody: "네 진지함은 이미 충분해. 이번엔 그걸 무게가 아니라 안정으로 바꿔. 문이 열리면 들어가고, 안 열려도 네가 혼자 무너지진 마.",
        signOff: "이상, 서나리. 카톡하듯 말해줄게—너는 혼자 무너지지 마.",
        strategyNudge: "확인하고 싶을 때가 제일 보내면 안 되는 때야. 느낌 왔지?",
        heartTempLead: (p) => `${p}에게 지금 필요한 건 설득이 아니라 안전감이야. 예전의 뜨거운 온도 말고, 옅은 온기만 흘려보내.`,
        keepLeaveClose: "결정은 사랑 점수가 아니라, 네 자존이 버티는 구조로 내려.",
        selfRoutineClose: "흔들림을 줄이면, 침묵의 의미도 달라 보이기 시작해.",
        dontNowLead: "지금~몇 주는 설득 시즌이 아니야. 생활 리듬부터.",
      };
    case "baek-ryeon":
      return {
        id: characterId,
        name: characterName,
        openerAside: (p) => `기운이 보여. 밤의 점사다. ${p} 쪽으로 아직 줄이 남아 있어. 다만 지금 흔들면 줄이 더 엉킨다. 흔들리지 마.`,
        coverBridge: (y, birth, gender, months, breakup) => `${y}. ${birth} · ${gender}. 밤의 감정이 낮의 말보다 깊게 남는 결이야. 헤어진 지 ${months}. “${breakup}”의 잔향이 아직 몸 안에 있어. 오늘은 강의가 아니라, 장면으로 읽어줄게.`,
        coverClose: "확정 예언은 하지 않는다. 기운은 흐른다. 그래도 원국·이별·침묵의 결을 겹치면, 위 방향이 가장 설득력 있다.",
        frameAside: "백련이 보는 건 말보다 氣다. 말은 포장되고, 기운은 비교적 정직하다. 점사는 짧고 단호하게.",
        questionsLead: "이번 밤의 점사—핵을 단호히 정리한다.",
        questionsClose: (p) => `지쳐 헤어진 인연은 사랑이 없어서가 아니라 속도가 어긋나서다. ${p}와 다시 붙더라도, 같은 호흡이면 같은 벽이다.`,
        traitLead: "원국·일간을 만세력으로 짧게 읽는다. 해석은 상담 톤이다.",
        traitClose: (p) => `압축한다—깊게 사랑하고, 오래 남기고, 참다가 한꺼번에 지친다. ${p}와의 이별도 누적 피로로 읽힌다.`,
        patternClose: (p) => `같은 스크립트로 ${p}에게 다시 들어가면 또 숨이 막힌다. 재회의 중심은 설득이 아니라 안정이다.`,
        bondAside: (p) => `${p}와 너는 나이보다 호흡 차이다. 온기가 과하면 부딪친다. 작은 서운이 쌓인 흐름으로 보라.`,
        sipseongAside: (p) => `${p}와의 역학—붙고, 흔들리고, 버티다 지쳤다. 다음 판은 너부터 회복이다.`,
        breakupAside: (p) => `표면은 소모, 속은 과열 차단일 수 있다. ${p} 쪽은 미움보다 자기보호다. 중심을 세워라.`,
        remainingAside: (p) => `${p} 마음에 네가 남아 있을 여지는 있다. 다만 남아 있음과 다시 열 준비는 다르다. 삭제보다 손대기 무서운 보관함에 가깝다.`,
        timelineAside: "타임라인은 가능성의 지도다. 氣는 조급할수록 흐트러지고, 정돈될수록 모인다.",
        contactAside: (p) => `${p}에게 추궁은 독이다. 설득하지 마. 안정이 용신이다.`,
        strategyClose: "전략의 지표는 답장이 아니라, 네 기운이 회수됐는가다.",
        pitfallsLead: "함정을 끊는다. 확인하고 싶을 때가 가장 보내면 안 되는 때다.",
        closingHook: (p, months) => `${months}의 침묵은 삭제가 아닐 수 있어. ${p} 자리를 묻기 전에—네 중심부터 세워. 남겨둘 만한 너로.`,
        closingBody: "진지함을 무게가 아니라 안정으로 바꿔. 타이밍이 문을 열어도, 네가 흔들리면 문은 닫힌다. 기운이 정돈된 사람 쪽으로 다시 모인다.",
        signOff: "이상, 백련. 기운이 정돈된 사람 쪽으로 다시 모인다.",
        strategyNudge: "설득하지 마. 안정이 먼저야.",
        heartTempLead: (p) => `${p}에게 필요한 건 설득이 아니라 안전감이다. 온도는 낮게. 과한 온기는 청구서로 읽힌다.`,
        keepLeaveClose: "결정은 감정 점수가 아니라, 네 중심이 버티는 구조로.",
        selfRoutineClose: "흔들림을 줄이면 침묵의 의미가 달라진다.",
        dontNowLead: "지금은 설득 시즌이 아니다. 기부터 모아.",
      };
    case "cha-yuri":
      return {
        id: characterId,
        name: characterName,
        openerAside: (p) => `${p}한테 왜 그렇게 퍼줘. 너는 더 아껴도 돼. 팩트부터—지금은 더 잘해주기 시즌이 아니야. 눈물 웹소설 말고, 자존 웹소설로 가자.`,
        coverBridge: (y, birth, gender, months, breakup) => `${y}. ${birth}, ${gender}. 낮엔 괜찮은 척, 밤에 감정이 커지는 타입이지? 헤어진 지 ${months}. “${breakup}”—로맨스 포장 말고 소모로 읽어. 장면은 길게, 결정은 짧게.`,
        coverClose: "예언 안 해. 근데 네 원국 결 + 이별 결 + 침묵 패턴 겹치면, 위 방향이 제일 현실적이야.",
        frameAside: "차유리 식으로—감정 점수 말고, 네가 버티는 구조로 읽어. 자존이 먼저다. dry하게.",
        questionsLead: "질문부터 팩트로. 감성 에세이 필요 없어. 장면만 딱.",
        questionsClose: (p) => `지쳐 헤어진 거면 사랑이 없어서가 아니라 속도가 안 맞은 거야. ${p}랑 다시 붙어도 구조 안 바꾸면 또 같아.`,
        traitLead: "기질은 원국 숫자로 짧게. 해석은 팩트 상담 톤.",
        traitClose: (p) => `한 줄—깊게 사랑하고, 참다가, 한꺼번에 지친다. ${p} 이별도 그 패턴. 인정해야 다음이 있어.`,
        patternClose: (p) => `같은 스크립트로 ${p}한테 가면 또 지친다. 재회 핵심은 더 잘해주기가 아니라 덜 매달리는 안정이야.`,
        bondAside: (p) => `${p}랑 너는 초반이 예뻤을 수도 있어. 문제는 온기가 과해져서 숨 막힌 구간. 작은 서운함이 쌓인 거.`,
        sipseongAside: (p) => `${p} 역학 요약—붙고, 흔들리고, 버티다 소모. 다음엔 너부터. 청구서형 온기는 접어.`,
        breakupAside: (p) => `팩트: ${p}가 싫어서라기보다 기대 속도를 못 따라가겠다는 자기보호일 가능성 크다. 너는 자존 거래하지 마.`,
        remainingAside: (p) => `${p} 마음에 네가 남아 있을 수는 있어. 근데 남아 있음 ≠ 지금 받아줄 준비. 보관함이지, 대기열이 아냐.`,
        timelineAside: "타임라인은 지도야. 조급하면 망하고, 정돈하면 창이 열려.",
        contactAside: (p) => `${p}한테 추궁·장문·자존 거래는 전부 독. 그만. 짧은 안부만.`,
        strategyClose: "답장 속도에 자존 걸지 마. 네가 무너지지 않는 하루가 이기는 거야.",
        pitfallsLead: "함정—확인하고 싶을 때가 제일 보내면 안 되는 때. 외워.",
        closingHook: (p, months) => `${months} 끌려다녔으면 이제 계산해. ${p}가 남아 있냐보다, 너 자존이 남아 있냐가 먼저야.`,
        closingBody: "진지한 거 알아. 근데 진지함을 무게로 쓰면 상대는 도망가. 안정으로 바꿔. 문은 열리면 들어가고, 안 열려도 네가 초라해질 필요는 없어.",
        signOff: "이상, 차유리. 팩트 말했고—너는 더 아껴도 돼.",
        strategyNudge: "추궁·장문·자존 거래는 전부 독. 그만.",
        heartTempLead: (p) => `${p}한테 지금 설득하지 마. 안전감. 온도 낮춰. 과한 온기는 청구서야.`,
        keepLeaveClose: "사랑 점수 말고 자존 구조로 결정해. 그게 팩트야.",
        selfRoutineClose: "네가 흔들리면 침묵이 더 크게 들려. 루틴부터.",
        dontNowLead: "지금은 설득 금지 구간. 생활부터 세워.",
      };
    case "han-bora":
      return {
        id: characterId,
        name: characterName,
        openerAside: (p) => `헐, 또 ${p} 생각했지? 일단 네 마음부터. 괜찮아, 그 마음 이상한 거 아니야. 다만 행동만 조심하자—오늘은 응원 웹소설처럼, 근데 현실 pep 넣어서.`,
        coverBridge: (y, birth, gender, months, breakup) => `${y}! ${birth}, ${gender}. 낮엔 괜찮은 척하다가 밤에 감정이 커지는 결에 가까워. 헤어진 지 ${months}, “${breakup}”이 아직 남아 있을 수 있어. 장면은 따뜻하게, 선택은 또렷하게 가자.`,
        coverClose: "확정 예언은 안 할게. 그래도 네 결 + 이별 결 + 침묵 패턴을 겹치면, 위 방향이 제일 설득력 있어.",
        frameAside: "한보라가 먼저 공감하고, 그다음 현실 한 줄—위험 집착은 말릴게.",
        questionsLead: "네가 묻고 싶은 거, 겹겹이지? 장면마다 같이 정리해보자.",
        questionsClose: (p) => `서로 지쳐 헤어진 거면, 사랑이 없어서보다 속도가 안 맞은 거야. ${p}랑 다시 만나도 호흡을 바꿔야 해.`,
        traitLead: "기질은 원국 기준으로 쉽게 말해줄게. 해석은 위로·상담이야.",
        traitClose: (p) => `한 줄로—깊게 사랑하고, 오래 남기고, 참다가 지쳐. ${p} 이별도 그 결에 가깝다 보면 돼.`,
        patternClose: (p) => `같은 방식으로 ${p}에게 가면 또 지칠 수 있어. 재회는 설득보다 안정이 먼저야.`,
        bondAside: (p) => `${p}랑 초반 온기는 예뻤을 거야. 길어지며 왜 말 없어 / 왜 확인해 로 숨 막힌 패턴이 흔해.`,
        sipseongAside: (p) => `${p}랑은 붙고-흔들리고-버티다 소모. 다음엔 너 회복 → 가벼운 말 → 관계는 상대가 느끼게.`,
        breakupAside: (p) => `표면은 소모, 속은 과열 차단일 수도. ${p}도 미움보다 지침일 가능성—그래도 네 자존은 지키자.`,
        remainingAside: (p) => `${p} 마음에 네가 남아 있을 수는 있어. 근데 남아 있음이랑 지금 만나자는 달라. 보관함에 가까워.`,
        timelineAside: "타임라인은 지도야. 조급하면 엉키고, 정돈하면 창이 열려.",
        contactAside: (p) => `${p}한테 첫 문장은 짧게. 숙제 주지 마. 답장 없어도 네가 괜찮아야 해.`,
        strategyClose: "성공은 답장 속도가 아니라, 네가 무너지지 않는 하루야.",
        pitfallsLead: "함정만 말해줄게. 확인하고 싶을 때가 제일 보내면 안 되는 때야.",
        closingHook: (p, months) => `${months}이면 그리움이 남아 있을 수 있어. 근데 ${p}에게 들이대기 전에—네가 무너지지 않는 하루를 먼저 만들자.`,
        closingBody: "응원할게. 진지함은 충분해—이번엔 무게 말고 안정으로. 문 열리면 들어가고, 안 열려도 네가 혼자는 아니야. 위험한 집착은 내가 말릴게.",
        signOff: "이상, 한보라. 응원하되, 위험한 집착은 내가 말릴게.",
        strategyNudge: "첫 문장은 짧게. 숙제 주지 마. 답장 없어도 네가 괜찮아야 해.",
        heartTempLead: (p) => `${p}에게는 설득보다 안전감. 온도는 2~3도만. 괜찮아, 천천히 가자.`,
        keepLeaveClose: "결정은 감정만으로 하지 말고, 네가 버티는 구조로 보자.",
        selfRoutineClose: "흔들림 줄이면 침묵도 덜 무섭게 들려. 같이 가자.",
        dontNowLead: "지금은 설득 시즌 아냐. 생활 리듬부터 챙기자.",
      };
    case "lee-doryeong":
      return {
        id: characterId,
        name: characterName,
        openerAside: (p) => `다치지 않게, 곁에서 읽어드릴게요. ${p} 생각이 남는다면 약함이 아니라 깊이예요. 그 깊이가 무게가 되지 않게 제가 지켜드릴게요.`,
        coverBridge: (y, birth, gender, months, breakup) => `${y}님. ${birth}, ${gender}. 낮의 말보다 밤의 감정이 깊게 남는 결에 가까워요. 헤어진 지 ${months}, “${breakup}”의 잔향이 아직 남아 있을 수 있어요.`,
        coverClose: "확정 예언은 하지 않아요. 그래도 원국·이별·침묵의 결을 겹치면 위 방향이 가장 설득력 있어요.",
        frameAside: "이도령이 지키는 건 예언이 아니라, 당신이 다치지 않는 여지예요.",
        questionsLead: "묻고 싶은 마음을 하나씩, 부드럽게 정리해 볼게요.",
        questionsClose: (p) => `지쳐 헤어진 인연은 사랑이 없어서보다 속도가 어긋나서인 경우가 많아요. ${p}와 다시 만나도 호흡을 바꿔야 해요.`,
        traitLead: "기질은 원국 기준으로 짧고 쉽게 말씀드릴게요. 해석은 상담 톤이에요.",
        traitClose: (p) => `깊게 사랑하고, 오래 남기고, 참다가 지치는 결. ${p}와의 이별도 그 결에 닿아 있을 수 있어요.`,
        patternClose: (p) => `같은 방식으로 ${p}에게 다가가면 같은 벽이 올 수 있어요. 재회는 설득보다 안정이 먼저예요.`,
        bondAside: (p) => `${p}와는 초반 합이 따뜻했을 가능성이 커요. 길어지며 확인과 침묵이 충이 된 흐름을 조심하세요.`,
        sipseongAside: (p) => `${p}와의 역학은 붙고-흔들리고-버티다 소모. 다음엔 당신 회복이 먼저예요.`,
        breakupAside: (p) => `표면은 소모, 속은 과열 차단일 수 있어요. ${p} 쪽도 미움보다 자기보호일 여지가 있어요.`,
        remainingAside: (p) => `${p} 마음에 당신이 남아 있을 여지는 있어요. 다만 남아 있음과 다시 열 준비는 달라요.`,
        timelineAside: "타임라인은 가능성의 지도예요. 조급함보다 정돈이 문을 열어요.",
        contactAside: (p) => `${p}에게는 부드러운 한 줄이면 충분해요. 강요는 독을 불러요.`,
        strategyClose: "성공은 답장이 아니라, 당신이 무너지지 않는 하루예요.",
        pitfallsLead: "함정만 짧게—확인하고 싶을 때가 가장 보내면 안 되는 때예요.",
        closingHook: (p, months) => `${months}의 침묵 속에서도 품위를 잃지 마세요. ${p}에게 돌아가기보다, 먼저 당신의 밤에 평화를 돌려주세요.`,
        closingBody: "진지함은 이미 충분해요. 이번엔 무게가 아니라 안정으로. 문이 열리면 들어가시고, 안 열려도 당신이 무너지진 않게.",
        signOff: "이상, 이도령. 문이 열리면 들어가고, 안 열려도 당신이 무너지진 않게.",
        strategyNudge: "부드러운 한 줄이면 충분해요. 강요는 독을 불러요.",
        heartTempLead: (p) => `${p}에게는 설득보다 안전감이 필요해요. 온도는 낮게, 천천히.`,
        keepLeaveClose: "결정은 사랑 점수가 아니라, 당신이 버티는 구조로요.",
        selfRoutineClose: "흔들림이 줄면 침묵의 의미도 달라져요.",
        dontNowLead: "지금은 설득 시즌이 아니에요. 생활의 리듬부터요.",
      };
    case "kang-seon":
      return {
        id: characterId,
        name: characterName,
        openerAside: (p) => `괜찮아. 같이 정리하자. ${p} 생각난다고 네가 작아질 필요는 없어—들이대는 자신감이 아니라, 정돈된 자신감.`,
        coverBridge: (y, birth, gender, months, breakup) => `${y}. ${birth}, ${gender}. 낮엔 괜찮은 척, 밤에 감정이 커지는 결이지. 헤어진 지 ${months}, “${breakup}”이 아직 남아 있을 수 있어.`,
        coverClose: "예언은 안 해. 그래도 네 결 + 이별 결 + 침묵 패턴이면 위 방향이 제일 설득력 있어.",
        frameAside: "강세온 식으로—너는 이미 매력 있어. 문제는 타이밍과 온도야.",
        questionsLead: "질문부터 깔끔하게. 네가 진짜 궁금한 것만.",
        questionsClose: (p) => `지쳐 헤어진 거면 속도 문제야. ${p}랑 다시 만나도 호흡 안 바꾸면 또 같아.`,
        traitLead: "기질은 원국 기준으로 짧게. 해석은 상담 톤.",
        traitClose: (p) => `깊게 사랑하고 참다가 지치는 타입. ${p} 이별도 그 결. 이번엔 페이스를 네가 잡아.`,
        patternClose: (p) => `같은 스크립트로 ${p}에게 가면 매력이 죽어. 재회는 설득보다 안정.`,
        bondAside: (p) => `${p}랑 합은 초반에 통했을 거야. 과해지면 충. 작은 서운함부터 정리하자.`,
        sipseongAside: (p) => `${p} 역학—붙고 흔들리고 버티다 소모. 너 회복이 먼저, 티징은 가볍게.`,
        breakupAside: (p) => `${p}가 싫어서보다 지침일 가능성. 너는 자존 올려. 선은 지키되 작아지지는 마.`,
        remainingAside: (p) => `${p} 마음에 네가 남아 있을 수는 있어. 근데 남아 있음 ≠ 지금 열려 있음. 온도 낮춰.`,
        timelineAside: "타임라인은 지도. 조급하면 흐름 엉키고, 정돈하면 창이 열려.",
        contactAside: (p) => `${p}한테 티징은 가볍게, 추궁은 제로. 네가 무거우면 매력이 죽어.`,
        strategyClose: "답장에 자존 걸지 마. 네가 더 좋아 보이는 쪽이 이겨.",
        pitfallsLead: "함정—확인하고 싶을 때가 제일 보내면 안 되는 때야.",
        closingHook: (p, months) => `${months} 끌려다녔으면 이제 네 페이스로. ${p}가 돌아오든 말든, 네가 더 좋아 보이는 쪽이 이기는 거야.`,
        closingBody: "선 넘지 말고, 자존은 올려. 진지함은 충분해—무게 말고 안정으로. 문 열리면 들어가고, 안 열려도 네가 무너지진 마.",
        signOff: "이상, 강세온. 선 넘지 말고, 자존은 올려.",
        strategyNudge: "티징은 가볍게, 추궁은 제로. 네가 무거우면 매력이 죽어.",
        heartTempLead: (p) => `${p}에게 설득하지 마. 안전감. 온도 낮추고, 네가 흔들리지 않는 모습.`,
        keepLeaveClose: "결정은 감정 점수 말고, 네가 버티는 구조로.",
        selfRoutineClose: "흔들림 줄이면 침묵도 작아져. 루틴이 매력이야.",
        dontNowLead: "지금은 설득 말고 생활. 정돈된 자신감부터.",
      };
    case "han-siwoo":
    default:
      return {
        id: characterId,
        name: characterName,
        openerAside: (p) => `급할수록 한 박자 쉬어. 너, 밤에 또 ${p} 생각했지. 氣는 거짓말 잘 안 해—지금 들이대면 흐름이 또 엉킨다.`,
        coverBridge: (y, birth, gender, months, breakup) => `${y}. ${birth}, ${gender}. 낮의 말보다 밤의 감정이 깊게 남는 결. 헤어진 지 ${months}. “${breakup}”의 잔기가 아직 있다.`,
        coverClose: "단정은 안 한다. 氣는 고정값이 아니니까. 그래도 원국·이별·침묵을 겹치면 위 방향이 가장 설득력 있다.",
        frameAside: "한시우 방식은 단순하다. 표면 감정은 거짓말하기 쉽고, 기운의 방향은 비교적 정직하다.",
        questionsLead: "질문의 핵만 짧게.",
        questionsClose: (p) => `지쳐 헤어진 인연은 속도 문제다. ${p}와 다시 붙어도 호흡이 같으면 같은 벽이다.`,
        traitLead: "원국·일간을 만세력으로 짧게 읽는다. 해석은 氣 상담이다.",
        traitClose: (p) => `깊게 사랑하고, 참다가, 한꺼번에 지친다. ${p} 이별도 그 결.`,
        patternClose: (p) => `같은 스크립트로 ${p}에게 가면 합이 충이 된다. 용신은 설득이 아니라 안정.`,
        bondAside: (p) => `${p}와는 합이 과하면 충. 작은 해가 형을 부른 흐름으로 보라.`,
        sipseongAside: (p) => `${p} 역학—관성으로 붙고, 재성으로 흔들리고, 인성으로 버티다 지쳤다.`,
        breakupAside: (p) => `과열 차단일 수 있다. ${p} 쪽은 미움보다 자기보호. 중심만 잡아.`,
        remainingAside: (p) => `${p} 마음에 네가 남아 있을 여지는 있다. 남아 있음 ≠ 지금 열림. 손대기 무서운 공망에 가깝다.`,
        timelineAside: "타임라인은 지도다. 氣는 조급할수록 흐트러진다.",
        contactAside: (p) => `${p}에게 추궁은 독. 확인하고 싶을 때가 가장 보내면 안 되는 때다.`,
        strategyClose: "지표는 답장이 아니라, 네가 정돈됐는지다.",
        pitfallsLead: "함정—확인하고 싶을 때가 가장 보내면 안 되는 때다.",
        closingHook: (p, months) => `${months}이면 사랑은 안 죽었을 수도 있어. 근데 예전의 방식까지 살아 있으면, ${p}와 다시 만나도 또 지친다.`,
        closingBody: "氣는 조급할수록 흐트러지고, 정돈된 사람 쪽으로 다시 모인다. 문 열리면 들어가고, 안 열려도 네가 무너지진 않게.",
        signOff: "이상, 한시우. 氣는 조급할수록 흐트러지고, 정돈된 사람 쪽으로 다시 모인다.",
        strategyNudge: "확인하고 싶을 때가, 가장 보내면 안 되는 때다.",
        heartTempLead: (p) => `${p}에게 필요한 건 설득이 아니라 안전감. 온도는 낮게.`,
        keepLeaveClose: "결정은 감정 점수가 아니라, 네가 버티는 구조로.",
        selfRoutineClose: "흔들림을 줄이면 침묵의 의미가 달라진다.",
        dontNowLead: "지금은 설득 시즌이 아니다. 氣부터 모아.",
      };
  }
}


function disclaimerBlock(characterName: string, productTitle: string) {
  return `**원국(네 기둥·일간 등)은 출생 기준 만세력으로 계산**했어요(양력·입춘·절기).
해석·조언은 **참고용이에요. 절대 결과가 아니에요.** 원치 않는 연락은 권하지 않아요.

— ${characterName} · ${productTitle}`;
}

function commonCover(
  form: SajuBirthForm,
  voice: VoicePack,
  productTitle: string,
  oneLiner: string,
  bullets: string[],
): SajuReportSection {
  const p = partner(form);
  const y = you(form);
  return {
    id: "cover",
    title: "표지 / 한줄결론",
    body: `${voice.openerAside(p)}

${voice.coverBridge(y, birthLabel(form), form.gender, monthsLabel(form), breakupLine(form))}

밤의 대화창이 꺼지지 않은 채, 네가 적어 준 고민의 핵:
> ${concernLine(form)}

**흐름상 결론만 먼저.** (이야기는 길게, 결정은 또렷하게.)

${oneLiner}

${bullets.map((b) => `- ${b}`).join("\n")}

이 리포트는 체크리스트 강의가 아니라, **읽는 장면**으로 풀어갈게. 사주 숫자는 가끔 *(근거 한 줄)*로만 받쳐 주고, 본편은 네 감정·상대 심리·다음에 네가 할 선택이야.

${voice.coverClose}

— ${voice.name} · ${productTitle}`,
  };
}

function questionsSection(form: SajuBirthForm, voice: VoicePack): SajuReportSection {
  const p = partner(form);
  return {
    id: "questions",
    title: "이번 점사의 질문 정리",
    body: `${voice.questionsLead}

1. **관계는 다시 열릴 수 있는가?** — “가능/불가능”이 아니라, *어떤 조건에서 가능성이 살아나는가.*
2. **지금 연락해도 되는가?** — *지금 연락이 흐름을 여는가, 닫는가.*
3. **${p} 마음에 내가 남아 있는가?** — 남아 있다면 *그리움인지, 죄책감인지, 습관인지* 구분.

네가 적어 준 고민:
> ${concernLine(form)}

이별 메모: ${breakupLine(form)} · 헤어진 지 ${monthsLabel(form)}.

${voice.frameAside}
${voice.questionsClose(p)}

*(근거 한 줄)* 이번 점사는 ${p}와의 인연에서 ‘어디서 숨이 막히고, 어디서 숨통이 트이는지’를 본다. 틀·끌림·완충—이름은 나중에, 장면이 먼저야.`,
  };
}

function loveTraitSection(form: SajuBirthForm, voice: VoicePack, chart: SajuChart): SajuReportSection {
  const p = partner(form);
  const dm = dayMasterLabel(chart.dayMaster, chart.dayMasterElement);
  const hourBit = chart.pillars.hour
    ? `시주 **${chart.pillars.hour.korean}**(${chart.pillars.hour.hanja})`
    : "시주 미상(출생 시각 없음)";
  return {
    id: "trait",
    title: "원국·일간 기질",
    body: `${voice.traitLead}
${birthLabel(form)} ${form.gender} — 만세력 원국 **${chart.summaryLine}**.

### 3-1. 원국(原局)
년 **${chart.pillars.year.korean}** · 월 **${chart.pillars.month.korean}** · 일 **${chart.pillars.day.korean}** · ${hourBit}
대운·세운이 날씨라면 원국은 집의 구조다. ${monthsLabel(form)}이 지나도 ${p} 생각이 남는 결이 여기와 맞닿는다.

### 3-2. 일간(日干) — ‘나’의 중심
일간 **${dm}** (${chart.dayMasterYinYang}${chart.dayMasterElement}).
오행 **${chart.dayMasterElement}** 기운의 연애는 “관심”보다 “뿌리”로 읽히기 쉽다. 상대가 멀어지면 가지를 흔들기보다 뿌리가 흔들린 것처럼 반응하기 쉽다.

### 3-3. 월지 · 시주
월주 **${chart.pillars.month.korean}** — 바깥에서 보이는 나·환경의 결.
${hourBit}. ${chart.hourUnknown ? "시각을 알면 시주까지 더 정확해져요." : "시주는 내면·‘진짜 속’과 연결된다."}

### 3-4. 기질을 장면으로
*(근거 한 줄)* 원국 십성 감각은 년 ${chart.tenGods.year.stem}/${chart.tenGods.year.branch} · 월 ${chart.tenGods.month.stem}/${chart.tenGods.month.branch} · 일 일간/${chart.tenGods.day.branch}${chart.tenGods.hour ? ` · 시 ${chart.tenGods.hour.stem}/${chart.tenGods.hour.branch}` : ""} — 외우지 마. “깊게 남고, 참다가 지친다”만 기억해.

연애 함정: ‘끝까지 이해해주면 돌아올 것’ 믿음이 ${p}처럼 지쳐 떠난 상대에게 **압박**으로 읽힐 수 있다.

${voice.traitClose(p)}

이별 메모(${breakupLine(form)})와도 맞닿는 결이다.`,
  };
}

function lovePatternSection(form: SajuBirthForm, voice: VoicePack): SajuReportSection {
  const p = partner(form);
  return {
    id: "pattern",
    title: "원국 연애 패턴 · 용신 감각",
    body: `네 원국에서 보이는 연애 패턴을, ${p} 이전에도 비슷한 결로 겪었을 법한 **스크립트**로 읽는다.

1. **진입**: 상대의 빈자리·무심함·말수의 적음이 오히려 끌림이 된다.
2. **몰입**: 네가 감정·일정·배려를 많이 쓴다. “챙겨주고 이해해주는 나”가 켜진다.
3. **과열**: 상대의 페이스가 안 맞으면, 확인·해석·장문이 늘어난다.
4. **차단**: 상대가 지쳐 거리를 둔다. 너는 “버림”으로 읽고, 그는 “숨”으로 읽는다.
5. **잔향**: 헤어진 뒤에도 밤에 감정이 다시 차오른다. 지금 ${monthsLabel(form)}은 **4→5단계**에 걸쳐 있을 가능성이 크다.

재회를 원한다면, 같은 스크립트의 3단계를 **다른 호흡**으로 다시 써야 한다. 같은 방식으로 들어가면, 또 숨이 막힌다.

### 다음에 네가 쓸 호흡 (쉬운 말)
- **중심**: 감정·관계를 안정적으로 붙잡는 차분한 틀
- **도움**: 표현을 부드럽게, 페이스를 조절
- **독**: 과한 확인·추궁·자존 싸움

${voice.patternClose(p)}
${voice.strategyNudge}

패턴을 바꿀 때 기억할 한 줄: **설득보다 안정**. 같은 스크립트의 3단계(과열)를 반복하면 이야기는 같은 결말로 복제돼. 헤어진 지 ${monthsLabel(form)} · “${breakupLine(form)}” 메모를 기준으로, 지금은 감정을 더 쓰는 구간이 아니라 기력을 회수하는 구간으로 읽는 편이 맞다.

「또 같은 장면이 반복되면 어떡하지.」—그 두려움이 정상이야. 그래서 다음 장부터, 장면을 바꾸는 선택을 구체로 줄게.`,
  };
}

function bondSection(form: SajuBirthForm, voice: VoicePack): SajuReportSection {
  const p = partner(form);
  const py = safe(form.partnerBirthYear, "");
  const ageBit = py ? `${p}(${py}년생)와 ` : `${p}와 `;
  return {
    id: "bond",
    title: "두 사람 사이 인연의 결 (합·충·형·해)",
    body: `${ageBit}너는 나이 차이보다 **호흡 차이**가 핵심이다.
*(근거 한 줄)* 전통에선 글자 관계를 붙음·부딪침·꼬임·불편으로 읽는다.
쉽게 말하면—붙음은 온기, 부딪침은 숨 막힘, 꼬임은 상처, 불편은 서운함의 결이야.
“정은 있는데 마음이 상하기 쉬운” 인연—좋아하면서도 자주 서운해지는 느낌, 그거.

### 끌림의 합
너는 감정·‘우리’의 온도를 보고, ${p}는 현실·페이스·‘내가 괜찮은가’를 본다. 처음엔 **보완의 합**으로 작동한다. 재성(끌림)과 관성(관계의 틀)이 맞물리면 “이 사람이면 되겠다”는 감각이 빨리 온다.

### 충돌의 충
관계가 길어지면 너는 “왜 말이 없어?”, 상대는 “왜 계속 확인하려 해?”가 된다. **온기가 과하면 숨이 막힌다.**
${monthsLabel(form)} 전 이별이 “큰 사건”보다 “${breakupLine(form)}”였다면, 충의 누적에 가깝다.

### 형·해의 미세한 상처
형이 있으면 말꼬리·자존심·“너는 왜 늘 그래”가 반복된다. 해가 있으면 “믿었는데 서운하다”가 쌓인다. 거창한 배신보다 **작은 해(불편)의 반복**이 형을 불러 지치게 만든 흐름으로 읽는 편이 맞다.

### 원진 느낌
정은 남는데 마음이 상하기 쉬운 결—헤어진 뒤에도 “미운데 그리운” 상태.
이 인연은 강제 재회 타입이라기보다, **서로가 ‘다시 배울 준비’가 될 때 붙는 인연**에 가깝다.

${voice.bondAside(p)}`,
  };
}

function sipseongSection(form: SajuBirthForm, voice: VoicePack, chart: SajuChart): SajuReportSection {
  const p = partner(form);
  return {
    id: "sipseong",
    title: "십성·합충으로 본 역학",
    body: `원국 십성(일간 **${dayMasterLabel(chart.dayMaster, chart.dayMasterElement)}** 기준):
년 ${chart.tenGods.year.stem}/${chart.tenGods.year.branch} · 월 ${chart.tenGods.month.stem}/${chart.tenGods.month.branch} · 일 일간/${chart.tenGods.day.branch}${chart.tenGods.hour ? ` · 시 ${chart.tenGods.hour.stem}/${chart.tenGods.hour.branch}` : " · 시 미상"}.

### 관성(官星) — “우리라는 틀”
${p}와의 관계에서 너는 ‘우리’의 틀을 빨리 원하고, 상대는 틀이 무거우면 숨으려 했을 가능성이 있다.

### 재성(財星) — 끌림과 주고받음
지금은 재성을 **많이 쓰기**보다 **적게, 깨끗하게**. 안부 한 줄이 장문보다 효율이 높다.

### 인성(印星) — 이해와 완충
인성을 ${p}에게만 쓰지 말고, **네 일간(나)을 회복하는 쪽**으로 돌려라.

### 공망
네 공망 지지: **${chart.voidBranches.join("·") || "없음"}**.

${voice.sipseongAside(p)}
다음 판은 **인성으로 너부터 회복 → 식신으로 가볍게 접촉 → 관성은 상대가 스스로 느끼게** 두는 순서다.`,
  };
}

function breakupReasonSection(form: SajuBirthForm, voice: VoicePack): SajuReportSection {
  const p = partner(form);
  return {
    id: "breakup-reason",
    title: "헤어진 진짜 이유 — 표면 vs 속마음",
    body: `### 표면
- 대화가 줄고, 만나면 편하기보다 피곤했다.
- “잠깐 쉬자”, “이쯤에서 정리하자” 같은 말이 나왔을 가능성.
- 큰 배신보다 **소모**가 원인으로 포장됨.
- 네가 남긴 메모: **${breakupLine(form)}** · 헤어진 지 ${monthsLabel(form)}.

### 속마음 (흐름 해석)
- **네 쪽**: 놓치기 싫은데 매달리면 초라해질까 봐 — 자존심(비견)과 애착(재성)이 동시에 작동.
- **${p} 쪽**: “네가 싫어서”라기보다 “네 기대 속도를 못 따라가겠다”는 **자기보호**. 지친 이별의 핵심은 미움이 아니라 **역량 고갈**인 경우가 많다. 관성 부담이 커진 상태.
- **공통**: 둘 다 ‘사랑’이 아니라 ‘지침’을 말했다. 그래서 감정의 잔향(원진 느낌)이 남는다.

${voice.breakupAside(p)}
임시장치가 영구가 되려면 그 사이에 **새로운 태도(용신 감각의 안정)**가 들어가야 한다.

고민의 핵심(${concernLine(form)})에 대한 첫 답: “가능/불가능”보다 **어떤 호흡으로 다시 쓸 수 있는가**가 질문의 진짜 핵이다.`,
  };
}

function remainingHeartSection(form: SajuBirthForm, voice: VoicePack, chart: SajuChart): SajuReportSection {
  const p = partner(form);
  const pc = chart.partnerChart;
  const partnerSense =
    pc?.detailLevel === "full" && pc.dayMaster && pc.dayMasterElement
      ? `상대 원국 ${pc.summaryLine} · 일간 **${dayMasterLabel(pc.dayMaster, pc.dayMasterElement)}**을 겹치면,`
      : chart.partnerYearPillar
        ? `상대 연주 **${chart.partnerYearPillar.korean}** 결을 겹치면,`
        : "";
  return {
    id: "remaining",
    title: "상대 속마음에 내가 남아있는지",
    body: `${voice.remainingAside(p)}
헤어진 지 ${monthsLabel(form)}, 메모상 “${breakupLine(form)}”라면—삭제의 공망보다 **손대기 무서운 공망**에 가깝다.
네 공망: **${chart.voidBranches.join("·") || "없음"}**.
${partnerSense ? `${partnerSense} ‘관심은 있는데 손이 안 가는’ 구간으로 읽히는 편이 자연스럽다.` : ""}

### 남아 있다는 쪽의 신호
- SNS·대화창을 가끔 열지만 먼저 쓰지는 못함
- 공통 지인 앞에서 네 이름을 피하거나 너무 무덤덤하게 말함
- 새 만남을 급하게 깊게 못 들어감

### 거리감이 유지되는 이유
- 다시 연락하는 순간 **또 그 피로로 돌아갈까 봐** 무서움
- 네가 장문으로 감정을 쏟을까 봐 문지방을 못 넘음

정리: **남아 있다 ≠ 지금 받아줄 준비가 됐다.** 보관함에 가까울 가능성이 크다.

「그럼… 기다리면 열려?」
기다림만으로는 안 열려. **네가 안전해 보이는 시간**이 쌓일 때 잠금이 느슨해질 여지가 있어. 그 시간은 검색이 아니라 루틴으로 채워.

다음에 네가 할 선택: 보관함을 두드리지 말고, 두드려도 안 무서울 너로 서 있기.`,
  };
}

function timelineSection(form: SajuBirthForm, voice: VoicePack, chart: SajuChart): SajuReportSection {
  const p = partner(form);
  const m = monthsShort(form);
  const luck = chart.luckPillars
    ? `대운 ${chart.luckPillars.forward ? "순행" : "역행"} · 시작 ${chart.luckPillars.startAge}세 · ` +
      chart.luckPillars.pillars.slice(0, 3).map((x) => `${x.age}세 ${x.korean}`).join(" → ")
    : "대운(성별 남/여 입력 시 표시)";
  return {
    id: "timeline",
    title: "대운·세운 타임라인 · 1 · 3 · 6개월",
    body: `- **세운(올해 연주):** ${chart.currentYearPillar.korean}
- **${luck}**
- 원국: ${chart.summaryLine}

※ 아래는 확정 예언이 아니라 원국·이별 패턴·세운을 겹친 **가능성의 지도**다. 헤어진 지 ${monthsLabel(form)}.

### ◇ 1개월 (관망·정돈)
적극 재접근 비추천. 인성을 너에게.

### ◇ 3개월 전후 (접촉 창)
가벼운 안부인사형 접촉↑. 조건: 매달림 없는 상태.

### ◇ 6개월 (갈림길)
재개 vs 정리. 상관→식신.

### 세운으로 본 지나온 ${m}개월 / 앞으로의 석 달
- **다음 30일**: 관망. 기신(추궁·장문) 차단
- **30~90일**: 안부형 저자극 접촉 창

${voice.timelineAside}
※ 네 선택이 지도를 바꾼다.`,
  };
}

function contactGuideSection(form: SajuBirthForm, voice: VoicePack): SajuReportSection {
  const p = partner(form);
  return {
    id: "contact",
    title: "연락 멘트 / 금지 문구",
    body: `**지금 당장(이 주~이번 달)의 장문·감정 폭발형 연락은 비추천.**
꼭 보내야 한다면, “확인받으려는 연락”인지 “흘려보내려는 연락”인지 구분해. 확인용이면 보내지 마.
사주 감각으로—지금은 상관·편관이 나오기 쉽고, 식신·정재가 나오기 어려운 타이밍이다.

고민(${concernLine(form)})에 대해: **타이밍은 1개월 이후의 저자극이 더 안전**한 편이다.

### 해도 되는 말 (식신의 말)
- “문득 생각나서. 잘 지내?”
- “갑자기 그날 노래 나와서. 별일은 아니고.”
- “답장 없어도 괜찮아. 그냥 안부.”
- (${p} 이름 넣어) “요즘 바쁠 것 같아서, 괜히 안부인사.”

짧고, 압박 없고, 숙제 안 주기.

### 금지 문구
- “그때 너 때문에 내가…”, “다른 사람 생겼어?”, “내가 아직도 마음에 있어?”
- “다시 시작해줘”, 강요형 “한 번만 만나자”
- 자정 넘은 술김·장문, 읽씹 추궁, 연속 메시지, 통화 폭탄
- “${breakupLine(form)}”을 상대 탓으로 재심문하는 문장

${voice.contactAside(p)}
${voice.strategyNudge}

### 장면 연습 — 전송 전 30초
1) 문장을 읽어본다. 숙제가 하나라도 있으면 지운다.
2) “답 없어도 괜찮은가?”에 NO면 보내지 않는다.
3) 보내고 나서 폰을 두고, 계획된 일정을 한다.

이게 연락 가이드의 척추야. 멘트보다 **네 상태**.`,
  };
}

function strategySection(form: SajuBirthForm, voice: VoicePack): SajuReportSection {
  const p = partner(form);
  return {
    id: "strategy",
    title: "재접근 전략 3단계",
    body: `### 1단계 — 네 기운부터 회수 (지금~1개월)
${p}를 설득하지 마. 일상에서 그를 ‘필수 변수’에서 빼.
운동·일·외모·친구 약속으로 “나 없이도 굴러간다”는 신호를 네 몸부터 만들어.
너의 木 기운이 상대에게만 기대지 않고 **스스로 뿌리**를 내리는 작업이다.
→ **인성을 나에게, 기신(추궁)을 차단.** ${voice.strategyNudge}

### 2단계 — 저자극 접촉 (대략 3개월 창)
한 줄 안부 → 반응 보면 멈춤.
답이 따뜻하면 2~3일 간격 가벼운 대화. 건조하거나 없으면 **최소 2주 침묵**.
목표: “이 사람은 예전처럼 무겁지 않다”는 **체감**.
→ **식신·정재로 재성을 얇게 쓰기. 관성은 아직 꺼내지 않기.**

### 3단계 — 만남이 열리면 과거 재판 금지 (3~6개월)
첫 1~2회는 추억 재판 금지. “왜 헤어졌을까 / ${breakupLine(form)}” 재심문은 관계가 다시 따뜻해진 **이후**의 대화다.
재회의 본질은 로맨스 복원이 아니라 **호흡 재계약**.
→ **정관의 ‘편한 틀’이 보이게. 편관의 압박은 숨기기.**

${voice.strategyClose}

「이 단계… 내가 지킬 수 있을까.」
지킬 수 있어. 한 번에 완벽이 아니라, **오늘 하루의 선택**만. 그게 전략의 진짜 호흡이야.`,
  };
}

function pitfallsSection(form: SajuBirthForm, voice: VoicePack): SajuReportSection {
  const p = partner(form);
  return {
    id: "pitfalls",
    title: "주의할 함정",
    body: `${voice.pitfallsLead}

함정은 목록이 아니라 **밤에 발이 가는 장면**이야.

1. **해석 중독**: ${p}의 모든 행동을 “좋아한다/아니다”로만 읽기. 침묵을 끝으로 단정하지 마.
2. **자존감 거래**: 외모 관리는 OK, 복수심 전시는 NO.
3. **공동 지인 스파이**: 소문은 왜곡되고 너는 더 흔들린다.
4. **술·새벽·장문**: 밤에 감정이 커지는 타입일수록 아침에 다시 읽어라.
5. **빠른 대체 연애로 자극**: 질투는 단기 반응만 주고 신뢰는 무너뜨린다.
6. **‘${breakupLine(form)}’ 사실 부정**: 안 아팠던 척하면 같은 과열 패턴으로 돌아간다.
7. **착각**: “더 잘해주면 된다”가 아니다. 지금은 **덜 매달리는 안정**이 중심이다.
8. **고민(${concernLine(form)})을 매일 검색으로 해결하려 하기**: 검색은 불안을 키운다. 리포트는 지도일 뿐, 발은 네 것이다.

「함정인 줄 알면서도 손이 가.」—그 손이 가는 순간이 이야기의 위기야. 위기에서 선택을 바꾸면, 결말이 바뀌어.

${voice.strategyNudge}`,
  };
}

function closingSection(form: SajuBirthForm, voice: VoicePack): SajuReportSection {
  const p = partner(form);
  return {
    id: "closing",
    title: "캐릭터 마지막 한마디",
    body: `${voice.closingHook(p, monthsLabel(form))}

긴 이야기 끝에서, 한 줄만 더. 재회는 보너스고—**네가 무너지지 않는 하루**가 본편이야.

${voice.closingBody}

다음에 네가 할 선택: 오늘 밤, 확인 대신 정돈. 그게 다음 장의 첫 문장이야.

${voice.signOff}`,
  };
}

function noticeSection(characterName: string, productTitle: string): SajuReportSection {
  return {
    id: "notice",
    title: "안내",
    body: disclaimerBlock(characterName, productTitle),
  };
}

function partnerHeartExtra(form: SajuBirthForm, voice: VoicePack, chart: SajuChart): SajuReportSection[] {
  const p = partner(form);
  const pc = chart.partnerChart;
  const pairBit =
    pc?.detailLevel === "full" && pc.dayMaster
      ? `네 일간 **${dayMasterLabel(chart.dayMaster, chart.dayMasterElement)}** ↔ ${p} 일간 **${dayMasterLabel(pc.dayMaster, pc.dayMasterElement ?? "")}** 페어를 기준으로 온도를 낮게 잡아.`
      : chart.partnerYearPillar
        ? `${p} 연주 **${chart.partnerYearPillar.korean}** 결을 존중하되, 온도는 낮게.`
        : "";
  return [
    {
      id: "heart-temp",
      title: "상대에게 다가갈 온도",
      body: `밤공기 온도부터 짚을게.

${voice.heartTempLead(p)}

장면으로 말할게. 예전에 너희가 7~8도로 타오르던 대화창—그 불을 지금 다시 켜면 ${p}는 온기가 아니라 **청구서**를 읽어. 느낌이 왔어. 지금은 **2~3도의 옅은 온기**만. 손끝으로 스치듯, 숙제 없이.

${pairBit}

「답장이 없으면… 나는 끝인 건가.」
그 속마음이 올라와도, 전송은 하지 마. 답장이 없어도 네가 무너지지 않는 모습이, 아이러니하게 ${p}의 문을 덜 무섭게 만들어. 언니가 본 잔향은 그래—안전감이 그리움을 부르지, 추궁이 부르지 않아.

헤어진 지 ${monthsLabel(form)} · “${breakupLine(form)}” 메모를 기준으로 하면, 지금 과한 온기는 독이야.

### 다음에 네가 할 선택
- 하루 1번, ${p} 검색 대신 네 몸·일·친구에 10분 쓰기
- 연락은 ‘확인’이 아니라 ‘흘림’일 때만
- 공통 지인에게 캐묻기 금지
- 고민(${concernLine(form)})을 메모장에만 적고, 전송 버튼은 닫기
- 자정에 장문이 써지면: 저장 → 화면 끄기 → “내일의 내가 보낸다” (대개 안 보내)

*(근거 한 줄)* 온도는 낮을수록, 문이 얇아질 여지가 커. 느낌이 왔지?

${voice.name}: ${voice.strategyNudge}

…그리고 온도를 낮춘 다음에도, 함정은 남아 있어. 다음 장에서 짚을게.`,
    },
  ];
}


function breakupDecisionExtra(form: SajuBirthForm, voice: VoicePack): SajuReportSection[] {
  const p = partner(form);
  return [
    {
      id: "keep-or-leave",
      title: "남겨둘 이유 / 놓을 이유",
      body: `팩트 테이블을 열어볼게. 감성 에세이 말고.

장면 하나: 너는 ${p} 대화창 앞에서 “붙여야 하나, 놓아야 하나”를 백 번 굴린다. 차유리는 그 굴림을 로맨스로 포장하지 않아. **자존이 버티는 구조**로 읽어.

### 남겨둘 이유가 되는 조건
- ${p}와의 관계가 **서로를 성장**시켰던 구간이 분명하다.
- 이별 원인이 사건·배신보다 **페이스 조율 실패(${breakupLine(form)})**에 가깝다.
- 네가 “그 사람이 아니면 안 된다”가 아니라 “다시 배우면 다를 수 있다”고 말할 수 있다.
- 남겨두는 이유가 ‘외로움 회피’가 아니라 ‘존중 가능한 관계’다.

### 놓는 편이 나은 신호
- 함께 있을 때 자존이 반복적으로 깎인다.
- 연락·만남이 회복이 아니라 **확인 강요**로만 흐른다.
- 네가 이미 몸의 피로·수면·일까지 무너지고 있다.
- ${monthsLabel(form)}이 지나도 네 일상 설계가 ${p} 검색으로만 채워진다.
- “조금만 더 잘해주면”이 습관처럼 반복된다. (스포일러: 그 길로는 안 끝난다.)

### 결정 체크리스트 — 다음에 네가 할 선택
1. 다시 만나면 **예전과 다른 규칙**을 말할 수 있나?
2. 답이 없어도 2주는 버틸 수 있나?
3. ${p} 없는 한 달의 나를 상상할 수 있나?
4. 고민(${concernLine(form)})의 답이 “상대 변화”에만 달려 있진 않나?
5. 남겨둔 뒤에도 네가 **퍼주는 사람**으로만 남지 않을 자신이 있나?

「그래도… 정이 남았는데.」
정 남는 거 알아. 근데 정과 자존이 싸우면, 차유리는 자존 편이야. 너는 더 아껴도 돼.

${voice.keepLeaveClose}

…결정이 뭐가 됐든, 다음 장—자존 루틴이 없으면 같은 밤이 복제돼.`,
    },
    {
      id: "self-routine",
      title: "자존 회복 루틴",
      body: `이별 결정이든 재시도든, 먼저 필요한 건 **네 기력**이야. 팩트.

장면: 자정, SNS, ${p} 검색. 그 루프를 ‘미션 실패’로 자책하지 마. **대체 루틴**을 심어.

- 수면·식사·가벼운 운동을 ‘미션’이 아니라 ‘최소 생존’으로
- SNS 야간 차단 1~2시간
- “내가 초라해 보일까” 문장을 아침마다 한 줄로 반박해 쓰기
- ${p} 관련 폴더/앨범은 당장 삭제보다 **열람 횟수 제한**부터
- 주 1회, 너만의 약속(사람·취미) — 복수 전시 말고, 네가 살아 있음의 증거

네가 흔들릴수록 ${p}의 침묵은 더 크게 들려. 루틴이 서면 침묵의 볼륨이 줄어. dry하게 말할게—**자존은 감정이 아니라 스케줄이야.**

${voice.selfRoutineClose}
${voice.strategyNudge}

다음에 네가 할 선택: 오늘 밤, 검색 대신 수면. 그게 웹소설의 다음 페이지야.`,
    },
  ];
}


function strategyProductExtra(form: SajuBirthForm, voice: VoicePack): SajuReportSection[] {
  const p = partner(form);
  return [
    {
      id: "dont-now",
      title: "지금 하면 안 되는 것",
      body: `헐, 이 장부터는 빨간불이야.

${voice.dontNowLead} 헤어진 지 ${monthsLabel(form)}, “${breakupLine(form)}” 상태라면 더더욱. 일단 네 마음부터—그 마음 이상한 거 아니야. 다만 **행동만** 조심하자.

### 금지에 가까운 행동 (지금 페이지에서 넘기지 마)
- 자정 장문 / 술김 통화
- “우리 다시” 직구
- 읽씹 추궁, 연속 카톡
- 지인 통한 압력
- 질투 유발용 급작 새 만남 전시
- 고민(${concernLine(form)})을 ${p}에게 그대로 질문으로 던지기

「조금만 보내면… 마음이 편해질 것 같아.」
알아. 근데 그 ‘조금’이 ${p}에겐 파도로 읽혀. 한보라가 말릴게—위험한 집착은 응원이 아니야.

### 대신 해도 되는 것 (응원 가능한 다음 선택)
- 생활 리듬 회복
- 외모·공간 정돈 (복수심 없이)
- ${p}를 떠올릴 때 ‘보낼 문장’을 메모장에만 적고 닫기
- 친구에게 “오늘 내가 참은 추궁” 자랑하기 (진짜로)

같이 가자. 금지 목록을 지키면, 다음 장—타임라인·연락 가이드가 의미가 생겨.

${voice.name}: ${voice.strategyNudge}`,
    },
  ];
}


function oneLinerFor(productId: SajuProductId, form: SajuBirthForm): string {
  const p = partner(form);
  switch (productId) {
    case "reunion-luck":
      return `그 사람, 아직 나를 생각할까? **완전히 끝난 인연은 아니야.** 다만 **지금 당장 들이대면** 줄이 더 엉키고, **1~3개월 사이 거리 있는 재접근**이 붙을 여지가 더 커.`;
    case "partner-heart":
      return `느낌이 왔어—${p} 마음에서 네가 **삭제됐다기보다 보관함**에 있을 가능성이 커. 다만 ‘남아 있음’과 ‘다시 열 준비’는 다른 층이야.`;
    case "breakup-decision":
      return `지금은 “무조건 붙여”도 “무조건 버려”도 아냐. **자존이 버티는 구조**부터 세운 다음, 남겨둘지 놓을지 결정해.`;
    case "reunion-strategy":
      return `재회의 핵심은 고백이 아니라 **저자극·정돈·타이밍**이야. 설득보다 안정이 먼저—같이 가자.`;
  }
}

function bulletsFor(productId: SajuProductId, form: SajuBirthForm): string[] {
  const p = partner(form);
  switch (productId) {
    case "reunion-luck":
      return [
        "재회 **절대 불가** 쪽은 아니야.",
        "다만 **지금 이 순간 고백·추궁·장문**은 독이 될 가능성이 높아.",
        `${p} 마음속에 네가 **완전히 지워진 상태**로 보이지는 않아.`,
        `**앞으로 1개월**: 관망·정돈. **3개월 전후**: 접촉 창. **6개월**: 재개 vs 정리 갈림. (헤어진 지 ${monthsLabel(form)} 기준)`,
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
  voice: VoicePack,
  productTitle: string,
  chart: SajuChart,
): SajuReportSection[] {
  if (productId === "reunion-luck") {
    return buildReunionNarrativeSections(
      form,
      voice,
      chart,
      productTitle,
      oneLinerFor(productId, form),
      bulletsFor(productId, form),
    );
  }

  const base: SajuReportSection[] = [
    commonCover(form, voice, productTitle, oneLinerFor(productId, form), bulletsFor(productId, form)),
    questionsSection(form, voice),
    loveTraitSection(form, voice, chart),
    lovePatternSection(form, voice),
  ];

  if (productId === "partner-heart") {
    return [
      ...base,
      bondSection(form, voice),
      breakupReasonSection(form, voice),
      remainingHeartSection(form, voice, chart),
      ...partnerHeartExtra(form, voice, chart),
      contactGuideSection(form, voice),
      pitfallsSection(form, voice),
      closingSection(form, voice),
      noticeSection(voice.name, productTitle),
    ];
  }

  if (productId === "breakup-decision") {
    return [
      ...base,
      breakupReasonSection(form, voice),
      ...breakupDecisionExtra(form, voice),
      pitfallsSection(form, voice),
      closingSection(form, voice),
      noticeSection(voice.name, productTitle),
    ];
  }

  // reunion-strategy
  return [
    ...base,
    ...strategyProductExtra(form, voice),
    timelineSection(form, voice, chart),
    contactGuideSection(form, voice),
    strategySection(form, voice),
    pitfallsSection(form, voice),
    closingSection(form, voice),
    noticeSection(voice.name, productTitle),
  ];
}

export function buildTemplateReport(
  productId: SajuProductId,
  form: SajuBirthForm,
  selectedCharacterId?: SajuCharacterId | string | null,
): SajuReportPayload {
  const product = getSajuProduct(productId);
  if (!product) {
    throw new Error("Unknown product");
  }
  const resolvedId = product.counselorIds.includes(selectedCharacterId as SajuCharacterId)
    ? (selectedCharacterId as SajuCharacterId)
    : product.characterId;
  const character = getSajuCharacter(resolvedId);
  const characterName = character?.name ?? product.characterName;
  const voice = voicePack(resolvedId, characterName);
  const chart = computeChart(form);
  const built = sectionsForProduct(productId, form, voice, product.title, chart);
  const canonical = getCanonicalSections(productId);
  if (built.length !== canonical.length) {
    throw new Error(
      `Section count mismatch for ${productId}: built=${built.length} canonical=${canonical.length}`,
    );
  }
  const sections = built.map((s, i) => ({
    ...s,
    title: canonical[i] ?? s.title,
  }));
  const previewSections = sections.slice(0, 2).map((s, i) => ({
    ...s,
    blurred: i === 1,
  }));

  return {
    productId,
    characterId: resolvedId,
    characterName,
    title: `${product.title} 리포트｜${characterName}`,
    oneLiner: oneLinerFor(productId, form),
    previewSections,
    sections,
    source: "template",
    generatedAt: new Date().toISOString(),
    form,
    chart,
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
    partnerBirthMonth: "",
    partnerBirthDay: "",
    partnerBirthTime: "",
    partnerGender: "",
    monthsApart: "3",
    breakupNote: "",
    concern: "",
  };
}
