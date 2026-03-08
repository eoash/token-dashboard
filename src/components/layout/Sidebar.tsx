"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

const menuItems: { labelKey: TranslationKey; href: string }[] = [
  { labelKey: "nav.overview", href: "/" },
  { labelKey: "nav.leaderboard", href: "/leaderboard" },
  { labelKey: "nav.team", href: "/team" },
  { labelKey: "nav.models", href: "/models" },
  { labelKey: "nav.utilization", href: "/utilization" },
  { labelKey: "nav.efficiency", href: "/efficiency" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useT();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#0A0A0A] border-r border-[#222] flex flex-col justify-between p-6">
      <nav className="flex flex-col gap-1 mt-8">
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

      <div className="flex flex-col gap-2 px-2">
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
    </aside>
  );
}
