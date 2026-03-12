import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.regretzero.kr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "RegretZero | 놓친 투자, 숫자로 다시 보기",
  description: "10년 전 투자 후회와 앞으로 10년의 기회를 함께 보여주는 장기 투자 시뮬레이터",
  openGraph: {
    title: "RegretZero | 놓친 투자, 숫자로 다시 보기",
    description: "10년 전 투자 후회와 앞으로 10년의 기회를 함께 보여주는 장기 투자 시뮬레이터",
    url: siteUrl,
    siteName: "RegretZero",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} ${ibmPlexMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
