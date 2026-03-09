"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useT } from "@/lib/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

const STORAGE_KEY = "dismissed-announcements";

interface BannerItem {
  id: string;
  type: "setup" | "update" | "info";
  messageKey: TranslationKey;
  linkTextKey?: TranslationKey;
  linkHref?: string;
  active: boolean;
}

// 배너 추가/수정 시 이 배열만 변경하면 됩니다.
// id를 바꾸면 이전에 닫은 사용자에게도 다시 표시됩니다.
const BANNERS: BannerItem[] = [
  {
    id: "setup-v2",
    type: "setup",
    messageKey: "announce.setup",
    linkTextKey: "announce.setupLink",
    linkHref: "/setup",
    active: true,
  },
];

const typeStyles: Record<BannerItem["type"], { border: string; bg: string; hoverBg: string; badgeKey: TranslationKey }> = {
  setup:  { border: "border-[#00E87A]/20", bg: "bg-[#00E87A]/5",  hoverBg: "hover:bg-[#00E87A]/10", badgeKey: "announce.new" },
  update: { border: "border-[#3B82F6]/20", bg: "bg-[#3B82F6]/5",  hoverBg: "hover:bg-[#3B82F6]/10", badgeKey: "announce.update" },
  info:   { border: "border-gray-500/20",  bg: "bg-gray-500/5",   hoverBg: "hover:bg-gray-500/10",  badgeKey: "announce.info" },
};

const badgeColors: Record<BannerItem["type"], string> = {
  setup: "text-[#00E87A]",
  update: "text-[#3B82F6]",
  info: "text-gray-400",
};

export default function AnnouncementBanner() {
  const { t } = useT();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setDismissed(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
  }, []);

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  };

  if (!mounted) return null;

  const visible = BANNERS.filter((a) => a.active && !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-4">
      {visible.map((a) => {
        const s = typeStyles[a.type];
        const content = (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <span className="text-sm text-gray-300">
              <span className={`font-semibold ${badgeColors[a.type]}`}>{t(s.badgeKey)}</span>{" "}
              {t(a.messageKey)}
            </span>
            {a.linkTextKey && (
              <span className={`text-sm font-medium ${badgeColors[a.type]} flex-shrink-0 ml-4`}>
                {t(a.linkTextKey)}
              </span>
            )}
          </div>
        );

        return (
          <div key={a.id} className={`flex items-center gap-2 rounded-lg border ${s.border} ${s.bg} transition-colors`}>
            {a.linkHref ? (
              <Link href={a.linkHref} className={`flex-1 px-4 py-3 ${s.hoverBg} rounded-lg transition-colors`}>
                {content}
              </Link>
            ) : (
              <div className="flex-1 px-4 py-3">{content}</div>
            )}
            <button
              onClick={() => dismiss(a.id)}
              className="px-3 py-3 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
              aria-label={t("announce.close")}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
