"use client";

import { useState } from "react";
import { useT } from "@/lib/contexts/LanguageContext";

const INSTALL_CMD_MAC =
  "curl -sL https://raw.githubusercontent.com/eoash/token-dashboard/main/scripts/install-hook.sh | bash";
const INSTALL_CMD_WIN =
  'powershell -Command "irm https://raw.githubusercontent.com/eoash/token-dashboard/main/scripts/install-hook.ps1 | iex"';

export default function SetupPage() {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const [os, setOs] = useState<"mac" | "win">("mac");

  const installCmd = os === "mac" ? INSTALL_CMD_MAC : INSTALL_CMD_WIN;

  const handleCopy = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    { num: "1", titleKey: "setup.step1" as const, descKey: "setup.step1.desc" as const, tool: "Claude Code" },
    { num: "2", titleKey: "setup.step2" as const, descKey: "setup.step2.desc" as const, tool: "Claude Code" },
    { num: "3", titleKey: "setup.step3" as const, descKey: "setup.step3.desc" as const, tool: "Codex CLI" },
    { num: "4", titleKey: "setup.step4" as const, descKey: "setup.step4.desc" as const, tool: "Gemini CLI" },
  ];

  const troubles = [
    { titleKey: "setup.trouble1.title" as const, descKey: "setup.trouble1.desc" as const },
    { titleKey: "setup.trouble2.title" as const, descKey: "setup.trouble2.desc" as const },
    { titleKey: "setup.trouble3.title" as const, descKey: "setup.trouble3.desc" as const },
  ];

  const prereqs = [
    { name: "python3", check: "python3 --version" },
    { name: "curl", check: "curl --version" },
    { name: "git", check: "git config user.email → @eoeoeo.net" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{t("setup.title")}</h1>
      <p className="text-gray-400 text-sm mb-8">{t("setup.desc")}</p>

      {/* Install command */}
      <div className="rounded-xl border border-[#E8FF47]/30 bg-[#E8FF47]/5 p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-[#E8FF47] uppercase">
              {t("setup.installCmd")}
            </span>
            <div className="flex rounded-md overflow-hidden border border-[#E8FF47]/20 ml-2">
              <button
                onClick={() => { setOs("mac"); setCopied(false); }}
                className={`text-[10px] px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  os === "mac"
                    ? "bg-[#E8FF47]/20 text-[#E8FF47]"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Mac / Linux
              </button>
              <button
                onClick={() => { setOs("win"); setCopied(false); }}
                className={`text-[10px] px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  os === "win"
                    ? "bg-[#E8FF47]/20 text-[#E8FF47]"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Windows
              </button>
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="text-xs px-3 py-1.5 rounded-md bg-[#E8FF47]/10 text-[#E8FF47] hover:bg-[#E8FF47]/20 transition-colors cursor-pointer"
          >
            {copied ? t("common.copied") : t("common.copy")}
          </button>
        </div>
        <code className="block text-sm font-mono text-white break-all leading-relaxed select-all">
          {installCmd}
        </code>
      </div>

      {/* Prerequisites */}
      <div className="rounded-xl border border-[#222] bg-[#111111] p-5 mb-8">
        <h2 className="text-sm font-semibold text-white mb-3">{t("setup.prereq")}</h2>
        <div className="flex flex-wrap gap-3">
          {prereqs.map((p) => (
            <div key={p.name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-sm">
              <span className="text-[#E8FF47] font-mono font-semibold">{p.name}</span>
              <span className="text-gray-500">—</span>
              <span className="text-gray-400 text-xs">{p.check}</span>
            </div>
          ))}
        </div>
      </div>

      {/* What gets installed */}
      <h2 className="text-lg font-semibold mb-4">{t("setup.whatInstalled")}</h2>
      <div className="grid gap-3 mb-8">
        {steps.map((s) => (
          <div key={s.num} className="flex items-start gap-4 rounded-xl border border-[#222] bg-[#111111] p-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E8FF47]/10 text-[#E8FF47] flex items-center justify-center text-sm font-bold">
              {s.num}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-white">{t(s.titleKey)}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 font-mono">{s.tool}</span>
              </div>
              <p className="text-xs text-gray-400">{t(s.descKey)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* After install */}
      <div className="rounded-xl border border-[#222] bg-[#111111] p-5 mb-8">
        <h2 className="text-sm font-semibold text-white mb-3">{t("setup.afterInstall")}</h2>
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-start gap-2">
            <span className="text-[#E8FF47] mt-0.5">●</span>
            <span><strong className="text-white">Claude Code</strong> — {t("setup.claude.after")}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#10A37F] mt-0.5">●</span>
            <span><strong className="text-white">Codex CLI</strong> — {t("setup.codex.after")}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#4285F4] mt-0.5">●</span>
            <span><strong className="text-white">Gemini CLI</strong> — {t("setup.gemini.after")}</span>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="rounded-xl border border-[#222] bg-[#111111] p-5">
        <h2 className="text-sm font-semibold text-white mb-3">{t("setup.troubleshooting")}</h2>
        <div className="space-y-3 text-sm text-gray-400">
          {troubles.map((tr) => (
            <div key={tr.titleKey}>
              <p className="text-white text-xs font-medium mb-1">{t(tr.titleKey)}</p>
              <p className="text-xs">{t(tr.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
