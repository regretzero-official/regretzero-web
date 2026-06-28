import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Noto_Sans_KR } from "next/font/google";
import { ServiceWorkerRegister } from "@/src/components/ServiceWorkerRegister";
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
  manifest: "/manifest.webmanifest",
  title: "RegretZero | 그때 안 산 대가, 금과 붙이면 보입니다",
  description:
    "과거에 못 산 종목이 진짜 아쉬운 선택이었는지, 금(GLD)과 같은 돈으로 붙여 바로 보여주는 투자 비교 사이트",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RegretZero",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "RegretZero | 그때 안 산 대가, 금과 붙이면 보입니다",
    description:
      "과거에 못 산 종목이 진짜 아쉬운 선택이었는지, 금(GLD)과 같은 돈으로 붙여 바로 보여주는 투자 비교 사이트",
    url: siteUrl,
    siteName: "RegretZero",
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} ${ibmPlexMono.variable} antialiased`}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
