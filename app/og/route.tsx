import { ImageResponse } from "next/og";

export const alt = "Regretzero 후회 영수증 팩트 카드";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

function safeParam(value: string | null, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 80) : fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const asset = safeParam(searchParams.get("asset"), "10년 전 그 자산");
  const amount = safeParam(searchParams.get("amount"), "1,000만원");
  const final = safeParam(searchParams.get("final"), "결과 확인");
  const gap = safeParam(searchParams.get("gap"), "정기예금 대비 격차");
  const wait = safeParam(searchParams.get("wait"), "고점 아래 있었던 시간");

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #eaf4ff 0%, #f8fbff 48%, #dbeafe 100%)",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: 56,
          width: "100%",
        }}
      >
        <div
          style={{
            background: "white",
            border: "1px solid rgba(148, 163, 184, 0.28)",
            borderRadius: 42,
            boxShadow: "0 34px 90px rgba(15, 23, 42, 0.16)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            padding: 54,
            width: "100%",
          }}
        >
          <div style={{ color: "#2563eb", fontSize: 24, fontWeight: 800, letterSpacing: 8 }}>
            REGRETZERO RECEIPT
          </div>
          <div
            style={{
              color: "#0f172a",
              fontSize: 64,
              fontWeight: 900,
              letterSpacing: -4,
              lineHeight: 1.05,
              marginTop: 24,
              maxWidth: 780,
            }}
          >
            {asset}의 10년을 다시 계산했습니다
          </div>
          <div style={{ color: "#475569", fontSize: 28, lineHeight: 1.45, marginTop: 22 }}>
            투자 권유가 아닌 과거 시뮬레이션입니다. 최종 금액과 함께 버텨야 했던 시간을 봅니다.
          </div>

          <div style={{ display: "flex", gap: 22, marginTop: 44 }}>
            {[
              ["투입 원금", amount],
              ["최종 평가금액", final],
              ["기회비용 격차", gap],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 26,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  padding: "24px 26px",
                  width: 330,
                }}
              >
                <div style={{ color: "#64748b", fontSize: 22, fontWeight: 700 }}>{label}</div>
                <div style={{ color: "#0f172a", fontSize: 34, fontWeight: 900 }}>{value}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              alignItems: "center",
              background: "#0f172a",
              borderRadius: 28,
              color: "white",
              display: "flex",
              fontSize: 28,
              fontWeight: 800,
              justifyContent: "space-between",
              marginTop: "auto",
              padding: "26px 32px",
            }}
          >
            <span>인내의 세월 지도</span>
            <span style={{ color: "#93c5fd" }}>{wait}개월</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
