import { getSajuCharacter } from "@/features/saju-chat/characters";
import { buildTemplateReport } from "./buildReport";
import { getSajuProduct } from "./products";
import type { SajuBirthForm, SajuProductId, SajuReportPayload, SajuReportSection } from "./types";

function formSummary(form: SajuBirthForm) {
  return [
    `내담자: ${form.displayName || "(익명)"} · ${form.gender}`,
    `출생: ${form.birthYear || "?"}년 ${form.birthMonth || "?"}월 ${form.birthDay || "?"}일 ${form.birthTime || "(시간 미상)"} · ${form.birthPlace || "(지역 미상)"}`,
    `상대: ${form.partnerName || "(이름 미상)"}${form.partnerBirthYear ? ` · ${form.partnerBirthYear}년생` : ""}`,
    `이별: 약 ${form.monthsApart || "?"}개월 전 · ${form.breakupNote || "사정 미상"}`,
    `고민: ${form.concern || "재회/속마음/연락 타이밍"}`,
  ].join("\n");
}

function productOutline(productId: SajuProductId): string {
  const common = `필수 구조(번호/제목 유지, 각 섹션 충분히 길게):
1. 표지/한 줄 결론
2. 이번 점사의 질문 정리
3. 내 사주의 연애 기질 (원국/일간/월지/시주/십성 — 예시용 해석 프레임 명시)
4. 두 사람 사이 인연의 결 (합·충·형·해 / 원진 느낌)
5. 헤어진 진짜 이유 (표면 vs 속마음)
6. 상대 속마음에 내가 남아있는지
7. 재회운 타임라인 (1·3·6개월)
8. 지금 연락해도 되는지 (해도 되는 말 / 금지 문구)
9. 재접근 전략 3단계
10. 주의할 함정
11. 마지막 한마디
12. 엔터테인먼트 고지`;

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

function systemPrompt(productId: SajuProductId): string {
  const product = getSajuProduct(productId)!;
  const character = getSajuCharacter(product.characterId)!;
  return `${character.systemPrompt}

지금은 짧은 채팅이 아니라 **유료급 긴 ${product.title} 리포트(₩9,900급)**를 집필합니다.
보이스 규칙:
- 캐릭터 보이스를 유지하되, 리포트는 섹션화된 긴 전문 문서.
- 확정 예언 톤 금지. "~일 가능성", "흐름상", "기운이 기운다" 식으로.
- 구체적·생생·감정지능적으로. 고객 디테일을 적극 활용.
- 의료/법률 주장 금지. 한국어만. 마크다운 헤딩 OK.
- 사주 용어는 설득력 있게 쓰되 초반에 "예시용 해석 프레임"임을 명시.
- 분량: 본문 3500자 이상. 너무 짧으면 안 됨.
- foxbunny 등 타사 상표·캐릭터명을 쓰지 말 것.`;
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
): Promise<SajuReportPayload> {
  const template = buildTemplateReport(productId, form);
  const product = getSajuProduct(productId)!;
  const system = systemPrompt(productId);
  const user = `다음 고객 정보로 **${product.title}** 긴 한국어 리포트를 작성하라. 제목/본문에 확정 예언처럼 쓰지 말고, 엔터테인먼트·예시용 해석 프레임임을 밝혀라.

고객 정보:
${formSummary(form)}

${productOutline(productId)}

톤: 프리미엄 유료 상품. 구체적. ${product.characterName} 보이스.`;

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
