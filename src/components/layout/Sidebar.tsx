"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useT } from "@/lib/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

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
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#E8FF47]/10 text-[#E8FF47]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
      </div>

      <div className="flex flex-col gap-2 px-2 mt-auto">
        <Link
          href="/setup"
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname.startsWith("/setup")
              ? "bg-[#E8FF47]/10 text-[#E8FF47]"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
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
