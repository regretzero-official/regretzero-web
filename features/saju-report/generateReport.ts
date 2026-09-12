import { getSajuCharacter } from "@/features/saju-chat/characters";
import { buildTemplateReport } from "./buildReport";
import { computeChart } from "./manseryeok/computeChart";
import { formatChartPlain } from "./manseryeok/formatChart";
import { getSajuProduct } from "./products";
import type { SajuBirthForm, SajuProductId, SajuReportPayload, SajuReportSection } from "./types";

function formSummary(form: SajuBirthForm) {
  return [
    `내담자: ${form.displayName || "(익명)"} · ${form.gender}`,
    `출생: ${form.birthYear || "?"}년 ${form.birthMonth || "?"}월 ${form.birthDay || "?"}일 ${form.birthTime || "(시간 미상)"} · ${form.birthPlace || "(지역 미상)"}`,
    (() => {
      const name = form.partnerName || "(이름 미상)";
      if (!form.partnerBirthYear) return `상대: ${name}`;
      const ymd =
        form.partnerBirthMonth && form.partnerBirthDay
          ? `${form.partnerBirthYear}년 ${form.partnerBirthMonth}월 ${form.partnerBirthDay}일 ${form.partnerBirthTime || "(시간 미상)"}`
          : `${form.partnerBirthYear}년생(월일 미상)`;
      return `상대: ${name} · ${ymd}`;
    })(),
    `이별: 약 ${form.monthsApart || "?"}개월 전 · ${form.breakupNote || "사정 미상"}`,
    `고민: ${form.concern || "재회/속마음/연락 타이밍"}`,
  ].join("\n");
}

function productOutline(productId: SajuProductId): string {
  if (productId === "reunion-luck") {
    return `필수 구조(제목 유지, 각 섹션을 Foxbunny급 점사 상담으로 길게 · 전체 본문 약 38000~45000자):
1. 표지/한줄결론 — 상담자가 내담자 호명 + 「그 사람, 아직 나를 생각할까?」 훅 한줄결론 + 원국 요약 인용
2. 1장 · 끌린 이유
3. 두 사람의 사주 원국 비교 (양쪽 연주·일간 페어 필수)
4. 이별 진짜 원인
5. 지워지지 않는 흔적
6. 2장 · 남은 마음
7. 떠올리는 순간 · 말 못 하는 감정
8. 3장 · 연락 확률과 시기
9. 누가 먼저 연락할까
10. 다시 만났을 때
11. 외부 변수 · 새 인연 역전
12. 4장 · 달라져야 할 것
13. 행동 플랜 · 연락 가이드
14. 마지막 기회 · 선생님 마지막 말
15. 안내(원국=만세력 계산, 해석=오락·위로 — 짧게 한 번만)

점사/상담 톤 규칙(필수):
- Foxbunny식 긴 점사 리포트. 점쟁이가 사주를 보고 예언·풀이해주는 느낌(상담자가 TO you). 로맨스 웹소설 챕터·문학 서술 금지
- 오프닝: 직접 호명 + 한줄 결론 → 긴 쉬운 풀이(감정·타이밍·상대 심리·행동) → *(근거 한 줄)* → “다음에 네가 할 선택”
- 예언·단정감 있는 Foxbunny 점사 상담 호흡 필수. “지금은 연락할 때가 아니야.” “지금은 다가가지 마. 한두 달에서 세 달쯤 지나야 다시 말할 타이밍이야.” “지운 건 아냐. 근데 지금 당장 다시 만나자 할 마음은 아니야.”처럼 쉬운 일상어로 단언하라. “보관함/창은 1~3개월/선 그어/단정해/자존 구조/위 방향/줄은 남아/이 선이다/사랑이 0/문 닫힌 결/저열/고열/청구서/과열 스크립트/지금은 아니다/문은 아직/독이다/저자극/설득 시즌/부담 없는 안부·일상 먼저·타이밍/기부터 모아/대기열/타임라인 결론/氣는 조급하면/달아오름/정돈된 너” 은어 슬로건 금지. 쉬운 일상어로(“아직 끝난 건 아니야.” “지금은 더 밀지 마.” “사랑이 없어서 헤어진 게 아니야.” “서로 페이스가 안 맞아서 지쳐서 끝난 거야.”). “~쪽이다 / 흐름상 / 대체로” 잔여 헤지 최소화. 사기성 100%·가짜 확률%·의료/법률 단정·“무조건 재회” 미래 보장만 금지
- 가벼운 감각(밤·카톡)은 보조. “방 안이 고요하다”“다음 장”“웹소설처럼” 문학 pad/cliffhanger 금지
- 체크리스트 강의 톤 금지. 십성 리스트/용신·희신·기신 나열/난해한 합충 비유 금지
- 백련 보이스: 무당 카리스마·단호·氣 (“기운이 보여.” “흔들리지 마.”) · 밤의 점사 상담`;
  }
  const common = `필수 구조(제목 유지, 각 섹션을 Foxbunny급 점사 상담으로 길게 · 전체 본문 약 38000~45000자):
1. 표지/한줄결론 — 상담자 호명 + 한줄결론 + 원국 요약
2. 1장 · 이번 점사의 질문
3. 원국·일간 기질 (만세력 인용, 쉬운 번역 · 십성 나열 금지)
4. 연애 패턴 · 잔향의 스크립트
5~N. 상품 초점(속마음/이별결정/전략) — 흐름·심리·*(근거 한 줄)*·“다음에 네가 할 선택”
마지막: 안내(원국=만세력, 해석=오락·위로)
점사/상담: 직접 호명·쉬운 풀이·원국 근거·예언식 단정감(“지금은 연락할 때가 아니야.” “지운 건 아냐. 근데 지금 당장 다시 만나자 할 마음은 아니야.”). 소프트 헤지·“~쪽이다/흐름상” 잔여 최소화(끝 고지만). 웹소설 챕터·문학 cliffhanger 금지. 캐릭터 보이스 엄수. 용신/희신/기신 스택·난해한 합충 비유 금지. “보관함/창/선 그어/단정해/줄은 남아/이 선이다/사랑이 0/문 닫힌 결/저열·고열/청구서/지금은 아니다/문은 아직/독이다/저자극/설득 시즌/대기열/타임라인 결론” 은어 금지.`;
  if (productId === "partner-heart") {
    return `${common}\n강조: 상대 속마음·거리감·남아 있는데 손대기 무서운 상태·다가갈 온도. 서나리—느낌이 왔어·가슴·잔향·soft 반말.`;
  }
  if (productId === "breakup-decision") {
    return `${common}\n강조: 남겨둘 이유/놓을 이유, 결정 체크리스트, 자존 회복. 차유리—팩트·dry humor·퍼줘/아껴도 돼.`;
  }
  if (productId === "reunion-strategy") {
    return `${common}\n강조: 지금 하면 안 되는 것, 실행 가능한 3단계, 금지 문구. 한보라—헐·네 마음부터·공감→현실 pep.`;
  }
  return common;
}

