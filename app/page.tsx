import { Suspense } from "react";
import type { Metadata } from "next";

import { HomePage } from "@/components/home/home-page";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function readSearchParam(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}): Promise<Metadata> {
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const asset = readSearchParam(resolvedSearchParams, "ogAsset");
  const amount = readSearchParam(resolvedSearchParams, "ogAmount");
  const final = readSearchParam(resolvedSearchParams, "ogFinal");
  const gap = readSearchParam(resolvedSearchParams, "ogGap");
  const wait = readSearchParam(resolvedSearchParams, "ogWait");
  const hasResultPreview = Boolean(asset || final || gap);
  const title = hasResultPreview
    ? `Regretzero · ${asset ?? "10년 투자"} 결과`
    : "Regretzero | 10년 전 샀다면 지금 얼마가 되었을까요?";
  const description = hasResultPreview
    ? `${asset ?? "선택 자산"}의 10년 결과를 후회 영수증으로 확인하세요. 최종 금액과 인내의 세월 지도를 함께 봅니다.`
    : "10년 전 샀다면 지금 얼마가 되었을까요? 같은 돈이 지나온 흐름과 하락, 회복의 시간을 함께 보는 과거 투자 시뮬레이터입니다.";
  const ogImage = new URL("https://www.regretzero.kr/og");

  if (asset) ogImage.searchParams.set("asset", asset);
  if (amount) ogImage.searchParams.set("amount", amount);
  if (final) ogImage.searchParams.set("final", final);
  if (gap) ogImage.searchParams.set("gap", gap);
  if (wait) ogImage.searchParams.set("wait", wait);

  return {
    description,
    openGraph: {
      description,
      images: [
        {
          alt: "Regretzero 후회 영수증 팩트 카드",
          height: 630,
          url: ogImage.toString(),
          width: 1200,
        },
      ],
      locale: "ko_KR",
      siteName: "Regretzero",
      title,
      type: "website",
      url: "https://www.regretzero.kr",
    },
    title,
    twitter: {
      card: "summary_large_image",
      description,
      images: [ogImage.toString()],
      title,
    },
  };
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomePage />
    </Suspense>
  );
}
