"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "แดชบอร์ด", icon: "🏠" },
  { href: "/inbox", label: "กล่องหลักฐาน", icon: "📥" },
  { href: "/transactions", label: "รายการ", icon: "💰" },
  { href: "/projects", label: "โปรเจกต์", icon: "📁" },
  { href: "/review", label: "ตรวจสอบ", icon: "🔍" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-zinc-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-zinc-100">
          <h1 className="text-lg font-bold text-zinc-800 tracking-tight">
            📒 Ledger Inbox
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">Evidence-first Accounting</p>
        </div>

        <nav className="flex flex-col gap-0.5 px-3 py-3 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-3 border-t border-zinc-100 text-xs text-zinc-400">
          v0.1.0 — Week 1
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
