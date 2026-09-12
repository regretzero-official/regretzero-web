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
    return `필수 구조(제목 유지, 각 섹션 충분히 길게 · 전체 본문 약 6000~10000자):
1. 표지/한줄결론 — 「그 사람, 아직 나를 생각할까?」 훅 + 원국 요약 인용
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
15. 안내(원국=만세력 계산, 해석=오락·위로 — 짧게 한 번만)`;
  }
  const common = `필수 구조(번호/제목 유지, 각 섹션을 충분히 길게 · 전체 본문 약 6000~10000자 목표):
1. 표지/한줄결론 — 고객 출생·상대·개월·고민·원국 인용
2. 이번 점사의 질문 정리
3. 원국/일간 기질 (제공된 만세력 원국·일간·십성 사용)
4. 원국 연애 패턴 · 용신/희신/기신 감각
5. 두 사람 사이 인연의 결
6. 헤어진 진짜 이유 / 속마음 / 타임라인 / 연락 / 전략 등 상품 초점
마지막: 안내(원국=만세력, 해석=오락·위로)`;
  if (productId === "partner-heart") {
    return `${common}\n강조: 상대 속마음·거리감·보관함 감각·다가갈 온도.`;
  }
  if (productId === "breakup-decision") {
    return `${common}\n강조: 남겨둘 이유/놓을 이유, 결정 체크리스트, 자존 회복.`;
  }
  if (productId === "reunion-strategy") {
    return `${common}\n강조: 지금 하면 안 되는 것, 실행 가능한 3단계, 금지 문구.`;
  }
  return common;
}

function systemPrompt(productId: SajuProductId, characterId: string): string {
  const product = getSajuProduct(productId)!;
  const character = getSajuCharacter(characterId) ?? getSajuCharacter(product.characterId)!;
  return `${character.systemPrompt}

지금은 짧은 채팅이 아니라 **긴 ${product.title} 상담 리포트**를 집필합니다.
보이스 규칙 (최우선):
- ${character.name}(${character.roleLabel ?? "가이드"})처럼 말할 것. 이름만 바꾼 동일 문단 금지.
- 카톡/상담 톤. AI 에세이·“~입니다. ~입니다.” 스택·마케팅 클리셰(“프리미엄”“MVP”“정리하세요”“프레임” 남발) 금지.
- 섹션마다 캐릭터 고유 감각어·호흡을 넣을 것. 백련≠차유리≠서나리≠한보라≠이도령≠한시우≠강세온이 10초 안에 구분돼야 함.
- 확정 예언 금지. “~일 가능성”, “흐름상”, “기운이…” 식으로.
- 고객 디테일(출생·상대·개월·고민·이별 메모)을 적극 인용.
- 의료/법률 주장 금지. 한국어만. 마크다운 헤딩(##) OK.
- 사주 용어는 설득력 있게 쓰되, 본문 중간에 “프레임/엔터테인먼트”를 반복하지 말 것. 고지는 맨 끝 한 번만.
- 분량: 본문 **6000자 이상 10000자 전후**. 각 섹션을 풍부하게.
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
        max_tokens: 8192,
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
  const user = `다음 고객 정보로 **${product.title}** 긴 한국어 상담 리포트를 작성하라.
제목/본문에 확정 예언처럼 쓰지 말 것. “프리미엄/MVP/프레임” 마케팅 톤 금지.
분량 목표: **약 6000~10000자**. 섹션마다 ${narrator} 고유 보이스(이름만 교체 금지).
고지(재미·위로용)는 맨 끝 섹션에만 짧게.

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
