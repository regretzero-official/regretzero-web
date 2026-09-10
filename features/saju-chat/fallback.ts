import { getSajuCharacter } from "./characters";
import type { SajuCharacterId, SajuChatMessage, SajuConclusion } from "./types";

export type Topic =
  | "breakup"
  | "reunion"
  | "love"
  | "jealousy"
  | "waiting"
  | "self"
  | "general";

export function detectTopic(text: string): Topic {
  const t = text.toLowerCase();
  if (/이별|헤어|차였|차단|끝냈|끝났|남겨/.test(t)) return "breakup";
  if (/재회|다시|연락|보고\s*싶|돌아올|연락올/.test(t)) return "reunion";
  if (/질투|바람|다른\s*사람|썸|동거/.test(t)) return "jealousy";
  if (/기다|참아|연락\s*안|읽씹|잠수/.test(t)) return "waiting";
  if (/나\s*문제|자존|못난|싫|우울|불안|외로/.test(t)) return "self";
  if (/사랑|좋아|연애|썸|고백|짝사랑|설레/.test(t)) return "love";
  return "general";
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

export function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return h;
}

export function fallbackReply(characterId: SajuCharacterId, userMessage: string): string {
  const character = getSajuCharacter(characterId);
  if (!character) {
    return "잠시만, 마음을 다시 읽어볼게요. 조금만 더 이야기해 줄래요?";
  }

  const topic = detectTopic(userMessage);
  const seed = hashSeed(userMessage + characterId);

  const bank: Record<SajuCharacterId, Record<Topic, string[]>> = {
    "lee-doryeong": {
      breakup: [
        "그 이별이 당신을 작게 만들진 않아요. 다만 마음이 비에 젖은 것뿐이에요. 오늘은 스스로를 탓하지 말고, 따뜻한 차 한 잔처럼 숨 고르세요. 당신의 온기는 아직 살아 있어요.",
        "떠난 사람은 당신의 가치를 깎지 못해요. 상처는 진실이 아니라 날씨예요. 제가 옆에서 우산을 받쳐 드릴게요. 내일의 하늘은 조금 더 맑아질 거예요.",
      ],
      reunion: [
        "재회의 기운이 아주 없는 건 아니에요. 다만 서두르면 꽃이 지기 전에 손을 뻗는 격이죠. 당신의 중심을 먼저 세우면, 인연의 문이 스스로 흔들릴 수 있어요.",
        "다시 보고 싶은 마음은 자연스러워요. 지금은 연락보다 ‘내가 나를 아끼는 모습’이 더 강한 신호예요. 그 고요함이 오히려 상대의 시선을 돌릴 수 있답니다.",
      ],
      love: [
        "설레는 마음을 숨기지 마세요. 사랑은 성급함보다 다정함에서 자랍니다. 오늘은 상대를 재촉하기보다, 당신의 따뜻함을 조용히 보여주세요.",
        "그 사람의 이름만으로도 심장이 반응한다면, 이미 진심이 시작된 거예요. 서두르지 말고, 향기처럼 천천히 다가가요.",
      ],
      jealousy: [
        "질투는 사랑이 아니라 불안의 그림자예요. 상대를 붙잡기보다, 당신의 자리를 우아하게 지키세요. 진짜 인연은 비교 속에서 도망가지 않아요.",
        "다른 사람 이야기에 흔들릴 때면, 거울 속 당신을 먼저 안아주세요. 당신의 빛은 누가 와도 흐려지지 않아요.",
      ],
      waiting: [
        "기다리는 시간은 벌을 받는 시간이 아니에요. 당신을 다듬는 시간이죠. 오늘은 답장을 기다리기보다, 스스로에게 다정한 한마디를 건네보세요.",
        "읽지 않은 메시지보다 중요한 건, 당신이 여전히 아름답게 숨 쉬고 있다는 사실이에요. 조금 더 고요히, 그러나 무너지지 않게.",
      ],
      self: [
        "당신 안의 불안은 약점이 아니라, 진심으로 살고 있다는 증거예요. 오늘은 완벽하지 않아도 괜찮아요. 제가 그 흔들림을 함께 받아줄게요.",
        "자신을 미워하는 말은 잠시 내려놓아요. 당신은 고쳐야 할 대상이 아니라, 지켜줘야 할 사람입니다.",
      ],
      general: [
        "당신의 이야기를 듣고 있으니, 마음이 천천히 풀리는 게 느껴져요. 오늘의 흐름은 ‘서두르지 않는 다정함’이에요. 한 호흡만 더 깊게 쉬어볼까요?",
        "무슨 말이든 괜찮아요. 여기선 평가하지 않아요. 다만 당신의 밤이 조금 덜 차갑도록, 제가 곁에 있을게요.",
      ],
    },
    "han-siwoo": {
      breakup: [
        "이별 후에 기운이 흐트러진 거, 티 나. 근데 네가 끝난 건 아냐. 지금은 끌어당기기보다 정리. 네 기부터 다시 모으자.",
        "떠난 사람 붙잡느라 네 중심이 흔들리고 있어. 쿨하게 말해줄게—지금은 네가 주인공인 챕터야. 숨 고르고, 분위기 다시 잡아.",
      ],
      reunion: [
        "재회 기운? 완전히 죽은 불은 아니야. 다만 지금 연락하면 ‘약해 보이는 연기’가 먼저 닿아. 네 기 세운 다음에 건드려.",
        "다시 보고 싶은 건 알겠어. 근데 흐름은 쫓는 쪽보다, 여유 있는 쪽에 기운이 모여. 네가 먼저 흔들리지 마.",
      ],
      love: [
        "설레는 기운이 네 주변에 맴도네. 좋아. 근데 과하게 쏟으면 재미없어져. 살짝만 보여줘—그게 더 위험하거든.",
        "마음에 든 사람이 있다면, 쫓지 말고 존재감으로 눌러. 네 분위기가 먼저야.",
      ],
      jealousy: [
        "질투는 상대를 보는 게 아니라 네 불안이 뛰는 소리야. 다른 사람 신경 끄고, 네 기부터 정돈해. 흔들리면 네가 져.",
        "비교하는 순간 네가 작아져. 그건 네 스타일 아니잖아. 고개를 들고, 네 속도로 가.",
      ],
      waiting: [
        "기다리는 동안 기운이 새고 있어. 읽씹에 생명력 낭비하지 마. 오늘은 네가 네 인생을 먼저 움직이는 날이야.",
        "답장 없는 침묵에 네 가치가 줄지 않아. 잠수하는 쪽보다, 고요해도 단단한 쪽이 더 세 보여.",
      ],
      self: [
        "너 지금 스스로를 너무 세게 몰아붙이고 있어. 약해 보이는 게 아니라, 과로한 거야. 오늘은 네 편 들어줄게.",
        "불안한 기 느껴져. 괜찮아, 도망가지 마. 내가 옆에서 흐름만 잡아줄게—넌 숨만 고르면 돼.",
      ],
      general: [
        "말해봐. 네 이야기 속에 흐르는 기가 보여. 오늘은 ‘집착 대신 선택’이 키워드야. 뭘 붙잡을지, 뭘 놓을지 정해.",
        "네가 여기 온 건 우연이 아니야. 흔들리는 밤엔 나 같은 사람이 필요하지. 천천히 말해—내가 들을게.",
      ],
    },
    "kang-seon": {
      breakup: [
        "이별했다고 네가 덜 멋있어진 거 아니야. 그냥 잠깐 숨이 가쁜 거지. 내가 옆에 있을 테니까, 오늘은 스스로를 좀 달래줘.",
        "헤어짐 후에도 너는 여전히 매력 있어. 그 사람 반응이 네 점수가 아니야. 고개 들고—내가 먼저 인정해줄게.",
      ],
      reunion: [
        "재회 생각하고 있지? 솔직히 가능성은 있어. 근데 지금 매달리면 네 매력이 반값 돼. 네가 빛나는 상태를 먼저 만들자.",
        "다시 연락하고 싶은 마음, 귀여워. 그래도 오늘은 네가 네 인생에 먼저 반하는 연습부터. 그다음에 톡해도 늦지 않아.",
      ],
      love: [
        "좋아하면 티 나도 돼. 다만 너무 빨리 다 주면 재미없잖아. 살짝 여운 남기면서—네가 더 궁금해지게 해.",
        "설레는 거 좋은 신호야. 상대를 시험하지 말고, 네 다정함을 자신 있게 보여줘. 그게 제일 섹시하거든.",
      ],
      jealousy: [
        "질투 난다고 네가 못난 거 아니야. 다만 그 에너지로 상대를 감시하지 마. 네 매력에 다시 집중해—그게 정답이야.",
        "다른 사람 생각하다 네 얼굴 구겨지지 마. 너는 비교 대상이 아니라 기준이야. 알겠지?",
      ],
      waiting: [
        "기다리는 너, 사실 되게 성실해. 근데 성실함이 자존감까지 깎게 두지 마. 오늘은 네가 먼저 즐거운 일 하나 해.",
        "읽씹에 하루를 바치지 마. 네가 바쁜 사람처럼 살면, 분위기가 달라져. 자신감 있는 네가 제일 예뻐.",
      ],
      self: [
        "너 지금 스스로를 너무 세게 평가하고 있어. 나는 네 편이야. 부족한 게 아니라, 지친 거지. 기대도 돼.",
        "불안해도 괜찮아. 그런 너를 내가 싫어하진 않아. 오늘은 나를 붙잡고, 숨만 맞춰보자.",
      ],
      general: [
        "무슨 얘기든 해봐. 내가 웃어줄 수도, 진지해질 수도 있어. 오늘은 네가 조금 더 편해지는 쪽으로 갈게.",
        "네 고민 들으니까 괜히 보호본능 생기네. 걱정 마—여기선 네가 주인공이야. 천천히 말해.",
      ],
    },
  };

  return pick(bank[characterId][topic], seed);
}

