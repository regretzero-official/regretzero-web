import type { Metadata } from "next";

import { SajuHubApp } from "@/features/saju-report/components/saju-hub-app";
import { getSajuProduct } from "@/features/saju-report/products";
import type { SajuProductId } from "@/features/saju-report/types";

export const metadata: Metadata = {
  title: "사주 리포트 허브 · 재회운·속마음·이별 결정",
  description:
    "서나리 · 백련 · 차유리 · 한보라와 도령 트리오의 긴 사주 리포트. 재회운·상대 속마음·이별 결정·행동 전략. 여자의 마음은 여자가 잘 알지. 엔터테인먼트용이며 실제 예언이 아닙니다.",
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
