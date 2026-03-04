"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { label: "Overview", href: "/" },
  { label: "Team", href: "/team" },
  { label: "Models", href: "/models" },
  { label: "Costs", href: "/costs" },
];

export default function Sidebar() {
  const pathname = usePathname();

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
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-4">
        <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
          EO Studio
        </span>
      </div>
    </aside>
  );
}
