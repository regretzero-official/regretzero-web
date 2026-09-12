import { NextRequest, NextResponse } from "next/server";

import { generateSajuReport } from "@/features/saju-report/generateReport";
import { getSajuProduct } from "@/features/saju-report/products";
import type { SajuBirthForm, SajuProductId } from "@/features/saju-report/types";

export const runtime = "nodejs";

const VALID_PRODUCTS: SajuProductId[] = [
  "reunion-luck",
  "partner-heart",
  "breakup-decision",
  "reunion-strategy",
];

function isProductId(value: unknown): value is SajuProductId {
  return typeof value === "string" && (VALID_PRODUCTS as string[]).includes(value);
}

function asString(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function parseForm(raw: unknown): SajuBirthForm | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Record<string, unknown>;
  const genderRaw = asString(f.gender, 20);
  const gender =
    genderRaw === "남성" || genderRaw === "기타" || genderRaw === "여성" ? genderRaw : "여성";
  const partnerGenderRaw = asString(f.partnerGender, 20);
  const partnerGender =
    partnerGenderRaw === "남성" || partnerGenderRaw === "기타" || partnerGenderRaw === "여성"
      ? partnerGenderRaw
      : "";

  return {
    displayName: asString(f.displayName, 40),
    gender,
    birthYear: asString(f.birthYear, 8),
    birthMonth: asString(f.birthMonth, 4),
    birthDay: asString(f.birthDay, 4),
    birthTime: asString(f.birthTime, 40),
    birthPlace: asString(f.birthPlace, 40),
    partnerName: asString(f.partnerName, 40),
    partnerBirthYear: asString(f.partnerBirthYear, 8),
    partnerBirthMonth: asString(f.partnerBirthMonth, 4),
    partnerBirthDay: asString(f.partnerBirthDay, 4),
    partnerBirthTime: asString(f.partnerBirthTime, 40),
    partnerGender,
    monthsApart: asString(f.monthsApart, 8),
    breakupNote: asString(f.breakupNote, 200),
    concern: asString(f.concern, 400),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      productId?: unknown;
      form?: unknown;
      previewOnly?: unknown;
    };

    if (!isProductId(body.productId) || !getSajuProduct(body.productId)) {
      return NextResponse.json({ error: "Invalid productId." }, { status: 400 });
    }

    const form = parseForm(body.form);
    if (!form) {
      return NextResponse.json({ error: "Invalid form." }, { status: 400 });
    }

    const report = await generateSajuReport(body.productId, form);

    if (body.previewOnly) {
      return NextResponse.json({
        report: {
          ...report,
          sections: report.previewSections,
        },
      });
    }

    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
