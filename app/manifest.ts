import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RegretZero",
    short_name: "RegretZero",
    description: "10년 전 샀다면 지금 얼마였을지 보여주는 투자 타임머신",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#eaf2fb",
    theme_color: "#eaf2fb",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