function systemPrompt(productId: SajuProductId, characterId: string): string {
  const product = getSajuProduct(productId)!;
  const character = getSajuCharacter(characterId) ?? getSajuCharacter(product.characterId)!;
  return `${character.systemPrompt}

지금은 짧은 채팅이 아니라 **긴 ${product.title} 점사 상담 리포트**를 Foxbunny식으로 집필합니다(점쟁이가 사주를 보고 예언·풀이).
보이스 규칙 (최우선):
- ${character.name}(${character.roleLabel ?? "가이드"})처럼 말할 것. 이름만 바꾼 동일 문단 금지. 캐릭터 보이스 엄수.
- 점사/상담 호흡: 직접 호명 + 한줄 결론 → 긴 쉬운 풀이(감정·타이밍·상대 심리·행동) → *(근거 한 줄)* → 행동 가이드. 로맨스 웹소설 챕터·문학 서술·“다음 장” cliffhanger 금지.
- 카톡/상담 톤. AI 에세이·“~입니다. ~입니다.” 스택·마케팅 클리셰(“프리미엄”“MVP”“정리하세요”“프레임” 남발) 금지.
- 섹션마다 캐릭터 고유 감각어·호흡을 넣을 것. 백련(밤의 점사·氣·단호)≠차유리(깍쟁이 팩트·dry)≠서나리(직감 언니·느낌이 왔어)≠한보라(헐·네 마음부터·pep)≠이도령(다정 존댓말 보호)≠한시우(쿨 티징 밤 가이드)≠강세온(따뜻 티징 남친감)이 10초 안에 구분되어야 함.
- 상담 단정감 한 단계 더: “지금은 연락할 때가 아니야.” “지금은 다가가지 마.” “지운 건 아냐. 근데 지금 당장 다시 만나자 할 마음은 아니야.” “네가 먼저 괜찮은 상태가 돼야 해.” 쉬운 일상어 단언 우선. “보관함/창은 1~3개월/선 그어/단정해/자존 구조/지금은 아니다/문은 아직/독이다/저자극/설득 시즌/대기열” 은어 금지. “~쪽이다/흐름상/대체로” 잔여 헤지·소프트 헤지(~일 수도/어쩌면)는 본문에서 최소화. 현재 상태·지금 할 일은 더 단언하되, 사기성 100%·가짜 %·“무조건 재회” 미래 보장만 금지. 고지(오락·참고)는 맨 끝 한 번만.
- 고객 디테일(출생·상대·개월·고민·이별 메모)을 적극 인용.
- 의료/법률 주장 금지. 한국어만. 마크다운 헤딩(##) OK.
- 사주 용어는 *(근거 한 줄)* 또는 가볍게 직조. 본문 중간에 “프레임/엔터테인먼트” 반복 금지. 고지는 맨 끝 한 번만.
- 분량: 네 상품 모두 본문 **38000자 이상 45000자 전후**(섹션당 매우 풍부, Foxbunny급 긴 점사). 길이는 상담 콘텐츠로(장면 pad 금지).
- 톤: 쉬운 일상어·점사 예언 상담. 십성 나열·용신/희신/기신 스택·난해한 합충 비유 금지.
- 행동 가이드는 “다음에 네가 할 선택” 프레임(불릿 OK).
- 타사 상표·캐릭터명 금지.
- 마지막에 짧은 재미·위로용 안내 섹션 필수.`;
}

