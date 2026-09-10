"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const CONTACT_MAIL = "mailto:regretzero.official@gmail.com";

type NavItem = {
  id: string;
  label: string;
  href: string;
  match?: (pathname: string) => boolean;
  external?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "홈",
    href: "/saju",
    match: (p) => p === "/saju",
  },
  {
    id: "products",
    label: "상품",
    href: "/saju#products",
    match: (p) =>
      p === "/saju/reunion" ||
      p === "/saju/heart" ||
      p === "/saju/breakup" ||
      p === "/saju/strategy",
  },
  {
    id: "my",
    label: "내 사주",
    href: "/saju/my",
    match: (p) => p === "/saju/my",
  },
  {
    id: "faq",
    label: "FAQ",
    href: "/saju/faq",
    match: (p) => p === "/saju/faq",
  },
  {
    id: "contact",
    label: "문의",
    href: CONTACT_MAIL,
    external: true,
  },
];

function NavIcon({ id, active }: { id: string; active: boolean }) {
  const stroke = active ? "#FF7A99" : "#9A9098";
  const common = {
    fill: "none" as const,
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    className: "h-5 w-5",
    "aria-hidden": true as const,
  };

  switch (id) {
    case "home":
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
        </svg>
      );
    case "products":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "my":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5.5 19.5c1.6-3.2 4-4.8 6.5-4.8s4.9 1.6 6.5 4.8" />
        </svg>
      );
    case "faq":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9.6 9.4a2.4 2.4 0 0 1 4.6.9c0 1.4-1.4 2-2.2 2.5" />
          <circle cx="12" cy="16.2" r="0.8" fill={stroke} stroke="none" />
        </svg>
      );
    case "contact":
      return (
        <svg {...common}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
          <path d="m4.5 7.5 7.5 6 7.5-6" />
        </svg>
      );
    default:
      return null;
  }
}

export function SajuBottomNav() {
  const pathname = usePathname() || "/saju";

  return (
    <nav
      aria-label="사주 하단 메뉴"
      className="saju-bottom-nav saju-footer fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 border-t border-white/10"
    >
      <ul className="grid grid-cols-5 px-1 pb-[calc(env(safe-area-inset-bottom)+6px)] pt-1.5">
        {NAV_ITEMS.map((item) => {
          const active = item.match ? item.match(pathname) : false;
          const className = `flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-semibold transition ${
            active ? "text-[#FF7A99]" : "text-[#9A9098] hover:text-[#D8D0D4]"
          }`;

          if (item.external) {
            return (
              <li key={item.id}>
                <a href={item.href} className={className}>
                  <NavIcon id={item.id} active={false} />
                  <span>{item.label}</span>
                </a>
              </li>
            );
          }

          return (
            <li key={item.id}>
              <Link href={item.href} className={className} aria-current={active ? "page" : undefined}>
                <NavIcon id={item.id} active={active} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Extra bottom padding so content clears the fixed bottom nav */
export const SAJU_BOTTOM_NAV_PAD =
  "pb-[calc(env(safe-area-inset-bottom)+72px)]";
