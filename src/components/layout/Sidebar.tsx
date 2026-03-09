"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useT } from "@/lib/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

const menuIcons: Record<string, React.ReactNode> = {
  "/": (/* grid */ <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="1.5" width="5" height="5" rx="1"/><rect x="9.5" y="1.5" width="5" height="5" rx="1"/><rect x="1.5" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/></svg>),
  "/leaderboard": (/* trophy */ <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 2h6v5a3 3 0 0 1-6 0V2z"/><path d="M5 4H3a1 1 0 0 0-1 1v1a2 2 0 0 0 2 2h1"/><path d="M11 4h2a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2h-1"/><path d="M8 10v2"/><path d="M5 14h6"/></svg>),
  "/members": (/* users */ <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="5" r="2.5"/><path d="M1.5 14c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"/><circle cx="11.5" cy="5.5" r="1.8"/><path d="M14.5 14c0-2 -1.3-3.2-3-3.5"/></svg>),
  "/models": (/* cpu */ <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="8" height="8" rx="1"/><path d="M6.5 1.5v2M9.5 1.5v2M6.5 12.5v2M9.5 12.5v2M1.5 6.5h2M1.5 9.5h2M12.5 6.5h2M12.5 9.5h2"/></svg>),
  "/utilization": (/* bar chart */ <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 14V8M6 14V4M10 14V6M14 14V2"/></svg>),
  "/efficiency": (/* zap */ <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 1.5L3 9h5l-1 5.5L13 7H8l.5-5.5z"/></svg>),
  "/rank": (/* rocket */ <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 1.5c0 0-4 3-4 8l1.5 2.5h5L12 9.5c0-5-4-8-4-8z"/><circle cx="8" cy="6.5" r="1.2"/><path d="M6 12l-1.5 2.5M10 12l1.5 2.5"/></svg>),
};

const menuItems: { labelKey: TranslationKey; href: string }[] = [
  { labelKey: "nav.overview", href: "/" },
  { labelKey: "nav.leaderboard", href: "/leaderboard" },
  { labelKey: "nav.members", href: "/members" },
  { labelKey: "nav.models", href: "/models" },
  { labelKey: "nav.utilization", href: "/utilization" },
  { labelKey: "nav.efficiency", href: "/efficiency" },
  { labelKey: "nav.rank", href: "/rank" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useT();
  const [open, setOpen] = useState(false);

  // 페이지 이동 시 드로어 닫기
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 드로어 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const navContent = (
    <>
      <div>
        <div className="mb-8 px-4">
          <h1 className="text-lg font-bold text-white">{t("sidebar.title")}</h1>
          <p className="text-xs text-gray-500 mt-1">{t("sidebar.subtitle")}</p>
        </div>
      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2.5 ${
                isActive
                  ? "bg-[#E8FF47]/10 text-[#E8FF47]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="shrink-0 opacity-70">{menuIcons[item.href]}</span>
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
      </div>

      <div className="flex flex-col gap-2 px-2 mt-auto">
        <Link
          href="/setup"
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2.5 ${
            pathname.startsWith("/setup")
              ? "bg-[#E8FF47]/10 text-[#E8FF47]"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <span className="shrink-0 opacity-70">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>
          </span>
          {t("nav.setup")}
        </Link>

        {/* Language toggle */}
        <div className="flex items-center gap-1 px-2 py-1">
          <button
            onClick={() => setLocale("ko")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              locale === "ko"
                ? "bg-[#E8FF47]/10 text-[#E8FF47]"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            한국어
          </button>
          <span className="text-gray-600">/</span>
          <button
            onClick={() => setLocale("en")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              locale === "en"
                ? "bg-[#E8FF47]/10 text-[#E8FF47]"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            EN
          </button>
        </div>

        <span className="px-4 mt-1 pb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
          EO Studio
        </span>
      </div>
    </>
  );

  return (
    <>
      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-[#111] border border-[#333] text-gray-300 hover:text-white hover:bg-[#222] transition-colors cursor-pointer"
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      {/* 모바일 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 사이드바 — 데스크톱: 항상 표시, 모바일: 슬라이드 드로어 */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-60 bg-[#0A0A0A] border-r border-[#222]
          flex flex-col justify-between p-6 z-50
          transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* 모바일 닫기 버튼 */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 md:hidden p-1 text-gray-500 hover:text-white transition-colors cursor-pointer"
          aria-label="Close menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 4l10 10M14 4L4 14" />
          </svg>
        </button>

        {navContent}
      </aside>
    </>
  );
}