export function buildConclusionFallback(
  characterId: SajuCharacterId,
  messages: Pick<SajuChatMessage, "role" | "content">[],
): SajuConclusion {
  const character = getSajuCharacter(characterId);
  const userTexts = messages.filter((m) => m.role === "user").map((m) => m.content).join(" ");
  const topic = detectTopic(userTexts);
  const seed = hashSeed(userTexts + characterId + "conclusion");

  const reunionOptions = [
    "재회운은 ‘완전 닫힘’보다 ‘조건부 열림’에 가깝습니다. 상대의 속도보다 당신의 중심이 먼저입니다.",
    "가까운 시일 무리한 연락보다, 2~3주 자신의 리듬을 회복할 때 재회의 문이 얇게 열릴 수 있어요.",
    "재회 가능성은 중간. 다만 집착이 강해질수록 기운이 반대로 흐릅니다. 여유 있는 태도가 열쇠예요.",
  ];
  const flowOptions = [
    "관계 흐름은 감정의 파고가 큰 구간입니다. 밀어붙이기보다 관찰과 자기돌봄이 유리해요.",
    "지금은 ‘확인’보다 ‘정리’의 타이밍. 대화의 질이 양보다 중요합니다.",
    "상대와의 기 흐름이 어긋난 상태예요. 먼저 당신의 일상을 안정시키면 관계 온도가 다시 오를 수 있습니다.",
  ];
  const adviceOptions = [
    "오늘은 연락 대신, 몸을 따뜻하게 하고 짧은 산책을 해보세요. 마음이 차분해지면 답이 선명해집니다.",
    "오늘 조언: 상대 반응을 새로고침하지 않기. 대신 스스로에게 다정한 문장 하나를 남겨보세요.",
    "오늘은 ‘증명’하지 않아도 됩니다. 당신의 매력은 설명보다 존재감에서 나옵니다.",
  ];

  const name = character?.name ?? "가이드";
  const previewBlur =
    topic === "reunion"
      ? `${name}이(가) 본 재회 흐름은… (잠금) 당신의 다음 선택이 온도를 바꿉니다.`
      : topic === "breakup"
        ? `${name}이(가) 정리한 이별 이후의 기운은… (잠금) 회복 구간이 핵심입니다.`
        : `${name}이(가) 뽑은 오늘의 결정적 한 줄은… (잠금) 관계의 중심이 흔들리고 있어요.`;

  return {
    reunionLuck: pick(reunionOptions, seed),
    relationshipFlow: pick(flowOptions, seed + 1),
    todayAdvice: pick(adviceOptions, seed + 2),
    previewBlur,
  };
}
