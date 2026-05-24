import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { SeedBootstrap } from "@/components/dev/seed-bootstrap";
import { LoginGate } from "@/components/auth/login-gate";
import { AutoSync } from "@/components/sync/auto-sync";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: {
    default: "ClassLog · 클래스로그",
    template: "%s · 클래스로그",
  },
  description: "개인 과외 선생님을 위한 학생 진도·과제·리포트 통합 관리 도구",
  applicationName: "ClassLog",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "ClassLog",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <LoginGate>
          <AppShell>{children}</AppShell>
          <AutoSync />
          <SeedBootstrap />
        </LoginGate>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
