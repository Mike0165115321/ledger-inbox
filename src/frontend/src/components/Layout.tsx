"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  ArrowLeftRight,
  FolderKanban,
  Landmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Menu,
  Settings,
  ClipboardCheck,
  Wallet,
  Users,
} from "lucide-react";

type NavGroup = {
  label: string;
  items: { href: string; label: string; icon: any }[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "งานประจำวัน",
    items: [
      { href: "/inbox", label: "Inbox", icon: Inbox },
      { href: "/review", label: "คิวตรวจสอบ", icon: ClipboardCheck },
      { href: "/transactions", label: "สมุดบัญชี", icon: ArrowLeftRight },
      { href: "/projects", label: "โปรเจกต์", icon: FolderKanban },
    ],
  },
  {
    label: "สรุปผลและภาษี",
    items: [
      { href: "/", label: "แดชบอร์ด", icon: LayoutDashboard },
      { href: "/tax", label: "ภาษี", icon: Landmark },
    ],
  },
  {
    label: "ระบบบัญชี (Core)",
    items: [
      { href: "/accounts", label: "บัญชี", icon: Wallet },
      { href: "/parties", label: "คู่ค้า", icon: Users },
      { href: "/settings", label: "ตั้งค่า", icon: Settings },
    ],
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Init dark mode from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("ledger-dark-mode");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const isDark = stored !== null ? stored === "true" : prefersDark;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ledger-dark-mode", String(next));
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarWidth = collapsed ? "w-16" : "w-56";

  return (
    <div className="flex h-screen bg-surface-alt dark:bg-surface">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-overlay lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${sidebarWidth} bg-surface dark:bg-surface-alt border-r border-border flex flex-col shrink-0 transition-all duration-300 fixed lg:relative z-50 h-full ${
          mobileOpen ? "left-0" : "-left-56 lg:left-0"
        }`}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b border-border-light flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-text-on-accent" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-text truncate">
                Ledger Inbox
              </h1>
              <p className="text-[10px] text-text-subtle truncate">
                Evidence-first Accounting
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-4 px-2 py-4 flex-1 overflow-y-auto">
          {NAV_GROUPS.map((group, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              {!collapsed && (
                <div className="px-3 py-1 text-xs font-bold text-text-subtle uppercase tracking-wider">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                      isActive
                        ? "bg-surface-hover text-text"
                        : "text-text-muted hover:bg-surface-hover hover:text-text"
                    } ${collapsed ? "justify-center px-2" : ""}`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-accent" />
                    )}
                    <Icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-border-light space-y-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            title={darkMode ? "โหมดสว่าง" : "โหมดมืด"}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-surface-hover hover:text-text transition-colors w-full ${
              collapsed ? "justify-center px-2" : ""
            }`}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 shrink-0" />
            ) : (
              <Moon className="w-5 h-5 shrink-0" />
            )}
            {!collapsed && <span>{darkMode ? "โหมดสว่าง" : "โหมดมืด"}</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
            className={`hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-subtle hover:bg-surface-hover hover:text-text transition-colors w-full ${
              collapsed ? "justify-center px-2" : ""
            }`}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 shrink-0" />
                <span>ย่อเมนู</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-surface">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-text-muted p-1"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-text" />
            <span className="font-semibold text-sm text-text">
              Ledger Inbox
            </span>
          </div>
          <button
            onClick={toggleDark}
            className="ml-auto text-text-muted p-1"
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
