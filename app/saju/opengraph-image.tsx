import { ImageResponse } from "next/og";

export const alt = "Regretzero 사주 · 재회운·속마음 리포트";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

async function loadPretendardBold() {
  const res = await fetch(
    "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@main/packages/pretendard/dist/public/static/Pretendard-Bold.otf",
  );
  if (!res.ok) {
    throw new Error(`Failed to load Pretendard Bold: ${res.status}`);
  }
  return res.arrayBuffer();
}

export default async function Image() {
  const fontBold = await loadPretendardBold();

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background:
            "radial-gradient(ellipse 80% 55% at 50% -8%, rgba(232, 51, 109, 0.32), transparent 58%), radial-gradient(ellipse 55% 40% at 92% 88%, rgba(94, 234, 212, 0.1), transparent 52%), radial-gradient(ellipse 45% 35% at 8% 75%, rgba(255, 122, 153, 0.12), transparent 48%), #08090d",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Pretendard",
          height: "100%",
          justifyContent: "space-between",
          padding: "56px 64px",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              color: "#ff7a99",
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 6,
            }}
          >
            REGRETZERO 사주
          </div>
          <div
            style={{
              background: "rgba(232, 51, 109, 0.16)",
              border: "1px solid rgba(255, 122, 153, 0.35)",
              borderRadius: 999,
              color: "#ff7a99",
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              padding: "10px 22px",
            }}
          >
            밤의 상담 리포트
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
            width: "100%",
          }}
        >
          <div
            style={{
              color: "#f8f4f6",
              display: "flex",
              flexDirection: "column",
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: -2.5,
              lineHeight: 1.18,
              maxWidth: 980,
            }}
          >
            <span>그 사람 마음,</span>
            <span>사주로 다시 읽어볼게요</span>
          </div>
          <div
            style={{
              color: "#c4b8bf",
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.45,
              maxWidth: 900,
            }}
          >
            재회운 · 상대 속마음 · 이별 결정 · 행동 전략
          </div>
        </div>

        <div
          style={{
            alignItems: "center",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            justifyContent: "space-between",
            paddingTop: 28,
            width: "100%",
          }}
        >
          <div
            style={{
              color: "#9a9098",
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            서나리 · 백련 · 차유리 · 한보라 · 이도령 · 한시우 · 강세온
          </div>
          <div
            style={{
              color: "#5eead4",
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            regretzero.kr/saju
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          data: fontBold,
          name: "Pretendard",
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
