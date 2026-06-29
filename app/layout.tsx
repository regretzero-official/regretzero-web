import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { AdsenseScript } from "@/components/adsense-script";

import "./globals.css";

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const siteUrl = "https://www.regretzero.kr";
const siteTitle =
  "Regretzero | 10\uB144 \uC804 \uC0C0\uB2E4\uBA74 \uC9C0\uAE08 \uC5BC\uB9C8\uAC00 \uB418\uC5C8\uC744\uAE4C\uC694?";
const siteDescription =
  "10\uB144 \uC804 \uC0C0\uB2E4\uBA74 \uC9C0\uAE08 \uC5BC\uB9C8\uAC00 \uB418\uC5C8\uC744\uAE4C\uC694? \uAC19\uC740 \uB3C8\uC774 \uC9C0\uB098\uC628 \uD750\uB984\uACFC \uD558\uB77D, \uD68C\uBCF5\uC758 \uC2DC\uAC04\uC744 \uD568\uAED8 \uBCF4\uB294 \uACFC\uAC70 \uD22C\uC790 \uC2DC\uBBAC\uB808\uC774\uD130\uC785\uB2C8\uB2E4.";
const openGraphDescription =
  "\uADF8\uB54C \uC0C0\uB2E4\uBA74 \uC5BC\uB9C8\uAC00 \uB418\uC5C8\uC744\uAE4C\uC694? 10\uB144\uC758 \uC790\uC0B0 \uD750\uB984\uACFC \uBC84\uD154\uC57C \uD588\uB358 \uD558\uB77D\uACFC \uD68C\uBCF5\uC744 \uCC28\uD2B8\uB85C \uBCF5\uAE30\uD574\uBCF4\uC138\uC694.";
const defaultOgImage = "/image/Regretzero.png";

export const metadata: Metadata = {
  alternates: {
    canonical: siteUrl,
  },
  description: siteDescription,
  metadataBase: new URL(siteUrl),
  openGraph: {
    description: openGraphDescription,
    locale: "ko_KR",
    siteName: "Regretzero",
    title: siteTitle,
    type: "website",
    url: siteUrl,
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: "Regretzero",
      },
    ],
  },
  title: {
    default: siteTitle,
    template: "%s | Regretzero",
  },
  twitter: {
    card: "summary_large_image",
    description: siteDescription,
    images: [defaultOgImage],
    title: siteTitle,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${sans.variable} ${display.variable} antialiased`}>
        <AdsenseScript />
        {children}
      </body>
    </html>
  );
}
