"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { HelpCircle, Info, Mail, X } from "lucide-react";

export type AppMenuVariant = "dark" | "floating" | "inline" | "light";

export type AppMenuItem = {
  badge: string;
  description: string;
  href: string;
  title: string;
};

export type AppMenuSection = {
  items: AppMenuItem[];
  label: string;
};

export type SharedAppMenuProps = {
  className?: string;
  onHomeClick?: () => void;
  triggerLabel?: ReactNode;
  variant?: AppMenuVariant;
};

export type ControlledAppMenuProps = SharedAppMenuProps & {
  activeMenuIntent?: string | null;
  isOpen?: boolean;
  onOpenChange: (open: boolean) => void;
  open?: boolean;
};

export const MORE_MENU_SECTIONS: AppMenuSection[] = [
  {
    label: "도움말",
    items: [
      {
        badge: "GUIDE",
        description: "처음 쓰는 법과 꼭 필요한 투자 용어를 짧게 정리했습니다.",
        href: "/guide",
        title: "사용 가이드",
      },
      {
        badge: "ABOUT",
        description: "RegretZero가 보여주려는 기준과 데이터의 한계를 설명합니다.",
        href: "/about",
        title: "소개",
      },
      {
        badge: "MAIL",
        description: "광고, 제휴, 피드백을 메일로 보낼 수 있습니다.",
        href: "mailto:regretzero.official@gmail.com",
        title: "제휴·문의",
      },
    ],
  },
];

const SUPPORT_ICON_MAP: Record<string, typeof HelpCircle> = {
  ABOUT: Info,
  GUIDE: HelpCircle,
  MAIL: Mail,
};

function isInternalHref(href: string) {
  return href.startsWith("/");
}

function isActivePath(pathname: string | null, href: string) {
  if (!pathname || !isInternalHref(href)) {
    return false;
  }

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuTrigger({
  className,
  label,
  onClick,
  open,
  variant,
}: {
  className?: string;
  label?: ReactNode;
  onClick: () => void;
  open: boolean;
  variant: AppMenuVariant;
}) {
  const triggerClassName =
    variant === "inline"
      ? "inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white/85 px-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-white"
      : "inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm shadow-slate-200/70 transition hover:bg-white hover:text-slate-950";

  return (
    <button
      aria-expanded={open}
      aria-label={open ? "서비스 안내 닫기" : "서비스 안내 열기"}
      className={`${triggerClassName} ${className ?? ""}`}
      type="button"
      onClick={onClick}
    >
      {label ?? (
        <span className="flex flex-col gap-1">
          <span className="block h-0.5 w-4 rounded-full bg-current" />
          <span className="block h-0.5 w-4 rounded-full bg-current" />
          <span className="block h-0.5 w-4 rounded-full bg-current" />
        </span>
      )}
    </button>
  );
}

function MenuItemLink({
  active,
  item,
  onNavigate,
}: {
  active: boolean;
  item: AppMenuItem;
  onNavigate: (href: string) => void;
}) {
  const Icon = SUPPORT_ICON_MAP[item.badge] ?? HelpCircle;
  const content = (
    <span
      className={`flex w-full items-center gap-4 rounded-[24px] border px-4 py-4 text-left transition ${
        active
          ? "border-blue-200 bg-blue-50 text-slate-950 shadow-sm"
          : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
          active
            ? "border-blue-200 bg-white text-blue-600"
            : "border-slate-200 bg-slate-50 text-slate-500"
        }`}
      >
        <Icon aria-hidden className="h-5 w-5" strokeWidth={1.5} />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-bold tracking-[-0.04em]">{item.title}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-500">{item.description}</span>
      </span>
    </span>
  );

  if (isInternalHref(item.href)) {
    return (
      <Link href={item.href} onClick={() => onNavigate(item.href)}>
        {content}
      </Link>
    );
  }

  return (
    <a href={item.href} onClick={() => onNavigate(item.href)}>
      {content}
    </a>
  );
}

export function ControlledAppMenu({
  className,
  isOpen,
  onHomeClick,
  onOpenChange,
  open,
  triggerLabel,
  variant = "floating",
}: ControlledAppMenuProps) {
  const pathname = usePathname();
  const sections = useMemo(() => MORE_MENU_SECTIONS, []);
  const isMenuOpen = open ?? isOpen ?? false;

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  const closeMenu = () => onOpenChange(false);

  const handleNavigate = (href: string) => {
    if (href === "/" && onHomeClick) {
      onHomeClick();
    }

    closeMenu();
  };

  return (
    <>
      <MenuTrigger
        className={className}
        label={triggerLabel}
        open={isMenuOpen}
        variant={variant}
        onClick={() => onOpenChange(!isMenuOpen)}
      />

      {isMenuOpen ? (
        <div className="fixed inset-0 z-[80]">
          <button
            aria-label="서비스 안내 닫기"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            type="button"
            onClick={closeMenu}
          />
          <aside className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-hidden rounded-t-[32px] border border-white/70 bg-slate-50 shadow-2xl shadow-slate-950/20 md:bottom-auto md:left-4 md:top-4 md:h-[calc(100vh-2rem)] md:max-h-none md:w-[390px] md:rounded-[32px]">
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-4 px-6 pb-5 pt-7">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.34em] text-blue-600">
                    REGRETZERO
                  </p>
                  <h2 className="mt-4 text-3xl font-black tracking-[-0.08em] text-slate-950">
                    서비스 안내
                  </h2>
                  <p className="mt-3 max-w-[18rem] text-base leading-7 text-slate-500">
                    가이드, 브랜드 이야기, 문의만 담았습니다.
                  </p>
                </div>
                <button
                  className="inline-flex h-14 min-w-16 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-base font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  type="button"
                  onClick={closeMenu}
                >
                  닫기
                  <X aria-hidden className="ml-2 h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-7">
                <div className="rounded-[28px] border border-blue-200 bg-blue-50/85 p-5 text-slate-950">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-blue-600">
                    GUIDE
                  </p>
                  <h3 className="mt-4 text-2xl font-black tracking-[-0.08em]">
                    후회를 기준으로 바꾸는 공간
                  </h3>
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    RegretZero는 지나간 선택을 자책하기보다, 가혹한 시장을 버텨낼
                    나만의 기준을 확인하는 타임머신입니다.
                  </p>
                  <Link
                    className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
                    href="/about"
                    onClick={() => handleNavigate("/about")}
                  >
                    RegretZero 이야기 보기
                  </Link>
                </div>

                <div className="mt-7 space-y-6">
                  {sections.map((section) => (
                    <section key={section.label}>
                      <p className="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.26em] text-slate-400">
                        {section.label}
                      </p>
                      <div className="space-y-3">
                        {section.items.map((item) => (
                          <MenuItemLink
                            key={item.href}
                            active={isActivePath(pathname, item.href)}
                            item={item}
                            onNavigate={handleNavigate}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>

                <div className="mt-7 rounded-[24px] border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-500">
                  투자 추천이 아닙니다. 같은 돈의 과거 흐름과 버텨야 했던 시간을
                  보여주는 시뮬레이션입니다.
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

export function AppMenu(props: SharedAppMenuProps) {
  const [open, setOpen] = useState(false);

  return <ControlledAppMenu {...props} open={open} onOpenChange={setOpen} />;
}
