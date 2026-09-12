import type { Metadata } from "next";

import { SajuHubApp } from "@/features/saju-report/components/saju-hub-app";
import { getSajuProduct } from "@/features/saju-report/products";
import type { SajuProductId } from "@/features/saju-report/types";

export const metadata: Metadata = {
  title: "사주 리포트 허브 · 재회운·속마음·이별 결정",
  description:
    "서나리 · 백련 · 차유리 · 한보라와 도령들의 긴 사주 상담 리포트. 재회운·상대 속마음·이별 결정·행동 전략. 참고용이에요. 절대 결과가 아니에요.",
  robots: {
    index: false,
    follow: false,
  },
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function SajuPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const resolved = searchParams ? await Promise.resolve(searchParams) : {};
  const raw = resolved.product;
  const productParam = Array.isArray(raw) ? raw[0] : raw;
  const matched = getSajuProduct(productParam);
  const initialProductId = (matched?.id ?? null) as SajuProductId | null;

  return <SajuHubApp initialProductId={initialProductId} />;
}