function parseMarkdownSections(markdown: string): SajuReportSection[] {
  const text = markdown.trim();
  if (!text) return [];

  const parts = text.split(/\n(?=##\s+)/);
  const sections: SajuReportSection[] = [];

  for (const part of parts) {
    const lines = part.trim().split("\n");
    const first = lines[0] ?? "";
    const titleMatch = first.match(/^#{1,3}\s+(.*)$/);
    if (titleMatch) {
      sections.push({
        id: `llm-${sections.length + 1}`,
        title: titleMatch[1].trim(),
        body: lines.slice(1).join("\n").trim(),
      });
    } else if (sections.length === 0) {
      sections.push({
        id: "llm-1",
        title: "리포트",
        body: part.trim(),
      });
    } else {
      const last = sections[sections.length - 1];
      last.body = `${last.body}\n\n${part.trim()}`.trim();
    }
  }

  return sections.filter((s) => s.body.length > 0);
}

async function callOpenAICompatible(args: {
  apiKey: string;
  baseUrl: string;
  model: string;
  system: string;
  user: string;
}): Promise<string | null> {
  try {
    const response = await fetch(`${args.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: args.model,
        temperature: 0.85,
        max_tokens: 16384,
        messages: [
          { role: "system", content: args.system },
          { role: "user", content: args.user },
        ],
      }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

export async function generateSajuReport(
  productId: SajuProductId,
  form: SajuBirthForm,
  selectedCharacterId?: string | null,
): Promise<SajuReportPayload> {
  const template = buildTemplateReport(productId, form, selectedCharacterId);
  const product = getSajuProduct(productId)!;
  const chart = template.chart ?? computeChart(form);
  const system = systemPrompt(productId, template.characterId);
  const narrator = template.characterName;
  const user = `다음 고객 정보로 **${product.title}** 긴 한국어 Foxbunny식 점사 상담 리포트를 작성하라.
제목/본문은 Foxbunny식 **예언·단정감 점사 상담**으로. “지금은 연락할 때가 아니야.” “지금은 다가가지 마. 한두 달에서 세 달쯤 지나야 다시 말할 타이밍이야.” “지운 건 아냐. 근데 지금 당장 다시 만나자 할 마음은 아니야.”처럼 쉬운 일상어로 단언하라. “보관함/창/선 그어/단정해/자존 구조/지금은 아니다/문은 아직/독이다/저자극/설득 시즌” 은어 슬로건 금지. “~쪽이다/흐름상” 잔여 헤지 최소화. 사기성 100%·가짜 %·의료/법률·무조건 재회 미래 보장만 금지. “프리미엄/MVP/프레임” 마케팅 톤 금지. 웹소설 챕터·문학 장면 pad 금지.
분량 목표: **약 38000~45000자**(전 상품 Foxbunny급 긴 점사). 섹션마다 ${narrator} 고유 보이스(이름만 교체 금지). 호명·한줄결론·감정/타이밍/심리 풀이·*(근거 한 줄)*·“다음에 네가 할 선택” 위주. 쉬운 말·사주팔자(원국) 근거.
고지(재미·위로용)는 맨 끝 섹션에만 짧게—본문 매 문단 헤지하지 말 것.

고객 정보:
${formSummary(form)}

【만세력 원국 — 반드시 이 기둥·일간·십성·공망·대운·세운을 사용할 것. 임의로 바꾸지 말 것】
${formatChartPlain(chart)}

${productOutline(productId)}

톤: 구체적·상담. ${narrator}이 직접 말하는 것처럼.
원국 숫자는 위 만세력 결과를 인용하고, 해석·조언만 캐릭터 보이스로 풀어라.`;

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const content = await callOpenAICompatible({
      apiKey: openaiKey,
      baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      system,
      user,
    });
    const sections = content ? parseMarkdownSections(content) : [];
    if (sections.length >= 4) {
      return {
        ...template,
        chart,
        sections,
        previewSections: sections.slice(0, 2).map((s, i) => ({ ...s, blurred: i === 1 })),
        oneLiner: template.oneLiner,
        source: "openai",
        generatedAt: new Date().toISOString(),
      };
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const content = await callOpenAICompatible({
      apiKey: geminiKey,
      baseUrl:
        process.env.GEMINI_BASE_URL ??
        "https://generativelanguage.googleapis.com/v1beta/openai",
      model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
      system,
      user,
    });
    const sections = content ? parseMarkdownSections(content) : [];
    if (sections.length >= 4) {
      return {
        ...template,
        chart,
        sections,
        previewSections: sections.slice(0, 2).map((s, i) => ({ ...s, blurred: i === 1 })),
        oneLiner: template.oneLiner,
        source: "gemini",
        generatedAt: new Date().toISOString(),
      };
    }
  }

  return template;
}
