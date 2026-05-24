"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  FileText,
  Bell,
  Settings,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/students", label: "학생", icon: Users },
  { href: "/reports", label: "리포트", icon: FileText },
  { href: "/notifications", label: "알림", icon: Bell },
  { href: "/settings", label: "설정", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <div className="flex min-h-svh">
      {/* 데스크탑 사이드바 */}
      <aside className="hidden md:flex md:w-60 shrink-0 flex-col border-r bg-card">
        <div className="flex h-14 items-center gap-2 px-5 border-b">
          <GraduationCap className="size-6 text-primary" />
          <span className="font-semibold text-lg tracking-tight">클래스로그</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-3 text-xs text-muted-foreground border-t">
          v0.1 · local first
        </div>
      </aside>

      {/* 본문 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 모바일 상단바 */}
        <header className="md:hidden h-14 border-b flex items-center px-4 bg-card">
          <GraduationCap className="size-5 text-primary mr-2" />
          <span className="font-semibold">클래스로그</span>
        </header>

        <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">
          {children}
        </main>

        {/* 모바일 하단 탭 */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-card border-t flex items-stretch z-50">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 text-xs transition-colors",
                  isActive(item.href)
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
